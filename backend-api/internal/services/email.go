package services

import (
	"bytes"
	"fmt"
	"html/template"
	"net/smtp"
	"os"
	"time"

	"tripund-api/internal/models"
)

type EmailService struct {
	SMTPHost     string
	SMTPPort     string
	FromEmail    string
	FromPassword string
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
}

type OrderEmailItem struct {
	ProductName  string
	SKU          string
	Quantity     int
	Price        float64
	Total        float64
	VariantColor string
	VariantSize  string
}

func NewEmailService() *EmailService {
	return &EmailService{
		SMTPHost:     "smtp.gmail.com",
		SMTPPort:     "587",
		FromEmail:    os.Getenv("EMAIL_FROM"),
		FromPassword: os.Getenv("EMAIL_PASSWORD"),
	}
}

func (e *EmailService) SendOrderConfirmation(order models.Order) error {
	// Prepare email data
	data := OrderConfirmationData{
		Order:         order,
		CustomerName:  order.GuestName,
		CustomerEmail: order.GuestEmail,
		OrderDate:     order.CreatedAt.Format("January 2, 2006"),
		Totals:        order.Totals,
	}

	// If it's a registered user order
	if order.UserID != "guest" {
		data.CustomerEmail = order.GuestEmail // This might need to be fetched from user data
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
		}
		data.Items = append(data.Items, emailItem)
	}

	subject := fmt.Sprintf("Order Confirmation - %s | TRIPUND Lifestyle", order.OrderNumber)
	body, err := e.renderOrderConfirmationTemplate(data)
	if err != nil {
		return fmt.Errorf("failed to render email template: %v", err)
	}

	return e.sendEmail(data.CustomerEmail, subject, body)
}

func (e *EmailService) SendShippingConfirmation(order models.Order) error {
	// Prepare email data
	data := ShippingConfirmationData{
		Order:         order,
		CustomerName:  order.GuestName,
		CustomerEmail: order.GuestEmail,
		OrderDate:     order.CreatedAt.Format("January 2, 2006"),
		ShippedDate:   time.Now().Format("January 2, 2006"),
		TrackingInfo:  order.Tracking,
	}

	// If it's a registered user order
	if order.UserID != "guest" {
		data.CustomerEmail = order.GuestEmail // This might need to be fetched from user data
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
		}
		data.Items = append(data.Items, emailItem)
	}

	subject := fmt.Sprintf("Your Order is Shipped - %s | TRIPUND Lifestyle", order.OrderNumber)
	body, err := e.renderShippingConfirmationTemplate(data)
	if err != nil {
		return fmt.Errorf("failed to render email template: %v", err)
	}

	return e.sendEmail(data.CustomerEmail, subject, body)
}

func (e *EmailService) sendEmail(to, subject, body string) error {
	auth := smtp.PlainAuth("", e.FromEmail, e.FromPassword, e.SMTPHost)

	msg := []byte(fmt.Sprintf("To: %s\r\n"+
		"Subject: %s\r\n"+
		"MIME-version: 1.0;\r\n"+
		"Content-Type: text/html; charset=\"UTF-8\";\r\n"+
		"\r\n%s", to, subject, body))

	err := smtp.SendMail(e.SMTPHost+":"+e.SMTPPort, auth, e.FromEmail, []string{to}, msg)
	if err != nil {
		return fmt.Errorf("failed to send email: %v", err)
	}

	return nil
}

func (e *EmailService) renderOrderConfirmationTemplate(data OrderConfirmationData) (string, error) {
	tmpl := `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Confirmation</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #8B4513; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #fff; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px; }
        .order-info { background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0; }
        .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .items-table th, .items-table td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        .items-table th { background-color: #f8f9fa; font-weight: bold; }
        .total-row { font-weight: bold; background-color: #f8f9fa; }
        .footer { text-align: center; margin-top: 30px; padding: 20px; background-color: #f8f9fa; border-radius: 6px; }
        .variant-info { font-size: 0.9em; color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🙏 Thank You for Your Order!</h1>
        <p>TRIPUND Lifestyle - Premium Indian Handicrafts</p>
    </div>
    
    <div class="content">
        <p>Dear {{.CustomerName}},</p>
        
        <p>Thank you for your order! We're excited to handcraft your selected items with care and attention to detail.</p>
        
        <div class="order-info">
            <h3>Order Details</h3>
            <p><strong>Order Number:</strong> {{.Order.OrderNumber}}</p>
            <p><strong>Order Date:</strong> {{.OrderDate}}</p>
            <p><strong>Email:</strong> {{.CustomerEmail}}</p>
        </div>
        
        <h3>Order Items</h3>
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
                        {{.ProductName}}
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
        
        <table class="items-table">
            <tr>
                <td colspan="4"><strong>Subtotal:</strong></td>
                <td><strong>₹{{printf "%.2f" .Totals.Subtotal}}</strong></td>
            </tr>
            <tr>
                <td colspan="4"><strong>Shipping:</strong></td>
                <td><strong>₹{{printf "%.2f" .Totals.Shipping}}</strong></td>
            </tr>
            <tr>
                <td colspan="4"><strong>Tax:</strong></td>
                <td><strong>₹{{printf "%.2f" .Totals.Tax}}</strong></td>
            </tr>
            <tr class="total-row">
                <td colspan="4"><strong>Total:</strong></td>
                <td><strong>₹{{printf "%.2f" .Totals.Total}}</strong></td>
            </tr>
        </table>
        
        <div class="order-info">
            <h3>Shipping Address</h3>
            <p>
                {{.Order.ShippingAddress.Line1}}<br>
                {{if .Order.ShippingAddress.Line2}}{{.Order.ShippingAddress.Line2}}<br>{{end}}
                {{.Order.ShippingAddress.City}}, {{.Order.ShippingAddress.State}} {{.Order.ShippingAddress.PostalCode}}<br>
                {{.Order.ShippingAddress.Country}}
            </p>
        </div>
        
        <p><strong>What's Next?</strong></p>
        <ul>
            <li>We'll begin preparing your order within 1-2 business days</li>
            <li>You'll receive a shipping confirmation email with tracking details</li>
            <li>Estimated delivery: 5-7 business days</li>
        </ul>
        
        <p>If you have any questions about your order, please don't hesitate to contact us at orders@tripundlifestyle.com</p>
        
        <p>Thank you for supporting Indian artisans!</p>
        
        <p>Warm regards,<br>
        <strong>The TRIPUND Team</strong></p>
    </div>
    
    <div class="footer">
        <p>TRIPUND Lifestyle | Premium Indian Handicrafts & Home Décor</p>
        <p>Visit us at <a href="https://tripundlifestyle.com">tripundlifestyle.com</a></p>
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

func (e *EmailService) renderShippingConfirmationTemplate(data ShippingConfirmationData) (string, error) {
	tmpl := `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Shipping Confirmation</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #28a745; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #fff; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px; }
        .shipping-info { background-color: #d4edda; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #28a745; }
        .order-info { background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0; }
        .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .items-table th, .items-table td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        .items-table th { background-color: #f8f9fa; font-weight: bold; }
        .footer { text-align: center; margin-top: 30px; padding: 20px; background-color: #f8f9fa; border-radius: 6px; }
        .tracking-button { background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 10px 0; }
        .variant-info { font-size: 0.9em; color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <h1>📦 Your Order is On Its Way!</h1>
        <p>TRIPUND Lifestyle - Premium Indian Handicrafts</p>
    </div>
    
    <div class="content">
        <p>Dear {{.CustomerName}},</p>
        
        <p>Great news! Your order has been carefully packed and shipped. Your handcrafted treasures are now on their way to you!</p>
        
        <div class="shipping-info">
            <h3>✅ Shipping Confirmed</h3>
            <p><strong>Shipped Date:</strong> {{.ShippedDate}}</p>
            {{if .TrackingInfo}}
            <p><strong>Tracking Number:</strong> {{.TrackingInfo.Number}}</p>
            <p><strong>Carrier:</strong> {{.TrackingInfo.Provider}}</p>
            {{if .TrackingInfo.URL}}
            <a href="{{.TrackingInfo.URL}}" class="tracking-button">Track Your Package</a>
            {{end}}
            {{end}}
        </div>
        
        <div class="order-info">
            <h3>Order Details</h3>
            <p><strong>Order Number:</strong> {{.Order.OrderNumber}}</p>
            <p><strong>Order Date:</strong> {{.OrderDate}}</p>
        </div>
        
        <h3>Shipped Items</h3>
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
                        {{.ProductName}}
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
        
        <div class="order-info">
            <h3>Delivery Address</h3>
            <p>
                {{.Order.ShippingAddress.Line1}}<br>
                {{if .Order.ShippingAddress.Line2}}{{.Order.ShippingAddress.Line2}}<br>{{end}}
                {{.Order.ShippingAddress.City}}, {{.Order.ShippingAddress.State}} {{.Order.ShippingAddress.PostalCode}}<br>
                {{.Order.ShippingAddress.Country}}
            </p>
        </div>
        
        <p><strong>Delivery Information:</strong></p>
        <ul>
            <li>Estimated delivery: 5-7 business days from shipping date</li>
            <li>You'll receive delivery updates via SMS/email</li>
            <li>Please ensure someone is available to receive the package</li>
            <li>Contact us immediately if you have any delivery concerns</li>
        </ul>
        
        <p>We hope you love your handcrafted items! Don't forget to share photos of your TRIPUND treasures with us on social media.</p>
        
        <p>If you have any questions about your shipment, please contact us at orders@tripundlifestyle.com</p>
        
        <p>Thank you for supporting Indian artisans!</p>
        
        <p>Warm regards,<br>
        <strong>The TRIPUND Team</strong></p>
    </div>
    
    <div class="footer">
        <p>TRIPUND Lifestyle | Premium Indian Handicrafts & Home Décor</p>
        <p>Visit us at <a href="https://tripundlifestyle.com">tripundlifestyle.com</a></p>
        <p>Follow us on social media for artisan stories and new arrivals</p>
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