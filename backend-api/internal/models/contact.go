package models

import "time"

type ContactMessage struct {
	ID        string    `json:"id" firestore:"id"`
	Name      string    `json:"name" firestore:"name" validate:"required"`
	Email     string    `json:"email" firestore:"email" validate:"required,email"`
	Phone     string    `json:"phone" firestore:"phone"`
	Subject   string    `json:"subject" firestore:"subject" validate:"required"`
	Message   string    `json:"message" firestore:"message" validate:"required"`
	Status    string    `json:"status" firestore:"status"` // new, read, replied
	IsRead    bool      `json:"is_read" firestore:"is_read"`
	RepliedAt *time.Time `json:"replied_at,omitempty" firestore:"replied_at,omitempty"`
	Reply     string    `json:"reply,omitempty" firestore:"reply,omitempty"`
	CreatedAt time.Time `json:"created_at" firestore:"created_at"`
}