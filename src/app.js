// Phoenix HR App - Main Application Logic
// Handles routing, navigation, and app state management

class PhoenixHRApp {
	constructor() {
		this.currentView = "dashboard";
		this.sidebarCollapsed = false;
		this.init();
	}

	init() {
		this.bindEvents();
		this.handleInitialRoute();
		this.updatePageTitle();
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
		console.log(`Notification (${type}): ${message}`);
	}

	openModal(modalId) {
		// Modal management
		console.log(`Opening modal: ${modalId}`);
	}

	closeModal(modalId) {
		// Modal management
		console.log(`Closing modal: ${modalId}`);
	}
}

// Initialize app when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
	window.phoenixApp = new PhoenixHRApp();
});

// Export for potential module usage
export default PhoenixHRApp;
