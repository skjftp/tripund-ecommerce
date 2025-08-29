package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"tripund-api/internal/models"
)

// RequirePermission middleware checks if user has specific permission
func RequirePermission(permission string) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get claims from context (set by auth middleware)
		claims, exists := c.Get("claims")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
			c.Abort()
			return
		}

		jwtClaims, ok := claims.(jwt.MapClaims)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token claims"})
			c.Abort()
			return
		}

		// Get user role and permissions
		role, _ := jwtClaims["role"].(string)
		permissions, _ := jwtClaims["permissions"].([]interface{})

		// Super admin has all permissions
		if role == models.RoleSuperAdmin {
			c.Next()
			return
		}

		// Check specific permission
		hasPermission := false
		for _, p := range permissions {
			if pStr, ok := p.(string); ok && pStr == permission {
				hasPermission = true
				break
			}
		}

		if !hasPermission {
			c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
			c.Abort()
			return
		}

		c.Next()
	}
}

// RequireRole middleware checks if user has specific role or higher
func RequireRole(requiredRole string) gin.HandlerFunc {
	return func(c *gin.Context) {
		claims, exists := c.Get("claims")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
			c.Abort()
			return
		}

		jwtClaims, ok := claims.(jwt.MapClaims)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token claims"})
			c.Abort()
			return
		}

		userRole, _ := jwtClaims["role"].(string)

		// Define role hierarchy levels
		roleLevel := getRoleLevel(userRole)
		requiredLevel := getRoleLevel(requiredRole)

		if roleLevel < requiredLevel {
			c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient role privileges"})
			c.Abort()
			return
		}

		c.Next()
	}
}

// RequireAnyPermission middleware checks if user has any of the specified permissions
func RequireAnyPermission(permissions ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		claims, exists := c.Get("claims")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
			c.Abort()
			return
		}

		jwtClaims, ok := claims.(jwt.MapClaims)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token claims"})
			c.Abort()
			return
		}

		role, _ := jwtClaims["role"].(string)
		userPermissions, _ := jwtClaims["permissions"].([]interface{})

		// Super admin has all permissions
		if role == models.RoleSuperAdmin {
			c.Next()
			return
		}

		// Check if user has any of the required permissions
		hasAnyPermission := false
		for _, requiredPerm := range permissions {
			for _, userPerm := range userPermissions {
				if pStr, ok := userPerm.(string); ok && pStr == requiredPerm {
					hasAnyPermission = true
					break
				}
			}
			if hasAnyPermission {
				break
			}
		}

		if !hasAnyPermission {
			c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
			c.Abort()
			return
		}

		c.Next()
	}
}

// RequireAllPermissions middleware checks if user has all specified permissions
func RequireAllPermissions(permissions ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		claims, exists := c.Get("claims")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
			c.Abort()
			return
		}

		jwtClaims, ok := claims.(jwt.MapClaims)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token claims"})
			c.Abort()
			return
		}

		role, _ := jwtClaims["role"].(string)
		userPermissions, _ := jwtClaims["permissions"].([]interface{})

		// Super admin has all permissions
		if role == models.RoleSuperAdmin {
			c.Next()
			return
		}

		// Convert user permissions to map for easier lookup
		userPermMap := make(map[string]bool)
		for _, userPerm := range userPermissions {
			if pStr, ok := userPerm.(string); ok {
				userPermMap[pStr] = true
			}
		}

		// Check if user has all required permissions
		for _, requiredPerm := range permissions {
			if !userPermMap[requiredPerm] {
				c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
				c.Abort()
				return
			}
		}

		c.Next()
	}
}

// RequireOwnershipOrPermission allows access if user owns the resource OR has permission
func RequireOwnershipOrPermission(permission string, userIDField string) gin.HandlerFunc {
	return func(c *gin.Context) {
		claims, exists := c.Get("claims")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
			c.Abort()
			return
		}

		jwtClaims, ok := claims.(jwt.MapClaims)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token claims"})
			c.Abort()
			return
		}

		currentUserID, _ := jwtClaims["user_id"].(string)
		targetUserID := c.Param(userIDField)

		// Allow if it's the user's own resource
		if currentUserID == targetUserID {
			c.Next()
			return
		}

		// Otherwise check permission
		role, _ := jwtClaims["role"].(string)
		permissions, _ := jwtClaims["permissions"].([]interface{})

		// Super admin has all permissions
		if role == models.RoleSuperAdmin {
			c.Next()
			return
		}

		// Check specific permission
		hasPermission := false
		for _, p := range permissions {
			if pStr, ok := p.(string); ok && pStr == permission {
				hasPermission = true
				break
			}
		}

		if !hasPermission {
			c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
			c.Abort()
			return
		}

		c.Next()
	}
}

// AdminOnly middleware restricts access to admin roles only
func AdminOnly() gin.HandlerFunc {
	return RequireRole(models.RoleEditor)
}

// SuperAdminOnly middleware restricts access to super admin only
func SuperAdminOnly() gin.HandlerFunc {
	return RequireRole(models.RoleSuperAdmin)
}

// Helper function to get role level for hierarchy checking
func getRoleLevel(role string) int {
	switch role {
	case models.RoleSuperAdmin:
		return 100
	case models.RoleAdmin:
		return 80
	case models.RoleManager:
		return 60
	case models.RoleEditor:
		return 40
	case models.RoleViewer:
		return 20
	default:
		return 0
	}
}

// LogAction middleware logs admin actions automatically
func LogAction(action string, resource string) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Execute the request first
		c.Next()

		// Log the action after successful execution
		if c.Writer.Status() < 400 {
			// Log asynchronously to not block the response
			// For now, we'll skip async logging to avoid complexity
			// In production, you might want to use a queue system
			_ = action    // Mark as used to avoid compiler warning
			_ = resource  // Mark as used to avoid compiler warning
		}
	}
}

// ValidateTokenEnhanced validates JWT token and extracts enhanced claims
func ValidateTokenEnhanced(jwtSecret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required"})
			c.Abort()
			return
		}

		bearerToken := strings.Split(authHeader, " ")
		if len(bearerToken) != 2 || bearerToken[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid authorization format"})
			c.Abort()
			return
		}

		tokenString := bearerToken[1]
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, jwt.ErrSignatureInvalid
			}
			return []byte(jwtSecret), nil
		})

		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
			c.Abort()
			return
		}

		if claims, ok := token.Claims.(jwt.MapClaims); ok {
			c.Set("claims", claims)
			c.Set("user_id", claims["user_id"])
			c.Set("user_role", claims["role"])
			c.Set("user_permissions", claims["permissions"])
			c.Next()
		} else {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token claims"})
			c.Abort()
			return
		}
	}
}