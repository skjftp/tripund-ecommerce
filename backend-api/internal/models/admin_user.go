package models

import "time"

// AdminUser represents administrative users with role-based access
type AdminUser struct {
	ID             string               `json:"id" firestore:"-"`
	Email          string               `json:"email" firestore:"email" validate:"required,email"`
	PasswordHash   string               `json:"-" firestore:"password_hash"`
	FirstName      string               `json:"first_name" firestore:"first_name" validate:"required"`
	LastName       string               `json:"last_name" firestore:"last_name" validate:"required"`
	Role           string               `json:"role" firestore:"role"`
	Permissions    []string             `json:"permissions" firestore:"permissions"`
	Status         AdminUserStatus      `json:"status" firestore:"status"`
	Avatar         string               `json:"avatar,omitempty" firestore:"avatar,omitempty"`
	Department     string               `json:"department,omitempty" firestore:"department,omitempty"`
	LastLoginAt    *time.Time           `json:"last_login_at,omitempty" firestore:"last_login_at,omitempty"`
	CreatedAt      time.Time            `json:"created_at" firestore:"created_at"`
	UpdatedAt      time.Time            `json:"updated_at" firestore:"updated_at"`
	CreatedBy      string               `json:"created_by" firestore:"created_by"`
	PasswordPolicy AdminPasswordPolicy `json:"password_policy" firestore:"password_policy"`
}

type AdminUserStatus string

const (
	AdminStatusActive    AdminUserStatus = "active"
	AdminStatusInactive  AdminUserStatus = "inactive"
	AdminStatusSuspended AdminUserStatus = "suspended"
)

type AdminPasswordPolicy struct {
	RequireChange      bool      `json:"require_change" firestore:"require_change"`
	LastChanged        time.Time `json:"last_changed" firestore:"last_changed"`
	ExpiresAt          *time.Time `json:"expires_at,omitempty" firestore:"expires_at,omitempty"`
	FailedLoginAttempts int       `json:"failed_login_attempts" firestore:"failed_login_attempts"`
	LockedUntil        *time.Time `json:"locked_until,omitempty" firestore:"locked_until,omitempty"`
}

// Role represents different admin roles
type Role struct {
	ID          string   `json:"id" firestore:"id"`
	Name        string   `json:"name" firestore:"name"`
	DisplayName string   `json:"display_name" firestore:"display_name"`
	Description string   `json:"description" firestore:"description"`
	Permissions []string `json:"permissions" firestore:"permissions"`
	Level       int      `json:"level" firestore:"level"` // Higher number = more authority
	IsSystem    bool     `json:"is_system" firestore:"is_system"` // Cannot be deleted
	CreatedAt   time.Time `json:"created_at" firestore:"created_at"`
	UpdatedAt   time.Time `json:"updated_at" firestore:"updated_at"`
}

// Permission represents specific system permissions
type Permission struct {
	ID          string `json:"id" firestore:"id"`
	Name        string `json:"name" firestore:"name"`
	DisplayName string `json:"display_name" firestore:"display_name"`
	Description string `json:"description" firestore:"description"`
	Category    string `json:"category" firestore:"category"`
	IsSystem    bool   `json:"is_system" firestore:"is_system"`
}

// Predefined roles
const (
	RoleSuperAdmin = "super_admin"
	RoleAdmin      = "admin"
	RoleManager    = "manager"
	RoleEditor     = "editor"
	RoleViewer     = "viewer"
)

// Predefined permissions
const (
	// User Management
	PermissionUsersView   = "users.view"
	PermissionUsersCreate = "users.create"
	PermissionUsersEdit   = "users.edit"
	PermissionUsersDelete = "users.delete"
	
	// Product Management
	PermissionProductsView   = "products.view"
	PermissionProductsCreate = "products.create"
	PermissionProductsEdit   = "products.edit"
	PermissionProductsDelete = "products.delete"
	
	// Order Management
	PermissionOrdersView   = "orders.view"
	PermissionOrdersEdit   = "orders.edit"
	PermissionOrdersDelete = "orders.delete"
	PermissionOrdersRefund = "orders.refund"
	
	// Category Management
	PermissionCategoriesView   = "categories.view"
	PermissionCategoriesCreate = "categories.create"
	PermissionCategoriesEdit   = "categories.edit"
	PermissionCategoriesDelete = "categories.delete"
	
	// Analytics & Reports
	PermissionAnalyticsView = "analytics.view"
	PermissionReportsView   = "reports.view"
	PermissionReportsExport = "reports.export"
	
	// Settings & Configuration
	PermissionSettingsView = "settings.view"
	PermissionSettingsEdit = "settings.edit"
	
	// System Administration
	PermissionSystemLogs    = "system.logs"
	PermissionSystemBackup  = "system.backup"
	PermissionSystemMaintenance = "system.maintenance"
)

// Request/Response types for admin user management
type CreateAdminUserRequest struct {
	Email       string   `json:"email" validate:"required,email"`
	Password    string   `json:"password" validate:"required,min=8"`
	FirstName   string   `json:"first_name" validate:"required"`
	LastName    string   `json:"last_name" validate:"required"`
	Role        string   `json:"role" validate:"required"`
	Permissions []string `json:"permissions,omitempty"`
	Department  string   `json:"department,omitempty"`
}

type UpdateAdminUserRequest struct {
	FirstName   *string  `json:"first_name,omitempty"`
	LastName    *string  `json:"last_name,omitempty"`
	Role        *string  `json:"role,omitempty"`
	Permissions []string `json:"permissions,omitempty"`
	Status      *string  `json:"status,omitempty"`
	Department  *string  `json:"department,omitempty"`
}

type ChangePasswordRequest struct {
	CurrentPassword string `json:"current_password" validate:"required"`
	NewPassword     string `json:"new_password" validate:"required,min=8"`
	ConfirmPassword string `json:"confirm_password" validate:"required"`
}

type AdminLoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
}

type AdminAuthResponse struct {
	Token       string    `json:"token"`
	ExpiresIn   int64     `json:"expires_in"`
	User        AdminUser `json:"user"`
	Permissions []string  `json:"permissions"`
}

// Session tracking for audit logs
type AdminSession struct {
	ID        string    `json:"id" firestore:"-"`
	UserID    string    `json:"user_id" firestore:"user_id"`
	Email     string    `json:"email" firestore:"email"`
	IPAddress string    `json:"ip_address" firestore:"ip_address"`
	UserAgent string    `json:"user_agent" firestore:"user_agent"`
	LoginAt   time.Time `json:"login_at" firestore:"login_at"`
	LogoutAt  *time.Time `json:"logout_at,omitempty" firestore:"logout_at,omitempty"`
	IsActive  bool      `json:"is_active" firestore:"is_active"`
}

// Audit log for tracking admin actions
type AdminAuditLog struct {
	ID        string                 `json:"id" firestore:"-"`
	UserID    string                 `json:"user_id" firestore:"user_id"`
	Email     string                 `json:"email" firestore:"email"`
	Action    string                 `json:"action" firestore:"action"`
	Resource  string                 `json:"resource" firestore:"resource"`
	Details   map[string]interface{} `json:"details" firestore:"details"`
	IPAddress string                 `json:"ip_address" firestore:"ip_address"`
	UserAgent string                 `json:"user_agent" firestore:"user_agent"`
	Success   bool                   `json:"success" firestore:"success"`
	CreatedAt time.Time              `json:"created_at" firestore:"created_at"`
}