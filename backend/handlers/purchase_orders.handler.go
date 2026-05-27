package handlers

import (
	"context"
	"net/http"
	db "storemanagement/db/sqlc"
	"storemanagement/utils"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgtype"
)

func CreatePurchaseOrder(c *gin.Context) {
	storeID := c.MustGet("store_id").(pgtype.UUID)

	var req struct {
		OrderDate           string `json:"order_date"`
		ExpectedDeliverDate string `json:"expected_delivery_date"`
		Notes               string `json:"notes"`
		Items               []struct {
			SupplierID     string  `json:"supplier_id"`
			ProductID      string  `json:"product_id"`
			ProductName    string  `json:"product_name"`
			OrderedQty     int32   `json:"ordered_quantity"`
			UnitCost       float64 `json:"unit_cost"`
		} `json:"items" binding:"required,min=1"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	orderDate := time.Now()
	if req.OrderDate != "" {
		t, err := time.Parse("2006-01-02", req.OrderDate)
		if err == nil {
			orderDate = t
		}
	}

	var expectedDelivery pgtype.Timestamptz
	if req.ExpectedDeliverDate != "" {
		t, err := time.Parse("2006-01-02", req.ExpectedDeliverDate)
		if err == nil {
			expectedDelivery = pgtype.Timestamptz{Time: t, Valid: true}
		}
	}

	// Calculate total cost
	var totalCost float64
	for _, item := range req.Items {
		totalCost += float64(item.OrderedQty) * item.UnitCost
	}

	po, err := utils.Queries.CreatePurchaseOrder(ctx, db.CreatePurchaseOrderParams{
		StoreID:              storeID,
		OrderDate:            pgtype.Timestamptz{Time: orderDate, Valid: true},
		ExpectedDeliveryDate: expectedDelivery,
		Status:               "draft",
		Notes:                utils.OptionalText(req.Notes),
		TotalCost:            utils.Numeric(totalCost),
	})
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to create purchase order", err)
		return
	}

	// Create items
	for _, item := range req.Items {
		supplierUUID, err := utils.ParseUUID(item.SupplierID)
		if err != nil {
			utils.ErrorResponse(c, http.StatusBadRequest, "Invalid supplier ID", err)
			return
		}

		var productUUID pgtype.UUID
		if item.ProductID != "" {
			pid, err := utils.ParseUUID(item.ProductID)
			if err == nil {
				productUUID = pid
			}
		}

		_, err = utils.Queries.CreatePurchaseOrderItem(ctx, db.CreatePurchaseOrderItemParams{
			PurchaseOrderID: po.ID,
			SupplierID:      supplierUUID,
			ProductID:       productUUID,
			ProductName:     item.ProductName,
			OrderedQuantity: item.OrderedQty,
			UnitCost:        utils.Numeric(item.UnitCost),
		})
		if err != nil {
			utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to create order item", err)
			return
		}
	}

	utils.SuccessResponse(c, "Purchase order created", po)
}

func ListPurchaseOrders(c *gin.Context) {
	storeID := c.MustGet("store_id").(pgtype.UUID)

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	orders, err := utils.Queries.ListPurchaseOrders(ctx, storeID)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch orders", err)
		return
	}

	if orders == nil {
		orders = []db.ListPurchaseOrdersRow{}
	}

	utils.SuccessResponse(c, "Orders fetched", orders)
}

func GetPurchaseOrder(c *gin.Context) {
	storeID := c.MustGet("store_id").(pgtype.UUID)
	orderID, err := utils.ParseUUID(c.Param("id"))
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid ID", err)
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	order, err := utils.Queries.GetPurchaseOrder(ctx, db.GetPurchaseOrderParams{
		ID:      orderID,
		StoreID: storeID,
	})
	if err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Order not found", err)
		return
	}

	utils.SuccessResponse(c, "Order fetched", order)
}

func UpdatePurchaseOrder(c *gin.Context) {
	storeID := c.MustGet("store_id").(pgtype.UUID)
	orderID, err := utils.ParseUUID(c.Param("id"))
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid ID", err)
		return
	}

	var req struct {
		ExpectedDeliverDate string `json:"expected_delivery_date"`
		Notes               string `json:"notes"`
		Items               []struct {
			SupplierID     string  `json:"supplier_id"`
			ProductID      string  `json:"product_id"`
			ProductName    string  `json:"product_name"`
			OrderedQty     int32   `json:"ordered_quantity"`
			UnitCost       float64 `json:"unit_cost"`
		} `json:"items" binding:"required,min=1"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	// Verify PO exists and is in 'draft' status
	po, err := utils.Queries.GetPurchaseOrder(ctx, db.GetPurchaseOrderParams{
		ID:      orderID,
		StoreID: storeID,
	})
	if err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Order not found", err)
		return
	}
	if po.Status != "draft" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Only draft orders can be edited", nil)
		return
	}

	var expectedDelivery pgtype.Timestamptz
	if req.ExpectedDeliverDate != "" {
		t, err := time.Parse("2006-01-02", req.ExpectedDeliverDate)
		if err == nil {
			expectedDelivery = pgtype.Timestamptz{Time: t, Valid: true}
		}
	}

	// Calculate total cost
	var totalCost float64
	for _, item := range req.Items {
		totalCost += float64(item.OrderedQty) * item.UnitCost
	}

	// Update PO header
	_, err = utils.Queries.UpdatePurchaseOrder(ctx, db.UpdatePurchaseOrderParams{
		ID:                   orderID,
		StoreID:              storeID,
		Status:               "draft",
		Notes:                utils.OptionalText(req.Notes),
		ExpectedDeliveryDate: expectedDelivery,
		TotalCost:            utils.Numeric(totalCost),
	})
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to update order", err)
		return
	}

	// Delete existing items
	err = utils.Queries.DeletePOItemsByOrder(ctx, orderID)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to replace items", err)
		return
	}

	// Re-insert items
	for _, item := range req.Items {
		supplierUUID, err := utils.ParseUUID(item.SupplierID)
		if err != nil {
			utils.ErrorResponse(c, http.StatusBadRequest, "Invalid supplier ID", err)
			return
		}

		var productUUID pgtype.UUID
		if item.ProductID != "" {
			pid, err := utils.ParseUUID(item.ProductID)
			if err == nil {
				productUUID = pid
			}
		}

		_, err = utils.Queries.CreatePurchaseOrderItem(ctx, db.CreatePurchaseOrderItemParams{
			PurchaseOrderID: orderID,
			SupplierID:      supplierUUID,
			ProductID:       productUUID,
			ProductName:     item.ProductName,
			OrderedQuantity: item.OrderedQty,
			UnitCost:        utils.Numeric(item.UnitCost),
		})
		if err != nil {
			utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to create order item", err)
			return
		}
	}

	// Return updated order
	updated, err := utils.Queries.GetPurchaseOrder(ctx, db.GetPurchaseOrderParams{
		ID:      orderID,
		StoreID: storeID,
	})
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch updated order", err)
		return
	}

	utils.SuccessResponse(c, "Order updated", updated)
}

func UpdatePurchaseOrderStatus(c *gin.Context) {
	storeID := c.MustGet("store_id").(pgtype.UUID)
	orderID, err := utils.ParseUUID(c.Param("id"))
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid ID", err)
		return
	}

	var req struct {
		Status string `json:"status" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid request", err)
		return
	}

	validTransitions := map[string]bool{
		"ordered": true, "cancelled": true,
	}
	if !validTransitions[req.Status] {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid status transition", nil)
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	po, err := utils.Queries.UpdatePurchaseOrderStatus(ctx, db.UpdatePurchaseOrderStatusParams{
		ID:      orderID,
		StoreID: storeID,
		Status:  req.Status,
	})
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to update status", err)
		return
	}

	utils.SuccessResponse(c, "Status updated", po)
}

func DeletePurchaseOrder(c *gin.Context) {
	storeID := c.MustGet("store_id").(pgtype.UUID)
	orderID, err := utils.ParseUUID(c.Param("id"))
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid ID", err)
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	err = utils.Queries.DeletePurchaseOrder(ctx, db.DeletePurchaseOrderParams{
		ID:      orderID,
		StoreID: storeID,
	})
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to delete order", err)
		return
	}

	utils.SuccessResponse(c, "Order deleted", nil)
}

func GetSupplierPurchaseOrders(c *gin.Context) {
	storeID := c.MustGet("store_id").(pgtype.UUID)
	supplierID, err := utils.ParseUUID(c.Param("id"))
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid ID", err)
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	orders, err := utils.Queries.GetPurchaseOrdersBySupplier(ctx, db.GetPurchaseOrdersBySupplierParams{
		StoreID:    storeID,
		SupplierID: supplierID,
	})
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch orders", err)
		return
	}

	if orders == nil {
		orders = []db.PurchaseOrder{}
	}

	utils.SuccessResponse(c, "Orders fetched", orders)
}

type receiveItemInput struct {
	ItemID          string  `json:"item_id"`
	ReceivedQty     int32   `json:"received_quantity"`
	DamagedQty      int32   `json:"damaged_quantity"`
}

type supplierPaymentInput struct {
	SupplierID    string  `json:"supplier_id"`
	PaymentAmount float64 `json:"payment_amount"`
	PaymentMethod string  `json:"payment_method"`
	PaymentNotes  string  `json:"payment_notes"`
}

func ReceivePurchaseOrder(c *gin.Context) {
	storeID := c.MustGet("store_id").(pgtype.UUID)
	orderID, err := utils.ParseUUID(c.Param("id"))
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid ID", err)
		return
	}

	var req struct {
		Items    []receiveItemInput    `json:"items" binding:"required"`
		Payments []supplierPaymentInput `json:"payments"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid request", err)
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	// Verify PO exists and is in 'ordered' status
	po, err := utils.Queries.GetPurchaseOrder(ctx, db.GetPurchaseOrderParams{
		ID:      orderID,
		StoreID: storeID,
	})
	if err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Order not found", err)
		return
	}
	if po.Status != "ordered" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Order must be in 'ordered' status to receive", nil)
		return
	}

	// Start transaction
	tx, err := utils.DBPool.Begin(ctx)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to start transaction", err)
		return
	}
	defer tx.Rollback(ctx)

	qtx := utils.Queries.WithTx(tx)

	itemMap := make(map[string]db.GetPOItemRow)
	for _, item := range req.Items {
		itemID, err := utils.ParseUUID(item.ItemID)
		if err != nil {
			utils.ErrorResponse(c, http.StatusBadRequest, "Invalid item ID", err)
			return
		}
		poItem, err := utils.Queries.GetPOItem(ctx, itemID)
		if err != nil {
			utils.ErrorResponse(c, http.StatusNotFound, "Item not found", err)
			return
		}
		itemMap[item.ItemID] = poItem
	}

	supplierTotals := make(map[string]float64)
	for _, item := range req.Items {
		poItem := itemMap[item.ItemID]

		// Update PO item with received/damaged quantities
		_, err = qtx.UpdatePOItemReceive(ctx, db.UpdatePOItemReceiveParams{
			ID:               poItem.ID,
			ReceivedQuantity: item.ReceivedQty,
			DamagedQuantity:  item.DamagedQty,
		})
		if err != nil {
			utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to update item", err)
			return
		}

		// Update product stock (add received quantity)
		if poItem.ProductID.Valid && item.ReceivedQty > 0 {
			_, err = qtx.ReturnProductStock(ctx, db.ReturnProductStockParams{
				ID:            poItem.ProductID,
				StockQuantity: item.ReceivedQty,
				StoreID:       storeID,
			})
			if err != nil {
				utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to update stock", err)
				return
			}
		}

		// Update damaged stock
		if poItem.ProductID.Valid && item.DamagedQty > 0 {
			_, err = qtx.AddDamagedProductStock(ctx, db.AddDamagedProductStockParams{
				ID:              poItem.ProductID,
				DamagedQuantity: item.DamagedQty,
				StoreID:         storeID,
			})
			if err != nil {
				utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to update damaged stock", err)
				return
			}
		}

		// Accumulate cost per supplier
		supplierKey := poItem.SupplierID.String()
		itemCost := float64(item.ReceivedQty) * utils.Float64(poItem.UnitCost)
		supplierTotals[supplierKey] += itemCost
	}

	// Process payments per supplier
	for _, payment := range req.Payments {
		supplierUUID, err := utils.ParseUUID(payment.SupplierID)
		if err != nil {
			utils.ErrorResponse(c, http.StatusBadRequest, "Invalid supplier ID", err)
			continue
		}
		totalDue := supplierTotals[payment.SupplierID]
		amountPaid := payment.PaymentAmount

		// Determine status
		payableStatus := "pending"
		var payableAmountPaid float64
		if amountPaid >= totalDue {
			payableStatus = "paid"
			payableAmountPaid = totalDue
		} else if amountPaid > 0 {
			payableStatus = "partial"
			payableAmountPaid = amountPaid
		}

		// Always create a payable first (so payment can reference it)
		payable, err := qtx.CreateSupplierPayable(ctx, db.CreateSupplierPayableParams{
			StoreID:     storeID,
			SupplierID:  supplierUUID,
			Description: utils.OptionalText("From purchase order"),
			AmountOwed:  utils.Numeric(totalDue),
			AmountPaid:  utils.Numeric(payableAmountPaid),
			DueDate:     pgtype.Timestamptz{Valid: false},
			Status:      payableStatus,
		})
		if err != nil {
			utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to create payable", err)
			return
		}

		if amountPaid > 0 {
			// Record payment linked to the payable
			_, err = qtx.RecordSupplierPayment(ctx, db.RecordSupplierPaymentParams{
				StoreID:       storeID,
				PayableID:     payable.ID,
				Amount:        utils.Numeric(amountPaid),
				PaymentMethod: utils.OptionalText(payment.PaymentMethod),
				Notes:         utils.OptionalText(payment.PaymentNotes),
			})
			if err != nil {
				utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to record payment", err)
				return
			}
		}
	}

	// Check if all items are fully received
	allItems, err := qtx.GetPOItemsForReceive(ctx, orderID)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to check items", err)
		return
	}

	allReceived := true
	anyReceived := false
	for _, item := range allItems {
		if item.ReceivedQuantity+item.DamagedQuantity >= item.OrderedQuantity {
			anyReceived = true
		} else {
			allReceived = false
		}
	}

	newStatus := "ordered"
	if anyReceived && !allReceived {
		newStatus = "partially_received"
	} else if allReceived {
		newStatus = "received"
	}

	_, err = qtx.UpdatePurchaseOrderStatus(ctx, db.UpdatePurchaseOrderStatusParams{
		ID:      orderID,
		StoreID: storeID,
		Status:  newStatus,
	})
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to update order status", err)
		return
	}

	if err := tx.Commit(ctx); err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to commit transaction", err)
		return
	}

	utils.SuccessResponse(c, "Receiving completed successfully", gin.H{
		"status":          newStatus,
		"supplier_totals": supplierTotals,
	})
}
