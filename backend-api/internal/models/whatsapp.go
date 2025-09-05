package models

import "time"

// WhatsApp Message Templates
type WhatsAppTemplate struct {
	ID           string                 `firestore:"id" json:"id"`
	Name         string                 `firestore:"name" json:"name"`
	Language     string                 `firestore:"language" json:"language"`
	Status       string                 `firestore:"status" json:"status"`
	Category     string                 `firestore:"category" json:"category"`
	Components   []TemplateComponent    `firestore:"components" json:"components"`
	CreatedAt    time.Time              `firestore:"created_at" json:"created_at"`
	UpdatedAt    time.Time              `firestore:"updated_at" json:"updated_at"`
}

type TemplateComponent struct {
	Type       string                 `firestore:"type" json:"type"`
	Text       string                 `firestore:"text,omitempty" json:"text,omitempty"`
	Format     string                 `firestore:"format,omitempty" json:"format,omitempty"`
	Parameters []TemplateParameter    `firestore:"parameters,omitempty" json:"parameters,omitempty"`
	Buttons    []TemplateButton       `firestore:"buttons,omitempty" json:"buttons,omitempty"`
}

type TemplateParameter struct {
	Type string `firestore:"type" json:"type"`
	Text string `firestore:"text,omitempty" json:"text,omitempty"`
}

type TemplateButton struct {
	Type string `firestore:"type" json:"type"`
	Text string `firestore:"text" json:"text"`
	URL  string `firestore:"url,omitempty" json:"url,omitempty"`
}

// WhatsApp Messages
type WhatsAppMessage struct {
	ID          string    `firestore:"id" json:"id"`
	MessageID   string    `firestore:"message_id" json:"message_id"`
	PhoneNumber string    `firestore:"phone_number" json:"phone_number"`
	Direction   string    `firestore:"direction" json:"direction"` // "outgoing" or "incoming"
	Type        string    `firestore:"type" json:"type"`           // "text", "template", "image", etc.
	Content     string    `firestore:"content" json:"content"`
	TemplateID  string    `firestore:"template_id,omitempty" json:"template_id,omitempty"`
	Status      string    `firestore:"status" json:"status"`       // "sent", "delivered", "read", "failed"
	Timestamp   time.Time `firestore:"timestamp" json:"timestamp"`
	CreatedAt   time.Time `firestore:"created_at" json:"created_at"`
}

// WhatsApp Contacts
type WhatsAppContact struct {
	ID          string    `firestore:"id" json:"id"`
	PhoneNumber string    `firestore:"phone_number" json:"phone_number"`
	Name        string    `firestore:"name" json:"name"`
	ProfileName string    `firestore:"profile_name,omitempty" json:"profile_name,omitempty"`
	IsBlocked   bool      `firestore:"is_blocked" json:"is_blocked"`
	Tags        []string  `firestore:"tags" json:"tags"`
	LastMessage time.Time `firestore:"last_message" json:"last_message"`
	CreatedAt   time.Time `firestore:"created_at" json:"created_at"`
	UpdatedAt   time.Time `firestore:"updated_at" json:"updated_at"`
}

// WhatsApp Bulk Message Campaign
type WhatsAppCampaign struct {
	ID          string    `firestore:"id" json:"id"`
	Name        string    `firestore:"name" json:"name"`
	TemplateID  string    `firestore:"template_id" json:"template_id"`
	Recipients  []string  `firestore:"recipients" json:"recipients"`
	Status      string    `firestore:"status" json:"status"` // "scheduled", "running", "completed", "failed"
	Sent        int       `firestore:"sent" json:"sent"`
	Failed      int       `firestore:"failed" json:"failed"`
	ScheduledAt time.Time `firestore:"scheduled_at,omitempty" json:"scheduled_at,omitempty"`
	CreatedAt   time.Time `firestore:"created_at" json:"created_at"`
	CompletedAt time.Time `firestore:"completed_at,omitempty" json:"completed_at,omitempty"`
}

// WhatsApp OTP
type WhatsAppOTP struct {
	ID          string    `firestore:"id" json:"id"`
	PhoneNumber string    `firestore:"phone_number" json:"phone_number"`
	OTP         string    `firestore:"otp" json:"otp"`
	Purpose     string    `firestore:"purpose" json:"purpose"` // "login", "registration", "password_reset"
	ExpiresAt   time.Time `firestore:"expires_at" json:"expires_at"`
	IsUsed      bool      `firestore:"is_used" json:"is_used"`
	CreatedAt   time.Time `firestore:"created_at" json:"created_at"`
}

// WhatsApp API Request/Response structures
type SendMessageRequest struct {
	MessagingProduct string      `json:"messaging_product"`
	RecipientType    string      `json:"recipient_type"`
	To               string      `json:"to"`
	Type             string      `json:"type"`
	Text             *TextContent `json:"text,omitempty"`
	Template         *TemplateContent `json:"template,omitempty"`
}

type TextContent struct {
	PreviewURL bool   `json:"preview_url"`
	Body       string `json:"body"`
}

type TemplateContent struct {
	Name       string                 `json:"name"`
	Language   LanguageContent        `json:"language"`
	Components []ComponentContent     `json:"components,omitempty"`
}

type LanguageContent struct {
	Code string `json:"code"`
}

type ComponentContent struct {
	Type       string              `json:"type"`
	Parameters []ParameterContent  `json:"parameters,omitempty"`
	Index      string              `json:"index,omitempty"`
	SubType    string              `json:"sub_type,omitempty"`
}

type ParameterContent struct {
	Type string `json:"type"`
	Text string `json:"text,omitempty"`
}

// WhatsApp Webhook structures
type WebhookMessage struct {
	Object string         `json:"object"`
	Entry  []WebhookEntry `json:"entry"`
}

type WebhookEntry struct {
	ID      string                 `json:"id"`
	Changes []WebhookChange        `json:"changes"`
}

type WebhookChange struct {
	Value WebhookValue `json:"value"`
	Field string       `json:"field"`
}

type WebhookValue struct {
	MessagingProduct string              `json:"messaging_product"`
	Metadata         WebhookMetadata     `json:"metadata"`
	Contacts         []WebhookContact    `json:"contacts,omitempty"`
	Messages         []WebhookMessageContent `json:"messages,omitempty"`
	Statuses         []WebhookStatus     `json:"statuses,omitempty"`
}

type WebhookMetadata struct {
	DisplayPhoneNumber string `json:"display_phone_number"`
	PhoneNumberID      string `json:"phone_number_id"`
}

type WebhookContact struct {
	Profile WebhookProfile `json:"profile"`
	WAID    string         `json:"wa_id"`
}

type WebhookProfile struct {
	Name string `json:"name"`
}

type WebhookMessageContent struct {
	From      string                 `json:"from"`
	ID        string                 `json:"id"`
	Timestamp string                 `json:"timestamp"`
	Type      string                 `json:"type"`
	Text      *WebhookTextContent    `json:"text,omitempty"`
	Image     *WebhookMediaContent   `json:"image,omitempty"`
	Document  *WebhookMediaContent   `json:"document,omitempty"`
	Audio     *WebhookMediaContent   `json:"audio,omitempty"`
	Video     *WebhookMediaContent   `json:"video,omitempty"`
}

type WebhookTextContent struct {
	Body string `json:"body"`
}

type WebhookMediaContent struct {
	Caption  string `json:"caption,omitempty"`
	Filename string `json:"filename,omitempty"`
	ID       string `json:"id"`
	MimeType string `json:"mime_type"`
	SHA256   string `json:"sha256"`
}

type WebhookStatus struct {
	ID           string `json:"id"`
	Status       string `json:"status"`
	Timestamp    string `json:"timestamp"`
	RecipientID  string `json:"recipient_id"`
	Conversation struct {
		ID     string `json:"id"`
		Origin struct {
			Type string `json:"type"`
		} `json:"origin"`
	} `json:"conversation,omitempty"`
	Pricing struct {
		Billable     bool   `json:"billable"`
		PricingModel string `json:"pricing_model"`
		Category     string `json:"category"`
	} `json:"pricing,omitempty"`
}

// Bulk message CSV structure
type BulkMessageRecipient struct {
	PhoneNumber string            `csv:"phone_number"`
	Name        string            `csv:"name,omitempty"`
	Variables   map[string]string `csv:"-"`
}