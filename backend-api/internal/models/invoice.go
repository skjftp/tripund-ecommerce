package models

import (
	"time"
)

type InvoiceStatus string

const (
	InvoiceStatusDraft    InvoiceStatus = "draft"
	InvoiceStatusSent     InvoiceStatus = "sent"
	InvoiceStatusPaid     InvoiceStatus = "paid"
	InvoiceStatusOverdue  InvoiceStatus = "overdue"
	InvoiceStatusCanceled InvoiceStatus = "canceled"
)

type InvoiceType string

const (
	InvoiceTypeRegular InvoiceType = "regular"
	InvoiceTypeCredit  InvoiceType = "credit_note"
	InvoiceTypeDebit   InvoiceType = "debit_note"
)

type InvoiceLineItem struct {
	ID          string  `json:"id" firestore:"id"`
	ProductID   string  `json:"product_id" firestore:"product_id"`
	ProductName string  `json:"product_name" firestore:"product_name"`
	Description string  `json:"description,omitempty" firestore:"description"`
	HSNCode     string  `json:"hsn_code" firestore:"hsn_code"`
	Quantity    float64 `json:"quantity" firestore:"quantity"`
	UnitPrice   float64 `json:"unit_price" firestore:"unit_price"`
	Discount    float64 `json:"discount,omitempty" firestore:"discount"`
	TaxableValue float64 `json:"taxable_value" firestore:"taxable_value"`
	CGSTRate    float64 `json:"cgst_rate" firestore:"cgst_rate"`
	CGSTAmount  float64 `json:"cgst_amount" firestore:"cgst_amount"`
	SGSTRate    float64 `json:"sgst_rate" firestore:"sgst_rate"`
	SGSTAmount  float64 `json:"sgst_amount" firestore:"sgst_amount"`
	IGSTRate    float64 `json:"igst_rate,omitempty" firestore:"igst_rate"`
	IGSTAmount  float64 `json:"igst_amount,omitempty" firestore:"igst_amount"`
	TotalAmount float64 `json:"total_amount" firestore:"total_amount"`
}

type Address struct {
	Line1      string `json:"line1" firestore:"line1"`
	Line2      string `json:"line2,omitempty" firestore:"line2"`
	City       string `json:"city" firestore:"city"`
	State      string `json:"state" firestore:"state"`
	StateCode  string `json:"state_code" firestore:"state_code"`
	PostalCode string `json:"postal_code" firestore:"postal_code"`
	Country    string `json:"country" firestore:"country"`
}

type BillingEntity struct {
	Name       string   `json:"name" firestore:"name"`
	GSTIN      string   `json:"gstin,omitempty" firestore:"gstin"`
	PAN        string   `json:"pan,omitempty" firestore:"pan"`
	Email      string   `json:"email,omitempty" firestore:"email"`
	Phone      string   `json:"phone,omitempty" firestore:"phone"`
	Address    Address  `json:"address" firestore:"address"`
	IsB2B      bool     `json:"is_b2b" firestore:"is_b2b"`
}

type BankDetails struct {
	AccountName   string `json:"account_name" firestore:"account_name"`
	AccountNumber string `json:"account_number" firestore:"account_number"`
	IFSCCode      string `json:"ifsc_code" firestore:"ifsc_code"`
	BankName      string `json:"bank_name" firestore:"bank_name"`
	BranchName    string `json:"branch_name,omitempty" firestore:"branch_name"`
}

type TaxSummary struct {
	TotalTaxableValue float64 `json:"total_taxable_value" firestore:"total_taxable_value"`
	TotalCGST        float64 `json:"total_cgst" firestore:"total_cgst"`
	TotalSGST        float64 `json:"total_sgst" firestore:"total_sgst"`
	TotalIGST        float64 `json:"total_igst" firestore:"total_igst"`
	TotalTax         float64 `json:"total_tax" firestore:"total_tax"`
	TotalDiscount    float64 `json:"total_discount" firestore:"total_discount"`
	GrandTotal       float64 `json:"grand_total" firestore:"grand_total"`
	RoundingAmount   float64 `json:"rounding_amount,omitempty" firestore:"rounding_amount"`
	FinalAmount      float64 `json:"final_amount" firestore:"final_amount"`
}

type Invoice struct {
	ID                string             `json:"id,omitempty" firestore:"-"`
	InvoiceNumber     string             `json:"invoice_number" firestore:"invoice_number"`
	OrderID           string             `json:"order_id" firestore:"order_id"`
	UserID            string             `json:"user_id" firestore:"user_id"`
	Type              InvoiceType        `json:"type" firestore:"type"`
	Status            InvoiceStatus      `json:"status" firestore:"status"`
	
	// Company Details (Seller)
	SellerName        string             `json:"seller_name" firestore:"seller_name"`
	SellerGSTIN       string             `json:"seller_gstin" firestore:"seller_gstin"`
	SellerPAN         string             `json:"seller_pan" firestore:"seller_pan"`
	SellerAddress     Address            `json:"seller_address" firestore:"seller_address"`
	SellerEmail       string             `json:"seller_email" firestore:"seller_email"`
	SellerPhone       string             `json:"seller_phone" firestore:"seller_phone"`
	
	// Customer Details (Buyer)
	BuyerDetails      BillingEntity      `json:"buyer_details" firestore:"buyer_details"`
	ShippingAddress   Address            `json:"shipping_address" firestore:"shipping_address"`
	
	// Invoice Details
	IssueDate         time.Time          `json:"issue_date" firestore:"issue_date"`
	DueDate           time.Time          `json:"due_date" firestore:"due_date"`
	PlaceOfSupply     string             `json:"place_of_supply" firestore:"place_of_supply"`
	PlaceOfDelivery   string             `json:"place_of_delivery" firestore:"place_of_delivery"`
	
	// Line Items
	LineItems         []InvoiceLineItem  `json:"line_items" firestore:"line_items"`
	
	// Tax Summary
	TaxSummary        TaxSummary         `json:"tax_summary" firestore:"tax_summary"`
	
	// Payment Information
	BankDetails       BankDetails        `json:"bank_details" firestore:"bank_details"`
	PaymentTerms      string             `json:"payment_terms,omitempty" firestore:"payment_terms"`
	
	// Additional Fields
	Notes             string             `json:"notes,omitempty" firestore:"notes"`
	TermsConditions   string             `json:"terms_conditions,omitempty" firestore:"terms_conditions"`
	
	// System Fields
	CreatedAt         time.Time          `json:"created_at" firestore:"created_at"`
	UpdatedAt         time.Time          `json:"updated_at" firestore:"updated_at"`
	CreatedBy         string             `json:"created_by,omitempty" firestore:"created_by"`
	
	// Linked Documents
	LinkedOrderID     string             `json:"linked_order_id,omitempty" firestore:"linked_order_id"`
	LinkedInvoiceID   string             `json:"linked_invoice_id,omitempty" firestore:"linked_invoice_id"` // For credit/debit notes
	
	// Compliance
	IRNHash           string             `json:"irn_hash,omitempty" firestore:"irn_hash"` // For e-invoicing
	AckNumber         string             `json:"ack_number,omitempty" firestore:"ack_number"`
	EInvoiceStatus    string             `json:"e_invoice_status,omitempty" firestore:"e_invoice_status"`
	QRCode            string             `json:"qr_code,omitempty" firestore:"qr_code"`
}

// Helper methods for tax calculations
func (i *Invoice) CalculateTaxSummary() {
	var totalTaxableValue, totalCGST, totalSGST, totalIGST, totalDiscount float64
	
	for _, item := range i.LineItems {
		totalTaxableValue += item.TaxableValue
		totalCGST += item.CGSTAmount
		totalSGST += item.SGSTAmount
		totalIGST += item.IGSTAmount
		totalDiscount += item.Discount
	}
	
	totalTax := totalCGST + totalSGST + totalIGST
	grandTotal := totalTaxableValue + totalTax
	
	// Round to nearest rupee
	roundingAmount := 0.0
	finalAmount := grandTotal
	if grandTotal != float64(int(grandTotal)) {
		finalAmount = float64(int(grandTotal + 0.5))
		roundingAmount = finalAmount - grandTotal
	}
	
	i.TaxSummary = TaxSummary{
		TotalTaxableValue: totalTaxableValue,
		TotalCGST:        totalCGST,
		TotalSGST:        totalSGST,
		TotalIGST:        totalIGST,
		TotalTax:         totalTax,
		TotalDiscount:    totalDiscount,
		GrandTotal:       grandTotal,
		RoundingAmount:   roundingAmount,
		FinalAmount:      finalAmount,
	}
}

func (i *Invoice) IsInterState() bool {
	return i.SellerAddress.StateCode != i.BuyerDetails.Address.StateCode
}

func (i *Invoice) IsB2B() bool {
	return i.BuyerDetails.GSTIN != ""
}

// Helper to determine if IGST or CGST+SGST should be applied
func (item *InvoiceLineItem) ApplyGST(gstRate float64, isInterState bool) {
	if isInterState {
		// Inter-state: Apply IGST
		item.IGSTRate = gstRate
		item.IGSTAmount = (item.TaxableValue * gstRate) / 100
		item.CGSTRate = 0
		item.CGSTAmount = 0
		item.SGSTRate = 0
		item.SGSTAmount = 0
	} else {
		// Intra-state: Apply CGST + SGST
		item.CGSTRate = gstRate / 2
		item.CGSTAmount = (item.TaxableValue * item.CGSTRate) / 100
		item.SGSTRate = gstRate / 2
		item.SGSTAmount = (item.TaxableValue * item.SGSTRate) / 100
		item.IGSTRate = 0
		item.IGSTAmount = 0
	}
	
	item.TotalAmount = item.TaxableValue + item.CGSTAmount + item.SGSTAmount + item.IGSTAmount
}