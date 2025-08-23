package models

import "time"

// Content represents website content that can be managed through admin panel
type Content struct {
	ID          string                 `json:"id" firestore:"-"`
	Type        string                 `json:"type" firestore:"type"` // about, footer, faq, contact, etc.
	Title       string                 `json:"title" firestore:"title"`
	Content     map[string]interface{} `json:"content" firestore:"content"`
	Published   bool                   `json:"published" firestore:"published"`
	LastUpdated time.Time              `json:"last_updated" firestore:"last_updated"`
	UpdatedBy   string                 `json:"updated_by" firestore:"updated_by"`
}

// FAQ represents a frequently asked question
type FAQ struct {
	ID       string    `json:"id" firestore:"-"`
	Question string    `json:"question" firestore:"question"`
	Answer   string    `json:"answer" firestore:"answer"`
	Order    int       `json:"order" firestore:"order"`
	Active   bool      `json:"active" firestore:"active"`
	Created  time.Time `json:"created" firestore:"created"`
	Updated  time.Time `json:"updated" firestore:"updated"`
}

// AboutContent represents the about page content
type AboutContent struct {
	Title           string   `json:"title"`
	Subtitle        string   `json:"subtitle"`
	MainContent     string   `json:"main_content"`
	Mission         string   `json:"mission"`
	Vision          string   `json:"vision"`
	Values          []string `json:"values"`
	Stats           []Stat   `json:"stats"`
	TeamMembers     []TeamMember `json:"team_members"`
	WhyChooseUs     []string `json:"why_choose_us"`
}

// Stat represents a company statistic
type Stat struct {
	Number string `json:"number"`
	Label  string `json:"label"`
}

// TeamMember represents a team member
type TeamMember struct {
	Name     string `json:"name"`
	Position string `json:"position"`
	Bio      string `json:"bio"`
	Image    string `json:"image"`
}

// FooterContent represents footer content
type FooterContent struct {
	CompanyName        string         `json:"company_name"`
	CompanyDescription string         `json:"company_description"`
	Email              string         `json:"email"`
	Phone              string         `json:"phone"`
	Address            Address        `json:"address"`
	SocialLinks        SocialLinks    `json:"social_links"`
	QuickLinks         []Link         `json:"quick_links"`
	CustomerService    []Link         `json:"customer_service"`
	CopyrightText      string         `json:"copyright_text"`
}

// Address represents a physical address
type Address struct {
	Street  string `json:"street"`
	City    string `json:"city"`
	State   string `json:"state"`
	Country string `json:"country"`
	Pincode string `json:"pincode"`
}

// SocialLinks represents social media links
type SocialLinks struct {
	Facebook  string `json:"facebook"`
	Instagram string `json:"instagram"`
	Twitter   string `json:"twitter"`
	LinkedIn  string `json:"linkedin"`
	YouTube   string `json:"youtube"`
}

// Link represents a navigation link
type Link struct {
	Title string `json:"title"`
	URL   string `json:"url"`
}

// ContactContent represents contact page content
type ContactContent struct {
	Title          string      `json:"title"`
	Subtitle       string      `json:"subtitle"`
	Description    string      `json:"description"`
	Email          string      `json:"email"`
	Phone          string      `json:"phone"`
	WhatsApp       string      `json:"whatsapp"`
	Address        Address     `json:"address"`
	BusinessHours  []string    `json:"business_hours"`
	MapEmbedURL    string      `json:"map_embed_url"`
}