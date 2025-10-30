package db

import (
	"context"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/stretchr/testify/require"
)

func createRandomUser(t *testing.T) User {
	arg := CreateUserParams{
		Name:     "Test User " + uuid.New().String(),
		Email:    "test" + uuid.New().String() + "@example.com",
		Password: "securepassword123",
		Phone:    pgtype.Text{String: "+1" + uuid.New().String()[:10], Valid: true},
	}

	user, err := testQueries.CreateUser(context.Background(), arg)
	require.NoError(t, err)
	require.NotEmpty(t, user)

	return user
}

func TestCreateUser(t *testing.T) {
	createRandomUser(t)
}

func TestGetUser(t *testing.T) {
	// Create a user first
	user1 := createRandomUser(t)
	user2, err := testQueries.GetUser(context.Background(), user1.ID)

	require.NoError(t, err)
	require.NotEmpty(t, user2)

	require.Equal(t, user1.ID, user2.ID)
	require.Equal(t, user1.Name, user2.Name)
	require.Equal(t, user1.Email, user2.Email)
	require.Equal(t, user1.Password, user2.Password)
	require.Equal(t, user1.Phone, user2.Phone)
	require.Equal(t, user1.Status, user2.Status)
	require.Equal(t, user1.EmailVerified, user2.EmailVerified)
	require.WithinDuration(t, user1.CreatedAt.Time, user2.CreatedAt.Time, time.Second)
}

func TestGetUserByEmail(t *testing.T) {
	user1 := createRandomUser(t)
	user2, err := testQueries.GetUserByEmail(context.Background(), user1.Email)

	require.NoError(t, err)
	require.NotEmpty(t, user2)
	require.Equal(t, user1.ID, user2.ID)
}

func TestListUsers(t *testing.T) {
	// Create multiple users
	for i := 0; i < 10; i++ {
		createRandomUser(t)
	}

	arg := ListUsersParams{
		Limit:  5,
		Offset: 0,
	}

	users, err := testQueries.ListUsers(context.Background(), arg)
	require.NoError(t, err)
	require.NotEmpty(t, users)
	require.Len(t, users, 5)

	for _, user := range users {
		require.NotEmpty(t, user)
	}
}

func TestUpdateUser(t *testing.T) {
	user1 := createRandomUser(t)

	newName := "Updated Name"
	newPhone := pgtype.Text{String: "+9876543210", Valid: true}
	newStatus := "inactive"

	arg := UpdateUserParams{
		ID:     user1.ID,
		Name:   newName,
		Phone:  newPhone,
		Status: newStatus,
		Email:  user1.Email, // Preserve the original email
	}

	updatedUser, err := testQueries.UpdateUser(
		context.Background(),
		arg,
	)

	require.NoError(t, err)
	require.NotEmpty(t, updatedUser)

	require.Equal(t, user1.ID, updatedUser.ID)
	require.Equal(t, newName, updatedUser.Name)
	require.Equal(t, user1.Email, updatedUser.Email) // Email shouldn't change
	require.Equal(t, newPhone, updatedUser.Phone)
	require.Equal(t, newStatus, updatedUser.Status)
	require.True(t, updatedUser.UpdatedAt.Time.After(user1.UpdatedAt.Time))
}

func TestDeleteUser(t *testing.T) {
	user1 := createRandomUser(t)

	err := testQueries.DeleteUser(context.Background(), user1.ID)
	require.NoError(t, err)

	user2, err := testQueries.GetUser(context.Background(), user1.ID)
	require.Error(t, err)
	require.Empty(t, user2)
}

func TestUpdateLoginAttempts(t *testing.T) {
	user1 := createRandomUser(t)

	failedAttempts := int32(3)
	lockedUntil := pgtype.Timestamptz{
		Time:  time.Now().Add(30 * time.Minute),
		Valid: true,
	}
	lastLogin := pgtype.Timestamptz{
		Time:  time.Now(),
		Valid: true,
	}

	updatedUser, err := testQueries.UpdateLoginAttempts(
		context.Background(),
		UpdateLoginAttemptsParams{
			ID:                  user1.ID,
			FailedLoginAttempts: failedAttempts,
			LockedUntil:         lockedUntil,
			LastLogin:           lastLogin,
		},
	)

	require.NoError(t, err)
	require.Equal(t, failedAttempts, updatedUser.FailedLoginAttempts)
	require.WithinDuration(t, lockedUntil.Time, updatedUser.LockedUntil.Time, time.Second)
	require.WithinDuration(t, lastLogin.Time, updatedUser.LastLogin.Time, time.Second)
}

func TestVerifyEmail(t *testing.T) {
	user1 := createRandomUser(t)
	require.False(t, user1.EmailVerified)

	verifiedUser, err := testQueries.VerifyEmail(context.Background(), user1.ID)
	require.NoError(t, err)
	require.True(t, verifiedUser.EmailVerified)
}

func TestUpdatePassword(t *testing.T) {
	user1 := createRandomUser(t)
	newPassword := "newSecurePassword123"

	updatedUser, err := testQueries.UpdatePassword(
		context.Background(),
		UpdatePasswordParams{
			Password: newPassword,
			ID:       user1.ID,
		},
	)

	require.NoError(t, err)
	require.Equal(t, newPassword, updatedUser.Password)
	require.True(t, updatedUser.UpdatedAt.Time.After(user1.UpdatedAt.Time))
}
