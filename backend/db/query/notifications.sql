-- name: CreateNotification :one
INSERT INTO notifications (
    store_id,
    type,
    title,
    message,
    reference_id,
    reference_type,
    status
) VALUES (
    $1, $2, $3, $4, $5, $6, $7
) RETURNING *;

-- name: GetNotifications :many
SELECT * FROM notifications
WHERE store_id = $1
ORDER BY 
    CASE WHEN status = 'unread' THEN 0 ELSE 1 END,
    created_at DESC
LIMIT $2 OFFSET $3;

-- name: GetUnreadNotifications :many
SELECT * FROM notifications
WHERE store_id = $1 AND status = 'unread'
ORDER BY created_at DESC;

-- name: GetUnreadCount :one
SELECT COUNT(*) FROM notifications
WHERE store_id = $1 AND status = 'unread';

-- name: MarkNotificationAsRead :one
UPDATE notifications
SET status = 'read', updated_at = CURRENT_TIMESTAMP
WHERE id = $1 AND store_id = $2
RETURNING *;

-- name: MarkAllNotificationsAsRead :exec
UPDATE notifications
SET status = 'read', updated_at = CURRENT_TIMESTAMP
WHERE store_id = $1 AND status = 'unread';

-- name: DismissNotification :one
UPDATE notifications
SET status = 'dismissed', updated_at = CURRENT_TIMESTAMP
WHERE id = $1 AND store_id = $2
RETURNING *;

-- name: DeleteNotification :exec
DELETE FROM notifications
WHERE id = $1 AND store_id = $2;

-- name: DeleteOldNotifications :exec
DELETE FROM notifications
WHERE store_id = $1 
  AND status = 'dismissed' 
  AND created_at < NOW() - INTERVAL '30 days';

-- name: CheckNotificationExists :one
SELECT EXISTS(
    SELECT 1 FROM notifications
    WHERE store_id = $1 
      AND type = $2 
      AND reference_id = $3
      AND status = 'unread'
      AND created_at > NOW() - INTERVAL '24 hours'
);
