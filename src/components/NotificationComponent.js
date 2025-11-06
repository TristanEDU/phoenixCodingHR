// Unified Notification Component System
// Provides consistent notification/toast behavior across the entire application

export class NotificationComponent {
	constructor(options = {}) {
		this.options = {
			message: options.message || "",
			type: options.type || "info", // info, success, warning, error
			duration: options.duration || this.getDefaultDuration(options.type),
			position: options.position || "top-right", // top-right, top-left, bottom-right, bottom-left, top-center
			closable: options.closable !== false, // default true
			action: options.action || null, // { text: "Action", callback: function }
			persistent: options.persistent || false, // don't auto-dismiss
			className: options.className || "",
			...options,
		};

		this.notification = null;
		this.isVisible = false;
		this.timeoutId = null;
		this.id = `notification-${Date.now()}-${Math.random()
			.toString(36)
			.substr(2, 9)}`;
	}

	// Get default duration based on notification type
	getDefaultDuration(type) {
		const durations = {
			info: 4000,
			success: 3000,
			warning: 5000,
			error: 6000,
		};
		return durations[type] || 4000;
	}

	// Show the notification
	show() {
		if (this.isVisible) {
			return this;
		}

		this.createNotification();
		this.addToContainer();
		this.bindEvents();
		this.animate("in");

		// Auto-dismiss unless persistent
		if (!this.options.persistent && this.options.duration > 0) {
			this.timeoutId = setTimeout(() => {
				this.hide();
			}, this.options.duration);
		}

		this.isVisible = true;

		// Call onShow callback if provided
		if (typeof this.options.onShow === "function") {
			this.options.onShow(this);
		}

		return this;
	}

	// Hide the notification
	hide() {
		if (!this.isVisible) {
			return this;
		}

		// Clear auto-dismiss timer
		if (this.timeoutId) {
			clearTimeout(this.timeoutId);
			this.timeoutId = null;
		}

		this.animate("out", () => {
			this.remove();
		});

		this.isVisible = false;

		// Call onHide callback if provided
		if (typeof this.options.onHide === "function") {
			this.options.onHide(this);
		}

		return this;
	}

	// Create the notification element
	createNotification() {
		this.notification = document.createElement("div");
		this.notification.className = `notification notification-${this.options.type} ${this.options.className}`;
		this.notification.id = this.id;
		this.notification.setAttribute("role", "alert");
		this.notification.setAttribute("aria-live", "polite");

		// Add icon based on type
		const icon = this.getIcon(this.options.type);

		// Add action button if provided
		const actionButton = this.options.action
			? `<button class="notification-action" type="button">${this.options.action.text}</button>`
			: "";

		// Add close button if closable
		const closeButton = this.options.closable
			? '<button class="notification-close" type="button" aria-label="Close notification">&times;</button>'
			: "";

		this.notification.innerHTML = `
			<div class="notification-content">
				<div class="notification-icon">${icon}</div>
				<div class="notification-message">${this.options.message}</div>
				${actionButton}
				${closeButton}
			</div>
			<div class="notification-progress ${
				this.options.persistent ? "hidden" : ""
			}"></div>
		`;
	}

	// Get icon for notification type
	getIcon(type) {
		const icons = {
			info: "ℹ️",
			success: "✅",
			warning: "⚠️",
			error: "❌",
		};
		return icons[type] || icons.info;
	}

	// Add notification to container
	addToContainer() {
		let container = NotificationComponent.getContainer(this.options.position);
		container.appendChild(this.notification);
	}

	// Bind event handlers
	bindEvents() {
		// Close button
		const closeBtn = this.notification.querySelector(".notification-close");
		if (closeBtn) {
			closeBtn.addEventListener("click", (e) => {
				e.preventDefault();
				this.hide();
			});
		}

		// Action button
		const actionBtn = this.notification.querySelector(".notification-action");
		if (
			actionBtn &&
			this.options.action &&
			typeof this.options.action.callback === "function"
		) {
			actionBtn.addEventListener("click", (e) => {
				e.preventDefault();
				this.options.action.callback(this);
			});
		}

		// Pause on hover if not persistent
		if (!this.options.persistent) {
			this.notification.addEventListener("mouseenter", () => {
				if (this.timeoutId) {
					clearTimeout(this.timeoutId);
					this.timeoutId = null;
				}
			});

			this.notification.addEventListener("mouseleave", () => {
				if (this.isVisible && !this.timeoutId) {
					this.timeoutId = setTimeout(() => {
						this.hide();
					}, this.options.duration);
				}
			});
		}
	}

	// Animate notification in/out
	animate(direction, callback) {
		if (!this.notification) return;

		const progressBar = this.notification.querySelector(
			".notification-progress"
		);

		if (direction === "in") {
			// Slide in animation
			this.notification.style.transform = "translateX(100%)";
			this.notification.style.opacity = "0";

			requestAnimationFrame(() => {
				this.notification.style.transition =
					"transform 0.3s ease-out, opacity 0.3s ease-out";
				this.notification.style.transform = "translateX(0)";
				this.notification.style.opacity = "1";
			});

			// Progress bar animation for auto-dismiss
			if (
				progressBar &&
				!this.options.persistent &&
				this.options.duration > 0
			) {
				setTimeout(() => {
					progressBar.style.transition = `width ${this.options.duration}ms linear`;
					progressBar.style.width = "0%";
				}, 100);
			}
		} else {
			// Slide out animation
			this.notification.style.transition =
				"transform 0.3s ease-in, opacity 0.3s ease-in";
			this.notification.style.transform = "translateX(100%)";
			this.notification.style.opacity = "0";

			setTimeout(() => {
				if (callback) callback();
			}, 300);
		}
	}

	// Remove notification from DOM
	remove() {
		if (this.notification && this.notification.parentNode) {
			this.notification.parentNode.removeChild(this.notification);
		}
		this.notification = null;
	}

	// Static methods for quick notifications
	static show(message, type = "info", options = {}) {
		const notification = new NotificationComponent({
			message,
			type,
			...options,
		});
		return notification.show();
	}

	static success(message, options = {}) {
		return NotificationComponent.show(message, "success", options);
	}

	static error(message, options = {}) {
		return NotificationComponent.show(message, "error", options);
	}

	static warning(message, options = {}) {
		return NotificationComponent.show(message, "warning", options);
	}

	static info(message, options = {}) {
		return NotificationComponent.show(message, "info", options);
	}

	// Get or create notification container
	static getContainer(position = "top-right") {
		const containerId = `notification-container-${position}`;
		let container = document.getElementById(containerId);

		if (!container) {
			container = document.createElement("div");
			container.id = containerId;
			container.className = `notification-container notification-${position}`;
			container.setAttribute("aria-live", "polite");
			container.setAttribute("aria-label", "Notifications");
			document.body.appendChild(container);
		}

		return container;
	}

	// Clear all notifications
	static clearAll() {
		const containers = document.querySelectorAll(
			'[id^="notification-container-"]'
		);
		containers.forEach((container) => {
			const notifications = container.querySelectorAll(".notification");
			notifications.forEach((notification) => {
				notification.style.transition =
					"transform 0.3s ease-in, opacity 0.3s ease-in";
				notification.style.transform = "translateX(100%)";
				notification.style.opacity = "0";

				setTimeout(() => {
					if (notification.parentNode) {
						notification.parentNode.removeChild(notification);
					}
				}, 300);
			});
		});
	}

	// Clear notifications by type
	static clearByType(type) {
		const notifications = document.querySelectorAll(`.notification-${type}`);
		notifications.forEach((notification) => {
			notification.style.transition =
				"transform 0.3s ease-in, opacity 0.3s ease-in";
			notification.style.transform = "translateX(100%)";
			notification.style.opacity = "0";

			setTimeout(() => {
				if (notification.parentNode) {
					notification.parentNode.removeChild(notification);
				}
			}, 300);
		});
	}
}

// Export for module use
export default NotificationComponent;
