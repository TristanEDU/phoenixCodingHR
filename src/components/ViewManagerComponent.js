// View Manager Component
// Handles route-based view switching, transitions, and view lifecycle

export class ViewManagerComponent {
	constructor(options = {}) {
		this.options = {
			container: options.container || "#contentArea",
			defaultView: options.defaultView || "dashboard",
			routes: options.routes || {},
			transition: options.transition || "fade", // fade, slide, none
			transitionDuration: options.transitionDuration || 200,
			onViewChange: options.onViewChange || null,
			onViewLoad: options.onViewLoad || null,
			onViewError: options.onViewError || null,
			...options,
		};

		this.currentView = null;
		this.previousView = null;
		this.container = null;
		this.views = new Map(); // Cache for view instances
		this.isTransitioning = false;

		this.init();
	}

	// Initialize the view manager
	init() {
		// Get container element
		if (typeof this.options.container === "string") {
			this.container = document.querySelector(this.options.container);
		} else {
			this.container = this.options.container;
		}

		if (!this.container) {
			throw new Error("ViewManager: Container element not found");
		}

		// Setup hash-based routing
		this.setupRouting();

		// Load initial view
		this.loadInitialView();
	}

	// Setup hash-based routing
	setupRouting() {
		// Listen for hash changes
		window.addEventListener("hashchange", (e) => {
			this.handleRouteChange();
		});

		// Listen for popstate (browser back/forward)
		window.addEventListener("popstate", (e) => {
			this.handleRouteChange();
		});
	}

	// Load initial view based on hash or default
	loadInitialView() {
		const hash = window.location.hash.slice(1); // Remove #
		const viewName = hash || this.options.defaultView;
		this.navigateToView(viewName, false); // Don't update hash on initial load
	}

	// Handle route changes
	handleRouteChange() {
		if (this.isTransitioning) {
			return; // Prevent concurrent transitions
		}

		const hash = window.location.hash.slice(1);
		const viewName = hash || this.options.defaultView;

		if (viewName !== this.currentView) {
			this.navigateToView(viewName, false);
		}
	}

	// Navigate to a specific view
	async navigateToView(viewName, updateHash = true) {
		if (this.isTransitioning) {
			return false;
		}

		// Check if route exists
		if (!this.isValidRoute(viewName)) {
			console.warn(`ViewManager: Invalid route "${viewName}"`);
			if (this.options.onViewError) {
				this.options.onViewError(viewName, "Invalid route");
			}
			return false;
		}

		try {
			this.isTransitioning = true;

			// Update hash if needed
			if (updateHash && viewName !== this.getHashRoute()) {
				window.location.hash = viewName;
			}

			// Call before view change callback
			if (this.options.onViewChange) {
				const result = await this.options.onViewChange(
					viewName,
					this.currentView
				);
				if (result === false) {
					this.isTransitioning = false;
					return false; // Navigation cancelled
				}
			}

			// Store previous view
			this.previousView = this.currentView;

			// Hide current view
			if (this.currentView) {
				await this.hideView(this.currentView);
			}

			// Show new view
			await this.showView(viewName);

			// Update current view
			this.currentView = viewName;

			// Call after view load callback
			if (this.options.onViewLoad) {
				this.options.onViewLoad(viewName, this.previousView);
			}

			return true;
		} catch (error) {
			console.error("ViewManager: Navigation error", error);
			if (this.options.onViewError) {
				this.options.onViewError(viewName, error);
			}
			return false;
		} finally {
			this.isTransitioning = false;
		}
	}

	// Show a specific view
	async showView(viewName) {
		const viewElement = this.getViewElement(viewName);

		if (!viewElement) {
			throw new Error(`View element for "${viewName}" not found`);
		}

		// Apply transition
		await this.applyTransition(viewElement, "show");

		// Mark as active
		viewElement.classList.add("view-active");

		// Update navigation state
		this.updateNavigationState(viewName);
	}

	// Hide a specific view
	async hideView(viewName) {
		const viewElement = this.getViewElement(viewName);

		if (!viewElement) {
			return; // View not found, nothing to hide
		}

		// Apply transition
		await this.applyTransition(viewElement, "hide");

		// Remove active state
		viewElement.classList.remove("view-active");
	}

	// Get view element by name
	getViewElement(viewName) {
		return this.container.querySelector(
			`#${viewName}-view, .${viewName}-view, [data-view="${viewName}"]`
		);
	}

	// Apply transition effects
	async applyTransition(element, direction) {
		if (!element || this.options.transition === "none") {
			return;
		}

		return new Promise((resolve) => {
			const duration = this.options.transitionDuration;

			if (this.options.transition === "fade") {
				if (direction === "show") {
					element.style.opacity = "0";
					element.style.display = "block";
					element.style.transition = `opacity ${duration}ms ease-in-out`;

					requestAnimationFrame(() => {
						element.style.opacity = "1";
						setTimeout(resolve, duration);
					});
				} else {
					element.style.transition = `opacity ${duration}ms ease-in-out`;
					element.style.opacity = "0";

					setTimeout(() => {
						element.style.display = "none";
						resolve();
					}, duration);
				}
			} else if (this.options.transition === "slide") {
				if (direction === "show") {
					element.style.transform = "translateX(100%)";
					element.style.display = "block";
					element.style.transition = `transform ${duration}ms ease-in-out`;

					requestAnimationFrame(() => {
						element.style.transform = "translateX(0)";
						setTimeout(resolve, duration);
					});
				} else {
					element.style.transition = `transform ${duration}ms ease-in-out`;
					element.style.transform = "translateX(-100%)";

					setTimeout(() => {
						element.style.display = "none";
						element.style.transform = "";
						resolve();
					}, duration);
				}
			} else {
				// No transition
				if (direction === "show") {
					element.style.display = "block";
				} else {
					element.style.display = "none";
				}
				resolve();
			}
		});
	}

	// Update navigation state (highlight active nav items)
	updateNavigationState(viewName) {
		// Remove active class from all nav items
		const navItems = document.querySelectorAll(".nav-item, [data-view]");
		navItems.forEach((item) => {
			item.classList.remove("active");
		});

		// Add active class to current nav item
		const activeNav = document.querySelector(`[data-view="${viewName}"]`);
		if (activeNav) {
			activeNav.classList.add("active");
		}

		// Update document title if route has title
		const route = this.options.routes[viewName];
		if (route && route.title) {
			document.title = `${route.title} - The Study Hall`;
		}
	}

	// Check if route is valid
	isValidRoute(viewName) {
		// Check if view element exists
		const viewElement = this.getViewElement(viewName);
		if (viewElement) {
			return true;
		}

		// Check if route is defined
		return this.options.routes.hasOwnProperty(viewName);
	}

	// Get current hash route
	getHashRoute() {
		return window.location.hash.slice(1);
	}

	// Register a new route
	registerRoute(name, config) {
		this.options.routes[name] = {
			title: config.title || name,
			element: config.element || null,
			guard: config.guard || null, // Function to check if route can be accessed
			...config,
		};
	}

	// Remove a route
	unregisterRoute(name) {
		delete this.options.routes[name];
	}

	// Get current view name
	getCurrentView() {
		return this.currentView;
	}

	// Get previous view name
	getPreviousView() {
		return this.previousView;
	}

	// Go back to previous view
	goBack() {
		if (this.previousView) {
			this.navigateToView(this.previousView);
		} else {
			this.navigateToView(this.options.defaultView);
		}
	}

	// Refresh current view
	refresh() {
		if (this.currentView) {
			// Force re-render by hiding and showing
			this.hideView(this.currentView).then(() => {
				this.showView(this.currentView);
			});
		}
	}

	// Destroy the view manager
	destroy() {
		window.removeEventListener("hashchange", this.handleRouteChange);
		window.removeEventListener("popstate", this.handleRouteChange);
		this.views.clear();
		this.container = null;
		this.currentView = null;
		this.previousView = null;
	}

	// Static method to create and initialize
	static create(options) {
		return new ViewManagerComponent(options);
	}
}

// Export for module use
export default ViewManagerComponent;
