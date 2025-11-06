/**
 * Advanced Task UI Manager for Study Hall HR Application
 * Handles all task-related UI components and interactions
 */

export class TaskUIManager {
	constructor(taskManager, authSystem, userManager) {
		this.taskManager = taskManager;
		this.authSystem = authSystem;
		this.userManager = userManager;

		// View settings
		this.currentView = "kanban"; // 'kanban', 'list', 'calendar', 'gantt'
		this.currentFilters = {};
		this.sortBy = "dueDate";
		this.sortOrder = "asc";

		this.init();
	}

	init() {
		this.bindEvents();
		this.setupKeyboardShortcuts();
		console.log("TaskUIManager initialized");
	}

	bindEvents() {
		// Listen for task updates
		window.addEventListener("tasksUpdated", (event) => {
			this.refreshCurrentView();
		});

		// Keyboard shortcuts
		document.addEventListener("keydown", (e) => {
			if (e.ctrlKey || e.metaKey) {
				switch (e.key) {
					case "n":
						e.preventDefault();
						this.showTaskModal();
						break;
					case "f":
						e.preventDefault();
						this.focusSearchInput();
						break;
				}
			}
		});
	}

	setupKeyboardShortcuts() {
		// Add keyboard shortcut hints to the UI
		const shortcuts = [
			{ key: "Ctrl+N", action: "Create New Task" },
			{ key: "Ctrl+F", action: "Search Tasks" },
			{ key: "Escape", action: "Close Modal" },
		];

		// Could display these in a help modal or tooltip
		this.keyboardShortcuts = shortcuts;
	}

	// ========================
	// MAIN TASK VIEW RENDERING
	// ========================

	renderTasksView() {
		const container = document.getElementById("tasks-view");
		if (!container) return;

		container.innerHTML = `
			<div class="tasks-container">
				${this.renderTaskHeader()}
				${this.renderTaskFilters()}
				${this.renderTaskContent()}
			</div>
		`;

		this.bindTaskViewEvents();
		this.loadTaskView();
	}

	renderTaskHeader() {
		return `
			<div class="task-header">
				<div class="task-header-left">
					<h2>Task Management</h2>
					<div class="task-stats">
						${this.renderTaskStats()}
					</div>
				</div>
				<div class="task-header-right">
					<div class="view-toggle">
						<button class="view-btn ${this.currentView === "kanban" ? "active" : ""}" 
								data-view="kanban" title="Kanban Board">
							📋
						</button>
						<button class="view-btn ${this.currentView === "list" ? "active" : ""}" 
								data-view="list" title="List View">
							📄
						</button>
						<button class="view-btn ${this.currentView === "calendar" ? "active" : ""}" 
								data-view="calendar" title="Calendar View">
							📅
						</button>
						<button class="view-btn ${this.currentView === "gantt" ? "active" : ""}" 
								data-view="gantt" title="Gantt Chart">
							📊
						</button>
					</div>
					<button class="btn btn-primary" onclick="taskUIManager.showTaskModal()">
						<span class="icon">➕</span> New Task
					</button>
				</div>
			</div>
		`;
	}

	renderTaskStats() {
		const tasks = this.taskManager.tasks;
		const stats = {
			total: tasks.length,
			pending: tasks.filter((t) => t.status === "pending").length,
			inProgress: tasks.filter((t) => t.status === "in-progress").length,
			completed: tasks.filter((t) => t.status === "completed").length,
			overdue: this.taskManager.getOverdueTasks().length,
		};

		return `
			<div class="stats-grid">
				<div class="stat-card">
					<span class="stat-number">${stats.total}</span>
					<span class="stat-label">Total</span>
				</div>
				<div class="stat-card">
					<span class="stat-number">${stats.pending}</span>
					<span class="stat-label">Pending</span>
				</div>
				<div class="stat-card">
					<span class="stat-number">${stats.inProgress}</span>
					<span class="stat-label">In Progress</span>
				</div>
				<div class="stat-card">
					<span class="stat-number">${stats.completed}</span>
					<span class="stat-label">Completed</span>
				</div>
				<div class="stat-card ${stats.overdue > 0 ? "overdue" : ""}">
					<span class="stat-number">${stats.overdue}</span>
					<span class="stat-label">Overdue</span>
				</div>
			</div>
		`;
	}

	renderTaskFilters() {
		const users = this.userManager?.getAllUsers() || [];
		const departments = [
			...new Set(users.map((u) => u.department).filter(Boolean)),
		];
		const categories = [
			...new Set(this.taskManager.tasks.map((t) => t.category).filter(Boolean)),
		];

		return `
			<div class="task-filters">
				<div class="filter-group">
					<input type="text" 
						   id="taskSearch" 
						   placeholder="Search tasks..." 
						   value="${this.currentFilters.search || ""}"
						   class="search-input">
				</div>
				
				<div class="filter-group">
					<select id="statusFilter" class="filter-select">
						<option value="">All Statuses</option>
						<option value="pending" ${
							this.currentFilters.status === "pending" ? "selected" : ""
						}>Pending</option>
						<option value="in-progress" ${
							this.currentFilters.status === "in-progress" ? "selected" : ""
						}>In Progress</option>
						<option value="on-hold" ${
							this.currentFilters.status === "on-hold" ? "selected" : ""
						}>On Hold</option>
						<option value="completed" ${
							this.currentFilters.status === "completed" ? "selected" : ""
						}>Completed</option>
						<option value="overdue" ${
							this.currentFilters.status === "overdue" ? "selected" : ""
						}>Overdue</option>
					</select>
				</div>

				<div class="filter-group">
					<select id="priorityFilter" class="filter-select">
						<option value="">All Priorities</option>
						<option value="LOW" ${
							this.currentFilters.priority === "LOW" ? "selected" : ""
						}>Low</option>
						<option value="MEDIUM" ${
							this.currentFilters.priority === "MEDIUM" ? "selected" : ""
						}>Medium</option>
						<option value="HIGH" ${
							this.currentFilters.priority === "HIGH" ? "selected" : ""
						}>High</option>
						<option value="CRITICAL" ${
							this.currentFilters.priority === "CRITICAL" ? "selected" : ""
						}>Critical</option>
					</select>
				</div>

				<div class="filter-group">
					<select id="assigneeFilter" class="filter-select">
						<option value="">All Assignees</option>
						<option value="me">Assigned to Me</option>
						${users
							.map(
								(user) =>
									`<option value="${user.email}" ${
										this.currentFilters.assignedTo === user.email
											? "selected"
											: ""
									}>
								${user.name}
							</option>`
							)
							.join("")}
					</select>
				</div>

				<div class="filter-group">
					<select id="departmentFilter" class="filter-select">
						<option value="">All Departments</option>
						${departments
							.map(
								(dept) =>
									`<option value="${dept}" ${
										this.currentFilters.department === dept ? "selected" : ""
									}>
								${dept}
							</option>`
							)
							.join("")}
					</select>
				</div>

				<div class="filter-group">
					<input type="date" 
						   id="dueDateFrom" 
						   placeholder="Due from..."
						   value="${this.currentFilters.dueDateFrom || ""}"
						   class="date-input">
				</div>

				<div class="filter-group">
					<input type="date" 
						   id="dueDateTo" 
						   placeholder="Due to..."
						   value="${this.currentFilters.dueDateTo || ""}"
						   class="date-input">
				</div>

				<div class="filter-actions">
					<button class="btn btn-secondary" onclick="taskUIManager.clearFilters()">
						Clear Filters
					</button>
					<button class="btn btn-secondary" onclick="taskUIManager.showBulkActions()">
						Bulk Actions
					</button>
					<button class="btn btn-secondary" onclick="taskUIManager.showExportModal()">
						Export Tasks
					</button>
				</div>
			</div>
		`;
	}

	renderTaskContent() {
		return `
			<div class="task-content" id="taskContent">
				${this.renderCurrentView()}
			</div>
		`;
	}

	renderCurrentView() {
		switch (this.currentView) {
			case "kanban":
				return this.renderKanbanView();
			case "list":
				return this.renderListView();
			case "calendar":
				return this.renderCalendarView();
			case "gantt":
				return this.renderGanttView();
			default:
				return this.renderKanbanView();
		}
	}

	// ========================
	// KANBAN VIEW
	// ========================

	renderKanbanView() {
		const columns = [
			{ id: "pending", title: "Pending", status: "pending" },
			{ id: "in-progress", title: "In Progress", status: "in-progress" },
			{ id: "on-hold", title: "On Hold", status: "on-hold" },
			{ id: "completed", title: "Completed", status: "completed" },
		];

		return `
			<div class="kanban-board">
				${columns.map((column) => this.renderKanbanColumn(column)).join("")}
			</div>
		`;
	}

	renderKanbanColumn(column) {
		const tasks = this.getFilteredTasks().filter(
			(task) => task.status === column.status
		);

		return `
			<div class="kanban-column" data-status="${column.status}">
				<div class="column-header">
					<h3>${column.title}</h3>
					<span class="task-count">${tasks.length}</span>
				</div>
				<div class="column-content" 
					 ondrop="taskUIManager.handleDrop(event)" 
					 ondragover="taskUIManager.handleDragOver(event)">
					${tasks.map((task) => this.renderKanbanCard(task)).join("")}
				</div>
			</div>
		`;
	}

	renderKanbanCard(task) {
		const priority = this.taskManager.priorities[task.priority];
		const assigneeNames = task.assignedTo
			.map((email) => {
				const user = this.userManager?.getUserByEmail(email);
				return user ? user.name : email;
			})
			.join(", ");

		const overdue =
			task.dueDate &&
			new Date(task.dueDate) < new Date() &&
			task.status !== "completed";

		return `
			<div class="kanban-card ${overdue ? "overdue" : ""}" 
				 draggable="true" 
				 data-task-id="${task.id}"
				 ondragstart="taskUIManager.handleDragStart(event)">
				
				<div class="card-header">
					<div class="priority-indicator" 
						 style="background-color: ${priority.color}"
						 title="${priority.label} Priority">
					</div>
					<div class="card-actions">
						<button class="card-action-btn" onclick="taskUIManager.showTaskModal(${
							task.id
						})" title="Edit">
							✏️
						</button>
						<button class="card-action-btn" onclick="taskUIManager.showTaskMenu(${
							task.id
						}, event)" title="More">
							⋮
						</button>
					</div>
				</div>

				<div class="card-content">
					<h4 class="task-title">${task.title}</h4>
					${
						task.description
							? `<p class="task-description">${task.description.substring(
									0,
									100
							  )}${task.description.length > 100 ? "..." : ""}</p>`
							: ""
					}
					
					${
						task.progress > 0
							? `
						<div class="progress-bar">
							<div class="progress-fill" style="width: ${task.progress}%"></div>
							<span class="progress-text">${task.progress}%</span>
						</div>
					`
							: ""
					}
				</div>

				<div class="card-footer">
					${
						task.dueDate
							? `
						<div class="due-date ${overdue ? "overdue" : ""}">
							📅 ${new Date(task.dueDate).toLocaleDateString()}
						</div>
					`
							: ""
					}
					
					${
						assigneeNames
							? `
						<div class="assignees">
							👤 ${assigneeNames}
						</div>
					`
							: ""
					}

					${
						task.dependencies.length > 0
							? `
						<div class="dependencies">
							🔗 ${task.dependencies.length} dependencies
						</div>
					`
							: ""
					}
				</div>
			</div>
		`;
	}

	// ========================
	// LIST VIEW
	// ========================

	renderListView() {
		const tasks = this.getFilteredTasks();

		return `
			<div class="task-list">
				<div class="list-header">
					<div class="list-controls">
						<select id="sortBy" onchange="taskUIManager.handleSort(this.value)">
							<option value="dueDate">Sort by Due Date</option>
							<option value="priority">Sort by Priority</option>
							<option value="createdAt">Sort by Created Date</option>
							<option value="title">Sort by Title</option>
							<option value="status">Sort by Status</option>
						</select>
						<button class="sort-order-btn" onclick="taskUIManager.toggleSortOrder()">
							${this.sortOrder === "asc" ? "↑" : "↓"}
						</button>
					</div>
				</div>

				<div class="list-content">
					${
						tasks.length === 0
							? '<div class="empty-state">No tasks match your filters</div>'
							: tasks.map((task) => this.renderListItem(task)).join("")
					}
				</div>
			</div>
		`;
	}

	renderListItem(task) {
		const priority = this.taskManager.priorities[task.priority];
		const assigneeNames = task.assignedTo
			.map((email) => {
				const user = this.userManager?.getUserByEmail(email);
				return user ? user.name : email;
			})
			.join(", ");

		const overdue =
			task.dueDate &&
			new Date(task.dueDate) < new Date() &&
			task.status !== "completed";

		return `
			<div class="list-item ${overdue ? "overdue" : ""}" data-task-id="${task.id}">
				<div class="item-checkbox">
					<input type="checkbox" 
						   onchange="taskUIManager.toggleTaskSelection(${task.id}, this.checked)">
				</div>

				<div class="item-priority">
					<div class="priority-dot" 
						 style="background-color: ${priority.color}"
						 title="${priority.label} Priority">
					</div>
				</div>

				<div class="item-content">
					<div class="item-main">
						<h4 class="item-title" onclick="taskUIManager.showTaskModal(${task.id})">
							${task.title}
						</h4>
						<div class="item-meta">
							<span class="status-badge status-${task.status}">${task.status}</span>
							${task.category ? `<span class="category-badge">${task.category}</span>` : ""}
							${
								task.department
									? `<span class="department-badge">${task.department}</span>`
									: ""
							}
						</div>
					</div>

					${
						task.description
							? `
						<p class="item-description">${task.description.substring(0, 150)}${
									task.description.length > 150 ? "..." : ""
							  }</p>
					`
							: ""
					}

					<div class="item-details">
						${assigneeNames ? `<span class="detail-item">👤 ${assigneeNames}</span>` : ""}
						${
							task.dueDate
								? `<span class="detail-item ${
										overdue ? "overdue" : ""
								  }">📅 ${new Date(task.dueDate).toLocaleDateString()}</span>`
								: ""
						}
						${
							task.estimatedHours
								? `<span class="detail-item">⏱️ ${task.estimatedHours}h estimated</span>`
								: ""
						}
						${
							task.actualHours > 0
								? `<span class="detail-item">⌚ ${task.actualHours}h logged</span>`
								: ""
						}
					</div>
				</div>

				<div class="item-progress">
					${
						task.progress > 0
							? `
						<div class="progress-circle" data-progress="${task.progress}">
							<span>${task.progress}%</span>
						</div>
					`
							: ""
					}
				</div>

				<div class="item-actions">
					<button class="action-btn" onclick="taskUIManager.showTaskModal(${
						task.id
					})" title="Edit">
						✏️
					</button>
					<button class="action-btn" onclick="taskUIManager.updateTaskProgress(${
						task.id
					})" title="Update Progress">
						📊
					</button>
					<button class="action-btn" onclick="taskUIManager.logTime(${
						task.id
					})" title="Log Time">
						⏰
					</button>
					<button class="action-btn" onclick="taskUIManager.showTaskMenu(${
						task.id
					}, event)" title="More">
						⋮
					</button>
				</div>
			</div>
		`;
	}

	// ========================
	// CALENDAR VIEW
	// ========================

	renderCalendarView() {
		const currentDate = new Date();
		const currentMonth = currentDate.getMonth();
		const currentYear = currentDate.getFullYear();

		return `
			<div class="calendar-view">
				<div class="calendar-header">
					<button class="nav-btn" onclick="taskUIManager.navigateMonth(-1)">‹</button>
					<h3 id="currentMonth">${this.getMonthName(currentMonth)} ${currentYear}</h3>
					<button class="nav-btn" onclick="taskUIManager.navigateMonth(1)">›</button>
				</div>
				<div class="calendar-grid" id="calendarGrid">
					${this.renderCalendarGrid(currentYear, currentMonth)}
				</div>
			</div>
		`;
	}

	renderCalendarGrid(year, month) {
		const firstDay = new Date(year, month, 1);
		const lastDay = new Date(year, month + 1, 0);
		const startDate = new Date(firstDay);
		startDate.setDate(startDate.getDate() - firstDay.getDay());

		const weeks = [];
		let currentWeek = [];

		for (let i = 0; i < 42; i++) {
			// 6 weeks * 7 days
			const date = new Date(startDate);
			date.setDate(startDate.getDate() + i);

			currentWeek.push(date);

			if (currentWeek.length === 7) {
				weeks.push(currentWeek);
				currentWeek = [];
			}
		}

		const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

		return `
			<div class="calendar-weekdays">
				${weekDays.map((day) => `<div class="weekday">${day}</div>`).join("")}
			</div>
			<div class="calendar-days">
				${weeks.map((week) => this.renderCalendarWeek(week, month)).join("")}
			</div>
		`;
	}

	renderCalendarWeek(week, currentMonth) {
		return week
			.map((date) => {
				const isCurrentMonth = date.getMonth() === currentMonth;
				const isToday = this.isToday(date);
				const tasksForDay = this.getTasksForDate(date);

				return `
				<div class="calendar-day ${isCurrentMonth ? "" : "other-month"} ${
					isToday ? "today" : ""
				}"
					 data-date="${date.toISOString().split("T")[0]}">
					<div class="day-number">${date.getDate()}</div>
					<div class="day-tasks">
						${tasksForDay
							.slice(0, 3)
							.map((task) => this.renderCalendarTask(task))
							.join("")}
						${
							tasksForDay.length > 3
								? `<div class="more-tasks">+${
										tasksForDay.length - 3
								  } more</div>`
								: ""
						}
					</div>
				</div>
			`;
			})
			.join("");
	}

	renderCalendarTask(task) {
		const priority = this.taskManager.priorities[task.priority];

		return `
			<div class="calendar-task" 
				 style="border-left-color: ${priority.color}"
				 onclick="taskUIManager.showTaskModal(${task.id})"
				 title="${task.title}">
				<span class="task-title">${task.title.substring(0, 20)}${
			task.title.length > 20 ? "..." : ""
		}</span>
			</div>
		`;
	}

	// ========================
	// GANTT VIEW
	// ========================

	renderGanttView() {
		const tasks = this.getFilteredTasks().filter(
			(task) => task.startDate && task.dueDate
		);

		if (tasks.length === 0) {
			return `
				<div class="empty-state">
					<p>No tasks with start and due dates to display in Gantt view.</p>
					<button class="btn btn-primary" onclick="taskUIManager.showTaskModal()">
						Create Task with Dates
					</button>
				</div>
			`;
		}

		// Calculate date range
		const startDates = tasks.map((t) => new Date(t.startDate));
		const endDates = tasks.map((t) => new Date(t.dueDate));
		const minDate = new Date(Math.min(...startDates));
		const maxDate = new Date(Math.max(...endDates));

		return `
			<div class="gantt-view">
				<div class="gantt-header">
					<h3>Project Timeline</h3>
					<div class="gantt-controls">
						<button class="btn btn-secondary" onclick="taskUIManager.zoomGantt('week')">Week</button>
						<button class="btn btn-secondary" onclick="taskUIManager.zoomGantt('month')">Month</button>
						<button class="btn btn-secondary" onclick="taskUIManager.zoomGantt('quarter')">Quarter</button>
					</div>
				</div>
				
				<div class="gantt-container">
					<div class="gantt-sidebar">
						${tasks.map((task) => this.renderGanttTaskRow(task)).join("")}
					</div>
					<div class="gantt-timeline">
						${this.renderGanttTimeline(minDate, maxDate, tasks)}
					</div>
				</div>
			</div>
		`;
	}

	renderGanttTaskRow(task) {
		const priority = this.taskManager.priorities[task.priority];

		return `
			<div class="gantt-task-row" data-task-id="${task.id}">
				<div class="task-info">
					<div class="task-name">${task.title}</div>
					<div class="task-meta">
						<span class="priority-indicator" style="background-color: ${priority.color}"></span>
						<span class="status-text">${task.status}</span>
					</div>
				</div>
			</div>
		`;
	}

	renderGanttTimeline(minDate, maxDate, tasks) {
		// Simplified Gantt timeline - would need more complex date calculations for production
		return `
			<div class="timeline-header">
				<!-- Timeline dates would go here -->
			</div>
			<div class="timeline-bars">
				${tasks.map((task) => this.renderGanttBar(task, minDate, maxDate)).join("")}
			</div>
		`;
	}

	renderGanttBar(task, minDate, maxDate) {
		// Calculate position and width based on dates
		const totalDays = (maxDate - minDate) / (1000 * 60 * 60 * 24);
		const taskStart =
			(new Date(task.startDate) - minDate) / (1000 * 60 * 60 * 24);
		const taskDuration =
			(new Date(task.dueDate) - new Date(task.startDate)) /
			(1000 * 60 * 60 * 24);

		const left = (taskStart / totalDays) * 100;
		const width = (taskDuration / totalDays) * 100;

		const priority = this.taskManager.priorities[task.priority];

		return `
			<div class="gantt-bar" 
				 style="left: ${left}%; width: ${width}%; background-color: ${priority.color}"
				 data-task-id="${task.id}"
				 title="${task.title}">
				<div class="bar-progress" style="width: ${task.progress}%"></div>
			</div>
		`;
	}

	// ========================
	// EVENT HANDLERS
	// ========================

	bindTaskViewEvents() {
		// Search input
		const searchInput = document.getElementById("taskSearch");
		if (searchInput) {
			searchInput.addEventListener("input", (e) => {
				this.currentFilters.search = e.target.value;
				this.applyFilters();
			});
		}

		// Filter selects
		const filterSelects = [
			"statusFilter",
			"priorityFilter",
			"assigneeFilter",
			"departmentFilter",
		];
		filterSelects.forEach((selectId) => {
			const select = document.getElementById(selectId);
			if (select) {
				select.addEventListener("change", (e) => {
					const filterKey = selectId.replace("Filter", "");
					this.currentFilters[filterKey] = e.target.value;
					if (filterKey === "assignee" && e.target.value === "me") {
						this.currentFilters.assignedTo =
							this.authSystem.getCurrentUser()?.email;
					} else if (filterKey === "assignee") {
						this.currentFilters.assignedTo = e.target.value;
					}
					this.applyFilters();
				});
			}
		});

		// Date filters
		const dueDateFrom = document.getElementById("dueDateFrom");
		const dueDateTo = document.getElementById("dueDateTo");

		if (dueDateFrom) {
			dueDateFrom.addEventListener("change", (e) => {
				this.currentFilters.dueDateFrom = e.target.value;
				this.applyFilters();
			});
		}

		if (dueDateTo) {
			dueDateTo.addEventListener("change", (e) => {
				this.currentFilters.dueDateTo = e.target.value;
				this.applyFilters();
			});
		}

		// View toggle buttons
		const viewButtons = document.querySelectorAll(".view-btn");
		viewButtons.forEach((btn) => {
			btn.addEventListener("click", (e) => {
				this.switchView(e.target.dataset.view);
			});
		});
	}

	switchView(viewName) {
		this.currentView = viewName;

		// Update active button
		document.querySelectorAll(".view-btn").forEach((btn) => {
			btn.classList.toggle("active", btn.dataset.view === viewName);
		});

		// Re-render content
		const contentContainer = document.getElementById("taskContent");
		if (contentContainer) {
			contentContainer.innerHTML = this.renderCurrentView();
		}
	}

	applyFilters() {
		// Debounce the filter application
		clearTimeout(this.filterTimeout);
		this.filterTimeout = setTimeout(() => {
			this.refreshCurrentView();
		}, 300);
	}

	refreshCurrentView() {
		const contentContainer = document.getElementById("taskContent");
		if (contentContainer) {
			contentContainer.innerHTML = this.renderCurrentView();
		}

		// Update stats
		const statsContainer = document.querySelector(".task-stats");
		if (statsContainer) {
			statsContainer.innerHTML = this.renderTaskStats();
		}
	}

	getFilteredTasks() {
		const filters = { ...this.currentFilters };

		// Convert date filters to range
		if (filters.dueDateFrom || filters.dueDateTo) {
			filters.dueDateRange = {
				start: filters.dueDateFrom || "1900-01-01",
				end: filters.dueDateTo || "2100-12-31",
			};
			delete filters.dueDateFrom;
			delete filters.dueDateTo;
		}

		let tasks = this.taskManager.searchTasks(filters.search || "", filters);

		// Apply sorting
		tasks = this.sortTasks(tasks);

		return tasks;
	}

	sortTasks(tasks) {
		return tasks.sort((a, b) => {
			let aValue, bValue;

			switch (this.sortBy) {
				case "priority":
					aValue = this.taskManager.priorities[a.priority].value;
					bValue = this.taskManager.priorities[b.priority].value;
					break;
				case "dueDate":
					aValue = a.dueDate ? new Date(a.dueDate) : new Date("2100-01-01");
					bValue = b.dueDate ? new Date(b.dueDate) : new Date("2100-01-01");
					break;
				case "createdAt":
					aValue = new Date(a.createdAt);
					bValue = new Date(b.createdAt);
					break;
				case "title":
					aValue = a.title.toLowerCase();
					bValue = b.title.toLowerCase();
					break;
				case "status":
					aValue = a.status;
					bValue = b.status;
					break;
				default:
					return 0;
			}

			if (aValue < bValue) return this.sortOrder === "asc" ? -1 : 1;
			if (aValue > bValue) return this.sortOrder === "asc" ? 1 : -1;
			return 0;
		});
	}

	// ========================
	// DRAG AND DROP (Kanban)
	// ========================

	handleDragStart(event) {
		event.dataTransfer.setData("text/plain", event.target.dataset.taskId);
		event.target.classList.add("dragging");
	}

	handleDragOver(event) {
		event.preventDefault();
		event.currentTarget.classList.add("drag-over");
	}

	handleDrop(event) {
		event.preventDefault();
		event.currentTarget.classList.remove("drag-over");

		const taskId = parseInt(event.dataTransfer.getData("text/plain"));
		const newStatus =
			event.currentTarget.closest(".kanban-column").dataset.status;

		// Remove dragging class
		document.querySelector(".dragging")?.classList.remove("dragging");

		// Update task status
		this.taskManager.updateTask(taskId, { status: newStatus });
	}

	// ========================
	// MODAL METHODS
	// ========================

	showTaskModal(taskId = null) {
		const isEditing = taskId !== null;
		const task = isEditing ? this.taskManager.getTask(taskId) : null;
		const users = this.userManager?.getAllUsers() || [];
		const allTasks = this.taskManager.tasks.filter((t) => t.id !== taskId); // Exclude current task from dependencies

		const modal = document.createElement("div");
		modal.className = "modal-overlay task-modal-overlay";
		modal.innerHTML = `
			<div class="modal-content task-modal-content">
				<div class="modal-header">
					<h2>${isEditing ? "Edit Task" : "Create New Task"}</h2>
					<button class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</button>
				</div>

				<form class="task-form" onsubmit="event.preventDefault(); taskUIManager.${
					isEditing ? "updateTask" : "createTask"
				}(this, ${taskId || "null"})">
					<div class="form-grid">
						<!-- Basic Information -->
						<div class="form-section">
							<h3>Basic Information</h3>
							
							<div class="form-group">
								<label for="taskTitle">Task Title *</label>
								<input type="text" id="taskTitle" name="title" required 
									   value="${task?.title || ""}" placeholder="Enter task title">
							</div>

							<div class="form-group">
								<label for="taskDescription">Description</label>
								<textarea id="taskDescription" name="description" rows="4" 
										  placeholder="Enter task description">${task?.description || ""}</textarea>
							</div>

							<div class="form-row">
								<div class="form-group">
									<label for="taskPriority">Priority</label>
									<select id="taskPriority" name="priority">
										<option value="LOW" ${
											task?.priority === "LOW" ? "selected" : ""
										}>🟢 Low</option>
										<option value="MEDIUM" ${
											task?.priority === "MEDIUM" ? "selected" : ""
										}>🟡 Medium</option>
										<option value="HIGH" ${
											task?.priority === "HIGH" ? "selected" : ""
										}>🟠 High</option>
										<option value="CRITICAL" ${
											task?.priority === "CRITICAL" ? "selected" : ""
										}>🔴 Critical</option>
									</select>
								</div>

								<div class="form-group">
									<label for="taskCategory">Category</label>
									<input type="text" id="taskCategory" name="category" 
										   value="${task?.category || ""}" placeholder="e.g., Development, Marketing">
								</div>
							</div>
						</div>

						<!-- Assignment & Timeline -->
						<div class="form-section">
							<h3>Assignment & Timeline</h3>
							
							<div class="form-group">
								<label for="taskAssignees">Assign To</label>
								<select id="taskAssignees" name="assignedTo" multiple>
									${users
										.map(
											(user) => `
										<option value="${user.email}" 
												${task?.assignedTo?.includes(user.email) ? "selected" : ""}>
											${user.name} (${user.email})
										</option>
									`
										)
										.join("")}
								</select>
								<small>Hold Ctrl/Cmd to select multiple users</small>
							</div>

							<div class="form-row">
								<div class="form-group">
									<label for="taskStartDate">Start Date</label>
									<input type="date" id="taskStartDate" name="startDate" 
										   value="${task?.startDate ? task.startDate.split("T")[0] : ""}">
								</div>

								<div class="form-group">
									<label for="taskDueDate">Due Date</label>
									<input type="date" id="taskDueDate" name="dueDate" 
										   value="${task?.dueDate ? task.dueDate.split("T")[0] : ""}">
								</div>
							</div>

							<div class="form-row">
								<div class="form-group">
									<label for="taskEstimatedHours">Estimated Hours</label>
									<input type="number" id="taskEstimatedHours" name="estimatedHours" 
										   min="0" step="0.5" value="${task?.estimatedHours || ""}"
										   placeholder="0">
								</div>

								<div class="form-group">
									<label for="taskProgress">Progress (%)</label>
									<input type="number" id="taskProgress" name="progress" 
										   min="0" max="100" value="${task?.progress || 0}">
								</div>
							</div>
						</div>

						<!-- Dependencies & Advanced -->
						<div class="form-section">
							<h3>Dependencies & Advanced</h3>
							
							<div class="form-group">
								<label for="taskDependencies">Dependencies</label>
								<select id="taskDependencies" name="dependencies" multiple>
									${allTasks
										.map(
											(t) => `
										<option value="${t.id}" 
												${task?.dependencies?.includes(t.id) ? "selected" : ""}>
											${t.title}
										</option>
									`
										)
										.join("")}
								</select>
								<small>Tasks that must be completed before this one can start</small>
							</div>

							<div class="form-group">
								<label for="taskTags">Tags</label>
								<input type="text" id="taskTags" name="tags" 
									   value="${task?.tags?.join(", ") || ""}" 
									   placeholder="urgent, review, meeting (comma separated)">
							</div>

							<div class="form-group">
								<label>
									<input type="checkbox" id="taskRecurring" name="isRecurring" 
										   ${task?.isRecurring ? "checked" : ""}
										   onchange="taskUIManager.toggleRecurringOptions(this.checked)">
									Recurring Task
								</label>
							</div>

							<div id="recurringOptions" class="recurring-options" 
								 style="display: ${task?.isRecurring ? "block" : "none"}">
								<div class="form-row">
									<div class="form-group">
										<label for="recurringType">Recurrence</label>
										<select id="recurringType" name="recurringType">
											<option value="daily" ${
												task?.recurringType === "daily" ? "selected" : ""
											}>Daily</option>
											<option value="weekly" ${
												task?.recurringType === "weekly" ? "selected" : ""
											}>Weekly</option>
											<option value="monthly" ${
												task?.recurringType === "monthly" ? "selected" : ""
											}>Monthly</option>
											<option value="quarterly" ${
												task?.recurringType === "quarterly" ? "selected" : ""
											}>Quarterly</option>
											<option value="yearly" ${
												task?.recurringType === "yearly" ? "selected" : ""
											}>Yearly</option>
										</select>
									</div>

									<div class="form-group">
										<label for="recurringInterval">Every</label>
										<input type="number" id="recurringInterval" name="recurringInterval" 
											   min="1" value="${task?.recurringInterval || 1}">
									</div>
								</div>

								<div class="form-group">
									<label for="recurringEndDate">End Date (optional)</label>
									<input type="date" id="recurringEndDate" name="recurringEndDate" 
										   value="${task?.recurringEndDate ? task.recurringEndDate.split("T")[0] : ""}">
								</div>
							</div>
						</div>
					</div>

					<div class="form-actions">
						<button type="button" class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">
							Cancel
						</button>
						${
							isEditing
								? `
							<button type="button" class="btn btn-danger" onclick="taskUIManager.deleteTask(${taskId})">
								Delete Task
							</button>
						`
								: ""
						}
						<button type="submit" class="btn btn-primary">
							${isEditing ? "Update Task" : "Create Task"}
						</button>
					</div>
				</form>
			</div>
		`;

		document.body.appendChild(modal);

		// Focus on title input
		setTimeout(() => {
			modal.querySelector("#taskTitle").focus();
		}, 100);
	}

	toggleRecurringOptions(show) {
		const options = document.getElementById("recurringOptions");
		if (options) {
			options.style.display = show ? "block" : "none";
		}
	}

	createTask(form, taskId) {
		const formData = new FormData(form);
		const taskData = {
			title: formData.get("title"),
			description: formData.get("description"),
			priority: formData.get("priority"),
			category: formData.get("category"),
			assignedTo: formData.getAll("assignedTo"),
			startDate: formData.get("startDate") || null,
			dueDate: formData.get("dueDate") || null,
			estimatedHours: parseFloat(formData.get("estimatedHours")) || null,
			progress: parseInt(formData.get("progress")) || 0,
			dependencies: formData.getAll("dependencies").map((id) => parseInt(id)),
			tags: formData.get("tags")
				? formData
						.get("tags")
						.split(",")
						.map((t) => t.trim())
				: [],
			isRecurring: formData.has("isRecurring"),
			recurringType: formData.get("recurringType"),
			recurringInterval: parseInt(formData.get("recurringInterval")) || 1,
			recurringEndDate: formData.get("recurringEndDate") || null,
		};

		try {
			this.taskManager.createTask(taskData);
			form.closest(".modal-overlay").remove();
			this.showNotification("Task created successfully!", "success");
		} catch (error) {
			console.error("Error creating task:", error);
			this.showNotification("Error creating task: " + error.message, "error");
		}
	}

	updateTask(form, taskId) {
		const formData = new FormData(form);
		const updates = {
			title: formData.get("title"),
			description: formData.get("description"),
			priority: formData.get("priority"),
			category: formData.get("category"),
			assignedTo: formData.getAll("assignedTo"),
			startDate: formData.get("startDate") || null,
			dueDate: formData.get("dueDate") || null,
			estimatedHours: parseFloat(formData.get("estimatedHours")) || null,
			progress: parseInt(formData.get("progress")) || 0,
			dependencies: formData.getAll("dependencies").map((id) => parseInt(id)),
			tags: formData.get("tags")
				? formData
						.get("tags")
						.split(",")
						.map((t) => t.trim())
				: [],
			isRecurring: formData.has("isRecurring"),
			recurringType: formData.get("recurringType"),
			recurringInterval: parseInt(formData.get("recurringInterval")) || 1,
			recurringEndDate: formData.get("recurringEndDate") || null,
		};

		try {
			this.taskManager.updateTask(taskId, updates);
			form.closest(".modal-overlay").remove();
			this.showNotification("Task updated successfully!", "success");
		} catch (error) {
			console.error("Error updating task:", error);
			this.showNotification("Error updating task: " + error.message, "error");
		}
	}

	deleteTask(taskId) {
		if (confirm("Are you sure you want to delete this task?")) {
			try {
				this.taskManager.deleteTask(taskId);
				document.querySelector(".modal-overlay").remove();
				this.showNotification("Task deleted successfully!", "success");
			} catch (error) {
				console.error("Error deleting task:", error);
				this.showNotification("Error deleting task: " + error.message, "error");
			}
		}
	}

	// ========================
	// UTILITY METHODS
	// ========================

	clearFilters() {
		this.currentFilters = {};

		// Reset form inputs
		const inputs = document.querySelectorAll(
			"#taskSearch, .filter-select, .date-input"
		);
		inputs.forEach((input) => {
			input.value = "";
		});

		this.applyFilters();
	}

	focusSearchInput() {
		const searchInput = document.getElementById("taskSearch");
		if (searchInput) {
			searchInput.focus();
		}
	}

	showNotification(message, type = "info") {
		// Use the main app's notification system
		if (window.studyHallApp) {
			window.studyHallApp.showNotification(message, type);
		} else {
			console.log(`${type.toUpperCase()}: ${message}`);
		}
	}

	getTasksForDate(date) {
		const dateStr = date.toISOString().split("T")[0];
		return this.taskManager.tasks.filter((task) => {
			if (!task.dueDate) return false;
			return task.dueDate.split("T")[0] === dateStr;
		});
	}

	isToday(date) {
		const today = new Date();
		return date.toDateString() === today.toDateString();
	}

	getMonthName(monthIndex) {
		const months = [
			"January",
			"February",
			"March",
			"April",
			"May",
			"June",
			"July",
			"August",
			"September",
			"October",
			"November",
			"December",
		];
		return months[monthIndex];
	}

	loadTaskView() {
		// Load initial data and apply any saved filters
		this.refreshCurrentView();
	}
}
