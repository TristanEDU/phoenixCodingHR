// Organizational Hierarchy Manager
// Handles reporting relationships, org chart generation, and hierarchy-based operations

export class HierarchyManager {
	constructor(authSystem, userManager) {
		this.authSystem = authSystem;
		this.userManager = userManager;
		this.organizationSettings = this.loadOrganizationSettings();
	}

	loadOrganizationSettings() {
		try {
			const saved = localStorage.getItem("study-hall-org-settings");
			if (saved) {
				return JSON.parse(saved);
			}
		} catch (error) {
			console.warn("Failed to load organization settings:", error);
		}

		// Default organization settings
		return {
			companyName: "The Study Hall",
			maxReportingLevels: 6,
			maxDirectReports: 8,
			allowMatrixReporting: false,
			requireManagerApproval: true,
			hierarchyLevels: [
				{ level: 1, name: "Executive", color: "#8B5CF6" },
				{ level: 2, name: "Senior Leadership", color: "#3B82F6" },
				{ level: 3, name: "Middle Management", color: "#10B981" },
				{ level: 4, name: "Team Lead", color: "#F59E0B" },
				{ level: 5, name: "Senior", color: "#EF4444" },
				{ level: 6, name: "Junior", color: "#6B7280" },
			],
		};
	}

	saveOrganizationSettings() {
		localStorage.setItem(
			"study-hall-org-settings",
			JSON.stringify(this.organizationSettings)
		);
	}

	// Hierarchy structure methods
	getFullOrganizationChart() {
		const allUsers = this.authSystem.authorizedUsers;
		const chart = {};

		// Build the hierarchy tree
		allUsers.forEach((user) => {
			chart[user.id] = {
				...user,
				level: this.calculateUserLevel(user.id),
				directReports: this.getDirectReports(user.id),
				allSubordinates: this.getAllSubordinates(user.id),
				managerChain: this.getManagerChain(user.id),
				departmentPeers: this.getDepartmentPeers(user.id),
			};
		});

		return chart;
	}

	getOrgChartByDepartment(department) {
		const departmentUsers = this.userManager.getUsersByDepartment(department);
		const chart = {};

		departmentUsers.forEach((user) => {
			chart[user.id] = {
				...user,
				level: this.calculateUserLevel(user.id),
				directReports: this.getDirectReports(user.id).filter(
					(report) => report.department === department
				),
				manager: this.authSystem.getManager(user.id),
			};
		});

		return chart;
	}

	// Level and hierarchy calculations
	calculateUserLevel(userId) {
		let level = 1;
		let currentUser = this.authSystem.authorizedUsers.find(
			(u) => u.id === userId
		);

		while (currentUser && currentUser.managerId) {
			level++;
			currentUser = this.authSystem.authorizedUsers.find(
				(u) => u.id === currentUser.managerId
			);

			// Prevent infinite loops
			if (level > this.organizationSettings.maxReportingLevels) {
				break;
			}
		}

		return level;
	}

	getTopLevelExecutives() {
		return this.authSystem.authorizedUsers.filter((user) => !user.managerId);
	}

	getDirectReports(userId) {
		const user = this.authSystem.authorizedUsers.find((u) => u.id === userId);
		if (!user || !user.directReports) return [];

		return this.authSystem.authorizedUsers.filter((u) =>
			user.directReports.includes(u.id)
		);
	}

	getAllSubordinates(userId) {
		let subordinates = [];
		const directReports = this.getDirectReports(userId);

		directReports.forEach((report) => {
			subordinates.push(report);
			subordinates = subordinates.concat(this.getAllSubordinates(report.id));
		});

		return subordinates;
	}

	getManagerChain(userId) {
		const chain = [];
		let currentUser = this.authSystem.authorizedUsers.find(
			(u) => u.id === userId
		);

		while (currentUser && currentUser.managerId) {
			const manager = this.authSystem.authorizedUsers.find(
				(u) => u.id === currentUser.managerId
			);
			if (manager) {
				chain.push(manager);
				currentUser = manager;
			} else {
				break;
			}

			// Prevent infinite loops
			if (chain.length > this.organizationSettings.maxReportingLevels) {
				break;
			}
		}

		return chain;
	}

	getDepartmentPeers(userId) {
		const user = this.authSystem.authorizedUsers.find((u) => u.id === userId);
		if (!user) return [];

		return this.authSystem.authorizedUsers.filter(
			(u) =>
				u.department === user.department &&
				u.id !== userId &&
				this.calculateUserLevel(u.id) === this.calculateUserLevel(userId)
		);
	}

	// Hierarchy validation methods
	validateReportingStructure() {
		const issues = [];

		this.authSystem.authorizedUsers.forEach((user) => {
			// Check for circular reporting
			if (this.hasCircularReporting(user.id)) {
				issues.push({
					type: "circular_reporting",
					userId: user.id,
					message: `${user.name} has circular reporting relationship`,
				});
			}

			// Check reporting limits
			if (
				user.directReports &&
				user.directReports.length > this.organizationSettings.maxDirectReports
			) {
				issues.push({
					type: "too_many_reports",
					userId: user.id,
					message: `${user.name} has ${user.directReports.length} direct reports (max: ${this.organizationSettings.maxDirectReports})`,
				});
			}

			// Check orphaned users (no manager when they should have one)
			if (!user.managerId && !this.isTopLevelExecutive(user.id)) {
				issues.push({
					type: "orphaned_user",
					userId: user.id,
					message: `${user.name} has no manager assigned`,
				});
			}

			// Check level depth
			const level = this.calculateUserLevel(user.id);
			if (level > this.organizationSettings.maxReportingLevels) {
				issues.push({
					type: "too_deep",
					userId: user.id,
					message: `${user.name} is at level ${level} (max: ${this.organizationSettings.maxReportingLevels})`,
				});
			}
		});

		return issues;
	}

	hasCircularReporting(userId, visited = new Set()) {
		if (visited.has(userId)) {
			return true;
		}

		visited.add(userId);
		const user = this.authSystem.authorizedUsers.find((u) => u.id === userId);

		if (user && user.managerId) {
			return this.hasCircularReporting(user.managerId, visited);
		}

		return false;
	}

	isTopLevelExecutive(userId) {
		const user = this.authSystem.authorizedUsers.find((u) => u.id === userId);
		return (
			user &&
			(user.role === "SpongeLord" ||
				user.position.includes("CEO") ||
				user.position.includes("President"))
		);
	}

	// Reporting relationship management
	assignManager(employeeId, managerId) {
		if (!this.authSystem.canManageUsers()) {
			throw new Error(
				"Insufficient permissions to modify reporting relationships"
			);
		}

		// Validation checks
		if (employeeId === managerId) {
			throw new Error("User cannot be their own manager");
		}

		if (this.wouldCreateCircularReporting(employeeId, managerId)) {
			throw new Error(
				"Assignment would create circular reporting relationship"
			);
		}

		const manager = this.authSystem.authorizedUsers.find(
			(u) => u.id === managerId
		);
		if (!manager) {
			throw new Error("Manager not found");
		}

		if (
			manager.directReports.length >= this.organizationSettings.maxDirectReports
		) {
			throw new Error(
				`Manager already has maximum number of direct reports (${this.organizationSettings.maxDirectReports})`
			);
		}

		// Update relationships
		this.userManager.updateUser(employeeId, { managerId: managerId });

		return true;
	}

	removeManager(employeeId) {
		if (!this.authSystem.canManageUsers()) {
			throw new Error(
				"Insufficient permissions to modify reporting relationships"
			);
		}

		this.userManager.updateUser(employeeId, { managerId: null });
		return true;
	}

	wouldCreateCircularReporting(employeeId, managerId) {
		// Check if making employeeId report to managerId would create a cycle
		const managerChain = this.getManagerChain(managerId);
		return managerChain.some((manager) => manager.id === employeeId);
	}

	// Transfer and reorganization methods
	transferEmployee(employeeId, newManagerId, newDepartment = null) {
		if (!this.authSystem.canManageUsers()) {
			throw new Error("Insufficient permissions to transfer employees");
		}

		const updateData = { managerId: newManagerId };
		if (newDepartment) {
			updateData.department = newDepartment;
		}

		return this.userManager.updateUser(employeeId, updateData);
	}

	bulkTransfer(employeeIds, newManagerId, newDepartment = null) {
		if (!this.authSystem.canManageUsers()) {
			throw new Error("Insufficient permissions to transfer employees");
		}

		const results = [];

		employeeIds.forEach((employeeId) => {
			try {
				const result = this.transferEmployee(
					employeeId,
					newManagerId,
					newDepartment
				);
				results.push({ employeeId, status: "success", data: result });
			} catch (error) {
				results.push({ employeeId, status: "error", error: error.message });
			}
		});

		return results;
	}

	// Analytics and reporting methods
	getHierarchyAnalytics() {
		if (!this.authSystem.canViewReports()) {
			throw new Error("Insufficient permissions to view hierarchy analytics");
		}

		const analytics = {
			totalEmployees: this.authSystem.authorizedUsers.length,
			totalLevels: Math.max(
				...this.authSystem.authorizedUsers.map((u) =>
					this.calculateUserLevel(u.id)
				)
			),
			departmentCounts: {},
			levelDistribution: {},
			managerialLoad: {},
			spanOfControl: {},
		};

		// Department distribution
		this.authSystem.authorizedUsers.forEach((user) => {
			analytics.departmentCounts[user.department] =
				(analytics.departmentCounts[user.department] || 0) + 1;

			const level = this.calculateUserLevel(user.id);
			analytics.levelDistribution[level] =
				(analytics.levelDistribution[level] || 0) + 1;

			analytics.managerialLoad[user.id] = {
				name: user.name,
				directReports: user.directReports ? user.directReports.length : 0,
				totalSubordinates: this.getAllSubordinates(user.id).length,
			};
		});

		// Span of control analysis
		const managers = this.authSystem.authorizedUsers.filter(
			(u) => u.directReports && u.directReports.length > 0
		);
		analytics.spanOfControl = {
			average:
				managers.reduce((sum, m) => sum + m.directReports.length, 0) /
				managers.length,
			max: Math.max(...managers.map((m) => m.directReports.length)),
			min: Math.min(...managers.map((m) => m.directReports.length)),
		};

		return analytics;
	}

	getDepartmentHierarchy(department) {
		const departmentUsers = this.userManager.getUsersByDepartment(department);
		const hierarchy = {};

		// Find department head
		const head = departmentUsers.find((user) => {
			const level = this.calculateUserLevel(user.id);
			return (
				level ===
				Math.min(...departmentUsers.map((u) => this.calculateUserLevel(u.id)))
			);
		});

		if (head) {
			hierarchy.head = head;
			hierarchy.structure = this.buildDepartmentTree(head.id, departmentUsers);
		}

		return hierarchy;
	}

	buildDepartmentTree(managerId, departmentUsers) {
		const manager = departmentUsers.find((u) => u.id === managerId);
		if (!manager) return null;

		const directReports = departmentUsers.filter(
			(u) => u.managerId === managerId
		);

		return {
			...manager,
			reports: directReports
				.map((report) => this.buildDepartmentTree(report.id, departmentUsers))
				.filter(Boolean),
		};
	}

	// Export methods
	exportOrgChart(format = "json") {
		if (!this.authSystem.canViewReports()) {
			throw new Error("Insufficient permissions to export org chart");
		}

		const chart = this.getFullOrganizationChart();

		switch (format) {
			case "json":
				return JSON.stringify(chart, null, 2);
			case "csv":
				return this.convertToCSV(chart);
			default:
				throw new Error("Unsupported export format");
		}
	}

	convertToCSV(chart) {
		const headers = [
			"ID",
			"Name",
			"Email",
			"Role",
			"Position",
			"Department",
			"Manager",
			"Level",
			"Direct Reports",
		];
		const rows = Object.values(chart).map((user) => [
			user.id,
			user.name,
			user.email,
			user.role,
			user.position,
			user.department,
			user.managerId || "",
			user.level,
			user.directReports.length,
		]);

		return [headers, ...rows].map((row) => row.join(",")).join("\n");
	}
}
