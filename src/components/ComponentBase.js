// Component Base Class
// Provides shared lifecycle patterns and utilities for all components

export class ComponentBase {
	constructor(options = {}) {
		this.options = {
			container: null,
			autoInit: true,
			...options,
		};

		this.container = null;
		this.isInitialized = false;
		this.isDestroyed = false;
		this.eventListeners = [];

		if (this.options.autoInit) {
			this.init();
		}
	}

	// Initialize the component (override in subclasses)
	init() {
		this.setupContainer();
		this.bindEvents();
		this.render();
		this.isInitialized = true;
		console.log(`${this.constructor.name} initialized`);
	}

	// Setup container element
	setupContainer() {
		if (typeof this.options.container === "string") {
			this.container = document.querySelector(this.options.container);
		} else if (this.options.container instanceof Element) {
			this.container = this.options.container;
		}

		if (!this.container) {
			throw new Error(`${this.constructor.name}: Container element not found`);
		}
	}

	// Bind events (override in subclasses)
	bindEvents() {
		// Override in subclasses
	}

	// Render the component (override in subclasses)
	render() {
		// Override in subclasses
	}

	// Add event listener with automatic cleanup tracking
	addEventListener(element, event, handler, options = {}) {
		if (!element) return;

		element.addEventListener(event, handler, options);

		// Track for cleanup
		this.eventListeners.push({
			element,
			event,
			handler,
			options,
		});
	}

	// Remove all tracked event listeners
	removeAllEventListeners() {
		this.eventListeners.forEach(({ element, event, handler, options }) => {
			if (element && element.removeEventListener) {
				element.removeEventListener(event, handler, options);
			}
		});
		this.eventListeners = [];
	}

	// Show the component
	show() {
		if (this.container) {
			this.container.style.display = "";
			this.container.classList.remove("hidden");
		}
	}

	// Hide the component
	hide() {
		if (this.container) {
			this.container.style.display = "none";
			this.container.classList.add("hidden");
		}
	}

	// Enable the component
	enable() {
		if (this.container) {
			this.container.classList.remove("disabled");
			const inputs = this.container.querySelectorAll(
				"input, button, select, textarea"
			);
			inputs.forEach((input) => (input.disabled = false));
		}
	}

	// Disable the component
	disable() {
		if (this.container) {
			this.container.classList.add("disabled");
			const inputs = this.container.querySelectorAll(
				"input, button, select, textarea"
			);
			inputs.forEach((input) => (input.disabled = true));
		}
	}

	// Update component options
	updateOptions(newOptions) {
		this.options = { ...this.options, ...newOptions };
		this.refresh();
	}

	// Refresh the component (re-render)
	refresh() {
		if (this.isInitialized && !this.isDestroyed) {
			this.render();
		}
	}

	// Validate component state
	validate() {
		if (this.isDestroyed) {
			throw new Error(
				`${this.constructor.name}: Cannot operate on destroyed component`
			);
		}
		return true;
	}

	// Get container element
	getContainer() {
		return this.container;
	}

	// Get component options
	getOptions() {
		return { ...this.options };
	}

	// Check if component is initialized
	getInitialized() {
		return this.isInitialized;
	}

	// Check if component is destroyed
	getDestroyed() {
		return this.isDestroyed;
	}

	// Destroy the component
	destroy() {
		if (this.isDestroyed) return;

		// Remove all event listeners
		this.removeAllEventListeners();

		// Clear container reference
		this.container = null;

		// Mark as destroyed
		this.isDestroyed = true;
		this.isInitialized = false;

		console.log(`${this.constructor.name} destroyed`);
	}

	// Static method to create and initialize
	static create(options) {
		return new this(options);
	}

	// Static method to create without auto-init
	static createDeferred(options) {
		return new this({ ...options, autoInit: false });
	}
}

// Component Registry for managing component instances
export class ComponentRegistry {
	constructor() {
		this.components = new Map();
	}

	// Register a component instance
	register(name, component) {
		if (this.components.has(name)) {
			console.warn(
				`ComponentRegistry: Overwriting existing component "${name}"`
			);
		}
		this.components.set(name, component);
	}

	// Get a component instance
	get(name) {
		return this.components.get(name);
	}

	// Check if a component exists
	has(name) {
		return this.components.has(name);
	}

	// Unregister a component
	unregister(name) {
		const component = this.components.get(name);
		if (component && typeof component.destroy === "function") {
			component.destroy();
		}
		return this.components.delete(name);
	}

	// Get all component names
	getNames() {
		return Array.from(this.components.keys());
	}

	// Get all components
	getAll() {
		return Array.from(this.components.values());
	}

	// Destroy all components
	destroyAll() {
		this.components.forEach((component, name) => {
			if (typeof component.destroy === "function") {
				component.destroy();
			}
		});
		this.components.clear();
	}

	// Get registry size
	size() {
		return this.components.size;
	}
}

// Global component registry instance
export const globalComponentRegistry = new ComponentRegistry();

// Export for module use
export default ComponentBase;
