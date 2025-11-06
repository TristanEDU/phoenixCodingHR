// Admin UI Manager
// Handles all administrative interface functionality with top-level security

export class AdminUIManager {
	constructor(authSystem, userManager, permissionsManager, hierarchyManager) {
		this.authSystem = authSystem;
		this.userManager = userManager;
		this.permissionsManager = permissionsManager;
		this.hierarchyManager = hierarchyManager;

		this.currentView = null;
		this.selectedUsers = new Set();
		this.searchFilters = {
			query: "",
			role: "",
			department: "",
			status: "active",
		};

		this.init();
	}

	init() {
		console.log("AdminUIManager initializing...");

		// Verify admin access
		if (!this.hasAdminAccess()) {
			console.warn("User does not have admin access");
			return;
		}

		this.bindAdminEvents();
		this.initializeAdminViews();

		console.log("AdminUIManager initialized successfully!");
	}

	hasAdminAccess() {
		return (
			this.permissionsManager.hasPermission("admin") ||
			(this.permissionsManager.hasPermission("hr") &&
				this.authSystem.getCurrentUser()?.role === "SpongeLord")
		);
	}

	bindAdminEvents() {
		// User Management Events
		this.bindUserManagementEvents();

		// Role Management Events
		this.bindRoleManagementEvents();

		// Audit Events
		this.bindAuditEvents();

		// Hierarchy Management Events
		this.bindHierarchyEvents();
	}

	bindUserManagementEvents() {
		// Add User Button
		const addUserBtn = document.getElementById("addUserBtn");
		if (addUserBtn) {
			addUserBtn.addEventListener("click", () => this.showAddUserModal());
		}

		// Search and Filter
		const searchInput = document.querySelector(".users-view .search-input");
		if (searchInput) {
			searchInput.addEventListener("input", (e) => {
				this.searchFilters.query = e.target.value;
				this.filterAndRenderUsers();
			});
		}

		const roleFilter = document.querySelector(".users-view .role-filter");
		if (roleFilter) {
			roleFilter.addEventListener("change", (e) => {
				this.searchFilters.role = e.target.value;
				this.filterAndRenderUsers();
			});
		}

		// Bulk Actions
		const bulkActionsBtn = document.getElementById("bulkActionsBtn");
		if (bulkActionsBtn) {
			bulkActionsBtn.addEventListener("click", () =>
				this.showBulkActionsMenu()
			);
		}
	}

	bindRoleManagementEvents() {
		const addRoleBtn = document.getElementById("addRoleBtn");
		if (addRoleBtn) {
			addRoleBtn.addEventListener("click", () => this.showAddRoleModal());
		}
	}

	bindAuditEvents() {
		const exportAuditBtn = document.getElementById("exportAuditBtn");
		if (exportAuditBtn) {
			exportAuditBtn.addEventListener("click", () => this.exportAuditLog());
		}

		const auditFilterDate = document.getElementById("auditFilterDate");
		if (auditFilterDate) {
			auditFilterDate.addEventListener("change", () => this.filterAuditLog());
		}
	}

	bindHierarchyEvents() {
		const orgChartBtn = document.getElementById("orgChartBtn");
		if (orgChartBtn) {
			orgChartBtn.addEventListener("click", () => this.showOrganizationChart());
		}

		const validateHierarchyBtn = document.getElementById(
			"validateHierarchyBtn"
		);
		if (validateHierarchyBtn) {
			validateHierarchyBtn.addEventListener("click", () =>
				this.validateHierarchy()
			);
		}
	}

	initializeAdminViews() {
		// Initialize each admin view with enhanced content
		this.enhanceUsersView();
		this.enhanceRolesView();
		this.enhanceAuditView();
		this.addHierarchyView();
		this.addSystemSettingsView();
	}

	// Enhanced Users View
	enhanceUsersView() {
		const usersView = document.getElementById("users-view");
		if (!usersView) return;

		// Add enhanced header controls
		const controlsPlaceholder = usersView.querySelector(
			".admin-controls-placeholder"
		);
		if (controlsPlaceholder) {
			this.updateUsersViewHeader(controlsPlaceholder);
		}

		// Render users table with new functionality
		this.renderUsersTable();
	}

	updateUsersViewHeader(container) {
		// Add enhanced controls
		const enhancedControls = `
			<div class="admin-search-bar">
				<input type="search" placeholder="Search users by name, email, or ID..." class="search-input" id="userSearchInput">
				<select class="filter-select" id="roleFilter">
					<option value="">All Roles</option>
					<option value="SpongeLord">SpongeLord</option>
					<option value="HR Manager">HR Manager</option>
					<option value="HR Specialist">HR Specialist</option>
					<option value="Department Manager">Department Manager</option>
				</select>
				<select class="filter-select" id="departmentFilter">
					<option value="">All Departments</option>
					<option value="Executive">Executive</option>
					<option value="Human Resources">Human Resources</option>
					<option value="Operations">Operations</option>
				</select>
				<select class="filter-select" id="statusFilter">
					<option value="">All Status</option>
					<option value="active">Active</option>
					<option value="inactive">Inactive</option>
					<option value="on_leave">On Leave</option>
				</select>
			</div>
			<div class="admin-action-bar">
				<button class="btn btn-secondary" id="bulkActionsBtn" style="display: none;">Bulk Actions (0)</button>
				<button class="btn btn-secondary" id="exportUsersBtn">📊 Export</button>
				<button class="btn btn-secondary" id="orgChartBtn">🏢 Org Chart</button>
				<button class="btn btn-primary" id="addUserBtn">+ Add User</button>
			</div>
		`;

		container.innerHTML = enhancedControls;
		this.bindUserFilterEvents();
	}

	bindUserFilterEvents() {
		const filters = [
			"userSearchInput",
			"roleFilter",
			"departmentFilter",
			"statusFilter",
		];

		filters.forEach((filterId) => {
			const element = document.getElementById(filterId);
			if (element) {
				element.addEventListener("input", () => this.updateUserFilters());
				element.addEventListener("change", () => this.updateUserFilters());
			}
		});
	}

	updateUserFilters() {
		this.searchFilters = {
			query: document.getElementById("userSearchInput")?.value || "",
			role: document.getElementById("roleFilter")?.value || "",
			department: document.getElementById("departmentFilter")?.value || "",
			status: document.getElementById("statusFilter")?.value || "",
		};

		this.filterAndRenderUsers();
	}

	renderUsersTable() {
		const tableContainer = document.querySelector(".users-table-container");
		if (!tableContainer) return;

		const users = this.getFilteredUsers();

		const tableHTML = `
			<div class="admin-table-wrapper">
				<table class="admin-users-table">
					<thead>
						<tr>
							<th><input type="checkbox" id="selectAllUsers"></th>
							<th>Employee</th>
							<th>Role & Position</th>
							<th>Department</th>
							<th>Manager</th>
							<th>Reports</th>
							<th>Status</th>
							<th>Last Login</th>
							<th>Actions</th>
						</tr>
					</thead>
					<tbody>
						${users.map((user) => this.createUserRow(user)).join("")}
					</tbody>
				</table>
			</div>
			<div class="table-pagination">
				<div class="pagination-info">
					Showing ${users.length} of ${this.authSystem.authorizedUsers.length} users
				</div>
				<div class="pagination-controls">
					<button class="btn btn-small" id="prevPage">Previous</button>
					<span class="page-info">Page 1 of 1</span>
					<button class="btn btn-small" id="nextPage">Next</button>
				</div>
			</div>
		`;

		tableContainer.innerHTML = tableHTML;
		this.bindUserTableEvents();
	}

	createUserRow(user) {
		const manager = this.authSystem.getManager(user.id);
		const directReports = this.authSystem.getDirectReports(user.id);
		const lastLogin = user.lastLogin
			? this.formatDate(user.lastLogin)
			: "Never";

		return `
			<tr class="admin-user-row" data-user-id="${user.id}">
				<td><input type="checkbox" class="user-checkbox" value="${user.id}"></td>
				<td class="user-info-cell">
					<div class="user-avatar-wrapper">
						<div class="user-avatar">${this.getUserAvatar(user)}</div>
						<div class="user-status-indicator ${user.status}"></div>
					</div>
					<div class="user-details">
						<div class="user-name">${user.name}</div>
						<div class="user-id">ID: ${user.id}</div>
						<div class="user-email">${user.email}</div>
						<div class="user-phone">${user.phone || "N/A"}</div>
					</div>
				</td>
				<td class="role-cell">
					<div class="role-badge ${user.role.toLowerCase().replace(" ", "-")}">${
			user.role
		}</div>
					<div class="position-text">${user.position}</div>
					<div class="permissions-preview">
						${user.permissions
							.slice(0, 2)
							.map((p) => `<span class="permission-tag">${p}</span>`)
							.join("")}
						${
							user.permissions.length > 2
								? `<span class="permission-more">+${
										user.permissions.length - 2
								  }</span>`
								: ""
						}
					</div>
				</td>
				<td class="department-cell">
					<div class="department-name">${user.department}</div>
					<div class="location-text">${user.location}</div>
				</td>
				<td class="manager-cell">
					${
						manager
							? `
						<div class="manager-info">
							<div class="manager-name">${manager.name}</div>
							<div class="manager-role">${manager.role}</div>
						</div>
					`
							: '<span class="no-manager">No Manager</span>'
					}
				</td>
				<td class="reports-cell">
					<div class="reports-count">${directReports.length} Direct</div>
					<div class="subordinates-count">${
						this.authSystem.getAllSubordinates(user.id).length
					} Total</div>
				</td>
				<td class="status-cell">
					<span class="status-badge ${user.status}">${this.formatStatus(
			user.status
		)}</span>
					<div class="start-date">Since ${this.formatDate(user.startDate)}</div>
				</td>
				<td class="login-cell">
					<div class="last-login">${lastLogin}</div>
				</td>
				<td class="actions-cell">
					<div class="action-buttons">
						<button class="action-btn" onclick="adminUI.editUser('${
							user.id
						}')" title="Edit User">
							✏️
						</button>
						<button class="action-btn" onclick="adminUI.viewUserHierarchy('${
							user.id
						}')" title="View Hierarchy">
							🏢
						</button>
						<button class="action-btn" onclick="adminUI.resetUserPassword('${
							user.id
						}')" title="Reset Password">
							🔑
						</button>
						<button class="action-btn ${user.status === "active" ? "danger" : "success"}" 
								onclick="adminUI.toggleUserStatus('${user.id}')" 
								title="${user.status === "active" ? "Deactivate" : "Activate"} User">
							${user.status === "active" ? "⏸️" : "▶️"}
						</button>
						<button class="action-btn danger" onclick="adminUI.deleteUser('${
							user.id
						}')" title="Delete User">
							🗑️
						</button>
					</div>
				</td>
			</tr>
		`;
	}

	bindUserTableEvents() {
		// Select all checkbox
		const selectAllCheckbox = document.getElementById("selectAllUsers");
		if (selectAllCheckbox) {
			selectAllCheckbox.addEventListener("change", (e) => {
				const userCheckboxes = document.querySelectorAll(".user-checkbox");
				userCheckboxes.forEach((checkbox) => {
					checkbox.checked = e.target.checked;
					if (e.target.checked) {
						this.selectedUsers.add(checkbox.value);
					} else {
						this.selectedUsers.delete(checkbox.value);
					}
				});
				this.updateBulkActionsVisibility();
			});
		}

		// Individual user checkboxes
		const userCheckboxes = document.querySelectorAll(".user-checkbox");
		userCheckboxes.forEach((checkbox) => {
			checkbox.addEventListener("change", (e) => {
				if (e.target.checked) {
					this.selectedUsers.add(e.target.value);
				} else {
					this.selectedUsers.delete(e.target.value);
				}
				this.updateBulkActionsVisibility();
			});
		});
	}

	getFilteredUsers() {
		let users = [...this.authSystem.authorizedUsers];

		// Apply filters
		if (this.searchFilters.query) {
			const query = this.searchFilters.query.toLowerCase();
			users = users.filter(
				(user) =>
					user.name.toLowerCase().includes(query) ||
					user.email.toLowerCase().includes(query) ||
					user.id.toLowerCase().includes(query) ||
					user.department.toLowerCase().includes(query) ||
					user.position.toLowerCase().includes(query)
			);
		}

		if (this.searchFilters.role) {
			users = users.filter((user) => user.role === this.searchFilters.role);
		}

		if (this.searchFilters.department) {
			users = users.filter(
				(user) => user.department === this.searchFilters.department
			);
		}

		if (this.searchFilters.status) {
			users = users.filter((user) => user.status === this.searchFilters.status);
		}

		return users;
	}

	filterAndRenderUsers() {
		this.renderUsersTable();
	}

	// User Management Actions
	editUser(userId) {
		const user = this.userManager.getUserById(userId);
		if (!user) return;

		this.showEditUserModal(user);
	}

	showEditUserModal(user) {
		const modalHTML = `
			<div class="modal-overlay" id="editUserModal">
				<div class="modal admin-modal">
					<div class="modal-header">
						<h3>Edit User: ${user.name}</h3>
						<button class="modal-close" onclick="adminUI.closeModal('editUserModal')">&times;</button>
					</div>
					<div class="modal-body">
						<form id="editUserForm" class="admin-form">
							<div class="form-grid">
								<div class="form-group">
									<label for="editFirstName">First Name</label>
									<input type="text" id="editFirstName" value="${user.firstName}" required>
								</div>
								<div class="form-group">
									<label for="editLastName">Last Name</label>
									<input type="text" id="editLastName" value="${user.lastName}" required>
								</div>
								<div class="form-group">
									<label for="editEmail">Email</label>
									<input type="email" id="editEmail" value="${user.email}" required>
								</div>
								<div class="form-group">
									<label for="editPhone">Phone</label>
									<input type="tel" id="editPhone" value="${user.phone || ""}">
								</div>
								<div class="form-group">
									<label for="editRole">Role</label>
									<select id="editRole" required>
										<option value="SpongeLord" ${
											user.role === "SpongeLord" ? "selected" : ""
										}>SpongeLord</option>
										<option value="HR Manager" ${
											user.role === "HR Manager" ? "selected" : ""
										}>HR Manager</option>
										<option value="HR Specialist" ${
											user.role === "HR Specialist" ? "selected" : ""
										}>HR Specialist</option>
										<option value="Department Manager" ${
											user.role === "Department Manager" ? "selected" : ""
										}>Department Manager</option>
									</select>
								</div>
								<div class="form-group">
									<label for="editPosition">Position</label>
									<input type="text" id="editPosition" value="${user.position}" required>
								</div>
								<div class="form-group">
									<label for="editDepartment">Department</label>
									<select id="editDepartment" required>
										<option value="Executive" ${
											user.department === "Executive" ? "selected" : ""
										}>Executive</option>
										<option value="Human Resources" ${
											user.department === "Human Resources" ? "selected" : ""
										}>Human Resources</option>
										<option value="Operations" ${
											user.department === "Operations" ? "selected" : ""
										}>Operations</option>
									</select>
								</div>
								<div class="form-group">
									<label for="editLocation">Location</label>
									<input type="text" id="editLocation" value="${user.location}" required>
								</div>
								<div class="form-group">
									<label for="editManager">Manager</label>
									<select id="editManager">
										<option value="">No Manager</option>
										${this.authSystem.authorizedUsers
											.filter((u) => u.id !== user.id)
											.map(
												(u) =>
													`<option value="${u.id}" ${
														user.managerId === u.id ? "selected" : ""
													}>${u.name} (${u.role})</option>`
											)
											.join("")}
									</select>
								</div>
								<div class="form-group">
									<label for="editStatus">Status</label>
									<select id="editStatus" required>
										<option value="active" ${
											user.status === "active" ? "selected" : ""
										}>Active</option>
										<option value="inactive" ${
											user.status === "inactive" ? "selected" : ""
										}>Inactive</option>
										<option value="on_leave" ${
											user.status === "on_leave" ? "selected" : ""
										}>On Leave</option>
									</select>
								</div>
							</div>
							
							<div class="permissions-section">
								<h4>Permissions</h4>
								<div class="permission-checkboxes">
									${Object.keys(this.permissionsManager.permissionDefinitions)
										.map(
											(permission) => `
										<label class="permission-checkbox">
											<input type="checkbox" value="${permission}" 
												   ${user.permissions.includes(permission) ? "checked" : ""}>
											<span>${this.permissionsManager.permissionDefinitions[permission].name}</span>
										</label>
									`
										)
										.join("")}
								</div>
							</div>
						</form>
					</div>
					<div class="modal-footer">
						<button type="button" class="btn btn-secondary" onclick="adminUI.closeModal('editUserModal')">Cancel</button>
						<button type="submit" form="editUserForm" class="btn btn-primary">Save Changes</button>
					</div>
				</div>
			</div>
		`;

		document.body.insertAdjacentHTML("beforeend", modalHTML);

		// Bind form submission
		document.getElementById("editUserForm").addEventListener("submit", (e) => {
			e.preventDefault();
			this.saveUserChanges(user.id);
		});
	}

	saveUserChanges(userId) {
		const form = document.getElementById("editUserForm");
		const formData = new FormData(form);

		const updateData = {
			firstName:
				formData.get("firstName") ||
				document.getElementById("editFirstName").value,
			lastName:
				formData.get("lastName") ||
				document.getElementById("editLastName").value,
			name: `${document.getElementById("editFirstName").value} ${
				document.getElementById("editLastName").value
			}`,
			email: document.getElementById("editEmail").value,
			phone: document.getElementById("editPhone").value,
			role: document.getElementById("editRole").value,
			position: document.getElementById("editPosition").value,
			department: document.getElementById("editDepartment").value,
			location: document.getElementById("editLocation").value,
			managerId: document.getElementById("editManager").value || null,
			status: document.getElementById("editStatus").value,
		};

		// Get selected permissions
		const permissionCheckboxes = form.querySelectorAll(
			'.permission-checkboxes input[type="checkbox"]:checked'
		);
		updateData.permissions = Array.from(permissionCheckboxes).map(
			(cb) => cb.value
		);

		try {
			this.userManager.updateUser(userId, updateData);
			this.showNotification("User updated successfully", "success");
			this.closeModal("editUserModal");
			this.renderUsersTable();
		} catch (error) {
			this.showNotification(`Error updating user: ${error.message}`, "error");
		}
	}

	// Utility methods
	getUserAvatar(user) {
		const avatars = {
			SpongeLord: "👑",
			"HR Manager": "👩‍💼",
			"HR Specialist": "👨‍💼",
			"Department Manager": "📋",
		};
		return avatars[user.role] || "👤";
	}

	formatStatus(status) {
		const statusMap = {
			active: "Active",
			inactive: "Inactive",
			on_leave: "On Leave",
		};
		return statusMap[status] || status;
	}

	formatDate(dateString) {
		if (!dateString) return "N/A";
		const date = new Date(dateString);
		return date.toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
	}

	closeModal(modalId) {
		const modal = document.getElementById(modalId);
		if (modal) {
			modal.remove();
		}
	}

	showNotification(message, type = "info") {
		// Use the existing notification system from the main app
		if (window.studyHallApp && window.studyHallApp.showNotification) {
			window.studyHallApp.showNotification(message, type);
		} else {
			console.log(`${type.toUpperCase()}: ${message}`);
		}
	}

	updateBulkActionsVisibility() {
		const bulkActionsBtn = document.getElementById("bulkActionsBtn");
		if (bulkActionsBtn) {
			bulkActionsBtn.style.display =
				this.selectedUsers.size > 0 ? "block" : "none";
			bulkActionsBtn.textContent = `Bulk Actions (${this.selectedUsers.size})`;
		}
	}

	// Bulk operations
	showBulkActionsMenu() {
		const selectedUsers = Array.from(this.selectedUsers);
		if (selectedUsers.length === 0) {
			this.showNotification("No users selected", "error");
			return;
		}

		const menu = `
			<div class="bulk-actions-menu">
				<h4>Bulk Actions (${selectedUsers.length} users)</h4>
				<button class="btn btn-secondary" onclick="adminUIManager.bulkChangeRole()">Change Role</button>
				<button class="btn btn-secondary" onclick="adminUIManager.bulkChangeDepartment()">Change Department</button>
				<button class="btn btn-secondary" onclick="adminUIManager.bulkChangeStatus()">Change Status</button>
				<button class="btn btn-danger" onclick="adminUIManager.bulkDeactivateUsers()">Deactivate</button>
			</div>
		`;

		this.showCustomModal("Bulk Actions", menu);
	}

	getSelectedUsers() {
		return Array.from(this.selectedUsers);
	}

	bulkChangeRole() {
		const selectedUsers = this.getSelectedUsers();
		const newRole = prompt("Enter new role for selected users:");
		if (!newRole) return;

		selectedUsers.forEach((userId) => {
			this.userManager.updateUser(userId, { role: newRole });
		});

		this.renderUsersTable();
		this.closeModal();
		this.showNotification(
			`Updated role for ${selectedUsers.length} users`,
			"success"
		);
	}

	bulkChangeDepartment() {
		const selectedUsers = this.getSelectedUsers();
		const newDepartment = prompt("Enter new department for selected users:");
		if (!newDepartment) return;

		selectedUsers.forEach((userId) => {
			this.userManager.updateUser(userId, { department: newDepartment });
		});

		this.renderUsersTable();
		this.closeModal();
		this.showNotification(
			`Updated department for ${selectedUsers.length} users`,
			"success"
		);
	}

	bulkChangeStatus() {
		const selectedUsers = this.getSelectedUsers();
		const newStatus = prompt("Enter new status (active/inactive/on_leave):");
		if (!newStatus || !["active", "inactive", "on_leave"].includes(newStatus))
			return;

		selectedUsers.forEach((userId) => {
			this.userManager.updateUser(userId, { status: newStatus });
		});

		this.renderUsersTable();
		this.closeModal();
		this.showNotification(
			`Updated status for ${selectedUsers.length} users`,
			"success"
		);
	}

	bulkDeactivateUsers() {
		const selectedUsers = this.getSelectedUsers();
		if (
			!confirm(
				`Are you sure you want to deactivate ${selectedUsers.length} users?`
			)
		)
			return;

		selectedUsers.forEach((userId) => {
			this.userManager.updateUser(userId, { status: "inactive" });
		});

		this.renderUsersTable();
		this.closeModal();
		this.showNotification(
			`Deactivated ${selectedUsers.length} users`,
			"success"
		);
	}

	// User creation modal
	showAddUserModal() {
		const managers = this.userManager
			.getUsers()
			.filter((user) =>
				["SpongeLord", "HR Manager", "Department Manager"].includes(user.role)
			);

		const form = `
			<form id="addUserForm" class="user-form">
				<div class="form-grid">
					<div class="form-group">
						<label for="newUserEmail">Email *</label>
						<input type="email" id="newUserEmail" required>
					</div>
					<div class="form-group">
						<label for="newUserName">Full Name *</label>
						<input type="text" id="newUserName" required>
					</div>
					<div class="form-group">
						<label for="newUserEmployeeId">Employee ID *</label>
						<input type="text" id="newUserEmployeeId" required>
					</div>
					<div class="form-group">
						<label for="newUserRole">Role *</label>
						<select id="newUserRole" required>
							<option value="">Select Role</option>
							<option value="SpongeLord">SpongeLord</option>
							<option value="HR Manager">HR Manager</option>
							<option value="HR Specialist">HR Specialist</option>
							<option value="Department Manager">Department Manager</option>
						</select>
					</div>
					<div class="form-group">
						<label for="newUserDepartment">Department *</label>
						<select id="newUserDepartment" required>
							<option value="">Select Department</option>
							<option value="Executive">Executive</option>
							<option value="Human Resources">Human Resources</option>
							<option value="Operations">Operations</option>
						</select>
					</div>
					<div class="form-group">
						<label for="newUserManager">Manager</label>
						<select id="newUserManager">
							<option value="">No Manager</option>
							${managers
								.map(
									(user) =>
										`<option value="${user.id}">${user.name} (${user.role})</option>`
								)
								.join("")}
						</select>
					</div>
					<div class="form-group">
						<label for="newUserPhone">Phone</label>
						<input type="tel" id="newUserPhone">
					</div>
					<div class="form-group">
						<label for="newUserLocation">Location</label>
						<input type="text" id="newUserLocation">
					</div>
				</div>
				<div class="form-actions">
					<button type="button" class="btn btn-secondary" onclick="adminUIManager.closeModal()">Cancel</button>
					<button type="submit" class="btn btn-primary">Create User</button>
				</div>
			</form>
		`;

		this.showCustomModal("Add New User", form);

		// Bind form submission
		document.getElementById("addUserForm").addEventListener("submit", (e) => {
			e.preventDefault();
			this.handleAddUser();
		});
	}

	handleAddUser() {
		const formData = {
			email: document.getElementById("newUserEmail").value,
			name: document.getElementById("newUserName").value,
			employeeId: document.getElementById("newUserEmployeeId").value,
			role: document.getElementById("newUserRole").value,
			department: document.getElementById("newUserDepartment").value,
			manager: document.getElementById("newUserManager").value || null,
			phone: document.getElementById("newUserPhone").value || "",
			location: document.getElementById("newUserLocation").value || "",
		};

		try {
			this.userManager.createUser(formData);
			this.renderUsersTable();
			this.closeModal();
			this.showNotification("User created successfully", "success");
		} catch (error) {
			this.showNotification(`Error creating user: ${error.message}`, "error");
		}
	}

	// Export functionality
	exportUsers() {
		const users = this.userManager.getUsers();
		const csvContent = this.convertToCSV(users);
		this.downloadCSV(csvContent, "study-hall-users.csv");
	}

	convertToCSV(users) {
		const headers = [
			"Name",
			"Email",
			"Employee ID",
			"Role",
			"Department",
			"Status",
			"Manager",
			"Phone",
			"Location",
		];
		const rows = users.map((user) => {
			const manager = user.manager
				? this.userManager.getUserById(user.manager)
				: null;
			return [
				user.name,
				user.email,
				user.employeeId,
				user.role,
				user.department,
				user.status,
				manager ? manager.name : "",
				user.phone || "",
				user.location || "",
			];
		});

		return [headers, ...rows]
			.map((row) => row.map((field) => `"${field}"`).join(","))
			.join("\n");
	}

	downloadCSV(content, filename) {
		const blob = new Blob([content], { type: "text/csv" });
		const url = window.URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = filename;
		a.click();
		window.URL.revokeObjectURL(url);
	}

	// Organization chart
	showOrgChart() {
		const orgData = this.hierarchyManager.generateOrgChart();
		const chartHTML = this.renderOrgChart(orgData);
		this.showCustomModal("Organization Chart", chartHTML, "org-chart-modal");
	}

	renderOrgChart(orgData) {
		// Simple hierarchical display
		return `
			<div class="org-chart">
				<div class="org-chart-controls">
					<button class="btn btn-secondary" onclick="adminUIManager.exportOrgChart()">Export Chart</button>
				</div>
				<div class="org-chart-tree">
					${this.renderOrgNode(orgData)}
				</div>
			</div>
		`;
	}

	renderOrgNode(node) {
		const hasChildren = node.children && node.children.length > 0;
		return `
			<div class="org-node">
				<div class="org-card">
					<div class="org-card-name">${node.name}</div>
					<div class="org-card-role">${node.role}</div>
					<div class="org-card-department">${node.department}</div>
				</div>
				${
					hasChildren
						? `
					<div class="org-children">
						${node.children.map((child) => this.renderOrgNode(child)).join("")}
					</div>
				`
						: ""
				}
			</div>
		`;
	}

	// Missing methods required by initializeAdminViews()
	enhanceRolesView() {
		console.log("Enhancing roles view...");
		const rolesContainer = document.querySelector(
			"#roles-view .admin-content-placeholder"
		);
		if (rolesContainer) {
			rolesContainer.innerHTML = `
				<div class="admin-section">
					<h3>Role Management</h3>
					<div class="admin-controls">
						<button class="btn btn-primary" id="addRoleBtn">+ Add Role</button>
						<button class="btn btn-secondary" id="exportRolesBtn">📊 Export Roles</button>
					</div>
					<div class="roles-grid">
						<p>Role management interface coming soon...</p>
					</div>
				</div>
			`;
		}
	}

	enhanceAuditView() {
		console.log("Enhancing audit view...");
		const auditContainer = document.querySelector(
			"#audit-view .admin-content-placeholder"
		);
		if (auditContainer) {
			auditContainer.innerHTML = `
				<div class="admin-section">
					<h3>Audit & Compliance</h3>
					<div class="admin-controls">
						<button class="btn btn-secondary" id="exportAuditBtn">📊 Export Audit Log</button>
						<input type="date" id="auditFilterDate" class="form-control" style="width: auto;">
					</div>
					<div class="audit-grid">
						<p>Audit log interface coming soon...</p>
					</div>
				</div>
			`;
		}
	}

	addHierarchyView() {
		console.log("Adding hierarchy view...");
		const hierarchyContainer = document.querySelector("#hierarchy-view");
		if (!hierarchyContainer) {
			console.log("Hierarchy view container not found, skipping...");
			return;
		}

		const hierarchyContent = hierarchyContainer.querySelector(
			".admin-content-placeholder"
		);
		if (hierarchyContent) {
			hierarchyContent.innerHTML = `
				<div class="admin-section">
					<h3>Organizational Hierarchy</h3>
					<div class="admin-controls">
						<button class="btn btn-primary" id="orgChartBtn">🏢 View Org Chart</button>
						<button class="btn btn-secondary" id="validateHierarchyBtn">✓ Validate Hierarchy</button>
					</div>
					<div class="hierarchy-visualization">
						<p>Hierarchy visualization coming soon...</p>
					</div>
				</div>
			`;
		}
	}

	addSystemSettingsView() {
		console.log("Adding system settings view...");
		const settingsContainer = document.querySelector("#settings-view");
		if (!settingsContainer) {
			console.log("Settings view container not found, skipping...");
			return;
		}

		const settingsContent = settingsContainer.querySelector(
			".admin-content-placeholder"
		);
		if (settingsContent) {
			settingsContent.innerHTML = `
				<div class="admin-section">
					<h3>System Settings</h3>
					<div class="settings-grid">
						<div class="setting-item">
							<label>Company Name</label>
							<input type="text" class="form-control" value="The Study Hall" />
						</div>
						<div class="setting-item">
							<label>Time Zone</label>
							<select class="form-control">
								<option>UTC-5 (Eastern)</option>
								<option>UTC-8 (Pacific)</option>
							</select>
						</div>
						<div class="setting-item">
							<button class="btn btn-primary">Save Settings</button>
						</div>
					</div>
				</div>
			`;
		}
	}

	exportOrgChart() {
		const orgData = this.hierarchyManager.generateOrgChart();
		const jsonContent = JSON.stringify(orgData, null, 2);
		const blob = new Blob([jsonContent], { type: "application/json" });
		const url = window.URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "organization-chart.json";
		a.click();
		window.URL.revokeObjectURL(url);
	}
}
