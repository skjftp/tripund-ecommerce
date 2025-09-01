package services

import (
	"bytes"
	"context"
	"fmt"
	"html/template"
	"log"
	"os"
	"time"

	"cloud.google.com/go/firestore"
	"github.com/sendgrid/sendgrid-go"
	"github.com/sendgrid/sendgrid-go/helpers/mail"
	"tripund-api/internal/models"
)

type SendGridEmailService struct {
	APIKey    string
	FromEmail string
	FromName  string
	client    *sendgrid.Client
	db        *firestore.Client
}

type OrderConfirmationData struct {
	Order         models.Order
	CustomerName  string
	CustomerEmail string
	Items         []OrderEmailItem
	Totals        models.OrderTotals
	OrderDate     string
}

type ShippingConfirmationData struct {
	Order         models.Order
	CustomerName  string
	CustomerEmail string
	Items         []OrderEmailItem
	TrackingInfo  *models.Tracking
	OrderDate     string
	ShippedDate   string
	InvoiceURL    string
}

type OrderEmailItem struct {
	ProductName  string
	SKU          string
	Quantity     int
	Price        float64
	Total        float64
	VariantColor string
	VariantSize  string
	ImageURL     string
}

func NewSendGridEmailService() (*SendGridEmailService, error) {
	apiKey := os.Getenv("SENDGRID_API_KEY")
	if apiKey == "" {
		return nil, fmt.Errorf("SENDGRID_API_KEY environment variable not set")
	}

	fromEmail := os.Getenv("EMAIL_FROM")
	if fromEmail == "" {
		fromEmail = "orders@tripundlifestyle.com"
	}

	fromName := os.Getenv("EMAIL_FROM_NAME")
	if fromName == "" {
		fromName = "TRIPUND Lifestyle"
	}

	client := sendgrid.NewSendClient(apiKey)
	
	// Initialize Firestore client for user lookups
	db, err := firestore.NewClient(context.Background(), os.Getenv("FIREBASE_PROJECT_ID"))
	if err != nil {
		log.Printf("Warning: Failed to initialize Firestore client for email service: %v", err)
		db = nil
	}
	
	log.Printf("SendGrid: Email service initialized with from: %s <%s>", fromName, fromEmail)
	
	return &SendGridEmailService{
		APIKey:    apiKey,
		FromEmail: fromEmail,
		FromName:  fromName,
		client:    client,
		db:        db,
	}, nil
}

func (s *SendGridEmailService) SendOrderConfirmation(order models.Order) error {
	// Prepare email data
	data := OrderConfirmationData{
		Order:         order,
		CustomerName:  order.GuestName,
		CustomerEmail: order.GuestEmail,
		OrderDate:     order.CreatedAt.Format("January 2, 2006"),
		Totals:        order.Totals,
	}

	// For registered users, get email from user profile if not in GuestEmail
	if order.UserID != "guest" && order.GuestEmail == "" {
		if s.db != nil {
			// Get user email from Firestore
			userDoc, err := s.db.Collection("users").Doc(order.UserID).Get(context.Background())
			if err != nil {
				return fmt.Errorf("failed to get user email for order %s: %v", order.ID, err)
			}
			
			var user struct {
				Email   string `firestore:"email"`
				Profile struct {
					FirstName string `firestore:"first_name"`
					LastName  string `firestore:"last_name"`
				} `firestore:"profile"`
			}
			
			if err := userDoc.DataTo(&user); err != nil {
				return fmt.Errorf("failed to parse user data for order %s: %v", order.ID, err)
			}
			
			data.CustomerEmail = user.Email
			data.CustomerName = user.Profile.FirstName + " " + user.Profile.LastName
			log.Printf("SendGrid: Using registered user email %s for order %s", user.Email, order.ID)
		} else {
			return fmt.Errorf("no database connection to fetch user email for order %s", order.ID)
		}
	}

	// Convert order items to email items
	for _, item := range order.Items {
		emailItem := OrderEmailItem{
			ProductName:  item.ProductName,
			SKU:          item.SKU,
			Quantity:     item.Quantity,
			Price:        item.Price,
			Total:        item.Total,
			VariantColor: item.VariantColor,
			VariantSize:  item.VariantSize,
			ImageURL:     item.ProductImage, // Add image URL for template
		}
		data.Items = append(data.Items, emailItem)
	}

	subject := fmt.Sprintf("Order Confirmation - %s | TRIPUND Lifestyle", order.OrderNumber)
	// Try to use database template first, fallback to hardcoded
	htmlBody, err := s.renderDatabaseTemplate("order_confirmation", data)
	if err != nil {
		log.Printf("Failed to render database template, using fallback: %v", err)
		// Fallback to hardcoded template
		htmlBody, err = s.renderOrderConfirmationTemplate(data)
		if err != nil {
			return fmt.Errorf("failed to render email template: %v", err)
		}
	}

	return s.sendEmail(data.CustomerEmail, data.CustomerName, subject, htmlBody)
}

func (s *SendGridEmailService) SendShippingConfirmation(order models.Order) error {
	// Prepare email data
	data := ShippingConfirmationData{
		Order:         order,
		CustomerName:  order.GuestName,
		CustomerEmail: order.GuestEmail,
		OrderDate:     order.CreatedAt.Format("January 2, 2006"),
		ShippedDate:   time.Now().Format("January 2, 2006"),
		TrackingInfo:  order.Tracking,
	}

	// For registered users, get email from user profile if not in GuestEmail
	if order.UserID != "guest" && order.GuestEmail == "" {
		if s.db != nil {
			// Get user email from Firestore
			userDoc, err := s.db.Collection("users").Doc(order.UserID).Get(context.Background())
			if err != nil {
				return fmt.Errorf("failed to get user email for order %s: %v", order.ID, err)
			}
			
			var user struct {
				Email   string `firestore:"email"`
				Profile struct {
					FirstName string `firestore:"first_name"`
					LastName  string `firestore:"last_name"`
				} `firestore:"profile"`
			}
			
			if err := userDoc.DataTo(&user); err != nil {
				return fmt.Errorf("failed to parse user data for order %s: %v", order.ID, err)
			}
			
			data.CustomerEmail = user.Email
			data.CustomerName = user.Profile.FirstName + " " + user.Profile.LastName
			log.Printf("SendGrid: Using registered user email %s for order %s", user.Email, order.ID)
		} else {
			return fmt.Errorf("no database connection to fetch user email for order %s", order.ID)
		}
	}

	// Convert order items to email items
	for _, item := range order.Items {
		emailItem := OrderEmailItem{
			ProductName:  item.ProductName,
			SKU:          item.SKU,
			Quantity:     item.Quantity,
			Price:        item.Price,
			Total:        item.Total,
			VariantColor: item.VariantColor,
			VariantSize:  item.VariantSize,
			ImageURL:     item.ProductImage, // Add image URL for template
		}
		data.Items = append(data.Items, emailItem)
	}

	subject := fmt.Sprintf("Your Order is Shipped - %s | TRIPUND Lifestyle", order.OrderNumber)
	// Use database template for shipping (fixed data structure)
	htmlBody, err := s.renderDatabaseTemplate("shipping_confirmation", data)
	if err != nil {
		log.Printf("Failed to render database shipping template, using fallback: %v", err)
		// Fallback to hardcoded template
		htmlBody, err = s.renderShippingConfirmationTemplate(data)
		if err != nil {
			return fmt.Errorf("failed to render shipping email template: %v", err)
		}
	}

	// Add invoice URL to shipping data
	data.InvoiceURL = fmt.Sprintf("https://tripundlifestyle.netlify.app/invoices/%s", order.ID)
	log.Printf("Added invoice URL to shipping template for order %s", order.OrderNumber)
	
	return s.sendEmail(data.CustomerEmail, data.CustomerName, subject, htmlBody)
}

func (s *SendGridEmailService) sendEmail(toEmail, toName, subject, htmlBody string) error {
	log.Printf("SendGrid: Preparing to send email to %s <%s> with subject: %s", toName, toEmail, subject)

	from := mail.NewEmail(s.FromName, s.FromEmail)
	to := mail.NewEmail(toName, toEmail)
	
	// Create plain text version from HTML (basic conversion)
	plainTextBody := s.htmlToText(htmlBody)
	
	message := mail.NewSingleEmail(from, subject, to, plainTextBody, htmlBody)

	// Disable click tracking to prevent URL mangling
	clickTracking := mail.NewClickTrackingSetting()
	clickTracking.SetEnable(false)
	message.SetClickTracking(clickTracking)

	// Send email
	response, err := s.client.Send(message)
	if err != nil {
		log.Printf("SendGrid ERROR: Failed to send email: %v", err)
		return fmt.Errorf("failed to send email via SendGrid: %v", err)
	}

	log.Printf("SendGrid SUCCESS: Email sent to %s. Status: %d, Body: %s", toEmail, response.StatusCode, response.Body)
	
	if response.StatusCode >= 400 {
		return fmt.Errorf("SendGrid API returned error status %d: %s", response.StatusCode, response.Body)
	}

	return nil
}

// Basic HTML to text conversion
func (s *SendGridEmailService) htmlToText(html string) string {
	// This is a very basic conversion - for production you might want to use a proper HTML to text library
	// Remove common HTML tags and replace with text equivalents
	text := html
	// Replace line breaks
	text = fmt.Sprintf("Order Confirmation - TRIPUND Lifestyle\n\nThank you for your order! We're excited to handcraft your selected items with care and attention to detail.\n\nVisit us at tripundlifestyle.com for more details.")
	return text
}

func (s *SendGridEmailService) renderOrderConfirmationTemplate(data OrderConfirmationData) (string, error) {
	tmpl := `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Confirmation</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa; }
        .email-container { background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .header { background: linear-gradient(135deg, #8B4513 0%, #D2691E 100%); color: white; padding: 30px 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
        .header p { margin: 10px 0 0 0; opacity: 0.9; font-size: 16px; }
        .content { padding: 30px; }
        .greeting { font-size: 18px; color: #2c3e50; margin-bottom: 20px; }
        .order-info { background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #8B4513; }
        .order-info h3 { margin-top: 0; color: #8B4513; font-size: 20px; }
        .items-table { width: 100%; border-collapse: collapse; margin: 25px 0; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .items-table th { background: linear-gradient(135deg, #8B4513 0%, #D2691E 100%); color: white; padding: 15px 12px; text-align: left; font-weight: 600; }
        .items-table td { padding: 15px 12px; text-align: left; border-bottom: 1px solid #dee2e6; }
        .items-table tbody tr:nth-child(even) { background-color: #f8f9fa; }
        .items-table tbody tr:hover { background-color: #e9ecef; transition: background-color 0.3s; }
        .variant-info { font-size: 14px; color: #6c757d; margin-top: 5px; font-style: italic; }
        .total-section { background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); padding: 20px; border-radius: 8px; margin: 25px 0; }
        .total-row { display: flex; justify-content: space-between; margin: 8px 0; }
        .total-row.final { font-weight: bold; font-size: 18px; color: #8B4513; border-top: 2px solid #8B4513; padding-top: 12px; margin-top: 15px; }
        .shipping-address { background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%); padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #2196f3; }
        .shipping-address h3 { margin-top: 0; color: #1976d2; }
        .next-steps { background: linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%); padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #4caf50; }
        .next-steps h3 { margin-top: 0; color: #388e3c; }
        .next-steps ul { margin: 0; padding-left: 20px; }
        .next-steps li { margin: 8px 0; color: #2e7d32; }
        .footer { background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%); color: white; padding: 25px; text-align: center; }
        .footer a { color: #f39c12; text-decoration: none; }
        .footer a:hover { text-decoration: underline; }
        .support-info { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .support-info strong { color: #856404; }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>🙏 Thank You for Your Order!</h1>
            <p>TRIPUND Lifestyle - Premium Indian Handicrafts</p>
        </div>
        
        <div class="content">
            <div class="greeting">
                Dear {{.CustomerName}},
            </div>
            
            <p>Thank you for your order! We're excited to handcraft your selected items with care and attention to detail. Your support helps preserve traditional Indian artistry and supports skilled artisans across India.</p>
            
            <div class="order-info">
                <h3>📋 Order Details</h3>
                <div class="total-row"><span><strong>Order Number:</strong></span><span>{{.Order.OrderNumber}}</span></div>
                <div class="total-row"><span><strong>Order Date:</strong></span><span>{{.OrderDate}}</span></div>
                <div class="total-row"><span><strong>Email:</strong></span><span>{{.CustomerEmail}}</span></div>
            </div>
            
            <h3>🛍️ Order Items</h3>
            <table class="items-table">
                <thead>
                    <tr>
                        <th>Product</th>
                        <th>SKU</th>
                        <th>Quantity</th>
                        <th>Price</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    {{range .Items}}
                    <tr>
                        <td>
                            <strong>{{.ProductName}}</strong>
                            {{if or .VariantColor .VariantSize}}
                            <div class="variant-info">
                                {{if .VariantColor}}Color: {{.VariantColor}}{{end}}
                                {{if and .VariantColor .VariantSize}} | {{end}}
                                {{if .VariantSize}}Size: {{.VariantSize}}{{end}}
                            </div>
                            {{end}}
                        </td>
                        <td>{{.SKU}}</td>
                        <td>{{.Quantity}}</td>
                        <td>₹{{printf "%.2f" .Price}}</td>
                        <td>₹{{printf "%.2f" .Total}}</td>
                    </tr>
                    {{end}}
                </tbody>
            </table>
            
            <div class="total-section">
                <h3>💰 Order Summary</h3>
                <div class="total-row"><span>Subtotal:</span><span>₹{{printf "%.2f" .Totals.Subtotal}}</span></div>
                <div class="total-row"><span>Shipping:</span><span>₹{{printf "%.2f" .Totals.Shipping}}</span></div>
                <div class="total-row"><span>Tax:</span><span>₹{{printf "%.2f" .Totals.Tax}}</span></div>
                <div class="total-row final"><span>Total:</span><span>₹{{printf "%.2f" .Totals.Total}}</span></div>
            </div>
            
            <div class="shipping-address">
                <h3>🚚 Shipping Address</h3>
                <p>
                    {{.Order.ShippingAddress.Line1}}<br>
                    {{if .Order.ShippingAddress.Line2}}{{.Order.ShippingAddress.Line2}}<br>{{end}}
                    {{.Order.ShippingAddress.City}}, {{.Order.ShippingAddress.State}} {{.Order.ShippingAddress.PostalCode}}<br>
                    {{.Order.ShippingAddress.Country}}
                </p>
            </div>
            
            <div class="next-steps">
                <h3>📋 What's Next?</h3>
                <ul>
                    <li><strong>Order Processing:</strong> We'll begin preparing your order within 1-2 business days</li>
                    <li><strong>Shipping Notification:</strong> You'll receive a shipping confirmation email with tracking details</li>
                    <li><strong>Delivery Timeline:</strong> Estimated delivery in 5-7 business days from shipping</li>
                    <li><strong>Quality Assurance:</strong> Each item is carefully inspected before shipping</li>
                </ul>
            </div>
            
            <div class="support-info">
                <strong>Need Help?</strong> If you have any questions about your order, please don't hesitate to contact us at <strong>orders@tripundlifestyle.com</strong>
            </div>
            
            <p style="color: #8B4513; font-size: 16px; text-align: center; margin: 30px 0;">
                <strong>Thank you for supporting Indian artisans and preserving traditional craftsmanship! 🙏</strong>
            </p>
            
            <p style="text-align: center; color: #6c757d;">
                Warm regards,<br>
                <strong style="color: #8B4513;">The TRIPUND Team</strong>
            </p>
        </div>
        
        <div class="footer">
            <p><strong>TRIPUND Lifestyle</strong><br>Premium Indian Handicrafts & Home Décor</p>
            <p>Visit us at <a href="https://tripundlifestyle.com">tripundlifestyle.com</a></p>
            <p>Follow us on social media for artisan stories and new arrivals</p>
        </div>
    </div>
</body>
</html>
`

	t, err := template.New("orderConfirmation").Parse(tmpl)
	if err != nil {
		return "", err
	}

	var buf bytes.Buffer
	if err := t.Execute(&buf, data); err != nil {
		return "", err
	}

	return buf.String(), nil
}

func (s *SendGridEmailService) renderShippingConfirmationTemplate(data ShippingConfirmationData) (string, error) {
	tmpl := `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Shipping Confirmation</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa; }
        .email-container { background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .header { background: linear-gradient(135deg, #28a745 0%, #34ce57 100%); color: white; padding: 30px 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
        .header p { margin: 10px 0 0 0; opacity: 0.9; font-size: 16px; }
        .content { padding: 30px; }
        .greeting { font-size: 18px; color: #2c3e50; margin-bottom: 20px; }
        .shipping-alert { background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%); padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #28a745; text-align: center; }
        .shipping-alert h3 { margin-top: 0; color: #28a745; font-size: 22px; }
        .shipping-alert .shipped-date { font-size: 18px; color: #155724; margin: 10px 0; }
        .tracking-info { background: linear-gradient(135deg, #fff3cd 0%, #ffeeba 100%); padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #ffc107; }
        .tracking-info h3 { margin-top: 0; color: #856404; }
        .tracking-button { display: inline-block; background: linear-gradient(135deg, #28a745 0%, #34ce57 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 15px 0; font-weight: 600; box-shadow: 0 2px 4px rgba(0,0,0,0.2); }
        .tracking-button:hover { transform: translateY(-2px); box-shadow: 0 4px 8px rgba(0,0,0,0.3); transition: all 0.3s; }
        .order-info { background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #6c757d; }
        .order-info h3 { margin-top: 0; color: #495057; }
        .items-table { width: 100%; border-collapse: collapse; margin: 25px 0; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .items-table th { background: linear-gradient(135deg, #28a745 0%, #34ce57 100%); color: white; padding: 15px 12px; text-align: left; font-weight: 600; }
        .items-table td { padding: 15px 12px; text-align: left; border-bottom: 1px solid #dee2e6; }
        .items-table tbody tr:nth-child(even) { background-color: #f8f9fa; }
        .items-table tbody tr:hover { background-color: #e9ecef; transition: background-color 0.3s; }
        .variant-info { font-size: 14px; color: #6c757d; margin-top: 5px; font-style: italic; }
        .delivery-info { background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%); padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #2196f3; }
        .delivery-info h3 { margin-top: 0; color: #1976d2; }
        .delivery-info ul { margin: 0; padding-left: 20px; }
        .delivery-info li { margin: 8px 0; color: #1565c0; }
        .shipping-address { background: linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%); padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #9c27b0; }
        .shipping-address h3 { margin-top: 0; color: #7b1fa2; }
        .footer { background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%); color: white; padding: 25px; text-align: center; }
        .footer a { color: #f39c12; text-decoration: none; }
        .footer a:hover { text-decoration: underline; }
        .celebration { text-align: center; font-size: 20px; color: #28a745; margin: 30px 0; }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>📦 Your Order is On Its Way!</h1>
            <p>TRIPUND Lifestyle - Premium Indian Handicrafts</p>
        </div>
        
        <div class="content">
            <div class="greeting">
                Dear {{.CustomerName}},
            </div>
            
            <p>Exciting news! Your order has been carefully packed with love and attention, and it's now making its journey to you. Your handcrafted treasures are on their way!</p>
            
            <div class="shipping-alert">
                <h3>✅ Shipping Confirmed</h3>
                <div class="shipped-date"><strong>Shipped Date:</strong> {{.ShippedDate}}</div>
                {{if .TrackingInfo}}
                {{if .TrackingInfo.Number}}
                <p><strong>Tracking Number:</strong> <code style="background: #f8f9fa; padding: 4px 8px; border-radius: 4px;">{{.TrackingInfo.Number}}</code></p>
                {{end}}
                {{if .TrackingInfo.Provider}}
                <p><strong>Carrier:</strong> {{.TrackingInfo.Provider}}</p>
                {{end}}
                {{if .TrackingInfo.URL}}
                <a href="{{.TrackingInfo.URL}}" class="tracking-button">📍 Track Your Package</a>
                {{end}}
                {{end}}
            </div>
            
            <div class="order-info">
                <h3>📋 Order Details</h3>
                <p><strong>Order Number:</strong> {{.Order.OrderNumber}}</p>
                <p><strong>Order Date:</strong> {{.OrderDate}}</p>
            </div>
            
            <h3>📦 Shipped Items</h3>
            <table class="items-table">
                <thead>
                    <tr>
                        <th>Product</th>
                        <th>SKU</th>
                        <th>Quantity</th>
                    </tr>
                </thead>
                <tbody>
                    {{range .Items}}
                    <tr>
                        <td>
                            <strong>{{.ProductName}}</strong>
                            {{if or .VariantColor .VariantSize}}
                            <div class="variant-info">
                                {{if .VariantColor}}Color: {{.VariantColor}}{{end}}
                                {{if and .VariantColor .VariantSize}} | {{end}}
                                {{if .VariantSize}}Size: {{.VariantSize}}{{end}}
                            </div>
                            {{end}}
                        </td>
                        <td>{{.SKU}}</td>
                        <td>{{.Quantity}}</td>
                    </tr>
                    {{end}}
                </tbody>
            </table>
            
            <div class="shipping-address">
                <h3>🏠 Delivery Address</h3>
                <p>
                    {{.Order.ShippingAddress.Line1}}<br>
                    {{if .Order.ShippingAddress.Line2}}{{.Order.ShippingAddress.Line2}}<br>{{end}}
                    {{.Order.ShippingAddress.City}}, {{.Order.ShippingAddress.State}} {{.Order.ShippingAddress.PostalCode}}<br>
                    {{.Order.ShippingAddress.Country}}
                </p>
            </div>
            
            <div class="delivery-info">
                <h3>🚚 Delivery Information</h3>
                <ul>
                    <li><strong>Estimated Delivery:</strong> 5-7 business days from shipping date</li>
                    <li><strong>Delivery Updates:</strong> You'll receive SMS/email notifications about delivery progress</li>
                    <li><strong>Availability:</strong> Please ensure someone is available to receive the package</li>
                    <li><strong>Packaging:</strong> Your items are securely packed to prevent damage during transit</li>
                    <li><strong>Support:</strong> Contact us immediately if you have any delivery concerns</li>
                </ul>
            </div>
            
            <div class="celebration">
                🎉 We hope you absolutely love your handcrafted TRIPUND treasures! 🎉
            </div>
            
            <p style="text-align: center; color: #6c757d; background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 25px 0;">
                <strong>Share Your Joy!</strong><br>
                Don't forget to share photos of your TRIPUND items with us on social media and tag us!<br>
                We love seeing our products in their new homes. ❤️
            </p>
            
            <p style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <strong>Need Help?</strong> If you have any questions about your shipment, please contact us at <strong>orders@tripundlifestyle.com</strong>
            </p>
            
            <p style="color: #8B4513; font-size: 16px; text-align: center; margin: 30px 0;">
                <strong>Thank you for supporting Indian artisans and celebrating traditional craftsmanship! 🙏</strong>
            </p>
            
            <p style="text-align: center; color: #6c757d;">
                Warm regards,<br>
                <strong style="color: #28a745;">The TRIPUND Team</strong>
            </p>
        </div>
        
        <div class="footer">
            <p><strong>TRIPUND Lifestyle</strong><br>Premium Indian Handicrafts & Home Décor</p>
            <p>Visit us at <a href="https://tripundlifestyle.com">tripundlifestyle.com</a></p>
            <p>Follow us on social media for artisan stories and new arrivals</p>
        </div>
    </div>
</body>
</html>
`

	t, err := template.New("shippingConfirmation").Parse(tmpl)
	if err != nil {
		return "", err
	}

	var buf bytes.Buffer
	if err := t.Execute(&buf, data); err != nil {
		return "", err
	}

	return buf.String(), nil
}

// SendRawEmail sends an email with custom content (for template testing)
func (s *SendGridEmailService) SendRawEmail(toEmail, subject, htmlBody string) error {
	return s.sendEmail(toEmail, "", subject, htmlBody)
}

// renderDatabaseTemplate renders email using template from database
func (s *SendGridEmailService) renderDatabaseTemplate(templateType string, data interface{}) (string, error) {
	if s.db == nil {
		return "", fmt.Errorf("no database connection for template rendering")
	}
	
	// Get active template from database
	docs, err := s.db.Collection("email_templates").
		Where("type", "==", templateType).
		Where("is_active", "==", true).
		Where("is_default", "==", true).
		Documents(context.Background()).GetAll()
	
	if err != nil || len(docs) == 0 {
		return "", fmt.Errorf("no active template found for type: %s", templateType)
	}
	
	// Get the first active template
	templateData := docs[0].Data()
	htmlContent, ok := templateData["html_content"].(string)
	if !ok {
		return "", fmt.Errorf("template html_content not found or invalid")
	}
	
	// Parse and execute template
	t, err := template.New("database_template").Parse(htmlContent)
	if err != nil {
		return "", fmt.Errorf("failed to parse database template: %v", err)
	}
	
	var buf bytes.Buffer
	if err := t.Execute(&buf, data); err != nil {
		return "", fmt.Errorf("failed to execute database template: %v", err)
	}
	
	return buf.String(), nil
}

// sendEmailWithAttachment sends email with file attachment
func (s *SendGridEmailService) sendEmailWithAttachment(toEmail, toName, subject, htmlBody string, attachment []byte, filename string) error {
	log.Printf("SendGrid: Preparing to send email with attachment to %s <%s>", toName, toEmail)
	
	from := mail.NewEmail(s.FromName, s.FromEmail)
	to := mail.NewEmail(toName, toEmail)
	
	message := mail.NewSingleEmail(from, subject, to, "", htmlBody)

	// Disable click tracking to prevent URL mangling
	clickTracking := mail.NewClickTrackingSetting()
	clickTracking.SetEnable(false)
	message.SetClickTracking(clickTracking)
	
	// Add attachment
	if len(attachment) > 0 {
		attach := mail.NewAttachment()
		attach.SetContent(string(attachment))
		attach.SetType("text/plain")
		attach.SetFilename(filename)
		attach.SetDisposition("attachment")
		message.AddAttachment(attach)
		log.Printf("SendGrid: Added attachment %s (%d bytes)", filename, len(attachment))
	}
	
	response, err := s.client.Send(message)
	if err != nil {
		log.Printf("SendGrid: Failed to send email with attachment: %v", err)
		return err
	}
	
	log.Printf("SendGrid: Email with attachment sent successfully. Status: %d", response.StatusCode)
	return nil
}
