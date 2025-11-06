// Navigation Component
// Handles sidebar navigation, section states, mobile responsive behavior

export class NavigationComponent {
	constructor(options = {}) {
		this.options = {
			container: options.container || "#sidebar",
			sections: options.sections || [
				"favorites",
				"dashboards",
				"documentation",
				"spaces",
			],
			initialStates: options.initialStates || {},
			onNavigate: options.onNavigate || null,
			onSectionToggle: options.onSectionToggle || null,
			mobileBreakpoint: options.mobileBreakpoint || 768,
			...options,
		};

		this.container = null;
		this.isCollapsed = false;
		this.isMobile = false;
		this.sectionStates = {
			favorites: true,
			dashboards: true,
			documentation: true,
			spaces: true,
			...this.options.initialStates,
		};

		this.init();
	}

	// Initialize the navigation component
	init() {
		// Get container element
		if (typeof this.options.container === "string") {
			this.container = document.querySelector(this.options.container);
		} else {
			this.container = this.options.container;
		}

		if (!this.container) {
			throw new Error("NavigationComponent: Container element not found");
		}

		// Load saved states
		this.loadSectionStates();

		// Setup event listeners
		this.bindEvents();

		// Setup mobile detection
		this.setupMobileDetection();

		// Initialize section states
		this.applySectionStates();

		console.log("NavigationComponent initialized");
	}

	// Bind event listeners
	bindEvents() {
		// Navigation item clicks
		const navItems = this.container.querySelectorAll(".nav-item");
		navItems.forEach((item) => {
			item.addEventListener("click", (e) => {
				this.handleNavItemClick(e, item);
			});
		});

		// Section toggle clicks
		const sectionToggles = this.container.querySelectorAll(".section-toggle");
		sectionToggles.forEach((toggle) => {
			toggle.addEventListener("click", (e) => {
				this.handleSectionToggle(e, toggle);
			});
		});

		// Sidebar toggle button
		const sidebarToggle = document.getElementById("sidebarToggle");
		const mobileMenuBtn = document.getElementById("mobileMenuBtn");

		if (sidebarToggle) {
			sidebarToggle.addEventListener("click", () => this.toggleSidebar());
		}

		if (mobileMenuBtn) {
			mobileMenuBtn.addEventListener("click", () => this.toggleSidebar());
		}

		// Add dashboard button
		const addDashboard = document.getElementById("addDashboard");
		if (addDashboard) {
			addDashboard.addEventListener("click", (e) => {
				e.preventDefault();
				if (this.options.onAddDashboard) {
					this.options.onAddDashboard();
				}
			});
		}

		// Add space button
		const addSpace = document.getElementById("addSpace");
		if (addSpace) {
			addSpace.addEventListener("click", (e) => {
				e.preventDefault();
				if (this.options.onAddSpace) {
					this.options.onAddSpace();
				}
			});
		}

		// Item options
		this.container.addEventListener("click", (e) => {
			if (e.target.classList.contains("item-options")) {
				e.preventDefault();
				this.handleItemOptions(e);
			}
		});
	}

	// Handle navigation item clicks
	handleNavItemClick(e, item) {
		e.preventDefault();

		const view = item.dataset.view;
		if (!view) return;

		// Update active state
		this.setActiveNavItem(item);

		// Collapse sidebar on mobile after navigation
		if (this.isMobile) {
			this.collapseSidebar();
		}

		// Call navigation callback
		if (this.options.onNavigate) {
			this.options.onNavigate(view);
		}
	}

	// Handle section toggle
	handleSectionToggle(e, toggle) {
		e.preventDefault();

		const sectionName = toggle.dataset.section;
		if (!sectionName) return;

		this.toggleSection(sectionName);

		// Call section toggle callback
		if (this.options.onSectionToggle) {
			this.options.onSectionToggle(
				sectionName,
				this.sectionStates[sectionName]
			);
		}
	}

	// Handle item options
	handleItemOptions(e) {
		const itemId = e.target.dataset.itemId;
		const itemType = e.target.dataset.itemType;

		if (this.options.onItemOptions) {
			this.options.onItemOptions(itemId, itemType, e);
		}
	}

	// Toggle sidebar collapsed state
	toggleSidebar() {
		this.isCollapsed = !this.isCollapsed;

		if (this.isCollapsed) {
			this.collapseSidebar();
		} else {
			this.expandSidebar();
		}
	}

	// Collapse sidebar
	collapseSidebar() {
		this.container.classList.add("collapsed");
		this.isCollapsed = true;

		// Save state
		this.saveSidebarState();

		// Update body class for layout adjustments
		document.body.classList.add("sidebar-collapsed");
	}

	// Expand sidebar
	expandSidebar() {
		this.container.classList.remove("collapsed");
		this.isCollapsed = false;

		// Save state
		this.saveSidebarState();

		// Update body class for layout adjustments
		document.body.classList.remove("sidebar-collapsed");
	}

	// Toggle section expanded/collapsed state
	toggleSection(sectionName) {
		if (!this.sectionStates.hasOwnProperty(sectionName)) {
			return;
		}

		this.sectionStates[sectionName] = !this.sectionStates[sectionName];
		this.applySectionState(sectionName);
		this.saveSectionStates();
	}

	// Apply section states to UI
	applySectionStates() {
		Object.keys(this.sectionStates).forEach((sectionName) => {
			this.applySectionState(sectionName);
		});
	}

	// Apply individual section state
	applySectionState(sectionName) {
		const sectionContent = this.container.querySelector(
			`[data-section-content="${sectionName}"]`
		);
		const sectionToggle = this.container.querySelector(
			`[data-section="${sectionName}"]`
		);

		if (!sectionContent || !sectionToggle) return;

		const isExpanded = this.sectionStates[sectionName];

		// Update content visibility
		if (isExpanded) {
			sectionContent.style.display = "block";
			sectionToggle.classList.add("expanded");
		} else {
			sectionContent.style.display = "none";
			sectionToggle.classList.remove("expanded");
		}

		// Update toggle icon
		const toggleIcon = sectionToggle.querySelector(".toggle-icon");
		if (toggleIcon) {
			toggleIcon.textContent = isExpanded ? "▼" : "▶";
		}
	}

	// Set active navigation item
	setActiveNavItem(activeItem) {
		// Remove active class from all nav items
		const navItems = this.container.querySelectorAll(".nav-item");
		navItems.forEach((item) => {
			item.classList.remove("active");
		});

		// Add active class to current item
		activeItem.classList.add("active");
	}

	// Set active navigation by view name
	setActiveView(viewName) {
		const navItem = this.container.querySelector(`[data-view="${viewName}"]`);
		if (navItem) {
			this.setActiveNavItem(navItem);
		}
	}

	// Setup mobile detection
	setupMobileDetection() {
		// Initial check
		this.checkMobileState();

		// Listen for window resize
		window.addEventListener("resize", () => {
			this.checkMobileState();
		});
	}

	// Check if we're in mobile mode
	checkMobileState() {
		const wasMobile = this.isMobile;
		this.isMobile = window.innerWidth <= this.options.mobileBreakpoint;

		// Auto-collapse on mobile, auto-expand on desktop
		if (this.isMobile && !wasMobile) {
			this.collapseSidebar();
		} else if (!this.isMobile && wasMobile) {
			this.expandSidebar();
		}

		// Update body class for responsive styling
		if (this.isMobile) {
			document.body.classList.add("mobile-layout");
		} else {
			document.body.classList.remove("mobile-layout");
		}
	}

	// Add dashboard to navigation
	addDashboard(dashboard) {
		const dashboardsContent = this.container.querySelector(
			'[data-section-content="dashboards"]'
		);
		if (!dashboardsContent) return;

		const dashboardItem = document.createElement("div");
		dashboardItem.className = "nav-item dashboard-item";
		dashboardItem.dataset.view = dashboard.id;
		dashboardItem.innerHTML = `
			<span class="nav-icon">${dashboard.icon || "📊"}</span>
			<span class="nav-text">${dashboard.name}</span>
			<button class="item-options" data-item-id="${
				dashboard.id
			}" data-item-type="dashboard">⋯</button>
		`;

		dashboardsContent.appendChild(dashboardItem);

		// Bind click event
		dashboardItem.addEventListener("click", (e) => {
			this.handleNavItemClick(e, dashboardItem);
		});

		// Bind options event
		const optionsBtn = dashboardItem.querySelector(".item-options");
		optionsBtn.addEventListener("click", (e) => {
			e.stopPropagation();
			this.handleItemOptions(e);
		});
	}

	// Remove dashboard from navigation
	removeDashboard(dashboardId) {
		const dashboardItem = this.container.querySelector(
			`[data-view="${dashboardId}"]`
		);
		if (dashboardItem) {
			dashboardItem.remove();
		}
	}

	// Load section states from localStorage
	loadSectionStates() {
		try {
			const saved = localStorage.getItem("study-hall-section-states");
			if (saved) {
				this.sectionStates = { ...this.sectionStates, ...JSON.parse(saved) };
			}
		} catch (error) {
			console.warn("Failed to load section states:", error);
		}
	}

	// Save section states to localStorage
	saveSectionStates() {
		try {
			localStorage.setItem(
				"study-hall-section-states",
				JSON.stringify(this.sectionStates)
			);
		} catch (error) {
			console.warn("Failed to save section states:", error);
		}
	}

	// Load sidebar state from localStorage
	loadSidebarState() {
		try {
			const saved = localStorage.getItem("study-hall-sidebar-collapsed");
			this.isCollapsed = saved === "true";
		} catch (error) {
			console.warn("Failed to load sidebar state:", error);
		}
	}

	// Save sidebar state to localStorage
	saveSidebarState() {
		try {
			localStorage.setItem(
				"study-hall-sidebar-collapsed",
				this.isCollapsed.toString()
			);
		} catch (error) {
			console.warn("Failed to save sidebar state:", error);
		}
	}

	// Get current section states
	getSectionStates() {
		return { ...this.sectionStates };
	}

	// Set section states
	setSectionStates(states) {
		this.sectionStates = { ...this.sectionStates, ...states };
		this.applySectionStates();
		this.saveSectionStates();
	}

	// Get current sidebar state
	getSidebarState() {
		return {
			collapsed: this.isCollapsed,
			mobile: this.isMobile,
		};
	}

	// Refresh navigation (re-bind events)
	refresh() {
		this.bindEvents();
		this.applySectionStates();
	}

	// Destroy the navigation component
	destroy() {
		// Remove event listeners would be complex, so we'll just clear references
		this.container = null;
		console.log("NavigationComponent destroyed");
	}

	// Static method to create and initialize
	static create(options) {
		return new NavigationComponent(options);
	}
}

// Export for module use
export default NavigationComponent;
