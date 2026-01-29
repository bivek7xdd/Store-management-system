package handlers

import (
	"context"
	"fmt"
	"math"
	"net/http"
	db "storemanagement/db/sqlc"
	"storemanagement/utils"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgtype"
)

func GetReportStats(c *gin.Context) {
	storeID := c.MustGet("store_id").(pgtype.UUID)
	rangeType := c.DefaultQuery("range", "today")

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

	// Chart Data: Stock By Category
	stockByCategory, err := utils.Queries.GetStockByCategory(ctx, storeID)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch stock by category", err)
		return
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

	// Forecast: Linear Regression on Daily Sales
	// Simplified Linear Regression: y = mx + c (y = sales, x = day index)
	var forecast []gin.H
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

	// Smart Insights Generation
	var insights []gin.H

	// Insight 1: Sales Trend
	if salesGrowth > 10 {
		insights = append(insights, gin.H{
			"type":    "success",
			"message": fmt.Sprintf("Sales are trending up! growth of %.1f%% compared to previous period.", salesGrowth),
		})
	} else if salesGrowth < -10 {
		insights = append(insights, gin.H{
			"type":    "warning",
			"message": fmt.Sprintf("Sales are down by %.1f%%. Consider running a promotion.", math.Abs(salesGrowth)),
		})
	}

	// Insight 2: Dead Stock
	deadStock, err := utils.Queries.GetInactiveProducts(ctx, db.GetInactiveProductsParams{
		StoreID: storeID,
		Limit:   5,
	})
	if err == nil && len(deadStock) > 0 {
		var productNames []string
		for _, p := range deadStock {
			productNames = append(productNames, p.ProductName)
		}
		insights = append(insights, gin.H{
			"type":    "warning",
			"message": fmt.Sprintf("%d products haven't sold in 30 days. Consider a clearance sale.", len(deadStock)),
			"details": productNames,
		})
	}

	// Insight 3: High Outstanding Debt
	outstandingDebt, _ := debtStats.TotalOutstanding.Float64Value()
	if outstandingDebt.Float64 > 50000 { // Threshold example
		insights = append(insights, gin.H{
			"type":    "info",
			"message": fmt.Sprintf("Total outstanding debt is high (रू %.2f). Review debtors list.", outstandingDebt.Float64),
		})
	}

	// Prepare Response
	utils.SuccessResponse(c, "Report stats fetched successfully", gin.H{
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
			"forecast":     forecast, // Added forecast
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
		"insights": insights, // Added insights
		"date_range": gin.H{
			"start": startDate,
			"end":   endDate,
		},
	})
}
