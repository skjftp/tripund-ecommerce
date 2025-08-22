package models

import "time"

type Product struct {
	ID             string                 `json:"id" firestore:"id"`
	Title          string                 `json:"title" firestore:"title" validate:"required"`
	Description    string                 `json:"description" firestore:"description"`
	ShortDesc      string                 `json:"short_description" firestore:"short_description"`
	Price          Price                  `json:"price" firestore:"price"`
	Discount       int                    `json:"discount" firestore:"discount"`
	Category       string                 `json:"category" firestore:"category"`
	Subcategory    string                 `json:"subcategory" firestore:"subcategory"`
	Tags           []string               `json:"tags" firestore:"tags"`
	Images         Images                 `json:"images" firestore:"images"`
	Inventory      Inventory              `json:"inventory" firestore:"inventory"`
	Artisan        Artisan                `json:"artisan" firestore:"artisan"`
	Specifications map[string]interface{} `json:"specifications" firestore:"specifications"`
	SEO            SEO                    `json:"seo" firestore:"seo"`
	Status         string                 `json:"status" firestore:"status"`
	Featured       bool                   `json:"featured" firestore:"featured"`
	IsLimited      bool                   `json:"is_limited" firestore:"is_limited"`
	CreatedAt      time.Time              `json:"created_at" firestore:"created_at"`
	UpdatedAt      time.Time              `json:"updated_at" firestore:"updated_at"`
}

type Price struct {
	Current  float64 `json:"current" firestore:"current"`
	Original float64 `json:"original" firestore:"original"`
	Currency string  `json:"currency" firestore:"currency"`
}

type Images struct {
	Main       string   `json:"main" firestore:"main"`
	Gallery    []string `json:"gallery" firestore:"gallery"`
	Thumbnails []string `json:"thumbnails" firestore:"thumbnails"`
}

type Inventory struct {
	InStock  bool   `json:"in_stock" firestore:"in_stock"`
	Quantity int    `json:"quantity" firestore:"quantity"`
	SKU      string `json:"sku" firestore:"sku"`
}

type Artisan struct {
	Name     string `json:"name" firestore:"name"`
	Location string `json:"location" firestore:"location"`
	Story    string `json:"story" firestore:"story"`
}

type SEO struct {
	MetaTitle       string `json:"meta_title" firestore:"meta_title"`
	MetaDescription string `json:"meta_description" firestore:"meta_description"`
	Keywords        string `json:"keywords" firestore:"keywords"`
}