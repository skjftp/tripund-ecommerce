package models

import "time"

type SubCategory struct {
	Name         string `json:"name" firestore:"name"`
	ProductCount int    `json:"product_count" firestore:"product_count"`
}

type Category struct {
	ID             string        `json:"id" firestore:"-"`
	SKU            string        `json:"sku" firestore:"sku"`
	Name           string        `json:"name" firestore:"name"`
	Slug           string        `json:"slug" firestore:"slug"`
	Description    string        `json:"description" firestore:"description"`
	Image          string        `json:"image,omitempty" firestore:"image,omitempty"`
	LandscapeImage string        `json:"landscape_image,omitempty" firestore:"landscape_image,omitempty"`
	Children       []SubCategory `json:"children" firestore:"children"`
	Order          int           `json:"order" firestore:"order"`
	CreatedAt      time.Time     `json:"created_at" firestore:"created_at"`
	UpdatedAt      time.Time     `json:"updated_at" firestore:"updated_at"`
}