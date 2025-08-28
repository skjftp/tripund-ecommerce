package models

import "time"

type Order struct {
	ID            string      `json:"id" firestore:"id"`
	OrderNumber   string      `json:"order_number" firestore:"order_number"`
	UserID        string      `json:"user_id" firestore:"user_id"`
	GuestEmail    string      `json:"guest_email,omitempty" firestore:"guest_email,omitempty"`
	GuestName     string      `json:"guest_name,omitempty" firestore:"guest_name,omitempty"`
	GuestPhone    string      `json:"guest_phone,omitempty" firestore:"guest_phone,omitempty"`
	Items         []OrderItem `json:"items" firestore:"items"`
	ShippingAddress UserAddress  `json:"shipping_address" firestore:"shipping_address"`
	BillingAddress  UserAddress  `json:"billing_address" firestore:"billing_address"`
	Payment       Payment     `json:"payment" firestore:"payment"`
	Totals        OrderTotals `json:"totals" firestore:"totals"`
	Status        string      `json:"status" firestore:"status"`
	Tracking      *Tracking   `json:"tracking,omitempty" firestore:"tracking"`
	Notes         string      `json:"notes" firestore:"notes"`
	CreatedAt     time.Time   `json:"created_at" firestore:"created_at"`
	UpdatedAt     time.Time   `json:"updated_at" firestore:"updated_at"`
}

type OrderItem struct {
	ProductID    string  `json:"product_id" firestore:"product_id"`
	ProductName  string  `json:"product_name" firestore:"product_name"`
	ProductImage string  `json:"product_image" firestore:"product_image"`
	SKU          string  `json:"sku" firestore:"sku"`
	Quantity     int     `json:"quantity" firestore:"quantity"`
	Price        float64 `json:"price" firestore:"price"`
	Discount     float64 `json:"discount" firestore:"discount"`
	Total        float64 `json:"total" firestore:"total"`
	// Variant information if applicable
	VariantID    string  `json:"variant_id,omitempty" firestore:"variant_id,omitempty"`
	VariantColor string  `json:"variant_color,omitempty" firestore:"variant_color,omitempty"`
	VariantSize  string  `json:"variant_size,omitempty" firestore:"variant_size,omitempty"`
}

type Payment struct {
	Method          string    `json:"method" firestore:"method"`
	Status          string    `json:"status" firestore:"status"`
	TransactionID   string    `json:"transaction_id" firestore:"transaction_id"`
	RazorpayOrderID string    `json:"razorpay_order_id" firestore:"razorpay_order_id"`
	RazorpayPaymentID string  `json:"razorpay_payment_id" firestore:"razorpay_payment_id"`
	RazorpaySignature string  `json:"razorpay_signature" firestore:"razorpay_signature"`
	Amount          float64   `json:"amount" firestore:"amount"`
	Currency        string    `json:"currency" firestore:"currency"`
	PaidAt          time.Time `json:"paid_at" firestore:"paid_at"`
}

type OrderTotals struct {
	Subtotal     float64 `json:"subtotal" firestore:"subtotal"`
	Discount     float64 `json:"discount" firestore:"discount"`
	Tax          float64 `json:"tax" firestore:"tax"`
	CGST         float64 `json:"cgst" firestore:"cgst"`
	SGST         float64 `json:"sgst" firestore:"sgst"`
	IGST         float64 `json:"igst" firestore:"igst"`
	Shipping     float64 `json:"shipping" firestore:"shipping"`
	Total        float64 `json:"total" firestore:"total"`
	CouponCode   string  `json:"coupon_code" firestore:"coupon_code"`
	CouponAmount float64 `json:"coupon_amount" firestore:"coupon_amount"`
}

type Tracking struct {
	Provider    string    `json:"provider" firestore:"provider"`
	Number      string    `json:"number" firestore:"number"`
	URL         string    `json:"url" firestore:"url"`
	ShippedAt   time.Time `json:"shipped_at" firestore:"shipped_at"`
	DeliveredAt time.Time `json:"delivered_at" firestore:"delivered_at"`
	Status      string    `json:"status" firestore:"status"`
}

type Cart struct {
	ID        string     `json:"id" firestore:"id"`
	UserID    string     `json:"user_id" firestore:"user_id"`
	Items     []CartItem `json:"items" firestore:"items"`
	CreatedAt time.Time  `json:"created_at" firestore:"created_at"`
	UpdatedAt time.Time  `json:"updated_at" firestore:"updated_at"`
}

