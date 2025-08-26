package services

import (
	"bytes"
	"context"
	"encoding/base64"
	"fmt"
	"html/template"
	"log"
	"os"
	"time"

	"golang.org/x/oauth2/google"
	"google.golang.org/api/gmail/v1"
	"google.golang.org/api/option"
	"tripund-api/internal/models"
)

type FixedOAuth2EmailService struct {
	FromEmail string
	service   *gmail.Service
}

func NewFixedOAuth2EmailService() (*FixedOAuth2EmailService, error) {
	ctx := context.Background()
	
	// Get service account credentials from environment
	credentialsJSON := os.Getenv("GOOGLE_SERVICE_ACCOUNT_KEY")
	if credentialsJSON == "" {
		log.Printf("OAuth2 ERROR: GOOGLE_SERVICE_ACCOUNT_KEY environment variable not set")
		return nil, fmt.Errorf("GOOGLE_SERVICE_ACCOUNT_KEY environment variable not set")
	}
	
	log.Printf("OAuth2: Service account key found, length: %d bytes", len(credentialsJSON))

	fromEmail := os.Getenv("EMAIL_FROM")
	if fromEmail == "" {
		fromEmail = "orders@tripundlifestyle.com"
	}
	log.Printf("OAuth2: Will send emails from: %s", fromEmail)

	// Parse the service account credentials
	config, err := google.JWTConfigFromJSON([]byte(credentialsJSON), gmail.GmailSendScope)
	if err != nil {
		log.Printf("OAuth2 ERROR: Failed to parse service account key: %v", err)
		return nil, fmt.Errorf("failed to parse service account key: %v", err)
	}
	
	// IMPORTANT: Set the Subject to impersonate the user for domain-wide delegation
	config.Subject = fromEmail
	log.Printf("OAuth2: Impersonating user %s for domain-wide delegation", fromEmail)
	
	// Create the HTTP client with the JWT config
	client := config.Client(ctx)
	
	// Create Gmail service with the authenticated client
	log.Printf("OAuth2: Creating Gmail service...")
	service, err := gmail.NewService(ctx, option.WithHTTPClient(client))
	if err != nil {
		log.Printf("OAuth2 ERROR: Failed to create Gmail service: %v", err)
		return nil, fmt.Errorf("failed to create Gmail service: %v", err)
	}

	log.Printf("OAuth2 SUCCESS: Gmail service created successfully with domain-wide delegation")
	return &FixedOAuth2EmailService{
		FromEmail: fromEmail,
		service:   service,
	}, nil
}

func (e *FixedOAuth2EmailService) SendOrderConfirmation(order models.Order) error {
	log.Printf("OAuth2: Preparing to send order confirmation for order %s", order.ID)
	
	// Prepare email data
	data := OrderConfirmationData{
		Order:         order,
		CustomerName:  order.GuestName,
		CustomerEmail: order.GuestEmail,
		OrderDate:     order.CreatedAt.Format("January 2, 2006"),
		Totals:        order.Totals,
	}

	// If it's a registered user order
	if order.UserID != "guest" && order.GuestEmail == "" {
		log.Printf("OAuth2 WARNING: User email not found for order %s", order.ID)
		return fmt.Errorf("user email not found for order %s", order.ID)
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
	body, err := renderOrderConfirmationTemplate(data)
	if err != nil {
		log.Printf("OAuth2 ERROR: Failed to render email template: %v", err)
		return fmt.Errorf("failed to render email template: %v", err)
	}

	return e.sendEmail(data.CustomerEmail, subject, body)
}

func (e *FixedOAuth2EmailService) SendShippingConfirmation(order models.Order) error {
	log.Printf("OAuth2: Preparing to send shipping confirmation for order %s", order.ID)
	
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
	if order.UserID != "guest" && order.GuestEmail == "" {
		log.Printf("OAuth2 WARNING: User email not found for order %s", order.ID)
		return fmt.Errorf("user email not found for order %s", order.ID)
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
	body, err := renderShippingConfirmationTemplate(data)
	if err != nil {
		log.Printf("OAuth2 ERROR: Failed to render shipping template: %v", err)
		return fmt.Errorf("failed to render email template: %v", err)
	}

	return e.sendEmail(data.CustomerEmail, subject, body)
}

func (e *FixedOAuth2EmailService) sendEmail(to, subject, body string) error {
	log.Printf("OAuth2: Sending email to %s with subject: %s", to, subject)
	
	// Create the email message
	var message gmail.Message
	
	// Build the email headers and body
	emailBody := fmt.Sprintf("To: %s\r\n"+
		"From: TRIPUND Lifestyle <%s>\r\n"+
		"Subject: %s\r\n"+
		"MIME-Version: 1.0\r\n"+
		"Content-Type: text/html; charset=UTF-8\r\n"+
		"\r\n%s", to, e.FromEmail, subject, body)

	// Encode the message
	message.Raw = base64.URLEncoding.EncodeToString([]byte(emailBody))
	log.Printf("OAuth2: Email message created, size: %d bytes", len(message.Raw))

	// Send the email
	log.Printf("OAuth2: Calling Gmail API to send email...")
	result, err := e.service.Users.Messages.Send("me", &message).Do()
	if err != nil {
		log.Printf("OAuth2 ERROR: Gmail API error: %v", err)
		return fmt.Errorf("failed to send email via Gmail API: %v", err)
	}

	log.Printf("OAuth2 SUCCESS: Email sent successfully to %s. Message ID: %s", to, result.Id)
	return nil
}

// SendRawEmail sends a raw HTML email (used for template testing)
func (e *FixedOAuth2EmailService) SendRawEmail(to, subject, htmlBody string) error {
	return e.sendEmail(to, subject, htmlBody)
}

// Reuse the template rendering functions from email_oauth.go
func renderOrderConfirmationTemplate(data OrderConfirmationData) (string, error) {
	tmpl := getOrderConfirmationTemplate()
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

func renderShippingConfirmationTemplate(data ShippingConfirmationData) (string, error) {
	tmpl := getShippingConfirmationTemplate()
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

func getOrderConfirmationTemplate() string {
	return `
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
                <td colspan="4"><strong>Subtotal (excl. GST):</strong></td>
                <td><strong>₹{{printf "%.2f" .Totals.Subtotal}}</strong></td>
            </tr>
            {{if gt .Totals.CGST 0.0}}
            <tr>
                <td colspan="4"><strong>CGST (9%):</strong></td>
                <td><strong>₹{{printf "%.2f" .Totals.CGST}}</strong></td>
            </tr>
            <tr>
                <td colspan="4"><strong>SGST (9%):</strong></td>
                <td><strong>₹{{printf "%.2f" .Totals.SGST}}</strong></td>
            </tr>
            {{else if gt .Totals.IGST 0.0}}
            <tr>
                <td colspan="4"><strong>IGST (18%):</strong></td>
                <td><strong>₹{{printf "%.2f" .Totals.IGST}}</strong></td>
            </tr>
            {{else}}
            <tr>
                <td colspan="4"><strong>GST (18%):</strong></td>
                <td><strong>₹{{printf "%.2f" .Totals.Tax}}</strong></td>
            </tr>
            {{end}}
            <tr>
                <td colspan="4"><strong>Shipping:</strong></td>
                <td><strong>₹{{printf "%.2f" .Totals.Shipping}}</strong></td>
            </tr>
            <tr class="total-row">
                <td colspan="4"><strong>Total (incl. GST):</strong></td>
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
}

func getShippingConfirmationTemplate() string {
	return `
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
        
        <p>We hope you love your handcrafted items!</p>
        
        <p>If you have any questions, please contact us at orders@tripundlifestyle.com</p>
        
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
}