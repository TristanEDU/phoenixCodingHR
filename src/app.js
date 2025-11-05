// Phoenix HR App - Main Application Logic
// Handles routing, navigation, and app state management

class PhoenixHRApp {
	constructor() {
		this.currentView = "dashboard";
		this.sidebarCollapsed = false;
		this.sectionStates = {
			favorites: true,
			dashboards: true,
			spaces: true,
		};

		// Load dashboards from localStorage or use defaults
		this.dashboards = this.loadDashboards();
		this.init();
	}

	// Dashboard persistence methods
	loadDashboards() {
		try {
			const saved = localStorage.getItem("phoenix-hr-dashboards");
			if (saved) {
				const dashboards = JSON.parse(saved);
				console.log("Loaded dashboards from localStorage:", dashboards);
				return dashboards;
			}
		} catch (error) {
			console.warn("Failed to load dashboards from localStorage:", error);
		}

		// Return default dashboards if nothing saved or error occurred
		return [
			{ id: "dashboard", name: "Overview", icon: "📊" },
			{ id: "projects", name: "HR Projects", icon: "📋" },
			{ id: "reports", name: "Analytics", icon: "📈" },
		];
	}

	saveDashboards() {
		try {
			localStorage.setItem(
				"phoenix-hr-dashboards",
				JSON.stringify(this.dashboards)
			);
			console.log("Dashboards saved to localStorage");
		} catch (error) {
			console.warn("Failed to save dashboards to localStorage:", error);
		}
	}

	init() {
		console.log("PhoenixHRApp initializing...");

		// Initialize authentication and user info
		this.initializeUser();

		this.bindEvents();
		this.handleInitialRoute();
		this.updatePageTitle();
		this.initializeSectionStates();
		this.initializeSavedDashboards();
		console.log("PhoenixHRApp initialized successfully!");
	}

	bindEvents() {
		// Sidebar navigation
		const navItems = document.querySelectorAll(".nav-item");
		navItems.forEach((item) => {
			item.addEventListener("click", (e) => {
				e.preventDefault();
				const view = item.dataset.view;
				this.navigateToView(view);
			});
		});

		// Sidebar toggle
		const sidebarToggle = document.getElementById("sidebarToggle");
		const mobileMenuBtn = document.getElementById("mobileMenuBtn");

		if (sidebarToggle) {
			sidebarToggle.addEventListener("click", () => this.toggleSidebar());
		}

		if (mobileMenuBtn) {
			mobileMenuBtn.addEventListener("click", () => this.toggleSidebar());
		}

		// Section toggles
		const sectionToggles = document.querySelectorAll(".section-toggle");
		sectionToggles.forEach((toggle) => {
			toggle.addEventListener("click", (e) => {
				const section = toggle.dataset.section;
				this.toggleSection(section);
			});
		});

		// Create dashboard button
		const createDashboard = document.getElementById("createDashboard");
		console.log("Create dashboard button found:", createDashboard);
		if (createDashboard) {
			createDashboard.addEventListener("click", () => {
				console.log("Create dashboard button clicked!");
				this.createNewDashboard();
			});
		} else {
			console.error("Create dashboard button not found!");
		}

		// Add dashboard button
		const addDashboard = document.getElementById("addDashboard");
		console.log("Add dashboard button found:", addDashboard);
		if (addDashboard) {
			addDashboard.addEventListener("click", () => {
				console.log("Add dashboard button clicked!");
				this.createNewDashboard();
			});
		}

		// Add space button
		const addSpace = document.getElementById("addSpace");
		if (addSpace) {
			addSpace.addEventListener("click", () => this.createNewSpace());
		}

		// Item options buttons
		document.addEventListener("click", (e) => {
			if (e.target.classList.contains("item-options")) {
				e.preventDefault();
				e.stopPropagation();
				this.showItemOptions(e.target);
			}
		});

		// Workspace dropdown
		const workspaceDropdown = document.querySelector(".workspace-dropdown");
		if (workspaceDropdown) {
			workspaceDropdown.addEventListener("click", () =>
				this.showWorkspaceMenu()
			);
		}

		// Handle browser back/forward
		window.addEventListener("popstate", (e) => {
			if (e.state && e.state.view) {
				this.showView(e.state.view, false);
			}
		});

		// View toggles for tasks (list/board view)
		const viewToggles = document.querySelectorAll(".view-toggle");
		viewToggles.forEach((toggle) => {
			toggle.addEventListener("click", (e) => {
				this.handleViewToggle(e.target);
			});
		});

		// Handle responsive sidebar on window resize
		window.addEventListener("resize", () => {
			this.handleResize();
		});
	}

	initializeSectionStates() {
		// Set initial section states
		Object.keys(this.sectionStates).forEach((sectionName) => {
			const isExpanded = this.sectionStates[sectionName];
			const sectionContent = document.querySelector(
				`[data-section-content="${sectionName}"]`
			);
			const sectionToggle = document.querySelector(
				`[data-section="${sectionName}"]`
			);

			if (sectionContent && sectionToggle) {
				if (isExpanded) {
					sectionContent.classList.remove("collapsed");
					sectionToggle.classList.remove("collapsed");
				} else {
					sectionContent.classList.add("collapsed");
					sectionToggle.classList.add("collapsed");
				}
			}
		});
	}

	initializeSavedDashboards() {
		// Create views and sidebar entries for any custom dashboards that don't have the default IDs
		const defaultIds = ["dashboard", "projects", "reports"];
		const customDashboards = this.dashboards.filter(
			(d) => !defaultIds.includes(d.id)
		);

		customDashboards.forEach((dashboard) => {
			// Create the dashboard view
			this.createDashboardView(dashboard);

			// Add to sidebar navigation
			this.addDashboardToSidebar(dashboard);
		});

		console.log(
			`Initialized ${customDashboards.length} saved custom dashboards`
		);
	}

	// Authentication and User Management Methods
	initializeUser() {
		if (!window.authSystem) {
			console.error("AuthSystem not available");
			return;
		}

		// Check if user is authenticated
		if (!window.authSystem.isAuthenticated()) {
			console.log("User not authenticated, redirecting to login");
			window.location.href = "login.html";
			return;
		}

		// Get current user and update UI
		const user = window.authSystem.getCurrentUser();
		if (user) {
			this.updateUserInterface(user);
			this.bindUserMenuEvents();
		}

		console.log("User initialized:", user?.name);
	}

	updateUserInterface(user) {
		// Update user info in topbar
		const userInfo = document.getElementById("userInfo");
		const userDetails = document.getElementById("userDetails");

		if (userInfo) {
			userInfo.innerHTML = `
				<span class="user-name">${user.name}</span>
				<span class="user-role">${user.role}</span>
			`;
		}

		if (userDetails) {
			userDetails.innerHTML = `
				<div class="user-name">${user.name}</div>
				<div class="user-email">${user.email}</div>
			`;
		}
	}

	bindUserMenuEvents() {
		// User menu toggle
		const userMenuBtn = document.getElementById("userMenuBtn");
		const userDropdown = document.getElementById("userDropdown");

		if (userMenuBtn && userDropdown) {
			userMenuBtn.addEventListener("click", (e) => {
				e.stopPropagation();
				this.toggleUserMenu();
			});

			// Close dropdown when clicking outside
			document.addEventListener("click", (e) => {
				if (
					!userMenuBtn.contains(e.target) &&
					!userDropdown.contains(e.target)
				) {
					this.closeUserMenu();
				}
			});
		}

		// Logout button
		const logoutBtn = document.getElementById("logoutBtn");
		if (logoutBtn) {
			logoutBtn.addEventListener("click", (e) => {
				e.preventDefault();
				this.handleLogout();
			});
		}

		// Account Settings button
		const accountSettingsBtn = document.getElementById("accountSettingsBtn");
		if (accountSettingsBtn) {
			accountSettingsBtn.addEventListener("click", (e) => {
				e.preventDefault();
				this.closeUserMenu();
				this.showAccountSettingsModal();
			});
		}

		// Preferences button
		const preferencesBtn = document.getElementById("preferencesBtn");
		if (preferencesBtn) {
			preferencesBtn.addEventListener("click", (e) => {
				e.preventDefault();
				this.closeUserMenu();
				this.showPreferencesModal();
			});
		}
	}

	toggleUserMenu() {
		const userDropdown = document.getElementById("userDropdown");
		if (userDropdown) {
			const isVisible = userDropdown.style.display !== "none";
			userDropdown.style.display = isVisible ? "none" : "block";
		}
	}

	closeUserMenu() {
		const userDropdown = document.getElementById("userDropdown");
		if (userDropdown) {
			userDropdown.style.display = "none";
		}
	}

	handleLogout() {
		if (confirm("Are you sure you want to sign out?")) {
			console.log("User logging out...");
			if (window.authSystem) {
				window.authSystem.logout();
			} else {
				// Fallback if authSystem not available
				window.location.href = "login.html";
			}
		}
	}

	toggleSection(sectionName) {
		const sectionContent = document.querySelector(
			`[data-section-content="${sectionName}"]`
		);
		const sectionToggle = document.querySelector(
			`[data-section="${sectionName}"]`
		);

		if (sectionContent && sectionToggle) {
			const isCurrentlyExpanded =
				!sectionContent.classList.contains("collapsed");
			this.sectionStates[sectionName] = !isCurrentlyExpanded;

			if (isCurrentlyExpanded) {
				sectionContent.classList.add("collapsed");
				sectionToggle.classList.add("collapsed");
			} else {
				sectionContent.classList.remove("collapsed");
				sectionToggle.classList.remove("collapsed");
			}
		}
	}

	createNewDashboard() {
		console.log("createNewDashboard method called!");
		this.showCreateDashboardModal();
	}

	showCreateDashboardModal() {
		// Remove any existing modals
		this.closeModal();

		// Create modal
		const modal = document.createElement("div");
		modal.className = "modal-overlay";
		modal.innerHTML = `
			<div class="modal-content">
				<div class="modal-header">
					<h2>Create New Dashboard</h2>
					<button class="modal-close" aria-label="Close modal">&times;</button>
				</div>
				<form class="dashboard-form" id="dashboardForm">
					<div class="form-group">
						<label for="dashboardName">Dashboard Name *</label>
						<input 
							type="text" 
							id="dashboardName" 
							name="name" 
							placeholder="e.g., Team Performance, Q4 Metrics" 
							required
						>
					</div>
					
					<div class="form-group">
						<label for="dashboardDescription">Description</label>
						<textarea 
							id="dashboardDescription" 
							name="description" 
							placeholder="Brief description of what this dashboard will track..."
							rows="3"
						></textarea>
					</div>
					
					<div class="form-row">
						<div class="form-group">
							<label for="dashboardIcon">Icon</label>
							<select id="dashboardIcon" name="icon">
								<option value="📊">📊 Charts</option>
								<option value="📈">📈 Analytics</option>
								<option value="📋">📋 Tasks</option>
								<option value="👥">👥 People</option>
								<option value="💼">💼 Business</option>
								<option value="🎯">🎯 Goals</option>
								<option value="⚡">⚡ Performance</option>
								<option value="🔍">🔍 Insights</option>
								<option value="💰">💰 Finance</option>
								<option value="📅">📅 Calendar</option>
							</select>
						</div>
						
						<div class="form-group">
							<label for="dashboardTemplate">Template</label>
							<select id="dashboardTemplate" name="template">
								<option value="blank">Blank Dashboard</option>
								<option value="analytics">Analytics Template</option>
								<option value="team">Team Management</option>
								<option value="project">Project Overview</option>
								<option value="hr">HR Metrics</option>
							</select>
						</div>
					</div>
					
					<div class="form-actions">
						<button type="button" class="btn btn-secondary" id="cancelDashboard">Cancel</button>
						<button type="submit" class="btn btn-primary">Create Dashboard</button>
					</div>
				</form>
			</div>
		`;

		// Add to page
		document.body.appendChild(modal);

		// Focus first input
		setTimeout(() => {
			document.getElementById("dashboardName").focus();
		}, 100);

		// Bind events
		this.bindModalEvents(modal);

		// Store reference
		this.currentModal = modal;
	}

	bindModalEvents(modal) {
		// Close button
		const closeBtn = modal.querySelector(".modal-close");
		closeBtn.addEventListener("click", () => this.closeModal());

		// Cancel button
		const cancelBtn = modal.querySelector("#cancelDashboard");
		cancelBtn.addEventListener("click", () => this.closeModal());

		// Close on overlay click
		modal.addEventListener("click", (e) => {
			if (e.target === modal) {
				this.closeModal();
			}
		});

		// Form submission
		const form = modal.querySelector("#dashboardForm");
		form.addEventListener("submit", (e) => {
			e.preventDefault();
			this.handleDashboardCreation(form);
		});

		// Escape key to close
		const handleEscape = (e) => {
			if (e.key === "Escape") {
				this.closeModal();
				document.removeEventListener("keydown", handleEscape);
			}
		};
		document.addEventListener("keydown", handleEscape);
	}

	handleDashboardCreation(form) {
		const formData = new FormData(form);
		const dashboardData = {
			id: `dashboard-${Date.now()}`,
			name: formData.get("name").trim(),
			description: formData.get("description").trim(),
			icon: formData.get("icon"),
			template: formData.get("template"),
			createdAt: new Date().toISOString(),
			widgets: [],
		};

		// Validate required fields
		if (!dashboardData.name) {
			this.showNotification("Dashboard name is required", "error");
			return;
		}

		// Create the dashboard
		this.createDashboard(dashboardData);

		// Close modal
		this.closeModal();

		// Navigate to new dashboard
		this.navigateToView(dashboardData.id);
	}

	createDashboard(dashboardData) {
		// Add to dashboards array
		this.dashboards.push(dashboardData);

		// Save to localStorage
		this.saveDashboards();

		// Create the HTML view for this dashboard
		this.createDashboardView(dashboardData);

		// Add to sidebar navigation
		this.addDashboardToSidebar(dashboardData);

		console.log("Dashboard created:", dashboardData);
	}

	createDashboardView(dashboard) {
		const contentArea = document.getElementById("contentArea");

		// Create dashboard view HTML based on template
		const dashboardHTML = this.generateDashboardHTML(dashboard);

		// Create view element
		const viewElement = document.createElement("div");
		viewElement.className = "view custom-dashboard-view";
		viewElement.id = `${dashboard.id}-view`;
		viewElement.innerHTML = dashboardHTML;

		// Add to content area
		contentArea.appendChild(viewElement);
	}

	generateDashboardHTML(dashboard) {
		const templates = {
			blank: `
				<div class="dashboard-header">
					<h2>${dashboard.icon} ${dashboard.name}</h2>
					<p class="dashboard-description">${
						dashboard.description || "Custom dashboard"
					}</p>
					<div class="dashboard-actions">
						<button class="btn btn-primary" onclick="phoenixApp.addWidget('${
							dashboard.id
						}')">+ Add Widget</button>
						<button class="btn btn-secondary" onclick="phoenixApp.editDashboard('${
							dashboard.id
						}')">Edit Dashboard</button>
					</div>
				</div>
				<div class="dashboard-content" id="${dashboard.id}-content">
					<div class="empty-dashboard">
						<div class="empty-icon">📊</div>
						<h3>Your dashboard is ready!</h3>
						<p>Start by adding some widgets to track your data.</p>
						<button class="btn btn-primary" onclick="phoenixApp.addWidget('${
							dashboard.id
						}')">Add Your First Widget</button>
					</div>
				</div>
			`,
			analytics: `
				<div class="dashboard-header">
					<h2>${dashboard.icon} ${dashboard.name}</h2>
					<p class="dashboard-description">${
						dashboard.description || "Analytics dashboard"
					}</p>
				</div>
				<div class="dashboard-grid">
					<div class="dashboard-card">
						<h3>Key Metrics</h3>
						<div class="metrics-grid">
							<div class="metric">
								<div class="metric-value">24</div>
								<div class="metric-label">Total Users</div>
							</div>
							<div class="metric">
								<div class="metric-value">89%</div>
								<div class="metric-label">Success Rate</div>
							</div>
						</div>
					</div>
					<div class="dashboard-card">
						<h3>Chart Placeholder</h3>
						<div class="chart-placeholder">📈 Analytics chart will go here</div>
					</div>
				</div>
			`,
			team: `
				<div class="dashboard-header">
					<h2>${dashboard.icon} ${dashboard.name}</h2>
					<p class="dashboard-description">${
						dashboard.description || "Team management dashboard"
					}</p>
				</div>
				<div class="dashboard-grid">
					<div class="dashboard-card">
						<h3>Team Overview</h3>
						<p>Team members: 12</p>
						<p>Active projects: 5</p>
						<p>Completed tasks: 89</p>
					</div>
					<div class="dashboard-card">
						<h3>Recent Activity</h3>
						<div class="activity-placeholder">👥 Team activity will be shown here</div>
					</div>
				</div>
			`,
			project: `
				<div class="dashboard-header">
					<h2>${dashboard.icon} ${dashboard.name}</h2>
					<p class="dashboard-description">${
						dashboard.description || "Project overview dashboard"
					}</p>
				</div>
				<div class="dashboard-grid">
					<div class="dashboard-card">
						<h3>Project Status</h3>
						<div class="progress-bar">
							<div class="progress-fill" style="width: 65%"></div>
						</div>
						<p>65% Complete</p>
					</div>
					<div class="dashboard-card">
						<h3>Timeline</h3>
						<p>📅 Project timeline and milestones</p>
					</div>
				</div>
			`,
			hr: `
				<div class="dashboard-header">
					<h2>${dashboard.icon} ${dashboard.name}</h2>
					<p class="dashboard-description">${
						dashboard.description || "HR metrics dashboard"
					}</p>
				</div>
				<div class="dashboard-grid">
					<div class="dashboard-card">
						<h3>HR Metrics</h3>
						<div class="hr-stats">
							<div class="stat">
								<span class="stat-number">142</span>
								<span class="stat-label">Employees</span>
							</div>
							<div class="stat">
								<span class="stat-number">8</span>
								<span class="stat-label">Open Positions</span>
							</div>
							<div class="stat">
								<span class="stat-number">95%</span>
								<span class="stat-label">Retention Rate</span>
							</div>
						</div>
					</div>
				</div>
			`,
		};

		return templates[dashboard.template] || templates.blank;
	}

	addDashboardToSidebar(dashboard) {
		const dashboardsSection = document.querySelector(
			'[data-section-content="dashboards"]'
		);

		const listItem = document.createElement("li");
		listItem.innerHTML = `
			<a href="#${dashboard.id}" class="nav-item" data-view="${dashboard.id}">
				<span class="nav-icon">${dashboard.icon}</span>
				<span class="nav-text">${dashboard.name}</span>
				<button class="item-options" title="Dashboard options">⋯</button>
			</a>
		`;

		dashboardsSection.appendChild(listItem);

		// Bind navigation event to new item
		const navItem = listItem.querySelector(".nav-item");
		navItem.addEventListener("click", (e) => {
			e.preventDefault();
			this.navigateToView(dashboard.id);
		});
	}

	closeModal() {
		if (this.currentModal) {
			this.currentModal.remove();
			this.currentModal = null;
		}
	}

	// Account Settings Modal
	showAccountSettingsModal() {
		// Remove any existing modals
		this.closeModal();

		// Get current user info
		const user = window.authSystem?.getCurrentUser();

		// Create modal
		const modal = document.createElement("div");
		modal.className = "modal-overlay";
		modal.innerHTML = `
			<div class="modal-content account-settings-modal">
				<div class="modal-header">
					<h2>Account Settings</h2>
					<button class="modal-close" aria-label="Close modal">&times;</button>
				</div>
				<div class="modal-body">
					<div class="settings-section">
						<h3>Profile Information</h3>
						<form class="settings-form" id="profileForm">
							<div class="form-row">
								<div class="form-group">
									<label for="fullName">Full Name</label>
									<input type="text" id="fullName" name="fullName" value="${
										user?.name || ""
									}" required>
								</div>
								<div class="form-group">
									<label for="email">Email Address</label>
									<input type="email" id="email" name="email" value="${
										user?.email || ""
									}" readonly>
									<small class="form-help">Email cannot be changed for security reasons</small>
								</div>
							</div>
							<div class="form-row">
								<div class="form-group">
									<label for="role">Role</label>
									<input type="text" id="role" name="role" value="${user?.role || ""}" readonly>
								</div>
								<div class="form-group">
									<label for="department">Department</label>
									<input type="text" id="department" name="department" value="${
										user?.department || ""
									}" readonly>
								</div>
							</div>
						</form>
					</div>

					<div class="settings-section">
						<h3>Security</h3>
						<form class="settings-form" id="securityForm">
							<div class="form-group">
								<label for="currentPassword">Current Password</label>
								<input type="password" id="currentPassword" name="currentPassword" placeholder="Enter current password">
							</div>
							<div class="form-row">
								<div class="form-group">
									<label for="newPassword">New Password</label>
									<input type="password" id="newPassword" name="newPassword" placeholder="Enter new password">
								</div>
								<div class="form-group">
									<label for="confirmPassword">Confirm Password</label>
									<input type="password" id="confirmPassword" name="confirmPassword" placeholder="Confirm new password">
								</div>
							</div>
							<div class="form-group">
								<label class="checkbox-label">
									<input type="checkbox" id="enableTwoFactor" name="enableTwoFactor">
									<span class="checkbox-custom"></span>
									Enable Two-Factor Authentication (Coming Soon)
								</label>
							</div>
						</form>
					</div>

					<div class="settings-section">
						<h3>Account Actions</h3>
						<div class="action-buttons">
							<button class="btn btn-outline" id="exportDataBtn">
								<span class="btn-icon">📥</span>
								Export My Data
							</button>
							<button class="btn btn-danger" id="deleteAccountBtn">
								<span class="btn-icon">🗑️</span>
								Delete Account
							</button>
						</div>
					</div>
				</div>
				<div class="modal-footer">
					<button class="btn btn-secondary" id="cancelSettingsBtn">Cancel</button>
					<button class="btn btn-primary" id="saveSettingsBtn">Save Changes</button>
				</div>
			</div>
		`;

		// Add to DOM
		document.body.appendChild(modal);
		this.currentModal = modal;

		// Bind events
		const closeBtn = modal.querySelector(".modal-close");
		const cancelBtn = modal.querySelector("#cancelSettingsBtn");
		const saveBtn = modal.querySelector("#saveSettingsBtn");
		const exportBtn = modal.querySelector("#exportDataBtn");
		const deleteBtn = modal.querySelector("#deleteAccountBtn");

		closeBtn.addEventListener("click", () => this.closeModal());
		cancelBtn.addEventListener("click", () => this.closeModal());

		saveBtn.addEventListener("click", () => {
			this.saveAccountSettings();
		});

		exportBtn.addEventListener("click", () => {
			this.exportUserData();
		});

		deleteBtn.addEventListener("click", () => {
			this.handleDeleteAccount();
		});

		// Close on overlay click
		modal.addEventListener("click", (e) => {
			if (e.target === modal) {
				this.closeModal();
			}
		});
	}

	// Preferences Modal
	showPreferencesModal() {
		// Remove any existing modals
		this.closeModal();

		// Create modal
		const modal = document.createElement("div");
		modal.className = "modal-overlay";
		modal.innerHTML = `
			<div class="modal-content preferences-modal">
				<div class="modal-header">
					<h2>Preferences</h2>
					<button class="modal-close" aria-label="Close modal">&times;</button>
				</div>
				<div class="modal-body">
					<div class="settings-section">
						<h3>Appearance</h3>
						<div class="preference-group">
							<label>Theme</label>
							<div class="radio-group">
								<label class="radio-label">
									<input type="radio" name="theme" value="dark" checked>
									<span class="radio-custom"></span>
									Dark Mode
								</label>
								<label class="radio-label">
									<input type="radio" name="theme" value="light">
									<span class="radio-custom"></span>
									Light Mode
								</label>
								<label class="radio-label">
									<input type="radio" name="theme" value="auto">
									<span class="radio-custom"></span>
									System Default
								</label>
							</div>
						</div>
						<div class="preference-group">
							<label>Sidebar</label>
							<label class="checkbox-label">
								<input type="checkbox" id="collapseSidebar" name="collapseSidebar">
								<span class="checkbox-custom"></span>
								Start with collapsed sidebar
							</label>
						</div>
					</div>

					<div class="settings-section">
						<h3>Notifications</h3>
						<div class="preference-group">
							<label class="checkbox-label">
								<input type="checkbox" id="emailNotifications" name="emailNotifications" checked>
								<span class="checkbox-custom"></span>
								Email notifications
							</label>
							<label class="checkbox-label">
								<input type="checkbox" id="pushNotifications" name="pushNotifications" checked>
								<span class="checkbox-custom"></span>
								Browser notifications
							</label>
							<label class="checkbox-label">
								<input type="checkbox" id="taskReminders" name="taskReminders" checked>
								<span class="checkbox-custom"></span>
								Task due date reminders
							</label>
							<label class="checkbox-label">
								<input type="checkbox" id="weeklyReports" name="weeklyReports">
								<span class="checkbox-custom"></span>
								Weekly activity reports
							</label>
						</div>
					</div>

					<div class="settings-section">
						<h3>Productivity</h3>
						<div class="preference-group">
							<label for="defaultView">Default Dashboard View</label>
							<select id="defaultView" name="defaultView" class="form-select">
								<option value="dashboard">Overview Dashboard</option>
								<option value="projects">HR Projects</option>
								<option value="tasks">Task List</option>
								<option value="people">People Directory</option>
							</select>
						</div>
						<div class="preference-group">
							<label for="workingHours">Working Hours</label>
							<div class="time-range">
								<select id="startTime" name="startTime" class="form-select">
									<option value="08:00">8:00 AM</option>
									<option value="09:00" selected>9:00 AM</option>
									<option value="10:00">10:00 AM</option>
								</select>
								<span class="time-separator">to</span>
								<select id="endTime" name="endTime" class="form-select">
									<option value="16:00">4:00 PM</option>
									<option value="17:00" selected>5:00 PM</option>
									<option value="18:00">6:00 PM</option>
								</select>
							</div>
						</div>
						<div class="preference-group">
							<label class="checkbox-label">
								<input type="checkbox" id="autoSave" name="autoSave" checked>
								<span class="checkbox-custom"></span>
								Auto-save draft changes
							</label>
						</div>
					</div>

					<div class="settings-section">
						<h3>Language & Region</h3>
						<div class="preference-group">
							<label for="language">Language</label>
							<select id="language" name="language" class="form-select">
								<option value="en" selected>English (US)</option>
								<option value="en-gb">English (UK)</option>
								<option value="es">Español</option>
								<option value="fr">Français</option>
								<option value="de">Deutsch</option>
							</select>
						</div>
						<div class="preference-group">
							<label for="timezone">Timezone</label>
							<select id="timezone" name="timezone" class="form-select">
								<option value="America/New_York">Eastern Time (ET)</option>
								<option value="America/Chicago">Central Time (CT)</option>
								<option value="America/Denver">Mountain Time (MT)</option>
								<option value="America/Los_Angeles" selected>Pacific Time (PT)</option>
								<option value="UTC">UTC</option>
							</select>
						</div>
						<div class="preference-group">
							<label for="dateFormat">Date Format</label>
							<select id="dateFormat" name="dateFormat" class="form-select">
								<option value="MM/DD/YYYY" selected>MM/DD/YYYY</option>
								<option value="DD/MM/YYYY">DD/MM/YYYY</option>
								<option value="YYYY-MM-DD">YYYY-MM-DD</option>
							</select>
						</div>
					</div>
				</div>
				<div class="modal-footer">
					<button class="btn btn-secondary" id="cancelPreferencesBtn">Cancel</button>
					<button class="btn btn-outline" id="resetPreferencesBtn">Reset to Defaults</button>
					<button class="btn btn-primary" id="savePreferencesBtn">Save Preferences</button>
				</div>
			</div>
		`;

		// Add to DOM
		document.body.appendChild(modal);
		this.currentModal = modal;

		// Bind events
		const closeBtn = modal.querySelector(".modal-close");
		const cancelBtn = modal.querySelector("#cancelPreferencesBtn");
		const resetBtn = modal.querySelector("#resetPreferencesBtn");
		const saveBtn = modal.querySelector("#savePreferencesBtn");

		closeBtn.addEventListener("click", () => this.closeModal());
		cancelBtn.addEventListener("click", () => this.closeModal());

		resetBtn.addEventListener("click", () => {
			this.resetPreferences();
		});

		saveBtn.addEventListener("click", () => {
			this.savePreferences();
		});

		// Close on overlay click
		modal.addEventListener("click", (e) => {
			if (e.target === modal) {
				this.closeModal();
			}
		});
	}

	// Account Settings Actions
	saveAccountSettings() {
		const profileForm = document.getElementById("profileForm");
		const securityForm = document.getElementById("securityForm");

		const profileData = new FormData(profileForm);
		const securityData = new FormData(securityForm);

		// Update profile information
		const newName = profileData.get("fullName");
		if (newName && newName.trim()) {
			// Here you would typically send to backend
			console.log("Updating profile:", { name: newName });
			this.showNotification("Profile updated successfully!", "success");
		}

		// Handle password change
		const currentPassword = securityData.get("currentPassword");
		const newPassword = securityData.get("newPassword");
		const confirmPassword = securityData.get("confirmPassword");

		if (currentPassword && newPassword && confirmPassword) {
			if (newPassword !== confirmPassword) {
				this.showNotification("Passwords don't match!", "error");
				return;
			}
			if (newPassword.length < 6) {
				this.showNotification(
					"Password must be at least 6 characters!",
					"error"
				);
				return;
			}
			// Here you would typically verify current password and update
			console.log("Password change requested");
			this.showNotification("Password updated successfully!", "success");
		}

		this.closeModal();
	}

	exportUserData() {
		// Create mock data export
		const userData = {
			profile: window.authSystem?.getCurrentUser(),
			dashboards: this.dashboards,
			preferences: JSON.parse(
				localStorage.getItem("phoenix-hr-preferences") || "{}"
			),
			exportDate: new Date().toISOString(),
		};

		const dataStr = JSON.stringify(userData, null, 2);
		const dataBlob = new Blob([dataStr], { type: "application/json" });

		const link = document.createElement("a");
		link.href = URL.createObjectURL(dataBlob);
		link.download = `phoenix-hr-data-${
			new Date().toISOString().split("T")[0]
		}.json`;
		link.click();

		this.showNotification("Data export completed!", "success");
	}

	handleDeleteAccount() {
		const confirmed = confirm(
			"Are you sure you want to delete your account?\n\nThis action cannot be undone and will permanently remove all your data."
		);

		if (confirmed) {
			const doubleConfirm = prompt(
				"To confirm account deletion, please type 'DELETE' in capital letters:"
			);

			if (doubleConfirm === "DELETE") {
				// Here you would typically send delete request to backend
				alert(
					"Account deletion requested. You will be contacted by an administrator to complete the process."
				);
				console.log(
					"Account deletion requested for user:",
					window.authSystem?.getCurrentUser()?.email
				);
			} else {
				this.showNotification("Account deletion cancelled.", "info");
			}
		}
	}

	// Preferences Actions
	savePreferences() {
		const modal = this.currentModal;
		const formData = new FormData();

		// Collect all form inputs
		const inputs = modal.querySelectorAll("input, select");
		inputs.forEach((input) => {
			if (input.type === "checkbox" || input.type === "radio") {
				if (input.checked) {
					formData.append(input.name, input.value || "true");
				}
			} else {
				formData.append(input.name, input.value);
			}
		});

		// Convert to object
		const preferences = {};
		for (let [key, value] of formData.entries()) {
			preferences[key] = value;
		}

		// Save to localStorage
		localStorage.setItem("phoenix-hr-preferences", JSON.stringify(preferences));

		console.log("Preferences saved:", preferences);
		this.showNotification("Preferences saved successfully!", "success");
		this.closeModal();

		// Apply some preferences immediately
		this.applyPreferences(preferences);
	}

	resetPreferences() {
		if (confirm("Reset all preferences to default values?")) {
			localStorage.removeItem("phoenix-hr-preferences");
			this.showNotification("Preferences reset to defaults!", "info");
			this.closeModal();
			// Reopen modal to show defaults
			setTimeout(() => this.showPreferencesModal(), 100);
		}
	}

	applyPreferences(preferences) {
		// Apply theme
		if (preferences.theme) {
			document.body.className = document.body.className.replace(
				/theme-\w+/g,
				""
			);
			if (preferences.theme !== "auto") {
				document.body.classList.add(`theme-${preferences.theme}`);
			}
		}

		// Apply sidebar preference
		if (preferences.collapseSidebar === "true") {
			this.collapseSidebar();
		}

		console.log("Applied preferences:", preferences);
	}

	// Helper methods for dashboard management
	addWidget(dashboardId) {
		this.showNotification("Widget creation coming soon!", "info");
	}

	editDashboard(dashboardId) {
		this.showNotification("Dashboard editing coming soon!", "info");
	}

	createNewSpace() {
		const spaceName = prompt("Enter space name:");
		if (spaceName && spaceName.trim()) {
			this.showNotification(`Created new space: ${spaceName}`, "success");
			console.log("New space created:", spaceName);
		}
	}

	showItemOptions(optionsButton) {
		// Remove any existing context menu
		this.closeContextMenu();

		// Get the item this options button belongs to
		const navItem = optionsButton.closest(".nav-item");
		const itemName = navItem.querySelector(".nav-text").textContent;
		const itemView = navItem.dataset.view;

		// Create context menu
		const contextMenu = document.createElement("div");
		contextMenu.className = "context-menu";
		contextMenu.innerHTML = `
			<div class="context-menu-item" data-action="rename">
				<span class="context-icon">✏️</span>
				<span class="context-text">Rename</span>
			</div>
			<div class="context-menu-item" data-action="duplicate">
				<span class="context-icon">📋</span>
				<span class="context-text">Duplicate</span>
			</div>
			<div class="context-menu-item" data-action="favorite">
				<span class="context-icon">⭐</span>
				<span class="context-text">Add to Favorites</span>
			</div>
			<div class="context-menu-divider"></div>
			<div class="context-menu-item" data-action="share">
				<span class="context-icon">🔗</span>
				<span class="context-text">Share</span>
			</div>
			<div class="context-menu-item context-menu-danger" data-action="delete">
				<span class="context-icon">🗑️</span>
				<span class="context-text">Delete</span>
			</div>
		`;

		// Position the context menu
		const rect = optionsButton.getBoundingClientRect();
		contextMenu.style.position = "fixed";
		contextMenu.style.top = `${rect.bottom + 5}px`;
		contextMenu.style.left = `${rect.left - 150}px`; // Position to the left of the button
		contextMenu.style.zIndex = "1001";

		// Add to page
		document.body.appendChild(contextMenu);

		// Add event listeners to menu items
		contextMenu.addEventListener("click", (e) => {
			const menuItem = e.target.closest(".context-menu-item");
			if (menuItem) {
				const action = menuItem.dataset.action;
				this.handleItemAction(action, itemName, itemView, navItem);
				this.closeContextMenu();
			}
		});

		// Close menu when clicking outside
		setTimeout(() => {
			document.addEventListener("click", this.closeContextMenu.bind(this), {
				once: true,
			});
		}, 100);

		// Store reference for cleanup
		this.currentContextMenu = contextMenu;
	}

	closeContextMenu() {
		if (this.currentContextMenu) {
			this.currentContextMenu.remove();
			this.currentContextMenu = null;
		}
	}

	handleItemAction(action, itemName, itemView, navItem) {
		switch (action) {
			case "rename":
				this.renameItem(itemName, itemView, navItem);
				break;
			case "duplicate":
				this.duplicateItem(itemName, itemView, navItem);
				break;
			case "favorite":
				this.toggleFavorite(itemName, itemView, navItem);
				break;
			case "share":
				this.shareItem(itemName, itemView);
				break;
			case "delete":
				this.deleteItem(itemName, itemView, navItem);
				break;
		}
	}

	renameItem(itemName, itemView, navItem) {
		const newName = prompt(`Rename "${itemName}" to:`, itemName);
		if (newName && newName.trim() && newName !== itemName) {
			// Update the UI
			const navText = navItem.querySelector(".nav-text");
			navText.textContent = newName.trim();

			// Update internal data if it's a dashboard
			const dashboard = this.dashboards.find((d) => d.id === itemView);
			if (dashboard) {
				dashboard.name = newName.trim();
				// Save to localStorage after rename
				this.saveDashboards();
			}

			this.showNotification(`Renamed to "${newName.trim()}"`, "success");
		}
	}

	duplicateItem(itemName, itemView, navItem) {
		const newName = prompt(
			`Name for duplicate of "${itemName}":`,
			`${itemName} Copy`
		);
		if (newName && newName.trim()) {
			// For now, just show success message
			// You could implement actual duplication logic here
			this.showNotification(
				`Created duplicate: "${newName.trim()}"`,
				"success"
			);
			console.log(`Duplicating ${itemName} as ${newName.trim()}`);
		}
	}

	toggleFavorite(itemName, itemView, navItem) {
		// Check if already in favorites
		const favoritesSection = document.querySelector(
			'[data-section-content="favorites"]'
		);
		const existingFavorite = Array.from(
			favoritesSection.querySelectorAll(".nav-item")
		).find((item) => item.dataset.view === itemView);

		if (existingFavorite) {
			this.showNotification(`"${itemName}" is already in favorites`, "info");
		} else {
			// Add to favorites (clone the nav item)
			const favoriteItem = navItem.cloneNode(true);
			favoriteItem.querySelector(".nav-icon").textContent = "⭐";

			const li = document.createElement("li");
			li.appendChild(favoriteItem);
			favoritesSection.appendChild(li);

			this.showNotification(`Added "${itemName}" to favorites`, "success");
		}
	}

	shareItem(itemName, itemView) {
		// Create a shareable link (placeholder functionality)
		const shareUrl = `${window.location.origin}${window.location.pathname}#${itemView}`;

		// Copy to clipboard if available
		if (navigator.clipboard) {
			navigator.clipboard
				.writeText(shareUrl)
				.then(() => {
					this.showNotification(`Link copied to clipboard!`, "success");
				})
				.catch(() => {
					this.showNotification(`Share link: ${shareUrl}`, "info");
				});
		} else {
			this.showNotification(`Share link: ${shareUrl}`, "info");
		}
	}

	deleteItem(itemName, itemView, navItem) {
		const confirmDelete = confirm(
			`Are you sure you want to delete "${itemName}"? This action cannot be undone.`
		);
		if (confirmDelete) {
			// Remove from UI sidebar
			navItem.closest("li").remove();

			// Remove from internal data if it's a dashboard
			const dashboardIndex = this.dashboards.findIndex(
				(d) => d.id === itemView
			);
			if (dashboardIndex !== -1) {
				this.dashboards.splice(dashboardIndex, 1);

				// Save to localStorage after deletion
				this.saveDashboards();

				// Remove the dashboard view from DOM
				const dashboardView = document.getElementById(`${itemView}-view`);
				if (dashboardView) {
					dashboardView.remove();
				}
			}

			// Remove from favorites if it exists there
			const favoritesSection = document.querySelector(
				'[data-section-content="favorites"]'
			);
			const favoriteItem = Array.from(
				favoritesSection.querySelectorAll(".nav-item")
			).find((item) => item.dataset.view === itemView);
			if (favoriteItem) {
				favoriteItem.closest("li").remove();
			}

			// If we're currently viewing this item, navigate to dashboard
			if (this.currentView === itemView) {
				this.navigateToView("dashboard");
			}

			this.showNotification(`Deleted "${itemName}"`, "success");
		}
	}

	showWorkspaceMenu() {
		this.showNotification("Workspace menu (coming soon)", "info");
	}

	navigateToView(viewName) {
		this.showView(viewName, true);
	}

	showView(viewName, pushState = true) {
		// Hide all views
		const allViews = document.querySelectorAll(".view");
		allViews.forEach((view) => view.classList.remove("active"));

		// Show target view
		const targetView = document.getElementById(`${viewName}-view`);
		if (targetView) {
			targetView.classList.add("active");
			this.currentView = viewName;
		}

		// Update navigation active state
		const navItems = document.querySelectorAll(".nav-item");
		navItems.forEach((item) => {
			if (item.dataset.view === viewName) {
				item.classList.add("active");
			} else {
				item.classList.remove("active");
			}
		});

		// Update page title
		this.updatePageTitle(viewName);

		// Update URL and browser history
		if (pushState) {
			const url = `#${viewName}`;
			history.pushState({ view: viewName }, "", url);
		}

		// Auto-hide sidebar on mobile after navigation
		if (window.innerWidth <= 768) {
			this.collapseSidebar();
		}
	}

	updatePageTitle(viewName = this.currentView) {
		const titleMap = {
			dashboard: "Dashboard",
			projects: "Projects",
			tasks: "Tasks",
			people: "People",
			calendar: "Calendar",
			documents: "Documents",
			reports: "Reports",
		};

		const pageTitle = document.getElementById("pageTitle");
		const documentTitle = document.title;

		if (pageTitle) {
			pageTitle.textContent = titleMap[viewName] || "Dashboard";
		}

		document.title = `${titleMap[viewName] || "Dashboard"} - Phoenix HR`;
	}

	toggleSidebar() {
		const sidebar = document.getElementById("sidebar");
		const mainContent = document.getElementById("mainContent");

		if (this.sidebarCollapsed) {
			this.expandSidebar();
		} else {
			this.collapseSidebar();
		}
	}

	collapseSidebar() {
		const sidebar = document.getElementById("sidebar");
		const body = document.body;

		sidebar.classList.add("collapsed");
		body.classList.add("sidebar-collapsed");
		this.sidebarCollapsed = true;
	}

	expandSidebar() {
		const sidebar = document.getElementById("sidebar");
		const body = document.body;

		sidebar.classList.remove("collapsed");
		body.classList.remove("sidebar-collapsed");
		this.sidebarCollapsed = false;
	}

	handleInitialRoute() {
		// Check URL hash for initial route
		const hash = window.location.hash.slice(1); // Remove #
		const validViews = [
			"dashboard",
			"projects",
			"tasks",
			"people",
			"calendar",
			"documents",
			"reports",
		];

		if (hash && validViews.includes(hash)) {
			this.showView(hash, false);
		} else {
			// Default to dashboard
			this.showView("dashboard", false);
		}
	}

	handleViewToggle(toggleButton) {
		// Handle view type toggles (like list/board for tasks)
		const parentContainer = toggleButton.closest(".view-controls");
		if (parentContainer) {
			const toggles = parentContainer.querySelectorAll(".view-toggle");
			toggles.forEach((toggle) => toggle.classList.remove("active"));
			toggleButton.classList.add("active");

			// You can add view-specific logic here
			const viewType = toggleButton.dataset.viewType;
			console.log(`Switched to ${viewType} view`);
		}
	}

	handleResize() {
		// Auto-collapse sidebar on small screens
		if (window.innerWidth <= 768 && !this.sidebarCollapsed) {
			this.collapseSidebar();
		} else if (window.innerWidth > 768 && this.sidebarCollapsed) {
			this.expandSidebar();
		}
	}

	// Utility methods for future features
	showNotification(message, type = "info") {
		// Create notification system
		const notification = document.createElement("div");
		notification.className = `notification notification-${type}`;
		notification.textContent = message;

		// Add to page
		document.body.appendChild(notification);

		// Animate in
		setTimeout(() => notification.classList.add("show"), 100);

		// Remove after delay
		setTimeout(() => {
			notification.classList.remove("show");
			setTimeout(() => notification.remove(), 300);
		}, 3000);
	}

	openModal(modalId) {
		// Modal management
		console.log(`Opening modal: ${modalId}`);
	}
}

// Initialize app when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
	console.log("DOM Content Loaded - starting app initialization");
	window.phoenixApp = new PhoenixHRApp();
});

// Remove export for non-module usage
// export default PhoenixHRApp;
