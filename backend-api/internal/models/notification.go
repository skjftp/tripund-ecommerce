package models

import "time"

type Notification struct {
	ID        string    `json:"id" firestore:"id"`
	Type      string    `json:"type" firestore:"type"` // order, payment, user, product, system
	Title     string    `json:"title" firestore:"title"`
	Message   string    `json:"message" firestore:"message"`
	Icon      string    `json:"icon" firestore:"icon"`
	Link      string    `json:"link" firestore:"link"`
	IsRead    bool      `json:"is_read" firestore:"is_read"`
	UserID    string    `json:"user_id" firestore:"user_id"` // admin or specific user
	CreatedAt time.Time `json:"created_at" firestore:"created_at"`
}

type NotificationStats struct {
	TotalCount  int `json:"total_count"`
	UnreadCount int `json:"unread_count"`
}