package db

import (
	"context"
	"fmt"
	"storemanagement/redis"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Store provides all functions to execute db queries and transactions
type Store struct {
	*Queries
	db *pgxpool.Pool
}

// NewStore creates a new Store
func NewStore(db *pgxpool.Pool) *Store {
	return &Store{
		db:      db,
		Queries: New(db),
	}
}

// ExecTx executes a function within a database transaction
func (store *Store) ExecTx(ctx context.Context, fn func(*Queries) error) error {
	tx, err := store.db.Begin(ctx)
	if err != nil {
		return err
	}

	q := New(tx)
	err = fn(q)
	if err != nil {
		fmt.Printf("Transaction error, rolling back: %v\n", err)
		if rbErr := tx.Rollback(ctx); rbErr != nil {
			return fmt.Errorf("tx err: %v, rb err: %v", err, rbErr)
		}
		return err
	}

	fmt.Println("Transaction successful, committing...")
	return tx.Commit(ctx)
}

type CreateSaleTxParams struct {
	CreateSaleParams CreateSaleParams
	Items            []CreateSaleItemParams
	Payments         []CreatePaymentRecordParams
	CreateDebtParams *CreateDebtParams // Optional, nil if no debt
}

// CreateSaleTxResult is the result of the transfer transaction
type CreateSaleTxResult struct {
	Sale Sale
}

// CreateSaleTx performs a money transfer from one account to the other
// It creates a transfer record, add account entries, and update accounts' balance within a single database transaction
func (store *Store) CreateSaleTx(ctx context.Context, arg CreateSaleTxParams) (CreateSaleTxResult, error) {
	var result CreateSaleTxResult

	err := store.ExecTx(ctx, func(q *Queries) error {
		var err error

		// 1. Create Sale
		result.Sale, err = q.CreateSale(ctx, arg.CreateSaleParams)
		if err != nil {
			return err
		}

		// 2. Create Sale Items & Update Stock
		for _, item := range arg.Items {
			// Link item to the created sale ID
			item.SaleID = result.Sale.ID

			_, err = q.CreateSaleItem(ctx, item)
			if err != nil {
				return err
			}

			// Update Variant Stock if applicable
			if item.VariantID.Valid {
				_, err = q.UpdateVariantStock(ctx, UpdateVariantStockParams{
					ID:         item.VariantID,
					StockLevel: item.Quantity,
				})
				if err != nil {
					return err
				}
			}

			// Update Parent/Main Product Stock
			product, err := q.UpdateProductStock(ctx, UpdateProductStockParams{
				ID:            item.ProductID,
				StockQuantity: item.Quantity,
				StoreID:       arg.CreateSaleParams.StoreID,
			})
			if err != nil {
				return err
			}

			// 3. Check for low stock and create notification
			q.CheckAndNotifyLowStock(ctx, arg.CreateSaleParams.StoreID, product)
		}

		// 4. Create Payment Records
		for _, payment := range arg.Payments {
			payment.SaleID = result.Sale.ID
			_, err = q.CreatePaymentRecord(ctx, payment)
			if err != nil {
				return err
			}
		}

		// 5. Create Debt if needed
		if arg.CreateDebtParams != nil {
			// Link debt to the created sale ID
			arg.CreateDebtParams.SaleID.Bytes = result.Sale.ID.Bytes
			arg.CreateDebtParams.SaleID.Valid = true

			_, err = q.CreateDebt(ctx, *arg.CreateDebtParams)
			if err != nil {
				return err
			}
		}

		// 6. Update Customer Loyalty
		if arg.CreateSaleParams.CustomerID.Valid {
			err = q.IncrementCustomerPurchaseCount(ctx, IncrementCustomerPurchaseCountParams{
				ID:      arg.CreateSaleParams.CustomerID,
				StoreID: arg.CreateSaleParams.StoreID,
			})
			if err != nil {
				// Log but don't fail sale for loyalty tracking
				fmt.Printf("Warning: failed to increment purchase count: %v\n", err)
			}
		}

		return nil
	})

	return result, err
}

// CheckAndNotifyLowStock checks if product stock is below threshold and creates a notification if so
func (q *Queries) CheckAndNotifyLowStock(ctx context.Context, storeID pgtype.UUID, product Product) {
	if !product.LowStockThreshold.Valid {
		return
	}

	if product.StockQuantity <= product.LowStockThreshold.Int32 {
		// Check if notification already exists (within last 24 hours to avoid spam)
		exists, _ := q.CheckNotificationExists(ctx, CheckNotificationExistsParams{
			StoreID:     storeID,
			Type:        NotificationTypeLowStock,
			ReferenceID: product.ID,
		})

		if !exists {
			_, err := q.CreateNotification(ctx, CreateNotificationParams{
				StoreID:       storeID,
				Type:          NotificationTypeLowStock,
				Title:         "Low Stock Alert",
				Message:       fmt.Sprintf("%s is running low on stock. Current: %d, Threshold: %d", product.Name, product.StockQuantity, product.LowStockThreshold.Int32),
				ReferenceID:   product.ID,
				ReferenceType: pgtype.Text{String: "product", Valid: true},
				Status:        NotificationStatusUnread,
			})
			if err != nil {
				// Just log the error, don't break the flow
				fmt.Printf("Error creating low stock notification for product %s: %v\n", product.Name, err)
			} else {
				// Invalidate cache so the badge count updates
				redis.InvalidateNotificationCount(ctx, storeID)
			}

		}
	}
}

type CreateProductWithVariantsTxParams struct {
	Product  CreateProductParams
	Variants []CreateProductVariantParams
}

func (store *Store) CreateProductWithVariantsTx(ctx context.Context, arg CreateProductWithVariantsTxParams) (Product, []ProductVariant, error) {
	var product Product
	var variants []ProductVariant

	err := store.ExecTx(ctx, func(q *Queries) error {
		var err error

		product, err = q.CreateProduct(ctx, arg.Product)
		if err != nil {
			return err
		}

		totalStock := int32(0)
		for _, vArg := range arg.Variants {
			vArg.ProductID = product.ID
			variant, err := q.CreateProductVariant(ctx, vArg)
			if err != nil {
				return err
			}
			variants = append(variants, variant)
			totalStock += vArg.StockLevel
		}

		// Update parent stock with aggregate sum
		product, err = q.UpdateProduct(ctx, UpdateProductParams{
			ID:                product.ID,
			Name:              product.Name,
			Barcode:           product.Barcode,
			Price:             product.Price,
			CostPrice:         product.CostPrice,
			MarketPrice:       product.MarketPrice,
			StockQuantity:     totalStock,
			LowStockThreshold: product.LowStockThreshold,
			ExpiresAt:         product.ExpiresAt,
			Status:            product.Status,
			CategoryID:        product.CategoryID,
			SupplierID:        product.SupplierID,
			ImageUrl:          product.ImageUrl,
			IsTracked:         product.IsTracked,
		})

		return err
	})

	return product, variants, err
}

type UpdateProductWithVariantsTxParams struct {
	UpdateProductParams UpdateProductParams
	Variants            []CreateProductVariantParams
}

func (store *Store) UpdateProductWithVariantsTx(ctx context.Context, arg UpdateProductWithVariantsTxParams) (Product, []ProductVariant, error) {
	var product Product
	var variants []ProductVariant

	err := store.ExecTx(ctx, func(q *Queries) error {
		var err error

		product, err = q.UpdateProduct(ctx, arg.UpdateProductParams)
		if err != nil {
			return err
		}

		// Delete existing variants
		err = q.DeleteVariantsByProduct(ctx, DeleteVariantsByProductParams{
			ProductID: product.ID,
			StoreID:   product.StoreID,
		})
		if err != nil {
			return err
		}

		totalStock := int32(0)
		// Create new variants
		for _, vArg := range arg.Variants {
			vArg.ProductID = product.ID
			variant, err := q.CreateProductVariant(ctx, vArg)
			if err != nil {
				return err
			}
			variants = append(variants, variant)
			totalStock += vArg.StockLevel
		}

		// Update parent stock with aggregate sum if variants exist
		if len(arg.Variants) > 0 {
			product, err = q.UpdateProduct(ctx, UpdateProductParams{
				ID:                product.ID,
				Name:              product.Name,
				Barcode:           product.Barcode,
				Price:             product.Price,
				CostPrice:         product.CostPrice,
				MarketPrice:       product.MarketPrice,
				StockQuantity:     totalStock,
				LowStockThreshold: product.LowStockThreshold,
				ExpiresAt:         product.ExpiresAt,
				Status:            product.Status,
				CategoryID:        product.CategoryID,
				SupplierID:        product.SupplierID,
				ImageUrl:          product.ImageUrl,
				IsTracked:         product.IsTracked,
			})
		}

		return err
	})

	return product, variants, err
}

type CreateReturnItemTxParams struct {
	SaleItemID pgtype.UUID
	Quantity   int32
	Reason     string
	Condition  string
	ProductID  pgtype.UUID
	VariantID  pgtype.UUID
}

type CreateReturnTxParams struct {
	SaleID       pgtype.UUID
	StoreID      pgtype.UUID
	RefundAmount pgtype.Numeric
	RefundMethod string
	Items        []CreateReturnItemTxParams
}

func (store *Store) CreateReturnTx(ctx context.Context, arg CreateReturnTxParams) (Return, error) {
	var ret Return

	err := store.ExecTx(ctx, func(q *Queries) error {
		var err error

		ret, err = q.CreateReturn(ctx, CreateReturnParams{
			SaleID:       arg.SaleID,
			StoreID:      arg.StoreID,
			RefundAmount: arg.RefundAmount,
			RefundMethod: arg.RefundMethod,
		})
		if err != nil {
			return err
		}

		for _, item := range arg.Items {
			_, err = q.CreateReturnItem(ctx, CreateReturnItemParams{
				ReturnID:   ret.ID,
				SaleItemID: item.SaleItemID,
				Quantity:   item.Quantity,
				Reason:     item.Reason,
				Condition:  item.Condition,
			})
			if err != nil {
				return err
			}

			if item.Condition == "damaged" || item.Condition == "defective" {
				if item.VariantID.Valid {
					_, err = q.AddDamagedVariantStock(ctx, AddDamagedVariantStockParams{
						ID:                item.VariantID,
						DamagedStockLevel: item.Quantity,
					})
				} else {
					_, err = q.AddDamagedProductStock(ctx, AddDamagedProductStockParams{
						ID:              item.ProductID,
						DamagedQuantity: item.Quantity,
						StoreID:         arg.StoreID,
					})
				}
			} else {
				if item.VariantID.Valid {
					_, err = q.ReturnVariantStock(ctx, ReturnVariantStockParams{
						ID:         item.VariantID,
						StockLevel: item.Quantity,
					})
				} else {
					_, err = q.ReturnProductStock(ctx, ReturnProductStockParams{
						ID:            item.ProductID,
						StockQuantity: item.Quantity,
						StoreID:       arg.StoreID,
					})
				}
			}
			if err != nil {
				return err
			}
		}

		return nil
	})

	return ret, err
}
