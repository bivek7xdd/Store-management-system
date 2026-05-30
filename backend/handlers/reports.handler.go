package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"math"
	"net/http"
	db "storemanagement/db/sqlc"
	"storemanagement/redis"
	"storemanagement/utils"
	"time"

	"encoding/csv"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/johnfercher/maroto/v2"
	"github.com/johnfercher/maroto/v2/pkg/components/col"
	"github.com/johnfercher/maroto/v2/pkg/components/line"
	"github.com/johnfercher/maroto/v2/pkg/components/row"
	"github.com/johnfercher/maroto/v2/pkg/components/text"
	"github.com/johnfercher/maroto/v2/pkg/consts/align"
	"github.com/johnfercher/maroto/v2/pkg/consts/fontstyle"
	"github.com/johnfercher/maroto/v2/pkg/props"
)

func GetReportStats(c *gin.Context) {
	storeID, ok := utils.GetStoreID(c)
	if !ok {
		utils.ErrorResponse(c, http.StatusUnauthorized, "Store not found", nil)
		return
	}
	rangeType := c.DefaultQuery("range", "today")

	// ── Redis Cache Lookup ────────────────────────────────────────────────────────
	cacheKey := fmt.Sprintf("report_stats:%s:%s", storeID.String(), rangeType)
	if redis.IsRedisAvailable() {
		cachedData, err := redis.RedisClient.Get(c.Request.Context(), cacheKey).Result()
		if err == nil {
			var result gin.H
			if err := json.Unmarshal([]byte(cachedData), &result); err == nil {
				utils.SuccessResponse(c, "Report stats fetched successfully (from cache)", result)
				return
			}
		}
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	// Calculate date range
	now := time.Now()
	var startDate, endDate time.Time
	endDate = now // Current time

	switch rangeType {
	case "today":
		startDate = time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	case "week":
		// Start of current week (Sunday)
		weekday := int(now.Weekday())
		startDate = time.Date(now.Year(), now.Month(), now.Day()-weekday, 0, 0, 0, 0, now.Location())
	case "month":
		startDate = time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
	case "year":
		startDate = time.Date(now.Year(), 1, 1, 0, 0, 0, 0, now.Location())
	default:
		startDate = time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	}

	startTimestamptz := pgtype.Timestamptz{Time: startDate, Valid: true}
	endTimestamptz := pgtype.Timestamptz{Time: endDate, Valid: true}

	// Fetch Sales Stats
	totalSales, err := utils.Queries.GetTotalSales(ctx, db.GetTotalSalesParams{
		StoreID:    storeID,
		SaleDate:   startTimestamptz,
		SaleDate_2: endTimestamptz,
	})
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch total sales", err)
		return
	}

	salesByType, err := utils.Queries.GetSalesByType(ctx, db.GetSalesByTypeParams{
		StoreID:    storeID,
		SaleDate:   startTimestamptz,
		SaleDate_2: endTimestamptz,
	})
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch sales by type", err)
		return
	}

	// Inventory Stats (Global, not date filtered)
	inventoryStats, err := utils.Queries.GetInventoryStats(ctx, storeID)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch inventory stats", err)
		return
	}

	// Debt Stats (Global)
	debtStats, err := utils.Queries.GetDebtsStats(ctx, storeID)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch debt stats", err)
		return
	}

	// Recent Transactions
	recentSales, err := utils.Queries.GetRecentSales(ctx, db.GetRecentSalesParams{
		StoreID: storeID,
		Limit:   5,
	})
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch recent sales", err)
		return
	}

	if recentSales == nil {
		recentSales = []db.GetRecentSalesRow{}
	}

	// Chart Data: Daily Sales
	// Get data for the selected range (e.g. last 7 days for 'week', last 30 for 'month')
	dailySales, err := utils.Queries.GetDailySales(ctx, db.GetDailySalesParams{
		StoreID:    storeID,
		SaleDate:   startTimestamptz,
		SaleDate_2: endTimestamptz,
	})
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch daily sales", err)
		return
	}

	if dailySales == nil {
		dailySales = []db.GetDailySalesRow{}
	}

	// Chart Data: Top Selling Products
	topProducts, err := utils.Queries.GetTopSellingProducts(ctx, db.GetTopSellingProductsParams{
		StoreID:    storeID,
		SaleDate:   startTimestamptz,
		SaleDate_2: endTimestamptz,
		Limit:      5,
	})
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch top selling products", err)
		return
	}

	if topProducts == nil {
		topProducts = []db.GetTopSellingProductsRow{}
	}

	// Chart Data: Stock By Category
	stockByCategory, err := utils.Queries.GetStockByCategory(ctx, storeID)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch stock by category", err)
		return
	}

	if stockByCategory == nil {
		stockByCategory = []db.GetStockByCategoryRow{}
	}

	// Top Debtors
	topDebtors, err := utils.Queries.GetTopDebtors(ctx, db.GetTopDebtorsParams{
		StoreID: storeID,
		Limit:   5,
	})
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch top debtors", err)
		return
	}

	if topDebtors == nil {
		topDebtors = []db.GetTopDebtorsRow{}
	}

	// Profit Stats
	profitStats, err := utils.Queries.GetProfitStats(ctx, db.GetProfitStatsParams{
		StoreID:    storeID,
		SaleDate:   startTimestamptz,
		SaleDate_2: endTimestamptz,
	})
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch profit stats", err)
		return
	}

	// Process Sales By Type
	var cashSales, creditSales, onlineSales float64
	for _, s := range salesByType {
		val, _ := s.TotalAmount.Float64Value()
		switch s.SalesType {
		case db.SalesTypesCash:
			cashSales = val.Float64
		case db.SalesTypesCredit:
			creditSales = val.Float64
		case db.SalesTypesOnline:
			onlineSales = val.Float64
		}
	}

	// Calculate Growth and Previous Period Sales
	// Period length defaults (approximate for simplicity)
	var prevStartDate, prevEndDate time.Time
	duration := endDate.Sub(startDate)

	// If duration is less than a day (e.g. "today"), compare with yesterday
	if duration.Hours() < 24 {
		prevStartDate = startDate.AddDate(0, 0, -1)
		prevEndDate = endDate.AddDate(0, 0, -1)
	} else {
		// Compare with same duration immediately before
		prevStartDate = startDate.Add(-duration)
		prevEndDate = startDate
	}

	prevStartTimestamptz := pgtype.Timestamptz{Time: prevStartDate, Valid: true}
	prevEndTimestamptz := pgtype.Timestamptz{Time: prevEndDate, Valid: true}

	prevSales, err := utils.Queries.GetSalesForPeriod(ctx, db.GetSalesForPeriodParams{
		StoreID:    storeID,
		SaleDate:   prevStartTimestamptz,
		SaleDate_2: prevEndTimestamptz,
	})
	// Ignore error for prev sales, default to 0
	prevTotalSales, _ := prevSales.Float64Value()
	currTotalSales, _ := totalSales.TotalSales.Float64Value()

	var salesGrowth float64
	if prevTotalSales.Float64 > 0 {
		salesGrowth = ((currTotalSales.Float64 - prevTotalSales.Float64) / prevTotalSales.Float64) * 100
	} else if currTotalSales.Float64 > 0 {
		salesGrowth = 100 // 100% growth if previous was 0
	}

	// Calculate Average Order Value (AOV)
	var aov float64
	if totalSales.SalesCount > 0 {
		aov = currTotalSales.Float64 / float64(totalSales.SalesCount)
	}

	// Fetch Revenue By Category
	revenueByCategory, err := utils.Queries.GetRevenueByCategory(ctx, db.GetRevenueByCategoryParams{
		StoreID:    storeID,
		SaleDate:   startTimestamptz,
		SaleDate_2: endTimestamptz,
	})
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch revenue by category", err)
		return
	}

	if revenueByCategory == nil {
		revenueByCategory = []db.GetRevenueByCategoryRow{}
	}

	// Forecast: Linear Regression on Daily Sales
	// Simplified Linear Regression: y = mx + c (y = sales, x = day index)
	forecast := []gin.H{}
	if len(dailySales) > 1 {
		var sumX, sumY, sumXY, sumXX float64
		n := float64(len(dailySales))

		for i, day := range dailySales {
			x := float64(i)
			val, _ := day.DailyTotal.Float64Value()
			y := val.Float64

			sumX += x
			sumY += y
			sumXY += x * y
			sumXX += x * x
		}

		// Calculate slope (m) and intercept (c)
		m := (n*sumXY - sumX*sumY) / (n*sumXX - sumX*sumX)
		c := (sumY - m*sumX) / n

		// Predict next 7 days
		for i := 1; i <= 7; i++ {
			nextDayIndex := float64(len(dailySales) - 1 + i)
			predictedSales := m*nextDayIndex + c
			if predictedSales < 0 {
				predictedSales = 0
			}

			// Get date for next day
			lastDateStr := dailySales[len(dailySales)-1].SaleDate
			lastDate, _ := time.Parse("2006-01-02", lastDateStr) // Assuming generated code returns YYYY-MM-DD
			nextDate := lastDate.AddDate(0, 0, i).Format("2006-01-02")

			forecast = append(forecast, gin.H{
				"date":            nextDate,
				"predicted_sales": predictedSales,
			})
		}
	}

	// ── Feature 1: Enhanced Insights Engine ─────────────────────────────────────
	insights := []gin.H{}

	// Insight: Sales Trend
	if salesGrowth > 10 {
		insights = append(insights, gin.H{
			"type":    "success",
			"message": fmt.Sprintf("Sales are up %.1f%% compared to the previous period. Great work!", salesGrowth),
			"action":  "view_sales",
		})
	} else if salesGrowth < -10 {
		insights = append(insights, gin.H{
			"type":    "warning",
			"message": fmt.Sprintf("Sales are down %.1f%%. Running a promotion could help recover momentum.", math.Abs(salesGrowth)),
			"action":  "view_sales",
		})
	}

	// Insight: High Outstanding Debt
	outstandingDebt, _ := debtStats.TotalOutstanding.Float64Value()
	if outstandingDebt.Float64 > 50000 {
		insights = append(insights, gin.H{
			"type":    "warning",
			"message": fmt.Sprintf("रू %.0f in outstanding debt. Follow up with your top debtors to free up cash flow.", outstandingDebt.Float64),
			"action":  "view_debtors",
		})
	}

	// ── Feature 2: Dead Stock (60-day threshold for insights) ───────────────────
	deadStockItems, err := utils.Queries.GetDeadStock(ctx, db.GetDeadStockParams{
		StoreID: storeID,
		Column2: 60,
	})
	if err != nil {
		deadStockItems = []db.GetDeadStockRow{}
	}

	// Compute dead stock totals by category & threshold buckets
	var deadStockTotal60, deadStockTotal90, deadStockTotal120 float64
	deadStockByCategory := map[string]float64{}
	for _, item := range deadStockItems {
		capital, _ := item.CapitalTiedUp.Float64Value()
		deadStockByCategory[item.CategoryName.String] += capital.Float64
		if item.DaysSinceLastSale >= 120 {
			deadStockTotal120 += capital.Float64
		}
		if item.DaysSinceLastSale >= 90 {
			deadStockTotal90 += capital.Float64
		}
		deadStockTotal60 += capital.Float64
	}

	// Dead stock insight
	if deadStockTotal60 > 0 {
		insights = append(insights, gin.H{
			"type":    "warning",
			"message": fmt.Sprintf("रू %.0f is tied up in inventory that hasn't sold in 60+ days. A discount campaign could unlock this cash.", deadStockTotal60),
			"action":  "view_dead_stock",
		})
	}

	// ── Feature 3: Product Velocity insights ────────────────────────────────────
	velocityItems, err := utils.Queries.GetProductVelocity(ctx, storeID)
	if err != nil || velocityItems == nil {
		velocityItems = []db.GetProductVelocityRow{}
	}

	// Stockout-within-7-days insight
	criticalItems := 0
	for _, v := range velocityItems {
		if v.EstimatedDaysToStockout <= 7 {
			criticalItems++
		}
	}
	if criticalItems > 0 {
		insights = append(insights, gin.H{
			"type":    "alert",
			"message": fmt.Sprintf("%d product(s) will run out of stock within 7 days. Reorder now to avoid lost sales.", criticalItems),
			"action":  "view_velocity",
		})
	}

	// ── Feature 4: Market Basket Analysis (cross-sell insight) ─────────────────
	basketPairs, err := utils.Queries.GetProductPairFrequency(ctx, storeID)
	if err != nil {
		basketPairs = []db.GetProductPairFrequencyRow{}
	}
	if len(basketPairs) > 0 {
		top := basketPairs[0]
		insights = append(insights, gin.H{
			"type":    "opportunity",
			"message": fmt.Sprintf("Customers who buy \"%s\" often also buy \"%s\". Consider bundling them for a higher average order value.", top.ProductAName, top.ProductBName),
			"action":  "view_basket",
		})
	}

	// ── Feature 5: Traffic Heatmap ──────────────────────────────────────────────
	heatmapRows, err := utils.Queries.GetHourlyTransactionHeatmap(ctx, storeID)
	if err != nil {
		heatmapRows = []db.GetHourlyTransactionHeatmapRow{}
	}

	// Build dead-stock category breakdown list for response
	type deadStockCategorySummary struct {
		Category string  `json:"category"`
		Total    float64 `json:"total"`
	}
	var deadStockCategoryList []deadStockCategorySummary
	for cat, total := range deadStockByCategory {
		deadStockCategoryList = append(deadStockCategoryList, deadStockCategorySummary{
			Category: cat,
			Total:    total,
		})
	}

	// ── Prepare Response ────────────────────────────────────────────────────────
	responseData := gin.H{
		"sales": gin.H{
			"total":        totalSales.TotalSales,
			"count":        totalSales.SalesCount,
			"growth":       salesGrowth,
			"aov":          aov,
			"cash":         cashSales,
			"credit":       creditSales,
			"online":       onlineSales,
			"recent":       recentSales,
			"daily_trend":  dailySales,
			"forecast":     forecast,
			"top_products": topProducts,
		},
		"inventory": gin.H{
			"total_products":      inventoryStats.TotalProducts,
			"total_value":         inventoryStats.TotalValue,
			"low_stock":           inventoryStats.LowStockCount,
			"stock_by_category":   stockByCategory,
			"revenue_by_category": revenueByCategory,
		},
		"debts": gin.H{
			"total_outstanding": debtStats.TotalOutstanding,
			"total_debtors":     debtStats.TotalDebtors,
			"top_debtors":       topDebtors,
		},
		"profit": gin.H{
			"total_revenue": profitStats.TotalRevenue,
			"total_cost":    profitStats.TotalCost,
			"gross_profit":  profitStats.GrossProfit,
		},
		"insights": insights,
		"dead_stock": gin.H{
			"total_60d":     deadStockTotal60,
			"total_90d":     deadStockTotal90,
			"total_120d":    deadStockTotal120,
			"items":         deadStockItems,
			"by_category":   deadStockCategoryList,
		},
		"velocity":         velocityItems,
		"basket_pairs":     basketPairs,
		"traffic_heatmap":  heatmapRows,
		"date_range": gin.H{
			"start": startDate,
			"end":   endDate,
		},
	}

	// ── Store in Redis Cache (TTL: 5 Minutes) ──────────────────────────────────
	if redis.IsRedisAvailable() {
		jsonData, err := json.Marshal(responseData)
		if err == nil {
			redis.RedisClient.Set(ctx, cacheKey, jsonData, 5*time.Minute)
		}
	}

	utils.SuccessResponse(c, "Report stats fetched successfully", responseData)
}

func ExportSalesReportCSV(c *gin.Context) {
	storeID, ok := utils.GetStoreID(c)
	if !ok {
		utils.ErrorResponse(c, http.StatusUnauthorized, "Store not found", nil)
		return
	}

	var body struct {
		Range string `json:"range"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		body.Range = "today"
	}
	rangeType := body.Range

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	// Calculate date range (same logic as GetReportStats)
	now := time.Now()
	var startDate, endDate time.Time
	endDate = now

	switch rangeType {
	case "today":
		startDate = time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	case "week":
		weekday := int(now.Weekday())
		startDate = time.Date(now.Year(), now.Month(), now.Day()-weekday, 0, 0, 0, 0, now.Location())
	case "month":
		startDate = time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
	case "year":
		startDate = time.Date(now.Year(), 1, 1, 0, 0, 0, 0, now.Location())
	default:
		startDate = time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	}

	startTimestamptz := pgtype.Timestamptz{Time: startDate, Valid: true}
	endTimestamptz := pgtype.Timestamptz{Time: endDate, Valid: true}

	// Fetch all sales for this period
	sales, err := utils.Queries.GetSalesInRange(ctx, db.GetSalesInRangeParams{
		StoreID:    storeID,
		SaleDate:   startTimestamptz,
		SaleDate_2: endTimestamptz,
	})
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch sales for export", err)
		return
	}

	// Set headers for CSV download
	c.Header("Content-Description", "File Transfer")
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=sales_report_%s.csv", rangeType))
	c.Header("Content-Type", "text/csv")

	writer := csv.NewWriter(c.Writer)
	defer writer.Flush()

	// Header row
	writer.Write([]string{"ID", "Customer", "Amount", "Type", "Date"})

	for _, s := range sales {
		writer.Write([]string{
			s.ID.String(),
			s.CustomerName.String,
			fmt.Sprintf("%.2f", utils.Float64(s.TotalAmount)),
			string(s.SalesType),
			s.SaleDate.Time.Format("2006-01-02 15:04:05"),
		})
	}
}

func ExportSalesReportPDF(c *gin.Context) {
	storeID, ok := utils.GetStoreID(c)
	if !ok {
		utils.ErrorResponse(c, http.StatusUnauthorized, "Store not found", nil)
		return
	}

	var body struct {
		Range string `json:"range"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		body.Range = "today"
	}
	rangeType := body.Range

	ctx, cancel := context.WithTimeout(c.Request.Context(), 20*time.Second)
	defer cancel()

	// Calculate date range
	now := time.Now()
	var startDate, endDate time.Time
	endDate = now

	switch rangeType {
	case "today":
		startDate = time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	case "week":
		weekday := int(now.Weekday())
		startDate = time.Date(now.Year(), now.Month(), now.Day()-weekday, 0, 0, 0, 0, now.Location())
	case "month":
		startDate = time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
	case "year":
		startDate = time.Date(now.Year(), 1, 1, 0, 0, 0, 0, now.Location())
	default:
		startDate = time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	}

	startTimestamptz := pgtype.Timestamptz{Time: startDate, Valid: true}
	endTimestamptz := pgtype.Timestamptz{Time: endDate, Valid: true}

	// Fetch sales
	sales, err := utils.Queries.GetSalesInRange(ctx, db.GetSalesInRangeParams{
		StoreID:    storeID,
		SaleDate:   startTimestamptz,
		SaleDate_2: endTimestamptz,
	})
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch sales for PDF", err)
		return
	}

	// Create PDF
	m := maroto.New()

	// Header
	m.AddRows(
		row.New(20).Add(
			col.New(12).Add(
				text.New("Sales Report", props.Text{
					Top:   5,
					Size:  20,
					Style: fontstyle.Bold,
					Align: align.Center,
				}),
			),
		),
		row.New(10).Add(
			col.New(12).Add(
				text.New(fmt.Sprintf("Period: %s", rangeType), props.Text{
					Size:  12,
					Align: align.Center,
				}),
			),
		),
		line.NewRow(2),
	)

	// Table Header
	m.AddRows(
		row.New(10).Add(
			col.New(4).Add(text.New("Customer", props.Text{Style: fontstyle.Bold})),
			col.New(2).Add(text.New("Type", props.Text{Style: fontstyle.Bold})),
			col.New(3).Add(text.New("Date", props.Text{Style: fontstyle.Bold})),
			col.New(3).Add(text.New("Amount", props.Text{Style: fontstyle.Bold, Align: align.Right})),
		),
	)

	var total float64
	for _, s := range sales {
		amount := utils.Float64(s.TotalAmount)
		total += amount
		m.AddRows(
			row.New(8).Add(
				col.New(4).Add(text.New(s.CustomerName.String)),
				col.New(2).Add(text.New(string(s.SalesType))),
				col.New(3).Add(text.New(s.SaleDate.Time.Format("2006-01-02"))),
				col.New(3).Add(text.New(fmt.Sprintf("%.2f", amount), props.Text{Align: align.Right})),
			),
		)
	}

	// Footer
	m.AddRows(
		line.NewRow(2),
		row.New(10).Add(
			col.New(9).Add(text.New("GRAND TOTAL", props.Text{Style: fontstyle.Bold, Align: align.Right})),
			col.New(3).Add(text.New(fmt.Sprintf("Rs. %.2f", total), props.Text{Style: fontstyle.Bold, Align: align.Right})),
		),
	)

	document, err := m.Generate()
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to generate PDF", err)
		return
	}

	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=sales_report_%s.pdf", rangeType))
	c.Header("Content-Type", "application/pdf")
	c.Data(http.StatusOK, "application/pdf", document.GetBytes())
}

func GetCashFlow(c *gin.Context) {
	storeID, ok := utils.GetStoreID(c)
	if !ok {
		utils.ErrorResponse(c, http.StatusUnauthorized, "Store not found", nil)
		return
	}
	rangeType := c.DefaultQuery("range", "month")

	startDate, endDate := utils.GetDateRange(rangeType)

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	cashFlow, err := utils.Queries.GetCashFlowDaily(ctx, db.GetCashFlowDailyParams{
		StoreID:    storeID,
		SaleDate:   pgtype.Timestamptz{Time: startDate, Valid: true},
		SaleDate_2: pgtype.Timestamptz{Time: endDate, Valid: true},
	})

	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch cash flow", err)
		return
	}

	if cashFlow == nil {
		cashFlow = []db.GetCashFlowDailyRow{}
	}

	utils.SuccessResponse(c, "Cash flow fetched successfully", cashFlow)
}

func GetBalanceSheetAssets(c *gin.Context) {
	storeID, ok := utils.GetStoreID(c)
	if !ok {
		utils.ErrorResponse(c, http.StatusUnauthorized, "Store not found", nil)
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	assets, err := utils.Queries.GetBalanceSheetAssets(ctx, storeID)

	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch assets", err)
		return
	}

	utils.SuccessResponse(c, "Assets fetched successfully", assets)
}

func GetBalanceSheetLiabilities(c *gin.Context) {
	storeID, ok := utils.GetStoreID(c)
	if !ok {
		utils.ErrorResponse(c, http.StatusUnauthorized, "Store not found", nil)
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	liabilities, err := utils.Queries.GetBalanceSheetLiabilities(ctx, storeID)

	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch liabilities", err)
		return
	}

	utils.SuccessResponse(c, "Liabilities fetched successfully", liabilities)
}

func GetNetProfit(c *gin.Context) {
	storeID, ok := utils.GetStoreID(c)
	if !ok {
		utils.ErrorResponse(c, http.StatusUnauthorized, "Store not found", nil)
		return
	}
	rangeType := c.DefaultQuery("range", "month")

	startDate, endDate := utils.GetDateRange(rangeType)

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	profit, err := utils.Queries.GetNetProfit(ctx, db.GetNetProfitParams{
		StoreID:       storeID,
		ExpenseDate:   pgtype.Timestamptz{Time: startDate, Valid: true},
		ExpenseDate_2: pgtype.Timestamptz{Time: endDate, Valid: true},
	})

	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch net profit", err)
		return
	}

	utils.SuccessResponse(c, "Net profit fetched successfully", profit)
}
