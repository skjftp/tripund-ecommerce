package models

// ProductVariant represents a product variation (size/color combination)
type ProductVariant struct {
	ID            string   `json:"id" firestore:"id"`
	Color         string   `json:"color" firestore:"color"`
	Size          string   `json:"size" firestore:"size"`
	Price         float64  `json:"price" firestore:"price"`
	SalePrice     float64  `json:"sale_price,omitempty" firestore:"sale_price,omitempty"`
	SKU           string   `json:"sku" firestore:"sku"`
	StockQuantity int      `json:"stock_quantity" firestore:"stock_quantity"`
	Images        []string `json:"images,omitempty" firestore:"images,omitempty"`
	Available     bool     `json:"available" firestore:"available"`
}

type Product struct {
	ID               string                 `json:"id" firestore:"-"`
	SKU              string                 `json:"sku" firestore:"sku"`
	Name             string                 `json:"name" firestore:"name"`
	Slug             string                 `json:"slug" firestore:"slug"`
	Description      string                 `json:"description" firestore:"description"`
	ShortDescription string                 `json:"short_description" firestore:"short_description"`
	Price            float64                `json:"price" firestore:"price"`
	SalePrice        interface{}            `json:"sale_price" firestore:"sale_price"`
	ManageStock      bool                   `json:"manage_stock" firestore:"manage_stock"`
	StockQuantity    int                    `json:"stock_quantity" firestore:"stock_quantity"`
	StockStatus      string                 `json:"stock_status" firestore:"stock_status"`
	Featured         bool                   `json:"featured" firestore:"featured"`
	Status           string                 `json:"status" firestore:"status"`
	Images           []string               `json:"images" firestore:"images"`
	Categories       []string               `json:"categories" firestore:"categories"`
	Subcategories    []string               `json:"subcategories" firestore:"subcategories"`
	Tags             []string               `json:"tags" firestore:"tags"`
	Attributes       []map[string]interface{} `json:"attributes" firestore:"attributes"`
	Dimensions       map[string]interface{}   `json:"dimensions" firestore:"dimensions"`
	Weight           map[string]interface{}   `json:"weight" firestore:"weight"`
	CreatedAt        interface{}            `json:"created_at" firestore:"created_at"`
	UpdatedAt        interface{}            `json:"updated_at" firestore:"updated_at"`
	ParsedDescription map[string]interface{} `json:"parsed_description,omitempty" firestore:"parsed_description,omitempty"`
	
	// Variant support
	HasVariants      bool              `json:"has_variants" firestore:"has_variants"`
	Variants         []ProductVariant  `json:"variants,omitempty" firestore:"variants,omitempty"`
	AvailableColors  []string          `json:"available_colors,omitempty" firestore:"available_colors,omitempty"`
	AvailableSizes   []string          `json:"available_sizes,omitempty" firestore:"available_sizes,omitempty"`
}

// Removed individual structs as we're using map[string]interface{} 
// to handle the flexible data structure from Firestore