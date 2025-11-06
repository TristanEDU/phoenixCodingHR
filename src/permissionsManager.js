// Permissions Management System
// Handles role-based access control and feature permissions

export class PermissionsManager {
	constructor(authSystem) {
		this.authSystem = authSystem;
		this.permissionDefinitions = this.loadPermissionDefinitions();
		this.featureFlags = this.loadFeatureFlags();
	}

	loadPermissionDefinitions() {
		try {
			const saved = localStorage.getItem("study-hall-permissions");
			if (saved) {
				return JSON.parse(saved);
			}
		} catch (error) {
			console.warn("Failed to load permissions:", error);
		}

		// Default permission definitions
		return {
			admin: {
				name: "Administrator",
				description: "Full system access and administrative privileges",
				features: [
					"users",
					"settings",
					"audit",
					"reports",
					"finance",
					"hr",
					"operations",
				],
				hierarchy: 10,
			},
			hr: {
				name: "Human Resources",
				description: "HR management and employee operations",
				features: ["employees", "policies", "training", "reports", "documents"],
				hierarchy: 8,
			},
			finance: {
				name: "Finance",
				description: "Financial operations and reporting",
				features: ["budgets", "expenses", "reports", "audit"],
				hierarchy: 7,
			},
			operations: {
				name: "Operations",
				description: "Daily operations and task management",
				features: ["tasks", "projects", "reports", "calendar"],
				hierarchy: 6,
			},
			users: {
				name: "User Management",
				description: "Basic user management capabilities",
				features: ["view_users", "basic_reports"],
				hierarchy: 5,
			},
			employee: {
				name: "Employee",
				description: "Standard employee access",
				features: ["profile", "tasks", "calendar", "documents"],
				hierarchy: 3,
			},
			readonly: {
				name: "Read Only",
				description: "View-only access to authorized content",
				features: ["view_profile", "view_calendar"],
				hierarchy: 1,
			},
		};
	}

	savePermissionDefinitions() {
		localStorage.setItem(
			"study-hall-permissions",
			JSON.stringify(this.permissionDefinitions)
		);
	}

	loadFeatureFlags() {
		try {
			const saved = localStorage.getItem("study-hall-feature-flags");
			if (saved) {
				return JSON.parse(saved);
			}
		} catch (error) {
			console.warn("Failed to load feature flags:", error);
		}

		// Default feature flags
		return {
			dashboard: { enabled: true, requiredPermissions: ["employee"] },
			tasks: { enabled: true, requiredPermissions: ["employee"] },
			calendar: { enabled: true, requiredPermissions: ["employee"] },
			documents: { enabled: true, requiredPermissions: ["employee"] },
			policies: { enabled: true, requiredPermissions: ["employee"] },
			training: { enabled: true, requiredPermissions: ["hr", "admin"] },
			users: { enabled: true, requiredPermissions: ["hr", "admin"] },
			reports: {
				enabled: true,
				requiredPermissions: ["hr", "admin", "operations"],
			},
			settings: { enabled: true, requiredPermissions: ["admin"] },
			audit: { enabled: true, requiredPermissions: ["admin"] },
			finance: { enabled: true, requiredPermissions: ["finance", "admin"] },
			chat: { enabled: false, requiredPermissions: ["employee"] },
			recordings: { enabled: false, requiredPermissions: ["hr", "admin"] },
			goals: { enabled: true, requiredPermissions: ["employee"] },
		};
	}

	saveFeatureFlags() {
		localStorage.setItem(
			"study-hall-feature-flags",
			JSON.stringify(this.featureFlags)
		);
	}

	// Permission checking methods
	hasPermission(permission, userId = null) {
		const user = userId
			? this.authSystem.authorizedUsers.find((u) => u.id === userId)
			: this.authSystem.getCurrentUser();
		if (!user || !user.permissions) return false;

		// Admin permission overrides all others
		if (user.permissions.includes("admin")) return true;

		return user.permissions.includes(permission);
	}

	hasAnyPermission(permissions, userId = null) {
		return permissions.some((permission) =>
			this.hasPermission(permission, userId)
		);
	}

	hasAllPermissions(permissions, userId = null) {
		return permissions.every((permission) =>
			this.hasPermission(permission, userId)
		);
	}

	canAccessFeature(feature, userId = null) {
		const featureConfig = this.featureFlags[feature];
		if (!featureConfig) return false;

		// Check if feature is enabled
		if (!featureConfig.enabled) return false;

		// Check required permissions
		if (
			featureConfig.requiredPermissions &&
			featureConfig.requiredPermissions.length > 0
		) {
			return this.hasAnyPermission(featureConfig.requiredPermissions, userId);
		}

		return true;
	}

	// Hierarchy-based permissions
	canManageUser(targetUserId, managerId = null) {
		const manager = managerId
			? this.authSystem.authorizedUsers.find((u) => u.id === managerId)
			: this.authSystem.getCurrentUser();
		if (!manager) return false;

		// Admin can manage anyone
		if (this.hasPermission("admin", manager.id)) return true;

		// HR can manage non-admin users
		if (this.hasPermission("hr", manager.id)) {
			const targetUser = this.authSystem.authorizedUsers.find(
				(u) => u.id === targetUserId
			);
			return targetUser && !this.hasPermission("admin", targetUser.id);
		}

		// Managers can manage their direct reports
		const subordinates = this.authSystem.getAllSubordinates(manager.id);
		return subordinates.some((sub) => sub.id === targetUserId);
	}

	canViewUserData(targetUserId, viewerId = null) {
		const viewer = viewerId
			? this.authSystem.authorizedUsers.find((u) => u.id === viewerId)
			: this.authSystem.getCurrentUser();
		if (!viewer) return false;

		// Users can always view their own data
		if (viewer.id === targetUserId) return true;

		// Admin and HR can view all user data
		if (this.hasAnyPermission(["admin", "hr"], viewer.id)) return true;

		// Managers can view their subordinates' data
		const subordinates = this.authSystem.getAllSubordinates(viewer.id);
		return subordinates.some((sub) => sub.id === targetUserId);
	}

	// Permission assignment methods
	assignPermission(userId, permission) {
		if (!this.hasPermission("admin")) {
			throw new Error("Only administrators can assign permissions");
		}

		const user = this.authSystem.authorizedUsers.find((u) => u.id === userId);
		if (!user) {
			throw new Error("User not found");
		}

		if (!user.permissions.includes(permission)) {
			user.permissions.push(permission);
			this.authSystem.saveUserData();
		}

		return true;
	}

	revokePermission(userId, permission) {
		if (!this.hasPermission("admin")) {
			throw new Error("Only administrators can revoke permissions");
		}

		const user = this.authSystem.authorizedUsers.find((u) => u.id === userId);
		if (!user) {
			throw new Error("User not found");
		}

		user.permissions = user.permissions.filter((p) => p !== permission);
		this.authSystem.saveUserData();

		return true;
	}

	// Role-based permission templates
	getPermissionsForRole(roleName) {
		const rolePermissions = {
			SpongeLord: ["admin", "hr", "finance", "operations", "users"],
			"HR Manager": ["hr", "admin", "users"],
			"HR Specialist": ["hr", "users"],
			"Department Manager": ["operations", "users"],
			"Senior Employee": ["employee", "users"],
			Employee: ["employee"],
			Contractor: ["readonly"],
			Intern: ["readonly"],
		};

		return rolePermissions[roleName] || ["employee"];
	}

	applyRolePermissions(userId, roleName) {
		if (!this.hasPermission("admin")) {
			throw new Error("Only administrators can apply role permissions");
		}

		const user = this.authSystem.authorizedUsers.find((u) => u.id === userId);
		if (!user) {
			throw new Error("User not found");
		}

		user.permissions = this.getPermissionsForRole(roleName);
		this.authSystem.saveUserData();

		return user.permissions;
	}

	// Feature flag management
	enableFeature(feature) {
		if (!this.hasPermission("admin")) {
			throw new Error("Only administrators can manage features");
		}

		if (this.featureFlags[feature]) {
			this.featureFlags[feature].enabled = true;
			this.saveFeatureFlags();
		}
	}

	disableFeature(feature) {
		if (!this.hasPermission("admin")) {
			throw new Error("Only administrators can manage features");
		}

		if (this.featureFlags[feature]) {
			this.featureFlags[feature].enabled = false;
			this.saveFeatureFlags();
		}
	}

	updateFeaturePermissions(feature, requiredPermissions) {
		if (!this.hasPermission("admin")) {
			throw new Error("Only administrators can manage features");
		}

		if (this.featureFlags[feature]) {
			this.featureFlags[feature].requiredPermissions = requiredPermissions;
			this.saveFeatureFlags();
		}
	}

	// Navigation and UI permissions
	getAvailableNavItems(userId = null) {
		const user = userId
			? this.authSystem.authorizedUsers.find((u) => u.id === userId)
			: this.authSystem.getCurrentUser();
		if (!user) return [];

		const navItems = [
			{ id: "dashboard", label: "Dashboard", icon: "📊", feature: "dashboard" },
			{ id: "tasks", label: "Tasks", icon: "✅", feature: "tasks" },
			{ id: "calendar", label: "Calendar", icon: "📅", feature: "calendar" },
			{ id: "documents", label: "Documents", icon: "📄", feature: "documents" },
			{ id: "policies", label: "Policies", icon: "📋", feature: "policies" },
			{ id: "training", label: "Training", icon: "🎓", feature: "training" },
			{ id: "goals", label: "Goals", icon: "🎯", feature: "goals" },
			{ id: "chat", label: "Chat", icon: "💬", feature: "chat" },
			{ id: "users", label: "Users", icon: "👥", feature: "users" },
			{ id: "reports", label: "Reports", icon: "📈", feature: "reports" },
			{
				id: "recordings",
				label: "Recordings",
				icon: "🎥",
				feature: "recordings",
			},
			{ id: "settings", label: "Settings", icon: "⚙️", feature: "settings" },
			{ id: "audit", label: "Audit Log", icon: "🔍", feature: "audit" },
		];

		return navItems.filter((item) =>
			this.canAccessFeature(item.feature, user.id)
		);
	}

	// Security audit methods
	getPermissionAudit() {
		if (!this.hasPermission("admin")) {
			throw new Error("Only administrators can view audit information");
		}

		return this.authSystem.authorizedUsers.map((user) => ({
			id: user.id,
			name: user.name,
			email: user.email,
			role: user.role,
			permissions: user.permissions,
			lastLogin: user.lastLogin,
			status: user.status,
		}));
	}

	getUnusedPermissions() {
		if (!this.hasPermission("admin")) {
			throw new Error("Only administrators can view audit information");
		}

		const allPermissions = Object.keys(this.permissionDefinitions);
		const usedPermissions = new Set();

		this.authSystem.authorizedUsers.forEach((user) => {
			user.permissions.forEach((permission) => {
				usedPermissions.add(permission);
			});
		});

		return allPermissions.filter(
			(permission) => !usedPermissions.has(permission)
		);
	}

	getOverprivilegedUsers() {
		if (!this.hasPermission("admin")) {
			throw new Error("Only administrators can view audit information");
		}

		return this.authSystem.authorizedUsers.filter((user) => {
			const rolePermissions = this.getPermissionsForRole(user.role);
			return user.permissions.some(
				(permission) => !rolePermissions.includes(permission)
			);
		});
	}
}
