// Phoenix HR Authentication System
// Handles login, logout, and session management

class AuthSystem {
	constructor() {
		this.authorizedUsers = [
			{
				email: "t3sserak@proton.me",
				password: "Password",
				name: "Russ",
				role: "SpongeLord",
				department: "HR Director",
			},
			{
				email: "admin@phoenixhr.com",
				password: "phoenix2025!",
				name: "Admin User",
				role: "HR Manager",
				department: "Human Resources",
			},
			{
				email: "hr@phoenixhr.com",
				password: "hr123secure",
				name: "Sarah Johnson",
				role: "HR Specialist",
				department: "Human Resources",
			},
			{
				email: "manager@phoenixhr.com",
				password: "mgr456pass",
				name: "Mike Chen",
				role: "Department Manager",
				department: "Operations",
			},
		];

		this.sessionKey = "phoenix-hr-session";
		this.init();
	}

	init() {
		// Check if we're on the login page
		if (document.getElementById("loginForm")) {
			this.initLoginPage();
		}

		// Check if user is already logged in when accessing app
		if (window.location.pathname.includes("app.html")) {
			this.checkAuthentication();
		}
	}

	initLoginPage() {
		const form = document.getElementById("loginForm");
		const passwordToggle = document.getElementById("passwordToggle");
		const forgotPassword = document.getElementById("forgotPassword");

		// Bind form submission
		form.addEventListener("submit", (e) => {
			e.preventDefault();
			this.handleLogin();
		});

		// Password visibility toggle
		passwordToggle.addEventListener("click", () => {
			this.togglePasswordVisibility();
		});

		// Forgot password (placeholder for now)
		forgotPassword.addEventListener("click", (e) => {
			e.preventDefault();
			this.handleForgotPassword();
		});

		// Clear any existing errors on input
		const inputs = form.querySelectorAll("input");
		inputs.forEach((input) => {
			input.addEventListener("input", () => {
				this.clearFieldError(input.name);
			});
		});

		// Check if user is already logged in
		if (this.isAuthenticated()) {
			window.location.href = "pages/app.html";
		}
	}

	async handleLogin() {
		const form = document.getElementById("loginForm");
		const formData = new FormData(form);
		const credentials = {
			email: formData.get("email").toLowerCase().trim(),
			password: formData.get("password"),
			rememberMe: formData.get("rememberMe") === "on",
		};

		// Clear previous errors
		this.clearAllErrors();

		// Validate input
		if (!this.validateInput(credentials)) {
			return;
		}

		// Show loading state
		this.setLoadingState(true);

		// Simulate network delay for realistic feel
		await new Promise((resolve) => setTimeout(resolve, 1500));

		// Check credentials
		const user = this.authenticateUser(credentials);

		if (user) {
			// Success - create session
			this.createSession(user, credentials.rememberMe);

			// Show success and redirect
			this.showSuccessMessage();
			setTimeout(() => {
				window.location.href = "app.html";
			}, 1000);
		} else {
			// Failed authentication
			this.setLoadingState(false);
			this.showLoginError();
		}
	}

	validateInput(credentials) {
		let isValid = true;

		// Email validation
		if (!credentials.email) {
			this.showFieldError("email", "Email address is required");
			isValid = false;
		} else if (!this.isValidEmail(credentials.email)) {
			this.showFieldError("email", "Please enter a valid email address");
			isValid = false;
		}

		// Password validation
		if (!credentials.password) {
			this.showFieldError("password", "Password is required");
			isValid = false;
		} else if (credentials.password.length < 6) {
			this.showFieldError("password", "Password must be at least 6 characters");
			isValid = false;
		}

		return isValid;
	}

	authenticateUser(credentials) {
		return this.authorizedUsers.find(
			(user) =>
				user.email === credentials.email &&
				user.password === credentials.password
		);
	}

	createSession(user, rememberMe) {
		const session = {
			user: {
				email: user.email,
				name: user.name,
				role: user.role,
				department: user.department,
			},
			loginTime: new Date().toISOString(),
			rememberMe: rememberMe,
			expiresAt: rememberMe
				? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
				: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(), // 8 hours
		};

		localStorage.setItem(this.sessionKey, JSON.stringify(session));
		console.log("Session created for:", user.name);
	}

	isAuthenticated() {
		try {
			const session = JSON.parse(localStorage.getItem(this.sessionKey));
			if (!session) return false;

			// Check if session has expired
			const now = new Date();
			const expiresAt = new Date(session.expiresAt);

			if (now > expiresAt) {
				this.logout();
				return false;
			}

			return true;
		} catch (error) {
			console.warn("Invalid session data");
			this.logout();
			return false;
		}
	}

	getCurrentUser() {
		try {
			const session = JSON.parse(localStorage.getItem(this.sessionKey));
			return session?.user || null;
		} catch (error) {
			return null;
		}
	}

	checkAuthentication() {
		if (!this.isAuthenticated()) {
			// Show access denied message and redirect
			alert("Access denied. Please sign in to continue.");
			window.location.href = "login.html";
		} else {
			console.log("User authenticated:", this.getCurrentUser()?.name);
		}
	}

	logout() {
		localStorage.removeItem(this.sessionKey);
		console.log("User logged out");

		// If on app page, redirect to login
		if (window.location.pathname.includes("app.html")) {
			window.location.href = "login.html";
		}
	}

	// UI Helper Methods
	setLoadingState(loading) {
		const submitBtn = document.getElementById("submitBtn");
		const btnText = submitBtn.querySelector(".btn-text");
		const btnSpinner = submitBtn.querySelector(".btn-spinner");
		const loadingOverlay = document.getElementById("loadingOverlay");

		if (loading) {
			submitBtn.disabled = true;
			btnText.style.display = "none";
			btnSpinner.style.display = "inline";
			loadingOverlay.style.display = "flex";
		} else {
			submitBtn.disabled = false;
			btnText.style.display = "inline";
			btnSpinner.style.display = "none";
			loadingOverlay.style.display = "none";
		}
	}

	showFieldError(fieldName, message) {
		const errorElement = document.getElementById(`${fieldName}Error`);
		const inputElement = document.getElementById(fieldName);

		if (errorElement) {
			errorElement.textContent = message;
			errorElement.style.display = "block";
		}

		if (inputElement) {
			inputElement.classList.add("error");
		}
	}

	clearFieldError(fieldName) {
		const errorElement = document.getElementById(`${fieldName}Error`);
		const inputElement = document.getElementById(fieldName);

		if (errorElement) {
			errorElement.style.display = "none";
		}

		if (inputElement) {
			inputElement.classList.remove("error");
		}
	}

	clearAllErrors() {
		const errorElements = document.querySelectorAll(".form-error");
		const inputElements = document.querySelectorAll(".form-group input");

		errorElements.forEach((el) => (el.style.display = "none"));
		inputElements.forEach((el) => el.classList.remove("error"));
	}

	showLoginError() {
		// Show general login error
		const form = document.getElementById("loginForm");
		const existingError = form.querySelector(".login-error");

		if (existingError) {
			existingError.remove();
		}

		const errorDiv = document.createElement("div");
		errorDiv.className = "login-error";
		errorDiv.innerHTML = `
			<span class="error-icon">⚠️</span>
			<span>Invalid email or password. Please try again.</span>
		`;

		form.insertBefore(errorDiv, form.querySelector(".form-options"));

		// Auto-remove after 5 seconds
		setTimeout(() => {
			errorDiv.remove();
		}, 5000);
	}

	showSuccessMessage() {
		const loadingOverlay = document.getElementById("loadingOverlay");
		loadingOverlay.innerHTML = `
			<div class="loading-spinner">
				<div class="success-icon">✅</div>
				<p>Welcome back! Redirecting...</p>
			</div>
		`;
	}

	togglePasswordVisibility() {
		const passwordInput = document.getElementById("password");
		const toggleIcon = document.querySelector(".toggle-icon");

		if (passwordInput.type === "password") {
			passwordInput.type = "text";
			toggleIcon.textContent = "🙈";
		} else {
			passwordInput.type = "password";
			toggleIcon.textContent = "👁️";
		}
	}

	handleForgotPassword() {
		alert(
			"Please contact your IT administrator to reset your password.\n\nFor security reasons, password resets must be handled internally."
		);
	}

	isValidEmail(email) {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(email);
	}
}

// Initialize authentication system
document.addEventListener("DOMContentLoaded", () => {
	window.authSystem = new AuthSystem();
});

// Export for use in other files
window.AuthSystem = AuthSystem;
