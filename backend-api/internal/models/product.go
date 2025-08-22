package models

import "time"

type Product struct {
	ID               string                 `json:"id" firestore:"-"`
	SKU              string                 `json:"sku" firestore:"sku"`
	Name             string                 `json:"name" firestore:"name"`
	Slug             string                 `json:"slug" firestore:"slug"`
	Description      string                 `json:"description" firestore:"description"`
	ShortDescription string                 `json:"short_description" firestore:"short_description"`
	Price            float64                `json:"price" firestore:"price"`
	SalePrice        *float64               `json:"sale_price" firestore:"sale_price,omitempty"`
	ManageStock      bool                   `json:"manage_stock" firestore:"manage_stock"`
	StockQuantity    int                    `json:"stock_quantity" firestore:"stock_quantity"`
	StockStatus      string                 `json:"stock_status" firestore:"stock_status"`
	Featured         bool                   `json:"featured" firestore:"featured"`
	Status           string                 `json:"status" firestore:"status"`
	Images           []string               `json:"images" firestore:"images"`
	Categories       []string               `json:"categories" firestore:"categories"`
	Tags             []string               `json:"tags" firestore:"tags"`
	Attributes       []ProductAttribute     `json:"attributes" firestore:"attributes"`
	Dimensions       ProductDimensions      `json:"dimensions" firestore:"dimensions"`
	Weight           ProductWeight          `json:"weight" firestore:"weight"`
	CreatedAt        time.Time              `json:"created_at" firestore:"created_at"`
	UpdatedAt        time.Time              `json:"updated_at" firestore:"updated_at"`
	ParsedDescription map[string]interface{} `json:"parsed_description,omitempty" firestore:"parsed_description,omitempty"`
}

type ProductAttribute struct {
	Name  string `json:"name" firestore:"name"`
	Value string `json:"value" firestore:"value"`
}

type ProductDimensions struct {
	Length float64 `json:"length" firestore:"length"`
	Width  float64 `json:"width" firestore:"width"`
	Height float64 `json:"height" firestore:"height"`
	Unit   string  `json:"unit" firestore:"unit"`
}

type ProductWeight struct {
	Value float64 `json:"value" firestore:"value"`
	Unit  string  `json:"unit" firestore:"unit"`
}