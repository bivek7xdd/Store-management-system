package db

import (
	"context"
	"fmt"

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
		if rbErr := tx.Rollback(ctx); rbErr != nil {
			return fmt.Errorf("tx err: %v, rb err: %v", err, rbErr)
		}
		return err
	}

	return tx.Commit(ctx)
}

// CreateSaleTxParams contains input parameters for the transfer transaction
type CreateSaleTxParams struct {
	CreateSaleParams CreateSaleParams
	Items            []CreateSaleItemParams
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

			// Update Stock (assuming you have this query)
			_, err = q.UpdateProductStock(ctx, UpdateProductStockParams{
				ID:            item.ProductID,
				StockQuantity: item.Quantity,
				StoreID:       arg.CreateSaleParams.StoreID,
			})
			if err != nil {
				return err
			}
		}

		// 3. Create Debt if needed
		if arg.CreateDebtParams != nil {
			// Link debt to the created sale ID
			arg.CreateDebtParams.SaleID.Bytes = result.Sale.ID.Bytes
			arg.CreateDebtParams.SaleID.Valid = true

			_, err = q.CreateDebt(ctx, *arg.CreateDebtParams)
			if err != nil {
				return err
			}
		}

		return nil
	})

	return result, err
}
