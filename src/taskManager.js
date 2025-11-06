/**
 * Advanced Task Manager for Study Hall HR Application
 * Handles task assignment, deadlines, priorities, dependencies, and notifications
 */

export class TaskManager {
	constructor(authSystem, userManager, permissionsManager) {
		this.authSystem = authSystem;
		this.userManager = userManager;
		this.permissionsManager = permissionsManager;

		// Task storage keys
		this.storageKeys = {
			tasks: "study-hall-tasks",
			taskTemplates: "study-hall-task-templates",
			taskDependencies: "study-hall-task-dependencies",
			recurringTasks: "study-hall-recurring-tasks",
			taskNotifications: "study-hall-task-notifications",
			taskProgress: "study-hall-task-progress",
			taskComments: "study-hall-task-comments",
		};

		// Priority levels
		this.priorities = {
			LOW: { value: 1, label: "Low", color: "#28a745", bgColor: "#d4edda" },
			MEDIUM: {
				value: 2,
				label: "Medium",
				color: "#ffc107",
				bgColor: "#fff3cd",
			},
			HIGH: { value: 3, label: "High", color: "#fd7e14", bgColor: "#ffeaa7" },
			CRITICAL: {
				value: 4,
				label: "Critical",
				color: "#dc3545",
				bgColor: "#f8d7da",
			},
		};

		// Task statuses
		this.statuses = {
			PENDING: "pending",
			IN_PROGRESS: "in-progress",
			ON_HOLD: "on-hold",
			COMPLETED: "completed",
			CANCELLED: "cancelled",
			OVERDUE: "overdue",
		};

		// Recurring task types
		this.recurringTypes = {
			DAILY: "daily",
			WEEKLY: "weekly",
			MONTHLY: "monthly",
			QUARTERLY: "quarterly",
			YEARLY: "yearly",
			CUSTOM: "custom",
		};

		this.init();
	}

	init() {
		this.loadTasks();
		this.loadTaskTemplates();
		this.loadDependencies();
		this.loadRecurringTasks();
		this.setupNotificationSystem();
		this.startPeriodicChecks();

		console.log("TaskManager initialized successfully");
	}

	// ========================
	// CORE TASK MANAGEMENT
	// ========================

	loadTasks() {
		try {
			const saved = localStorage.getItem(this.storageKeys.tasks);
			this.tasks = saved ? JSON.parse(saved) : [];
			return this.tasks;
		} catch (error) {
			console.error("Error loading tasks:", error);
			this.tasks = [];
			return [];
		}
	}

	saveTasks() {
		try {
			localStorage.setItem(this.storageKeys.tasks, JSON.stringify(this.tasks));
			this.updateTaskStatuses();
			this.triggerTaskUpdate();
		} catch (error) {
			console.error("Error saving tasks:", error);
		}
	}

	loadTaskTemplates() {
		try {
			const saved = localStorage.getItem(this.storageKeys.taskTemplates);
			this.taskTemplates = saved
				? JSON.parse(saved)
				: this.getDefaultTaskTemplates();
			return this.taskTemplates;
		} catch (error) {
			console.error("Error loading task templates:", error);
			this.taskTemplates = this.getDefaultTaskTemplates();
			return this.taskTemplates;
		}
	}

	getDefaultTaskTemplates() {
		return [
			{
				id: "onboarding",
				name: "New Employee Onboarding",
				description: "Standard onboarding process for new hires",
				category: "hr",
				estimatedHours: 16,
				priority: "HIGH",
				tasks: [
					{ title: "Send welcome email", estimatedHours: 0.5 },
					{ title: "Prepare workspace and equipment", estimatedHours: 2 },
					{ title: "Schedule orientation meeting", estimatedHours: 0.5 },
					{ title: "Create system accounts", estimatedHours: 1 },
					{ title: "Assign buddy/mentor", estimatedHours: 0.5 },
					{ title: "Conduct first-day orientation", estimatedHours: 4 },
					{ title: "Complete initial paperwork", estimatedHours: 2 },
					{ title: "Department introduction tour", estimatedHours: 1 },
					{ title: "Review job expectations", estimatedHours: 2 },
					{ title: "Schedule 30-day check-in", estimatedHours: 0.5 },
				],
			},
			{
				id: "performance_review",
				name: "Performance Review Process",
				description: "Quarterly performance review workflow",
				category: "hr",
				estimatedHours: 6,
				priority: "MEDIUM",
				tasks: [
					{ title: "Send review notification", estimatedHours: 0.5 },
					{ title: "Employee self-assessment", estimatedHours: 2 },
					{ title: "Gather peer feedback", estimatedHours: 1 },
					{ title: "Manager assessment", estimatedHours: 1.5 },
					{ title: "Schedule review meeting", estimatedHours: 0.5 },
					{ title: "Conduct review meeting", estimatedHours: 1 },
					{ title: "Document review results", estimatedHours: 0.5 },
				],
			},
			{
				id: "project_launch",
				name: "Project Launch Checklist",
				description: "Standard project initiation process",
				category: "operations",
				estimatedHours: 20,
				priority: "HIGH",
				tasks: [
					{ title: "Define project scope", estimatedHours: 4 },
					{ title: "Identify stakeholders", estimatedHours: 2 },
					{ title: "Create project timeline", estimatedHours: 3 },
					{ title: "Assign team members", estimatedHours: 2 },
					{ title: "Setup project tools", estimatedHours: 2 },
					{ title: "Plan kickoff meeting", estimatedHours: 1 },
					{ title: "Conduct kickoff meeting", estimatedHours: 2 },
					{ title: "Establish communication protocols", estimatedHours: 2 },
					{ title: "Create project documentation", estimatedHours: 4 },
				],
			},
		];
	}

	saveTaskTemplates() {
		try {
			localStorage.setItem(
				this.storageKeys.taskTemplates,
				JSON.stringify(this.taskTemplates)
			);
		} catch (error) {
			console.error("Error saving task templates:", error);
		}
	}

	loadDependencies() {
		try {
			const saved = localStorage.getItem(this.storageKeys.taskDependencies);
			this.taskDependencies = saved ? JSON.parse(saved) : [];
			return this.taskDependencies;
		} catch (error) {
			console.error("Error loading task dependencies:", error);
			this.taskDependencies = [];
			return this.taskDependencies;
		}
	}

	saveDependencies() {
		try {
			localStorage.setItem(
				this.storageKeys.taskDependencies,
				JSON.stringify(this.taskDependencies)
			);
		} catch (error) {
			console.error("Error saving task dependencies:", error);
		}
	}

	createTask(taskData) {
		const currentUser = this.authSystem.getCurrentUser();
		const newTask = {
			id: this.getNextTaskId(),
			title: taskData.title,
			description: taskData.description || "",
			priority: taskData.priority || "MEDIUM",
			status: taskData.status || this.statuses.PENDING,

			// Assignment details
			assignedTo: taskData.assignedTo || [],
			assignedBy: currentUser?.email || "system",
			department: taskData.department || null,

			// Timeline
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			dueDate: taskData.dueDate || null,
			startDate: taskData.startDate || null,
			completedAt: null,

			// Progress tracking
			progress: 0,
			estimatedHours: taskData.estimatedHours || null,
			actualHours: 0,

			// Dependencies
			dependencies: taskData.dependencies || [],
			dependents: [],

			// Recurring task settings
			isRecurring: taskData.isRecurring || false,
			recurringType: taskData.recurringType || null,
			recurringInterval: taskData.recurringInterval || 1,
			recurringEndDate: taskData.recurringEndDate || null,
			parentRecurringId: taskData.parentRecurringId || null,

			// Additional metadata
			tags: taskData.tags || [],
			attachments: taskData.attachments || [],
			category: taskData.category || "general",
			location: taskData.location || null,

			// Notification settings
			notifications: {
				onAssignment: true,
				beforeDue: true,
				onStatusChange: true,
				reminderDays: [1, 7], // Days before due date
			},
		};

		this.tasks.push(newTask);
		this.saveTasks();

		// Handle dependencies
		if (newTask.dependencies.length > 0) {
			this.updateTaskDependencies(newTask.id, newTask.dependencies);
		}

		// Setup recurring tasks
		if (newTask.isRecurring) {
			this.createRecurringTaskSchedule(newTask);
		}

		// Send notifications
		this.sendTaskNotification(newTask, "created");

		console.log("Task created:", newTask);
		return newTask;
	}

	updateTask(taskId, updates) {
		const taskIndex = this.tasks.findIndex((t) => t.id === taskId);
		if (taskIndex === -1) {
			throw new Error("Task not found");
		}

		const oldTask = { ...this.tasks[taskIndex] };
		const updatedTask = {
			...this.tasks[taskIndex],
			...updates,
			updatedAt: new Date().toISOString(),
		};

		// Handle status changes
		if (updates.status && updates.status !== oldTask.status) {
			this.handleStatusChange(updatedTask, oldTask.status, updates.status);
		}

		// Handle assignment changes
		if (
			updates.assignedTo &&
			JSON.stringify(updates.assignedTo) !== JSON.stringify(oldTask.assignedTo)
		) {
			this.handleAssignmentChange(
				updatedTask,
				oldTask.assignedTo,
				updates.assignedTo
			);
		}

		// Handle dependency changes
		if (updates.dependencies) {
			this.updateTaskDependencies(taskId, updates.dependencies);
		}

		this.tasks[taskIndex] = updatedTask;
		this.saveTasks();

		console.log("Task updated:", updatedTask);
		return updatedTask;
	}

	deleteTask(taskId) {
		const taskIndex = this.tasks.findIndex((t) => t.id === taskId);
		if (taskIndex === -1) {
			throw new Error("Task not found");
		}

		const task = this.tasks[taskIndex];

		// Remove from dependent tasks
		this.removeDependencies(taskId);

		// Cancel recurring schedule if applicable
		if (task.isRecurring) {
			this.cancelRecurringTask(taskId);
		}

		this.tasks.splice(taskIndex, 1);
		this.saveTasks();

		console.log("Task deleted:", taskId);
		return true;
	}

	getTask(taskId) {
		return this.tasks.find((t) => t.id === taskId);
	}

	getTasksByUser(userEmail) {
		return this.tasks.filter(
			(task) =>
				task.assignedTo.includes(userEmail) || task.assignedBy === userEmail
		);
	}

	getTasksByStatus(status) {
		return this.tasks.filter((task) => task.status === status);
	}

	getTasksByPriority(priority) {
		return this.tasks.filter((task) => task.priority === priority);
	}

	getOverdueTasks() {
		const now = new Date();
		return this.tasks.filter((task) => {
			if (!task.dueDate || task.status === this.statuses.COMPLETED)
				return false;
			return new Date(task.dueDate) < now;
		});
	}

	getUpcomingTasks(days = 7) {
		const now = new Date();
		const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

		return this.tasks.filter((task) => {
			if (!task.dueDate || task.status === this.statuses.COMPLETED)
				return false;
			const dueDate = new Date(task.dueDate);
			return dueDate >= now && dueDate <= futureDate;
		});
	}

	// ========================
	// ASSIGNMENT MANAGEMENT
	// ========================

	assignTask(taskId, userEmails, assignedBy = null) {
		const task = this.getTask(taskId);
		if (!task) throw new Error("Task not found");

		const currentUser = this.authSystem.getCurrentUser();
		const assignerEmail = assignedBy || currentUser?.email;

		// Validate users exist
		const validUsers = userEmails.filter((email) =>
			this.userManager.getUserByEmail(email)
		);

		const updatedTask = this.updateTask(taskId, {
			assignedTo: validUsers,
			assignedBy: assignerEmail,
		});

		// Send assignment notifications
		validUsers.forEach((email) => {
			this.sendTaskNotification(updatedTask, "assigned", email);
		});

		return updatedTask;
	}

	unassignTask(taskId, userEmail) {
		const task = this.getTask(taskId);
		if (!task) throw new Error("Task not found");

		const newAssignees = task.assignedTo.filter((email) => email !== userEmail);
		return this.updateTask(taskId, { assignedTo: newAssignees });
	}

	bulkAssignTasks(taskIds, userEmails) {
		const results = [];
		taskIds.forEach((taskId) => {
			try {
				const result = this.assignTask(taskId, userEmails);
				results.push({ taskId, success: true, task: result });
			} catch (error) {
				results.push({ taskId, success: false, error: error.message });
			}
		});
		return results;
	}

	// ========================
	// PROGRESS MANAGEMENT
	// ========================

	updateTaskProgress(taskId, progress, actualHours = null) {
		const task = this.getTask(taskId);
		if (!task) throw new Error("Task not found");

		const updates = { progress: Math.max(0, Math.min(100, progress)) };

		if (actualHours !== null) {
			updates.actualHours = actualHours;
		}

		// Auto-update status based on progress
		if (progress === 100 && task.status !== this.statuses.COMPLETED) {
			updates.status = this.statuses.COMPLETED;
			updates.completedAt = new Date().toISOString();
		} else if (progress > 0 && task.status === this.statuses.PENDING) {
			updates.status = this.statuses.IN_PROGRESS;
		}

		return this.updateTask(taskId, updates);
	}

	logTimeEntry(taskId, hours, description = "", date = null) {
		const task = this.getTask(taskId);
		if (!task) throw new Error("Task not found");

		const currentUser = this.authSystem.getCurrentUser();
		const timeEntry = {
			id: Date.now(),
			taskId,
			userEmail: currentUser?.email,
			hours,
			description,
			date: date || new Date().toISOString().split("T")[0],
			createdAt: new Date().toISOString(),
		};

		// Load existing time entries
		const timeEntries = this.loadTimeEntries();
		timeEntries.push(timeEntry);
		localStorage.setItem(
			"study-hall-time-entries",
			JSON.stringify(timeEntries)
		);

		// Update task's actual hours
		const totalHours = timeEntries
			.filter((entry) => entry.taskId === taskId)
			.reduce((sum, entry) => sum + entry.hours, 0);

		this.updateTask(taskId, { actualHours: totalHours });

		return timeEntry;
	}

	loadTimeEntries() {
		try {
			const saved = localStorage.getItem("study-hall-time-entries");
			return saved ? JSON.parse(saved) : [];
		} catch (error) {
			console.error("Error loading time entries:", error);
			return [];
		}
	}

	getTimeEntriesForTask(taskId) {
		const timeEntries = this.loadTimeEntries();
		return timeEntries.filter((entry) => entry.taskId === taskId);
	}

	// ========================
	// DEPENDENCY MANAGEMENT
	// ========================

	addTaskDependency(taskId, dependsOnId) {
		const task = this.getTask(taskId);
		const dependencyTask = this.getTask(dependsOnId);

		if (!task || !dependencyTask) {
			throw new Error("One or both tasks not found");
		}

		// Check for circular dependencies
		if (this.wouldCreateCircularDependency(taskId, dependsOnId)) {
			throw new Error(
				"Adding this dependency would create a circular reference"
			);
		}

		// Add dependency
		if (!task.dependencies.includes(dependsOnId)) {
			task.dependencies.push(dependsOnId);
		}

		// Add dependent reference
		if (!dependencyTask.dependents.includes(taskId)) {
			dependencyTask.dependents.push(taskId);
		}

		this.saveTasks();
		return true;
	}

	removeTaskDependency(taskId, dependsOnId) {
		const task = this.getTask(taskId);
		const dependencyTask = this.getTask(dependsOnId);

		if (task) {
			task.dependencies = task.dependencies.filter((id) => id !== dependsOnId);
		}

		if (dependencyTask) {
			dependencyTask.dependents = dependencyTask.dependents.filter(
				(id) => id !== taskId
			);
		}

		this.saveTasks();
		return true;
	}

	wouldCreateCircularDependency(taskId, dependsOnId, visited = new Set()) {
		if (visited.has(dependsOnId)) return true;
		if (dependsOnId === taskId) return true;

		visited.add(dependsOnId);

		const dependencyTask = this.getTask(dependsOnId);
		if (!dependencyTask) return false;

		return dependencyTask.dependencies.some((depId) =>
			this.wouldCreateCircularDependency(taskId, depId, new Set(visited))
		);
	}

	canStartTask(taskId) {
		const task = this.getTask(taskId);
		if (!task) return false;

		// Check if all dependencies are completed
		return task.dependencies.every((depId) => {
			const depTask = this.getTask(depId);
			return depTask && depTask.status === this.statuses.COMPLETED;
		});
	}

	getTaskDependencyChain(taskId) {
		const task = this.getTask(taskId);
		if (!task) return [];

		const chain = [];
		const visited = new Set();

		const buildChain = (currentTaskId, level = 0) => {
			if (visited.has(currentTaskId)) return;
			visited.add(currentTaskId);

			const currentTask = this.getTask(currentTaskId);
			if (!currentTask) return;

			chain.push({
				...currentTask,
				level,
				canStart: this.canStartTask(currentTaskId),
			});

			currentTask.dependencies.forEach((depId) => buildChain(depId, level + 1));
		};

		buildChain(taskId);
		return chain;
	}

	// ========================
	// RECURRING TASKS
	// ========================

	createRecurringTaskSchedule(parentTask) {
		const recurringSchedule = {
			id: Date.now(),
			parentTaskId: parentTask.id,
			type: parentTask.recurringType,
			interval: parentTask.recurringInterval,
			nextDue: this.calculateNextDueDate(parentTask),
			endDate: parentTask.recurringEndDate,
			isActive: true,
			createdInstances: [],
			template: { ...parentTask },
		};

		const schedules = this.loadRecurringTasks();
		schedules.push(recurringSchedule);
		localStorage.setItem(
			this.storageKeys.recurringTasks,
			JSON.stringify(schedules)
		);

		return recurringSchedule;
	}

	loadRecurringTasks() {
		try {
			const saved = localStorage.getItem(this.storageKeys.recurringTasks);
			return saved ? JSON.parse(saved) : [];
		} catch (error) {
			console.error("Error loading recurring tasks:", error);
			return [];
		}
	}

	processRecurringTasks() {
		const schedules = this.loadRecurringTasks();
		const now = new Date();

		schedules.forEach((schedule) => {
			if (!schedule.isActive) return;
			if (schedule.endDate && new Date(schedule.endDate) < now) {
				schedule.isActive = false;
				return;
			}

			if (new Date(schedule.nextDue) <= now) {
				this.createRecurringTaskInstance(schedule);
			}
		});

		localStorage.setItem(
			this.storageKeys.recurringTasks,
			JSON.stringify(schedules)
		);
	}

	createRecurringTaskInstance(schedule) {
		const template = schedule.template;
		const instanceData = {
			...template,
			id: this.getNextTaskId(),
			title: `${template.title} (${new Date().toLocaleDateString()})`,
			dueDate: schedule.nextDue,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			parentRecurringId: schedule.id,
			isRecurring: false, // Instance is not recurring itself
		};

		const newTask = this.createTask(instanceData);

		// Update schedule
		schedule.createdInstances.push(newTask.id);
		schedule.nextDue = this.calculateNextDueDate(
			template,
			new Date(schedule.nextDue)
		);

		return newTask;
	}

	calculateNextDueDate(task, fromDate = new Date()) {
		const date = new Date(fromDate);

		switch (task.recurringType) {
			case this.recurringTypes.DAILY:
				date.setDate(date.getDate() + task.recurringInterval);
				break;
			case this.recurringTypes.WEEKLY:
				date.setDate(date.getDate() + 7 * task.recurringInterval);
				break;
			case this.recurringTypes.MONTHLY:
				date.setMonth(date.getMonth() + task.recurringInterval);
				break;
			case this.recurringTypes.QUARTERLY:
				date.setMonth(date.getMonth() + 3 * task.recurringInterval);
				break;
			case this.recurringTypes.YEARLY:
				date.setFullYear(date.getFullYear() + task.recurringInterval);
				break;
		}

		return date.toISOString();
	}

	// ========================
	// NOTIFICATION SYSTEM
	// ========================

	setupNotificationSystem() {
		// Request notification permission if supported
		if ("Notification" in window && Notification.permission === "default") {
			Notification.requestPermission();
		}
	}

	sendTaskNotification(task, type, targetUser = null) {
		const notification = {
			id: Date.now(),
			taskId: task.id,
			type, // 'created', 'assigned', 'due', 'overdue', 'completed', 'status_changed'
			targetUser: targetUser || null,
			message: this.generateNotificationMessage(task, type),
			createdAt: new Date().toISOString(),
			read: false,
			priority: task.priority,
		};

		// Store notification
		const notifications = this.loadNotifications();
		notifications.push(notification);
		localStorage.setItem(
			this.storageKeys.taskNotifications,
			JSON.stringify(notifications)
		);

		// Show browser notification if permission granted
		if ("Notification" in window && Notification.permission === "granted") {
			this.showBrowserNotification(notification);
		}

		console.log("Task notification sent:", notification);
		return notification;
	}

	generateNotificationMessage(task, type) {
		const messages = {
			created: `New task created: "${task.title}"`,
			assigned: `You have been assigned to task: "${task.title}"`,
			due: `Task due soon: "${task.title}"`,
			overdue: `Task is overdue: "${task.title}"`,
			completed: `Task completed: "${task.title}"`,
			status_changed: `Task status updated: "${task.title}" is now ${task.status}`,
		};

		return messages[type] || `Task update: "${task.title}"`;
	}

	showBrowserNotification(notification) {
		const browserNotification = new Notification("Study Hall - Task Update", {
			body: notification.message,
			icon: "/assets/icons/task-icon.png", // Add icon if available
			tag: `task-${notification.taskId}`,
			requireInteraction: notification.priority === "CRITICAL",
		});

		// Auto-close after 5 seconds unless critical
		if (notification.priority !== "CRITICAL") {
			setTimeout(() => browserNotification.close(), 5000);
		}

		browserNotification.onclick = () => {
			window.focus();
			// Navigate to task details
			if (window.studyHallApp) {
				window.studyHallApp.navigateToView("tasks");
				// Could add specific task focusing here
			}
			browserNotification.close();
		};
	}

	loadNotifications() {
		try {
			const saved = localStorage.getItem(this.storageKeys.taskNotifications);
			return saved ? JSON.parse(saved) : [];
		} catch (error) {
			console.error("Error loading notifications:", error);
			return [];
		}
	}

	checkDueDateNotifications() {
		const now = new Date();
		const upcomingTasks = this.getUpcomingTasks(7); // Check 7 days ahead
		const overdueTasks = this.getOverdueTasks();

		// Send due date reminders
		upcomingTasks.forEach((task) => {
			const dueDate = new Date(task.dueDate);
			const daysUntilDue = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));

			if (task.notifications.reminderDays.includes(daysUntilDue)) {
				this.sendTaskNotification(task, "due");
			}
		});

		// Send overdue notifications
		overdueTasks.forEach((task) => {
			if (task.status !== this.statuses.OVERDUE) {
				this.updateTask(task.id, { status: this.statuses.OVERDUE });
				this.sendTaskNotification(task, "overdue");
			}
		});
	}

	// ========================
	// UTILITY METHODS
	// ========================

	getNextTaskId() {
		const maxId = this.tasks.reduce(
			(max, task) => Math.max(max, task.id || 0),
			0
		);
		return maxId + 1;
	}

	updateTaskStatuses() {
		const now = new Date();
		let updated = false;

		this.tasks.forEach((task) => {
			// Mark overdue tasks
			if (
				task.dueDate &&
				new Date(task.dueDate) < now &&
				task.status !== this.statuses.COMPLETED &&
				task.status !== this.statuses.CANCELLED &&
				task.status !== this.statuses.OVERDUE
			) {
				task.status = this.statuses.OVERDUE;
				updated = true;
			}
		});

		if (updated) {
			localStorage.setItem(this.storageKeys.tasks, JSON.stringify(this.tasks));
		}
	}

	handleStatusChange(task, oldStatus, newStatus) {
		if (newStatus === this.statuses.COMPLETED) {
			task.completedAt = new Date().toISOString();
			task.progress = 100;

			// Check if this enables dependent tasks
			this.checkDependentTasks(task.id);
		}

		this.sendTaskNotification(task, "status_changed");
	}

	handleAssignmentChange(task, oldAssignees, newAssignees) {
		// Notify newly assigned users
		const newlyAssigned = newAssignees.filter(
			(email) => !oldAssignees.includes(email)
		);
		newlyAssigned.forEach((email) => {
			this.sendTaskNotification(task, "assigned", email);
		});
	}

	checkDependentTasks(completedTaskId) {
		this.tasks.forEach((task) => {
			if (
				task.dependencies.includes(completedTaskId) &&
				this.canStartTask(task.id)
			) {
				// Task can now be started - could send notification
				console.log(`Task ${task.id} (${task.title}) can now be started`);
			}
		});
	}

	removeDependencies(taskId) {
		this.tasks.forEach((task) => {
			task.dependencies = task.dependencies.filter((id) => id !== taskId);
			task.dependents = task.dependents.filter((id) => id !== taskId);
		});
	}

	updateTaskDependencies(taskId, newDependencies) {
		const task = this.getTask(taskId);
		if (!task) return;

		// Remove old dependencies
		task.dependencies.forEach((depId) => {
			this.removeTaskDependency(taskId, depId);
		});

		// Add new dependencies
		newDependencies.forEach((depId) => {
			this.addTaskDependency(taskId, depId);
		});
	}

	startPeriodicChecks() {
		// Check for due dates and recurring tasks every hour
		setInterval(() => {
			this.checkDueDateNotifications();
			this.processRecurringTasks();
		}, 60 * 60 * 1000); // 1 hour

		// Initial check
		setTimeout(() => {
			this.checkDueDateNotifications();
			this.processRecurringTasks();
		}, 5000); // 5 seconds after initialization
	}

	triggerTaskUpdate() {
		// Dispatch custom event for UI updates
		window.dispatchEvent(
			new CustomEvent("tasksUpdated", {
				detail: { tasks: this.tasks },
			})
		);
	}

	// ========================
	// SEARCH AND FILTERING
	// ========================

	searchTasks(query, filters = {}) {
		let results = [...this.tasks];

		// Text search
		if (query) {
			const searchTerm = query.toLowerCase();
			results = results.filter(
				(task) =>
					task.title.toLowerCase().includes(searchTerm) ||
					task.description.toLowerCase().includes(searchTerm) ||
					task.tags.some((tag) => tag.toLowerCase().includes(searchTerm))
			);
		}

		// Apply filters
		if (filters.status) {
			results = results.filter((task) => task.status === filters.status);
		}

		if (filters.priority) {
			results = results.filter((task) => task.priority === filters.priority);
		}

		if (filters.assignedTo) {
			results = results.filter((task) =>
				task.assignedTo.includes(filters.assignedTo)
			);
		}

		if (filters.department) {
			results = results.filter(
				(task) => task.department === filters.department
			);
		}

		if (filters.dueDateRange) {
			const { start, end } = filters.dueDateRange;
			results = results.filter((task) => {
				if (!task.dueDate) return false;
				const dueDate = new Date(task.dueDate);
				return dueDate >= new Date(start) && dueDate <= new Date(end);
			});
		}

		if (filters.category) {
			results = results.filter((task) => task.category === filters.category);
		}

		return results;
	}

	// ========================
	// EXPORT METHODS
	// ========================

	exportTasks(format = "json", filters = {}) {
		const tasks = this.searchTasks("", filters);

		switch (format) {
			case "csv":
				return this.exportToCSV(tasks);
			case "json":
				return JSON.stringify(tasks, null, 2);
			default:
				throw new Error("Unsupported export format");
		}
	}

	exportToCSV(tasks) {
		const headers = [
			"ID",
			"Title",
			"Description",
			"Priority",
			"Status",
			"Assigned To",
			"Created At",
			"Due Date",
			"Progress",
			"Department",
			"Category",
		];

		const rows = tasks.map((task) => [
			task.id,
			task.title,
			task.description,
			task.priority,
			task.status,
			task.assignedTo.join("; "),
			task.createdAt,
			task.dueDate || "",
			task.progress,
			task.department || "",
			task.category,
		]);

		const csvContent = [headers, ...rows]
			.map((row) => row.map((cell) => `"${cell}"`).join(","))
			.join("\n");

		return csvContent;
	}
}
