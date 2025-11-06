// User Management System
// Handles CRUD operations for users, roles, and organizational structure

export class UserManager {
	constructor(authSystem) {
		this.authSystem = authSystem;
		this.departments = this.loadDepartments();
		this.roles = this.loadRoles();
		this.positions = this.loadPositions();
	}

	// Department management
	loadDepartments() {
		try {
			const saved = localStorage.getItem("study-hall-departments");
			if (saved) {
				return JSON.parse(saved);
			}
		} catch (error) {
			console.warn("Failed to load departments:", error);
		}

		// Default departments
		return [
			{
				id: "DEPT001",
				name: "Executive",
				description: "Executive Leadership",
				budget: 0,
				headOfDepartment: "EMP001",
			},
			{
				id: "DEPT002",
				name: "Human Resources",
				description: "People Operations and HR",
				budget: 250000,
				headOfDepartment: "EMP002",
			},
			{
				id: "DEPT003",
				name: "Operations",
				description: "Daily Operations and Management",
				budget: 500000,
				headOfDepartment: "EMP004",
			},
		];
	}

	saveDepartments() {
		localStorage.setItem(
			"study-hall-departments",
			JSON.stringify(this.departments)
		);
	}

	// Role and position management
	loadRoles() {
		try {
			const saved = localStorage.getItem("study-hall-roles");
			if (saved) {
				return JSON.parse(saved);
			}
		} catch (error) {
			console.warn("Failed to load roles:", error);
		}

		// Default roles
		return [
			{
				id: "ROLE001",
				name: "SpongeLord",
				level: 5,
				permissions: ["admin", "hr", "finance", "operations", "users"],
				description: "Chief Executive Officer",
			},
			{
				id: "ROLE002",
				name: "HR Manager",
				level: 4,
				permissions: ["hr", "admin", "users"],
				description: "Human Resources Manager",
			},
			{
				id: "ROLE003",
				name: "HR Specialist",
				level: 3,
				permissions: ["hr", "users"],
				description: "HR Business Partner",
			},
			{
				id: "ROLE004",
				name: "Department Manager",
				level: 4,
				permissions: ["operations", "users"],
				description: "Operations Manager",
			},
		];
	}

	saveRoles() {
		localStorage.setItem("study-hall-roles", JSON.stringify(this.roles));
	}

	loadPositions() {
		try {
			const saved = localStorage.getItem("study-hall-positions");
			if (saved) {
				return JSON.parse(saved);
			}
		} catch (error) {
			console.warn("Failed to load positions:", error);
		}

		// Default positions
		return [
			{
				id: "POS001",
				title: "Chief Executive Officer",
				department: "Executive",
				level: "C-Level",
				salaryRange: { min: 200000, max: 500000 },
				requirements: ["Leadership", "Strategic Planning"],
			},
			{
				id: "POS002",
				title: "Human Resources Manager",
				department: "Human Resources",
				level: "Manager",
				salaryRange: { min: 80000, max: 120000 },
				requirements: ["HR Management", "Employee Relations"],
			},
			{
				id: "POS003",
				title: "HR Business Partner",
				department: "Human Resources",
				level: "Senior",
				salaryRange: { min: 60000, max: 90000 },
				requirements: ["HR Operations", "Employee Support"],
			},
			{
				id: "POS004",
				title: "Operations Manager",
				department: "Operations",
				level: "Manager",
				salaryRange: { min: 75000, max: 110000 },
				requirements: ["Operations Management", "Process Improvement"],
			},
		];
	}

	savePositions() {
		localStorage.setItem(
			"study-hall-positions",
			JSON.stringify(this.positions)
		);
	}

	// User CRUD operations
	createUser(userData) {
		if (!this.authSystem.canManageUsers()) {
			throw new Error("Insufficient permissions to create users");
		}

		const newUser = {
			id: this.generateUserId(),
			...userData,
			directReports: [],
			startDate: new Date().toISOString().split("T")[0],
			status: "active",
			lastLogin: null,
		};

		this.authSystem.authorizedUsers.push(newUser);
		this.authSystem.saveUserData();

		// Update manager's direct reports if applicable
		if (newUser.managerId) {
			this.addDirectReport(newUser.managerId, newUser.id);
		}

		return newUser;
	}

	updateUser(userId, updateData) {
		if (!this.authSystem.canManageUsers()) {
			throw new Error("Insufficient permissions to update users");
		}

		const userIndex = this.authSystem.authorizedUsers.findIndex(
			(u) => u.id === userId
		);
		if (userIndex === -1) {
			throw new Error("User not found");
		}

		const currentUser = this.authSystem.authorizedUsers[userIndex];
		const oldManagerId = currentUser.managerId;

		// Update user data
		this.authSystem.authorizedUsers[userIndex] = {
			...currentUser,
			...updateData,
		};

		// Handle manager changes
		if (oldManagerId !== updateData.managerId) {
			// Remove from old manager's direct reports
			if (oldManagerId) {
				this.removeDirectReport(oldManagerId, userId);
			}
			// Add to new manager's direct reports
			if (updateData.managerId) {
				this.addDirectReport(updateData.managerId, userId);
			}
		}

		this.authSystem.saveUserData();
		return this.authSystem.authorizedUsers[userIndex];
	}

	deleteUser(userId) {
		if (!this.authSystem.canManageUsers()) {
			throw new Error("Insufficient permissions to delete users");
		}

		const user = this.getUserById(userId);
		if (!user) {
			throw new Error("User not found");
		}

		// Remove from manager's direct reports
		if (user.managerId) {
			this.removeDirectReport(user.managerId, userId);
		}

		// Reassign direct reports to user's manager or mark as unassigned
		user.directReports.forEach((reportId) => {
			this.updateUser(reportId, { managerId: user.managerId || null });
		});

		// Remove user from array
		this.authSystem.authorizedUsers = this.authSystem.authorizedUsers.filter(
			(u) => u.id !== userId
		);
		this.authSystem.saveUserData();

		return true;
	}

	getUserById(userId) {
		return this.authSystem.authorizedUsers.find((u) => u.id === userId);
	}

	getUsersByDepartment(department) {
		return this.authSystem.authorizedUsers.filter(
			(u) => u.department === department
		);
	}

	getUsersByRole(role) {
		return this.authSystem.authorizedUsers.filter((u) => u.role === role);
	}

	// Hierarchy management
	addDirectReport(managerId, employeeId) {
		const manager = this.getUserById(managerId);
		if (manager && !manager.directReports.includes(employeeId)) {
			manager.directReports.push(employeeId);
			this.authSystem.saveUserData();
		}
	}

	removeDirectReport(managerId, employeeId) {
		const manager = this.getUserById(managerId);
		if (manager) {
			manager.directReports = manager.directReports.filter(
				(id) => id !== employeeId
			);
			this.authSystem.saveUserData();
		}
	}

	getOrganizationChart() {
		const chart = {};

		this.authSystem.authorizedUsers.forEach((user) => {
			chart[user.id] = {
				...user,
				directReports: this.authSystem.getDirectReports(user.id),
				manager: this.authSystem.getManager(user.id),
			};
		});

		return chart;
	}

	// Utility methods
	generateUserId() {
		const users = this.authSystem.authorizedUsers;
		const maxId = Math.max(...users.map((u) => parseInt(u.id.substring(3))));
		return `EMP${String(maxId + 1).padStart(3, "0")}`;
	}

	validateUserData(userData) {
		const errors = [];

		if (!userData.email || !this.authSystem.isValidEmail(userData.email)) {
			errors.push("Valid email is required");
		}

		if (!userData.name || userData.name.trim().length < 2) {
			errors.push("Name must be at least 2 characters");
		}

		if (!userData.role) {
			errors.push("Role is required");
		}

		if (!userData.department) {
			errors.push("Department is required");
		}

		// Check if email is already in use
		const existingUser = this.authSystem.authorizedUsers.find(
			(u) => u.email === userData.email
		);
		if (existingUser) {
			errors.push("Email address is already in use");
		}

		return errors;
	}

	// Department operations
	createDepartment(deptData) {
		if (!this.authSystem.canAccessAdminPanel()) {
			throw new Error("Insufficient permissions to create departments");
		}

		const newDept = {
			id: this.generateDepartmentId(),
			...deptData,
		};

		this.departments.push(newDept);
		this.saveDepartments();
		return newDept;
	}

	generateDepartmentId() {
		const maxId = Math.max(
			...this.departments.map((d) => parseInt(d.id.substring(4)))
		);
		return `DEPT${String(maxId + 1).padStart(3, "0")}`;
	}

	// Search and filter methods
	searchUsers(query) {
		const searchTerm = query.toLowerCase();
		return this.authSystem.authorizedUsers.filter(
			(user) =>
				user.name.toLowerCase().includes(searchTerm) ||
				user.email.toLowerCase().includes(searchTerm) ||
				user.role.toLowerCase().includes(searchTerm) ||
				user.department.toLowerCase().includes(searchTerm) ||
				user.position.toLowerCase().includes(searchTerm)
		);
	}

	getActiveUsers() {
		return this.authSystem.authorizedUsers.filter((u) => u.status === "active");
	}

	getInactiveUsers() {
		return this.authSystem.authorizedUsers.filter((u) => u.status !== "active");
	}
}
