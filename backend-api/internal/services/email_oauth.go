package services

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"html/template"
	"log"
	"os"
	"strings"
	"time"

	"google.golang.org/api/gmail/v1"
	"google.golang.org/api/option"
	"tripund-api/internal/models"
)

type OAuth2EmailService struct {
	FromEmail string
	service   *gmail.Service
}

type ServiceAccountKey struct {
	Type                    string `json:"type"`
	ProjectID               string `json:"project_id"`
	PrivateKeyID            string `json:"private_key_id"`
	PrivateKey              string `json:"private_key"`
	ClientEmail             string `json:"client_email"`
	ClientID                string `json:"client_id"`
	AuthURI                 string `json:"auth_uri"`
	TokenURI                string `json:"token_uri"`
	AuthProviderX509CertURL string `json:"auth_provider_x509_cert_url"`
	ClientX509CertURL       string `json:"client_x509_cert_url"`
}

func NewOAuth2EmailService() (*OAuth2EmailService, error) {
	ctx := context.Background()
	
	// Get service account credentials from environment
	credentialsJSON := os.Getenv("GOOGLE_SERVICE_ACCOUNT_KEY")
	if credentialsJSON == "" {
		return nil, fmt.Errorf("GOOGLE_SERVICE_ACCOUNT_KEY environment variable not set")
	}
	
	log.Printf("OAuth2: Service account key found, length: %d", len(credentialsJSON))

	fromEmail := os.Getenv("EMAIL_FROM")
	if fromEmail == "" {
		fromEmail = "orders@tripundlifestyle.com"
	}
	log.Printf("OAuth2: Will send emails from: %s", fromEmail)

	// Create Gmail service with service account credentials
	log.Printf("OAuth2: Creating Gmail service with domain-wide delegation...")
	service, err := gmail.NewService(ctx, 
		option.WithCredentialsJSON([]byte(credentialsJSON)),
		option.WithScopes(gmail.GmailSendScope),
		option.WithSubject(fromEmail), // This enables domain-wide delegation
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create Gmail service: %v", err)
	}

	log.Printf("OAuth2: Gmail service created successfully")
	return &OAuth2EmailService{
		FromEmail: fromEmail,
		service:   service,
	}, nil
}

func (e *OAuth2EmailService) SendOrderConfirmation(order models.Order) error {
	// Prepare email data
	data := OrderConfirmationData{
		Order:         order,
		CustomerName:  order.GuestName,
		CustomerEmail: order.GuestEmail,
		OrderDate:     order.CreatedAt.Format("January 2, 2006"),
		Totals:        order.Totals,
	}

	// If it's a registered user order, we might need to fetch user email
	if order.UserID != "guest" && order.GuestEmail == "" {
		// For now, we'll need the email to be passed in the order
		// This might need to be updated based on your user system
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
	body, err := e.renderOrderConfirmationTemplate(data)
	if err != nil {
		return fmt.Errorf("failed to render email template: %v", err)
	}

	return e.sendEmail(data.CustomerEmail, subject, body)
}

func (e *OAuth2EmailService) SendShippingConfirmation(order models.Order) error {
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
	body, err := e.renderShippingConfirmationTemplate(data)
	if err != nil {
		return fmt.Errorf("failed to render email template: %v", err)
	}

	return e.sendEmail(data.CustomerEmail, subject, body)
}

func (e *OAuth2EmailService) sendEmail(to, subject, body string) error {
	log.Printf("OAuth2: Attempting to send email to %s with subject: %s", to, subject)
	
	// Create the email message
	message := &gmail.Message{}
	
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
	result, err := e.service.Users.Messages.Send("me", message).Do()
	if err != nil {
		log.Printf("OAuth2 ERROR: Gmail API error: %v", err)
		return fmt.Errorf("failed to send email via Gmail API: %v", err)
	}

	log.Printf("OAuth2 SUCCESS: Email sent successfully to %s via Gmail API. Message ID: %s", to, result.Id)
	return nil
}

func (e *OAuth2EmailService) renderOrderConfirmationTemplate(data OrderConfirmationData) (string, error) {
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

func (e *OAuth2EmailService) renderShippingConfirmationTemplate(data ShippingConfirmationData) (string, error) {
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

// Helper function to create service account credentials JSON from environment variables
func CreateServiceAccountJSON() (string, error) {
	// You can set individual environment variables or use a full JSON
	serviceAccountJSON := os.Getenv("GOOGLE_SERVICE_ACCOUNT_KEY")
	if serviceAccountJSON != "" {
		return serviceAccountJSON, nil
	}

	// Alternative: construct from individual fields
	key := ServiceAccountKey{
		Type:                    "service_account",
		ProjectID:               os.Getenv("GOOGLE_PROJECT_ID"),
		PrivateKeyID:            os.Getenv("GOOGLE_PRIVATE_KEY_ID"),
		PrivateKey:              strings.ReplaceAll(os.Getenv("GOOGLE_PRIVATE_KEY"), "\\n", "\n"),
		ClientEmail:             os.Getenv("GOOGLE_CLIENT_EMAIL"),
		ClientID:                os.Getenv("GOOGLE_CLIENT_ID"),
		AuthURI:                 "https://accounts.google.com/o/oauth2/auth",
		TokenURI:                "https://oauth2.googleapis.com/token",
		AuthProviderX509CertURL: "https://www.googleapis.com/oauth2/v1/certs",
	}

	if key.ProjectID == "" || key.PrivateKey == "" || key.ClientEmail == "" {
		return "", fmt.Errorf("missing required service account credentials")
	}

	key.ClientX509CertURL = fmt.Sprintf("https://www.googleapis.com/robot/v1/metadata/x509/%s", key.ClientEmail)

	jsonBytes, err := json.Marshal(key)
	if err != nil {
		return "", fmt.Errorf("failed to marshal service account key: %v", err)
	}

	return string(jsonBytes), nil
}