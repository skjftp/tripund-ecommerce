package database

import (
	"context"
	"sync"
	"time"
	"tripund-api/internal/models"
)

// MemoryStore provides in-memory storage for development/testing
type MemoryStore struct {
	mu         sync.RWMutex
	categories map[string]models.Category
	products   map[string]models.Product
	users      map[string]models.User
	orders     map[string]interface{}
	initialized bool
}

func NewMemoryStore() *MemoryStore {
	store := &MemoryStore{
		categories: make(map[string]models.Category),
		products:   make(map[string]models.Product),
		users:      make(map[string]models.User),
		orders:     make(map[string]interface{}),
	}
	store.initializeDefaultCategories()
	return store
}

func (m *MemoryStore) initializeDefaultCategories() {
	m.mu.Lock()
	defer m.mu.Unlock()
	
	if m.initialized {
		return
	}

	defaultCategories := []models.Category{
		{
			ID:          "cat_1",
			SKU:         "TLSFL00001",
			Name:        "Festivals",
			Slug:        "festivals",
			Description: "Festive decorations and items",
			Order:       1,
			Children: []models.SubCategory{
				{Name: "Torans", ProductCount: 0},
				{Name: "Door Décor/Hanging", ProductCount: 0},
				{Name: "Garlands", ProductCount: 0},
				{Name: "Decorations", ProductCount: 0},
				{Name: "Rangoli", ProductCount: 0},
			},
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
		{
			ID:          "cat_2",
			SKU:         "TLSWD00001",
			Name:        "Wall Décor",
			Slug:        "wall-decor",
			Description: "Wall decorations and hangings",
			Order:       2,
			Children: []models.SubCategory{
				{Name: "Wall Hangings", ProductCount: 0},
				{Name: "Paintings", ProductCount: 0},
				{Name: "Frames", ProductCount: 0},
				{Name: "Mirrors", ProductCount: 0},
				{Name: "Clocks", ProductCount: 0},
			},
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
		{
			ID:          "cat_3",
			SKU:         "TLSLT00001",
			Name:        "Lighting",
			Slug:        "lighting",
			Description: "Decorative lighting solutions",
			Order:       3,
			Children: []models.SubCategory{
				{Name: "Candles", ProductCount: 0},
				{Name: "Diyas", ProductCount: 0},
				{Name: "Lanterns", ProductCount: 0},
				{Name: "Decorative Lights", ProductCount: 0},
			},
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
		{
			ID:          "cat_4",
			SKU:         "TLSHA00001",
			Name:        "Home Accent",
			Slug:        "home-accent",
			Description: "Home decoration accents",
			Order:       4,
			Children: []models.SubCategory{
				{Name: "Cushion Covers", ProductCount: 0},
				{Name: "Table Décor", ProductCount: 0},
				{Name: "Vases", ProductCount: 0},
				{Name: "Showpieces", ProductCount: 0},
			},
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
		{
			ID:          "cat_5",
			SKU:         "TLSDC00001",
			Name:        "Divine Collections",
			Slug:        "divine-collections",
			Description: "Religious and spiritual items",
			Order:       5,
			Children: []models.SubCategory{
				{Name: "Idols", ProductCount: 0},
				{Name: "Pooja Items", ProductCount: 0},
				{Name: "Spiritual Décor", ProductCount: 0},
			},
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
		{
			ID:          "cat_6",
			SKU:         "TLSSB00001",
			Name:        "Storage & Bags",
			Slug:        "storage-bags",
			Description: "Storage solutions and bags",
			Order:       6,
			Children: []models.SubCategory{
				{Name: "Storage Boxes", ProductCount: 0},
				{Name: "Bags", ProductCount: 0},
				{Name: "Organizers", ProductCount: 0},
			},
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
		{
			ID:          "cat_7",
			SKU:         "TLSGF00001",
			Name:        "Gifting",
			Slug:        "gifting",
			Description: "Gift items and hampers",
			Order:       7,
			Children: []models.SubCategory{
				{Name: "Gift Sets", ProductCount: 0},
				{Name: "Hampers", ProductCount: 0},
				{Name: "Personalized Gifts", ProductCount: 0},
			},
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
	}

	for _, cat := range defaultCategories {
		m.categories[cat.ID] = cat
	}
	m.initialized = true
}

func (m *MemoryStore) GetCategories(ctx context.Context) ([]models.Category, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	var categories []models.Category
	for _, cat := range m.categories {
		categories = append(categories, cat)
	}
	return categories, nil
}

func (m *MemoryStore) GetCategory(ctx context.Context, id string) (*models.Category, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	if cat, ok := m.categories[id]; ok {
		return &cat, nil
	}
	return nil, nil
}

func (m *MemoryStore) CreateCategory(ctx context.Context, category models.Category) (*models.Category, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	category.ID = "cat_" + time.Now().Format("20060102150405")
	category.CreatedAt = time.Now()
	category.UpdatedAt = time.Now()
	m.categories[category.ID] = category
	return &category, nil
}

func (m *MemoryStore) UpdateCategory(ctx context.Context, id string, updates map[string]interface{}) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	if cat, ok := m.categories[id]; ok {
		// Simple update logic - in production, use reflection or a proper update mechanism
		if name, ok := updates["name"].(string); ok {
			cat.Name = name
		}
		if desc, ok := updates["description"].(string); ok {
			cat.Description = desc
		}
		cat.UpdatedAt = time.Now()
		m.categories[id] = cat
	}
	return nil
}

func (m *MemoryStore) DeleteCategory(ctx context.Context, id string) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	delete(m.categories, id)
	return nil
}