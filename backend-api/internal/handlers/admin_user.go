package handlers

import (
	"fmt"
	"log"
	"net/http"
	"time"

	"cloud.google.com/go/firestore"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"tripund-api/internal/database"
	"tripund-api/internal/models"
)

type AdminUserHandler struct {
	db        *database.Firebase
	jwtSecret string
}

func NewAdminUserHandler(db *database.Firebase, jwtSecret string) *AdminUserHandler {
	return &AdminUserHandler{
		db:        db,
		jwtSecret: jwtSecret,
	}
}

// GetAdminUsers retrieves all admin users (Super Admin and Admin only)
func (h *AdminUserHandler) GetAdminUsers(c *gin.Context) {
	// Check permissions
	if !h.hasPermission(c, models.PermissionUsersView) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
		return
	}

	var users []models.AdminUser
	
	docs, err := h.db.Client.Collection("admin_users").
		OrderBy("created_at", firestore.Desc).
		Documents(h.db.Context).GetAll()
	
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch admin users"})
		return
	}

	for _, doc := range docs {
		var user models.AdminUser
		if err := doc.DataTo(&user); err != nil {
			continue
		}
		user.ID = doc.Ref.ID
		// Don't return password hash
		user.PasswordHash = ""
		users = append(users, user)
	}

	c.JSON(http.StatusOK, gin.H{
		"users": users,
		"total": len(users),
	})
}

// GetAdminUser retrieves a single admin user by ID
func (h *AdminUserHandler) GetAdminUser(c *gin.Context) {
	userID := c.Param("id")
	
	// Check permissions or if requesting own profile
	currentUserID := h.getCurrentUserID(c)
	if userID != currentUserID && !h.hasPermission(c, models.PermissionUsersView) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
		return
	}

	doc, err := h.db.Client.Collection("admin_users").Doc(userID).Get(h.db.Context)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Admin user not found"})
		return
	}

	var user models.AdminUser
	if err := doc.DataTo(&user); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse user data"})
		return
	}
	user.ID = doc.Ref.ID
	user.PasswordHash = "" // Don't return password hash

	c.JSON(http.StatusOK, user)
}

// CreateAdminUser creates a new admin user
func (h *AdminUserHandler) CreateAdminUser(c *gin.Context) {
	// Check permissions
	if !h.hasPermission(c, models.PermissionUsersCreate) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
		return
	}

	var req models.CreateAdminUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate password strength
	if !h.isPasswordStrong(req.Password) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Password must be at least 8 characters with uppercase, lowercase, number, and special character"})
		return
	}

	// Check if email already exists
	if h.emailExists(req.Email) {
		c.JSON(http.StatusConflict, gin.H{"error": "Email already exists"})
		return
	}

	// Validate role
	if !h.isValidRole(req.Role) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid role specified"})
		return
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process password"})
		return
	}

	// Get role permissions
	rolePermissions := h.getRolePermissions(req.Role)
	allPermissions := append(rolePermissions, req.Permissions...)

	// Create admin user
	user := models.AdminUser{
		Email:       req.Email,
		PasswordHash: string(hashedPassword),
		FirstName:   req.FirstName,
		LastName:    req.LastName,
		Role:        req.Role,
		Permissions: h.deduplicatePermissions(allPermissions),
		Status:      models.AdminStatusActive,
		Department:  req.Department,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
		CreatedBy:   h.getCurrentUserID(c),
		PasswordPolicy: models.AdminPasswordPolicy{
			RequireChange: true, // Force password change on first login
			LastChanged:   time.Now(),
		},
	}

	docRef, _, err := h.db.Client.Collection("admin_users").Add(h.db.Context, user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to create admin user: %v", err)})
		return
	}

	user.ID = docRef.ID
	user.PasswordHash = "" // Don't return password hash

	// Log the action
	h.logAdminAction(c, "user.create", "admin_users", map[string]interface{}{
		"created_user_id": user.ID,
		"created_email":   user.Email,
		"role":           user.Role,
	})

	c.JSON(http.StatusCreated, gin.H{
		"message": "Admin user created successfully",
		"user":    user,
	})
}

// UpdateAdminUser updates an existing admin user
func (h *AdminUserHandler) UpdateAdminUser(c *gin.Context) {
	userID := c.Param("id")
	
	// Check permissions or if updating own profile (limited fields)
	currentUserID := h.getCurrentUserID(c)
	isSelfUpdate := userID == currentUserID
	
	if !isSelfUpdate && !h.hasPermission(c, models.PermissionUsersEdit) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
		return
	}

	var req models.UpdateAdminUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Build update map
	updates := map[string]interface{}{
		"updated_at": time.Now(),
	}

	// Self-update only allows certain fields
	if isSelfUpdate {
		if req.FirstName != nil {
			updates["first_name"] = *req.FirstName
		}
		if req.LastName != nil {
			updates["last_name"] = *req.LastName
		}
		if req.Department != nil {
			updates["department"] = *req.Department
		}
		// Self-update cannot change role, permissions, or status
	} else {
		// Admin update can change all fields
		if req.FirstName != nil {
			updates["first_name"] = *req.FirstName
		}
		if req.LastName != nil {
			updates["last_name"] = *req.LastName
		}
		if req.Role != nil {
			if !h.isValidRole(*req.Role) {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid role specified"})
				return
			}
			updates["role"] = *req.Role
			// Update permissions based on new role
			rolePermissions := h.getRolePermissions(*req.Role)
			allPermissions := append(rolePermissions, req.Permissions...)
			updates["permissions"] = h.deduplicatePermissions(allPermissions)
		} else if req.Permissions != nil {
			updates["permissions"] = req.Permissions
		}
		if req.Status != nil {
			updates["status"] = *req.Status
		}
		if req.Department != nil {
			updates["department"] = *req.Department
		}
	}

	// Convert to Firestore updates
	var firestoreUpdates []firestore.Update
	for key, value := range updates {
		firestoreUpdates = append(firestoreUpdates, firestore.Update{
			Path:  key,
			Value: value,
		})
	}

	_, err := h.db.Client.Collection("admin_users").Doc(userID).Update(h.db.Context, firestoreUpdates)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update admin user"})
		return
	}

	// Log the action
	h.logAdminAction(c, "user.update", "admin_users", map[string]interface{}{
		"updated_user_id": userID,
		"updates":        updates,
		"is_self_update": isSelfUpdate,
	})

	c.JSON(http.StatusOK, gin.H{"message": "Admin user updated successfully"})
}

// DeleteAdminUser soft-deletes an admin user
func (h *AdminUserHandler) DeleteAdminUser(c *gin.Context) {
	userID := c.Param("id")
	
	// Check permissions
	if !h.hasPermission(c, models.PermissionUsersDelete) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
		return
	}

	// Cannot delete self
	if userID == h.getCurrentUserID(c) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot delete your own account"})
		return
	}

	// Get user to check if it's a super admin (cannot be deleted)
	doc, err := h.db.Client.Collection("admin_users").Doc(userID).Get(h.db.Context)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Admin user not found"})
		return
	}

	var user models.AdminUser
	doc.DataTo(&user)
	
	if user.Role == models.RoleSuperAdmin {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot delete super admin account"})
		return
	}

	// Soft delete by setting status to inactive
	_, err = h.db.Client.Collection("admin_users").Doc(userID).Update(h.db.Context, []firestore.Update{
		{Path: "status", Value: models.AdminStatusInactive},
		{Path: "updated_at", Value: time.Now()},
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete admin user"})
		return
	}

	// Log the action
	h.logAdminAction(c, "user.delete", "admin_users", map[string]interface{}{
		"deleted_user_id": userID,
		"deleted_email":   user.Email,
	})

	c.JSON(http.StatusOK, gin.H{"message": "Admin user deleted successfully"})
}

// ChangePassword allows admin users to change their password
func (h *AdminUserHandler) ChangePassword(c *gin.Context) {
	userID := h.getCurrentUserID(c)
	
	var req models.ChangePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate password confirmation
	if req.NewPassword != req.ConfirmPassword {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Password confirmation does not match"})
		return
	}

	// Validate password strength
	if !h.isPasswordStrong(req.NewPassword) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Password must be at least 8 characters with uppercase, lowercase, number, and special character"})
		return
	}

	// Get current user
	doc, err := h.db.Client.Collection("admin_users").Doc(userID).Get(h.db.Context)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	var user models.AdminUser
	doc.DataTo(&user)

	// Verify current password
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.CurrentPassword)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Current password is incorrect"})
		return
	}

	// Hash new password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process new password"})
		return
	}

	// Update password
	_, err = h.db.Client.Collection("admin_users").Doc(userID).Update(h.db.Context, []firestore.Update{
		{Path: "password_hash", Value: string(hashedPassword)},
		{Path: "password_policy.last_changed", Value: time.Now()},
		{Path: "password_policy.require_change", Value: false},
		{Path: "password_policy.failed_login_attempts", Value: 0},
		{Path: "password_policy.locked_until", Value: nil},
		{Path: "updated_at", Value: time.Now()},
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update password"})
		return
	}

	// Log the action
	h.logAdminAction(c, "user.password_change", "admin_users", map[string]interface{}{
		"user_id": userID,
	})

	c.JSON(http.StatusOK, gin.H{"message": "Password changed successfully"})
}

// GetRoles retrieves all available roles
func (h *AdminUserHandler) GetRoles(c *gin.Context) {
	// Check permissions
	if !h.hasPermission(c, models.PermissionUsersView) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
		return
	}

	roles := h.getSystemRoles()
	c.JSON(http.StatusOK, gin.H{
		"roles": roles,
		"total": len(roles),
	})
}

// GetPermissions retrieves all available permissions
func (h *AdminUserHandler) GetPermissions(c *gin.Context) {
	// Check permissions
	if !h.hasPermission(c, models.PermissionUsersView) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
		return
	}

	permissions := h.getSystemPermissions()
	c.JSON(http.StatusOK, gin.H{
		"permissions": permissions,
		"total":       len(permissions),
	})
}

// AdminLogin handles admin authentication with enhanced security
func (h *AdminUserHandler) AdminLogin(c *gin.Context) {
	var req models.AdminLoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Find admin user by email
	docs, err := h.db.Client.Collection("admin_users").
		Where("email", "==", req.Email).
		Where("status", "==", string(models.AdminStatusActive)).
		Documents(h.db.Context).GetAll()

	if err != nil || len(docs) == 0 {
		h.logFailedLogin(c, req.Email, "user_not_found")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	var user models.AdminUser
	docs[0].DataTo(&user)
	user.ID = docs[0].Ref.ID

	// Check if account is locked
	if user.PasswordPolicy.LockedUntil != nil && time.Now().Before(*user.PasswordPolicy.LockedUntil) {
		c.JSON(http.StatusLocked, gin.H{"error": "Account is temporarily locked due to too many failed login attempts"})
		return
	}

	// Verify password
	log.Printf("AdminLogin: Attempting password verification for user %s", user.Email)
	log.Printf("AdminLogin: Password hash length: %d", len(user.PasswordHash))
	
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		log.Printf("AdminLogin: Password verification failed for %s: %v", user.Email, err)
		h.handleFailedLogin(user.ID, req.Email)
		h.logFailedLogin(c, req.Email, "invalid_password")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}
	
	log.Printf("AdminLogin: Password verification successful for %s", user.Email)

	// Reset failed login attempts on successful login
	h.resetFailedLoginAttempts(user.ID)

	// Create session
	sessionID := h.createAdminSession(user, c)

	// Generate JWT token with enhanced claims
	token, expiresIn, err := h.generateAdminJWT(user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	// Update last login
	h.db.Client.Collection("admin_users").Doc(user.ID).Update(h.db.Context, []firestore.Update{
		{Path: "last_login_at", Value: time.Now()},
	})

	// Log successful login
	h.logAdminAction(c, "user.login", "admin_users", map[string]interface{}{
		"user_id":    user.ID,
		"session_id": sessionID,
	})

	user.PasswordHash = "" // Don't return password hash
	c.JSON(http.StatusOK, models.AdminAuthResponse{
		Token:       token,
		ExpiresIn:   expiresIn,
		User:        user,
		Permissions: user.Permissions,
	})
}

// Helper functions

func (h *AdminUserHandler) hasPermission(c *gin.Context, permission string) bool {
	// Get user permissions from JWT token
	userRole := h.getCurrentUserRole(c)
	userPermissions := h.getCurrentUserPermissions(c)
	
	// Super admin has all permissions
	if userRole == models.RoleSuperAdmin {
		return true
	}
	
	// Check specific permission
	for _, p := range userPermissions {
		if p == permission {
			return true
		}
	}
	
	return false
}

func (h *AdminUserHandler) getCurrentUserID(c *gin.Context) string {
	if claims, exists := c.Get("claims"); exists {
		if jwtClaims, ok := claims.(jwt.MapClaims); ok {
			if userID, ok := jwtClaims["user_id"].(string); ok {
				return userID
			}
		}
	}
	return ""
}

func (h *AdminUserHandler) getCurrentUserRole(c *gin.Context) string {
	if claims, exists := c.Get("claims"); exists {
		if jwtClaims, ok := claims.(jwt.MapClaims); ok {
			if role, ok := jwtClaims["role"].(string); ok {
				return role
			}
		}
	}
	return ""
}

func (h *AdminUserHandler) getCurrentUserPermissions(c *gin.Context) []string {
	if claims, exists := c.Get("claims"); exists {
		if jwtClaims, ok := claims.(jwt.MapClaims); ok {
			if perms, ok := jwtClaims["permissions"].([]interface{}); ok {
				permissions := make([]string, len(perms))
				for i, p := range perms {
					if pStr, ok := p.(string); ok {
						permissions[i] = pStr
					}
				}
				return permissions
			}
		}
	}
	return []string{}
}

func (h *AdminUserHandler) isPasswordStrong(password string) bool {
	if len(password) < 8 {
		return false
	}
	
	hasUpper := false
	hasLower := false
	hasDigit := false
	hasSpecial := false
	
	for _, char := range password {
		switch {
		case char >= 'A' && char <= 'Z':
			hasUpper = true
		case char >= 'a' && char <= 'z':
			hasLower = true
		case char >= '0' && char <= '9':
			hasDigit = true
		case char >= 33 && char <= 47 || char >= 58 && char <= 64 || char >= 91 && char <= 96 || char >= 123 && char <= 126:
			hasSpecial = true
		}
	}
	
	return hasUpper && hasLower && hasDigit && hasSpecial
}

func (h *AdminUserHandler) emailExists(email string) bool {
	docs, err := h.db.Client.Collection("admin_users").Where("email", "==", email).Documents(h.db.Context).GetAll()
	return err == nil && len(docs) > 0
}

func (h *AdminUserHandler) isValidRole(role string) bool {
	validRoles := []string{models.RoleSuperAdmin, models.RoleAdmin, models.RoleManager, models.RoleEditor, models.RoleViewer}
	for _, validRole := range validRoles {
		if role == validRole {
			return true
		}
	}
	return false
}

func (h *AdminUserHandler) getRolePermissions(role string) []string {
	switch role {
	case models.RoleSuperAdmin:
		return []string{
			models.PermissionUsersView, models.PermissionUsersCreate, models.PermissionUsersEdit, models.PermissionUsersDelete,
			models.PermissionProductsView, models.PermissionProductsCreate, models.PermissionProductsEdit, models.PermissionProductsDelete,
			models.PermissionOrdersView, models.PermissionOrdersEdit, models.PermissionOrdersDelete, models.PermissionOrdersRefund,
			models.PermissionCategoriesView, models.PermissionCategoriesCreate, models.PermissionCategoriesEdit, models.PermissionCategoriesDelete,
			models.PermissionAnalyticsView, models.PermissionReportsView, models.PermissionReportsExport,
			models.PermissionSettingsView, models.PermissionSettingsEdit,
			models.PermissionSystemLogs, models.PermissionSystemBackup, models.PermissionSystemMaintenance,
		}
	case models.RoleAdmin:
		return []string{
			models.PermissionUsersView, models.PermissionUsersCreate, models.PermissionUsersEdit,
			models.PermissionProductsView, models.PermissionProductsCreate, models.PermissionProductsEdit, models.PermissionProductsDelete,
			models.PermissionOrdersView, models.PermissionOrdersEdit, models.PermissionOrdersRefund,
			models.PermissionCategoriesView, models.PermissionCategoriesCreate, models.PermissionCategoriesEdit, models.PermissionCategoriesDelete,
			models.PermissionAnalyticsView, models.PermissionReportsView, models.PermissionReportsExport,
			models.PermissionSettingsView, models.PermissionSettingsEdit,
		}
	case models.RoleManager:
		return []string{
			models.PermissionProductsView, models.PermissionProductsCreate, models.PermissionProductsEdit,
			models.PermissionOrdersView, models.PermissionOrdersEdit,
			models.PermissionCategoriesView, models.PermissionCategoriesEdit,
			models.PermissionAnalyticsView, models.PermissionReportsView,
		}
	case models.RoleEditor:
		return []string{
			models.PermissionProductsView, models.PermissionProductsCreate, models.PermissionProductsEdit,
			models.PermissionCategoriesView, models.PermissionCategoriesEdit,
		}
	case models.RoleViewer:
		return []string{
			models.PermissionProductsView,
			models.PermissionOrdersView,
			models.PermissionCategoriesView,
			models.PermissionAnalyticsView,
		}
	default:
		return []string{}
	}
}

func (h *AdminUserHandler) deduplicatePermissions(permissions []string) []string {
	seen := make(map[string]bool)
	result := []string{}
	for _, perm := range permissions {
		if !seen[perm] {
			seen[perm] = true
			result = append(result, perm)
		}
	}
	return result
}

func (h *AdminUserHandler) getSystemRoles() []models.Role {
	return []models.Role{
		{
			ID:          models.RoleSuperAdmin,
			Name:        models.RoleSuperAdmin,
			DisplayName: "Super Administrator",
			Description: "Full system access with all permissions",
			Permissions: h.getRolePermissions(models.RoleSuperAdmin),
			Level:       100,
			IsSystem:    true,
			CreatedAt:   time.Now(),
		},
		{
			ID:          models.RoleAdmin,
			Name:        models.RoleAdmin,
			DisplayName: "Administrator",
			Description: "Full administrative access except system management",
			Permissions: h.getRolePermissions(models.RoleAdmin),
			Level:       80,
			IsSystem:    true,
			CreatedAt:   time.Now(),
		},
		{
			ID:          models.RoleManager,
			Name:        models.RoleManager,
			DisplayName: "Manager",
			Description: "Product and order management access",
			Permissions: h.getRolePermissions(models.RoleManager),
			Level:       60,
			IsSystem:    true,
			CreatedAt:   time.Now(),
		},
		{
			ID:          models.RoleEditor,
			Name:        models.RoleEditor,
			DisplayName: "Editor",
			Description: "Product and category editing access",
			Permissions: h.getRolePermissions(models.RoleEditor),
			Level:       40,
			IsSystem:    true,
			CreatedAt:   time.Now(),
		},
		{
			ID:          models.RoleViewer,
			Name:        models.RoleViewer,
			DisplayName: "Viewer",
			Description: "Read-only access to view data",
			Permissions: h.getRolePermissions(models.RoleViewer),
			Level:       20,
			IsSystem:    true,
			CreatedAt:   time.Now(),
		},
	}
}

func (h *AdminUserHandler) getSystemPermissions() []models.Permission {
	return []models.Permission{
		// User Management
		{ID: models.PermissionUsersView, Name: models.PermissionUsersView, DisplayName: "View Users", Description: "View admin users list", Category: "User Management", IsSystem: true},
		{ID: models.PermissionUsersCreate, Name: models.PermissionUsersCreate, DisplayName: "Create Users", Description: "Create new admin users", Category: "User Management", IsSystem: true},
		{ID: models.PermissionUsersEdit, Name: models.PermissionUsersEdit, DisplayName: "Edit Users", Description: "Edit admin user details", Category: "User Management", IsSystem: true},
		{ID: models.PermissionUsersDelete, Name: models.PermissionUsersDelete, DisplayName: "Delete Users", Description: "Delete admin users", Category: "User Management", IsSystem: true},
		
		// Product Management
		{ID: models.PermissionProductsView, Name: models.PermissionProductsView, DisplayName: "View Products", Description: "View products list", Category: "Product Management", IsSystem: true},
		{ID: models.PermissionProductsCreate, Name: models.PermissionProductsCreate, DisplayName: "Create Products", Description: "Create new products", Category: "Product Management", IsSystem: true},
		{ID: models.PermissionProductsEdit, Name: models.PermissionProductsEdit, DisplayName: "Edit Products", Description: "Edit product details", Category: "Product Management", IsSystem: true},
		{ID: models.PermissionProductsDelete, Name: models.PermissionProductsDelete, DisplayName: "Delete Products", Description: "Delete products", Category: "Product Management", IsSystem: true},
		
		// Order Management
		{ID: models.PermissionOrdersView, Name: models.PermissionOrdersView, DisplayName: "View Orders", Description: "View orders list", Category: "Order Management", IsSystem: true},
		{ID: models.PermissionOrdersEdit, Name: models.PermissionOrdersEdit, DisplayName: "Edit Orders", Description: "Edit order status and details", Category: "Order Management", IsSystem: true},
		{ID: models.PermissionOrdersDelete, Name: models.PermissionOrdersDelete, DisplayName: "Delete Orders", Description: "Delete orders", Category: "Order Management", IsSystem: true},
		{ID: models.PermissionOrdersRefund, Name: models.PermissionOrdersRefund, DisplayName: "Process Refunds", Description: "Process order refunds", Category: "Order Management", IsSystem: true},
		
		// Category Management
		{ID: models.PermissionCategoriesView, Name: models.PermissionCategoriesView, DisplayName: "View Categories", Description: "View categories list", Category: "Category Management", IsSystem: true},
		{ID: models.PermissionCategoriesCreate, Name: models.PermissionCategoriesCreate, DisplayName: "Create Categories", Description: "Create new categories", Category: "Category Management", IsSystem: true},
		{ID: models.PermissionCategoriesEdit, Name: models.PermissionCategoriesEdit, DisplayName: "Edit Categories", Description: "Edit category details", Category: "Category Management", IsSystem: true},
		{ID: models.PermissionCategoriesDelete, Name: models.PermissionCategoriesDelete, DisplayName: "Delete Categories", Description: "Delete categories", Category: "Category Management", IsSystem: true},
		
		// Analytics & Reports
		{ID: models.PermissionAnalyticsView, Name: models.PermissionAnalyticsView, DisplayName: "View Analytics", Description: "View analytics dashboard", Category: "Analytics", IsSystem: true},
		{ID: models.PermissionReportsView, Name: models.PermissionReportsView, DisplayName: "View Reports", Description: "View system reports", Category: "Reports", IsSystem: true},
		{ID: models.PermissionReportsExport, Name: models.PermissionReportsExport, DisplayName: "Export Reports", Description: "Export reports to files", Category: "Reports", IsSystem: true},
		
		// Settings & Configuration
		{ID: models.PermissionSettingsView, Name: models.PermissionSettingsView, DisplayName: "View Settings", Description: "View system settings", Category: "Settings", IsSystem: true},
		{ID: models.PermissionSettingsEdit, Name: models.PermissionSettingsEdit, DisplayName: "Edit Settings", Description: "Edit system settings", Category: "Settings", IsSystem: true},
		
		// System Administration
		{ID: models.PermissionSystemLogs, Name: models.PermissionSystemLogs, DisplayName: "View System Logs", Description: "View system and audit logs", Category: "System", IsSystem: true},
		{ID: models.PermissionSystemBackup, Name: models.PermissionSystemBackup, DisplayName: "System Backup", Description: "Create and manage system backups", Category: "System", IsSystem: true},
		{ID: models.PermissionSystemMaintenance, Name: models.PermissionSystemMaintenance, DisplayName: "System Maintenance", Description: "System maintenance operations", Category: "System", IsSystem: true},
	}
}

func (h *AdminUserHandler) generateAdminJWT(user models.AdminUser) (string, int64, error) {
	expirationTime := time.Now().Add(30 * 24 * time.Hour) // 30 days
	expiresIn := expirationTime.Unix() - time.Now().Unix()

	claims := jwt.MapClaims{
		"user_id":     user.ID,
		"email":       user.Email,
		"role":        user.Role,
		"permissions": user.Permissions,
		"first_name":  user.FirstName,
		"last_name":   user.LastName,
		"exp":         expirationTime.Unix(),
		"iat":         time.Now().Unix(),
		"iss":         "tripund-backend",
		"sub":         user.ID,
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(h.jwtSecret))
	if err != nil {
		return "", 0, err
	}

	return tokenString, expiresIn, nil
}

func (h *AdminUserHandler) handleFailedLogin(userID, email string) {
	// Increment failed login attempts
	h.db.Client.Collection("admin_users").Doc(userID).Update(h.db.Context, []firestore.Update{
		{Path: "password_policy.failed_login_attempts", Value: firestore.Increment(1)},
	})

	// Check if we need to lock the account (after 5 failed attempts)
	doc, err := h.db.Client.Collection("admin_users").Doc(userID).Get(h.db.Context)
	if err != nil {
		return
	}

	var user models.AdminUser
	doc.DataTo(&user)
	
	if user.PasswordPolicy.FailedLoginAttempts >= 5 {
		lockUntil := time.Now().Add(30 * time.Minute)
		h.db.Client.Collection("admin_users").Doc(userID).Update(h.db.Context, []firestore.Update{
			{Path: "password_policy.locked_until", Value: lockUntil},
		})
	}
}

func (h *AdminUserHandler) resetFailedLoginAttempts(userID string) {
	h.db.Client.Collection("admin_users").Doc(userID).Update(h.db.Context, []firestore.Update{
		{Path: "password_policy.failed_login_attempts", Value: 0},
		{Path: "password_policy.locked_until", Value: nil},
	})
}

func (h *AdminUserHandler) createAdminSession(user models.AdminUser, c *gin.Context) string {
	session := models.AdminSession{
		UserID:    user.ID,
		Email:     user.Email,
		IPAddress: c.ClientIP(),
		UserAgent: c.GetHeader("User-Agent"),
		LoginAt:   time.Now(),
		IsActive:  true,
	}

	docRef, _, err := h.db.Client.Collection("admin_sessions").Add(h.db.Context, session)
	if err != nil {
		return ""
	}

	return docRef.ID
}

func (h *AdminUserHandler) logAdminAction(c *gin.Context, action, resource string, details map[string]interface{}) {
	userID := h.getCurrentUserID(c)
	userEmail := ""
	if claims, exists := c.Get("claims"); exists {
		if jwtClaims, ok := claims.(jwt.MapClaims); ok {
			if email, ok := jwtClaims["email"].(string); ok {
				userEmail = email
			}
		}
	}

	auditLog := models.AdminAuditLog{
		UserID:    userID,
		Email:     userEmail,
		Action:    action,
		Resource:  resource,
		Details:   details,
		IPAddress: c.ClientIP(),
		UserAgent: c.GetHeader("User-Agent"),
		Success:   true,
		CreatedAt: time.Now(),
	}

	h.db.Client.Collection("admin_audit_logs").Add(h.db.Context, auditLog)
}

func (h *AdminUserHandler) logFailedLogin(c *gin.Context, email, reason string) {
	auditLog := models.AdminAuditLog{
		Email:     email,
		Action:    "user.login_failed",
		Resource:  "admin_auth",
		Details: map[string]interface{}{
			"reason": reason,
		},
		IPAddress: c.ClientIP(),
		UserAgent: c.GetHeader("User-Agent"),
		Success:   false,
		CreatedAt: time.Now(),
	}

	h.db.Client.Collection("admin_audit_logs").Add(h.db.Context, auditLog)
}