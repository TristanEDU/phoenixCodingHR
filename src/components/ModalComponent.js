// Unified Modal Component System
// Provides consistent modal behavior across the entire application

export class ModalComponent {
	constructor(options = {}) {
		this.options = {
			title: options.title || "",
			content: options.content || "",
			size: options.size || "medium", // small, medium, large, fullscreen
			closable: options.closable !== false, // default true
			backdrop: options.backdrop !== false, // default true (click to close)
			keyboard: options.keyboard !== false, // default true (escape to close)
			className: options.className || "",
			buttons: options.buttons || [], // array of button configs
			onShow: options.onShow || null,
			onHide: options.onHide || null,
			onSubmit: options.onSubmit || null,
			...options,
		};

		this.modal = null;
		this.isVisible = false;
		this.escapeHandler = null;
		this.id = `modal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
	}

	// Create and show the modal
	show() {
		if (this.isVisible) {
			return this;
		}

		// Remove any existing modals first
		this.removeExistingModals();

		// Create modal structure
		this.modal = this.createModalElement();

		// Add to DOM
		document.body.appendChild(this.modal);

		// Bind events
		this.bindEvents();

		// Set state
		this.isVisible = true;

		// Focus management
		this.manageFocus();

		// Callback
		if (this.options.onShow) {
			this.options.onShow(this);
		}

		console.log(`Modal ${this.id} shown`);
		return this;
	}

	// Hide and remove the modal
	hide() {
		if (!this.isVisible || !this.modal) {
			return this;
		}

		// Callback before hiding
		if (this.options.onHide) {
			this.options.onHide(this);
		}

		// Remove event listeners
		this.unbindEvents();

		// Remove from DOM
		this.modal.remove();

		// Reset state
		this.modal = null;
		this.isVisible = false;

		console.log(`Modal ${this.id} hidden`);
		return this;
	}

	// Update modal content
	updateContent(content) {
		if (!this.modal) return this;

		const body = this.modal.querySelector(".modal-body");
		if (body) {
			body.innerHTML = content;
		}
		return this;
	}

	// Update modal title
	updateTitle(title) {
		if (!this.modal) return this;

		const titleElement = this.modal.querySelector(".modal-title");
		if (titleElement) {
			titleElement.textContent = title;
		}
		return this;
	}

	// Create the modal DOM element
	createModalElement() {
		const modal = document.createElement("div");
		modal.className = `modal-overlay modal-size-${this.options.size} ${this.options.className}`;
		modal.id = this.id;
		modal.setAttribute("role", "dialog");
		modal.setAttribute("aria-modal", "true");
		modal.setAttribute("aria-labelledby", `${this.id}-title`);

		modal.innerHTML = `
			<div class="modal-content">
				${this.createHeader()}
				${this.createBody()}
				${this.createFooter()}
			</div>
		`;

		return modal;
	}

	// Create modal header
	createHeader() {
		if (!this.options.title && !this.options.closable) {
			return "";
		}

		return `
			<div class="modal-header">
				${
					this.options.title
						? `<h2 class="modal-title" id="${this.id}-title">${this.options.title}</h2>`
						: ""
				}
				${
					this.options.closable
						? `<button class="modal-close" aria-label="Close modal">&times;</button>`
						: ""
				}
			</div>
		`;
	}

	// Create modal body
	createBody() {
		return `<div class="modal-body">${this.options.content}</div>`;
	}

	// Create modal footer
	createFooter() {
		if (!this.options.buttons || this.options.buttons.length === 0) {
			return "";
		}

		const buttonsHtml = this.options.buttons
			.map((button) => {
				const className = `btn ${button.className || "btn-secondary"}`;
				const attrs = Object.entries(button.attributes || {})
					.map(([key, value]) => `${key}="${value}"`)
					.join(" ");

				return `<button class="${className}" data-action="${
					button.action || ""
				}" ${attrs}>${button.text}</button>`;
			})
			.join("");

		return `<div class="modal-footer">${buttonsHtml}</div>`;
	}

	// Bind event listeners
	bindEvents() {
		if (!this.modal) return;

		// Close button
		if (this.options.closable) {
			const closeBtn = this.modal.querySelector(".modal-close");
			if (closeBtn) {
				closeBtn.addEventListener("click", (e) => {
					e.preventDefault();
					e.stopPropagation();
					this.hide();
				});
			}
		}

		// Backdrop click
		if (this.options.backdrop) {
			this.modal.addEventListener("click", (e) => {
				if (e.target === this.modal) {
					this.hide();
				}
			});
		}

		// Escape key
		if (this.options.keyboard) {
			this.escapeHandler = (e) => {
				if (e.key === "Escape") {
					this.hide();
				}
			};
			document.addEventListener("keydown", this.escapeHandler);
		}

		// Button actions
		const buttons = this.modal.querySelectorAll(
			".modal-footer button[data-action]"
		);
		buttons.forEach((button) => {
			button.addEventListener("click", (e) => {
				const action = button.dataset.action;
				this.handleButtonAction(action, e, button);
			});
		});

		// Form submission if present
		const form = this.modal.querySelector("form");
		if (form && this.options.onSubmit) {
			form.addEventListener("submit", (e) => {
				e.preventDefault();
				this.options.onSubmit(e, this, form);
			});
		}
	}

	// Unbind event listeners
	unbindEvents() {
		if (this.escapeHandler) {
			document.removeEventListener("keydown", this.escapeHandler);
			this.escapeHandler = null;
		}
	}

	// Handle button actions
	handleButtonAction(action, event, button) {
		switch (action) {
			case "close":
			case "cancel":
				this.hide();
				break;
			case "submit":
				const form = this.modal.querySelector("form");
				if (form) {
					form.dispatchEvent(new Event("submit"));
				}
				break;
			default:
				// Custom action - call callback if provided
				if (this.options.onButtonClick) {
					this.options.onButtonClick(action, event, button, this);
				}
		}
	}

	// Focus management for accessibility
	manageFocus() {
		if (!this.modal) return;

		// Focus first focusable element
		setTimeout(() => {
			const focusableElements = this.modal.querySelectorAll(
				'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
			);

			if (focusableElements.length > 0) {
				focusableElements[0].focus();
			}
		}, 100);
	}

	// Remove any existing modals to prevent stacking
	removeExistingModals() {
		const existingModals = document.querySelectorAll(".modal-overlay");
		existingModals.forEach((modal) => modal.remove());
	}

	// Static method to create and show a simple modal quickly
	static show(title, content, options = {}) {
		const modal = new ModalComponent({
			title,
			content,
			...options,
		});
		return modal.show();
	}

	// Static method to create a confirmation modal
	static confirm(title, content, onConfirm, onCancel = null) {
		return new ModalComponent({
			title,
			content,
			buttons: [
				{ text: "Cancel", action: "cancel", className: "btn-secondary" },
				{ text: "Confirm", action: "confirm", className: "btn-primary" },
			],
			onButtonClick: (action, event, button, modal) => {
				if (action === "confirm" && onConfirm) {
					onConfirm(modal);
				} else if (action === "cancel" && onCancel) {
					onCancel(modal);
				}
				modal.hide();
			},
		}).show();
	}

	// Static method to create an alert modal
	static alert(title, content, onOk = null) {
		return new ModalComponent({
			title,
			content,
			buttons: [{ text: "OK", action: "ok", className: "btn-primary" }],
			onButtonClick: (action, event, button, modal) => {
				if (onOk) onOk(modal);
				modal.hide();
			},
		}).show();
	}

	// Static method to create a form modal
	static form(title, formContent, onSubmit, options = {}) {
		return new ModalComponent({
			title,
			content: `<form class="modal-form">${formContent}</form>`,
			buttons: [
				{ text: "Cancel", action: "cancel", className: "btn-secondary" },
				{ text: "Submit", action: "submit", className: "btn-primary" },
			],
			onSubmit,
			...options,
		}).show();
	}
}
