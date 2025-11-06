// The Study Hall Authentication System
// Handles login, logout, and session management

export class AuthSystem {
	constructor() {
		this.authorizedUsers = [
			{
				id: "EMP001",
				email: "t3sserak@proton.me",
				password: "Password",
				name: "Russ",
				firstName: "Russ",
				lastName: "",
				role: "SpongeLord",
				position: "Chief Executive Officer",
				department: "Executive",
				managerId: null,
				directReports: ["EMP002", "EMP003", "EMP004"],
				startDate: "2023-01-01",
				status: "active",
				phone: "+1-555-0001",
				location: "Main Office",
				permissions: ["admin", "hr", "finance", "operations"],
				lastLogin: null,
			},
			{
				id: "EMP002",
				email: "admin@studyhall.com",
				password: "study2025!",
				name: "Admin User",
				firstName: "Admin",
				lastName: "User",
				role: "HR Manager",
				position: "Human Resources Manager",
				department: "Human Resources",
				managerId: "EMP001",
				directReports: ["EMP003"],
				startDate: "2023-02-15",
				status: "active",
				phone: "+1-555-0002",
				location: "Main Office",
				permissions: ["hr", "admin", "users"],
				lastLogin: null,
			},
			{
				id: "EMP003",
				email: "hr@studyhall.com",
				password: "hr123secure",
				name: "Sarah Johnson",
				firstName: "Sarah",
				lastName: "Johnson",
				role: "HR Specialist",
				position: "HR Business Partner",
				department: "Human Resources",
				managerId: "EMP002",
				directReports: [],
				startDate: "2023-03-01",
				status: "active",
				phone: "+1-555-0003",
				location: "Main Office",
				permissions: ["hr", "users"],
				lastLogin: null,
			},
			{
				id: "EMP004",
				email: "manager@studyhall.com",
				password: "mgr456pass",
				name: "Mike Chen",
				firstName: "Mike",
				lastName: "Chen",
				role: "Department Manager",
				position: "Operations Manager",
				department: "Operations",
				managerId: "EMP001",
				directReports: [],
				startDate: "2023-01-15",
				status: "active",
				phone: "+1-555-0004",
				location: "Operations Floor",
				permissions: ["operations", "users"],
				lastLogin: null,
			},
		];

		this.sessionKey = "study-hall-session";
		this.failedAttempts = this.loadFailedAttempts();
		this.init();
	}

	init() {
		// Load any saved user data
		this.loadUserData();

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
			window.location.href = "app.html";
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

		// Check if account is locked
		if (this.isAccountLocked(credentials.email)) {
			this.showFieldError(
				"email",
				"Account temporarily locked due to too many failed attempts. Please try again in 15 minutes."
			);
			return;
		}

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
			// Success - clear failed attempts and create session
			this.clearFailedAttempts(credentials.email);
			this.createSession(user, credentials.rememberMe);

			// Show success and redirect
			this.showSuccessMessage();
			setTimeout(() => {
				window.location.href = "app.html";
			}, 1000);
		} else {
			// Failed authentication - record attempt
			this.recordFailedAttempt(credentials.email);
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
				id: user.id,
				email: user.email,
				name: user.name,
				firstName: user.firstName,
				lastName: user.lastName,
				role: user.role,
				position: user.position,
				department: user.department,
				managerId: user.managerId,
				permissions: user.permissions,
				location: user.location,
			},
			loginTime: new Date().toISOString(),
			rememberMe: rememberMe,
			expiresAt: rememberMe
				? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
				: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(), // 8 hours
		};

		// Update last login time
		user.lastLogin = new Date().toISOString();
		this.saveUserData();

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

	// Security and user management methods
	loadFailedAttempts() {
		try {
			const attempts = localStorage.getItem("study-hall-failed-attempts");
			return attempts ? JSON.parse(attempts) : {};
		} catch (error) {
			return {};
		}
	}

	saveFailedAttempts() {
		localStorage.setItem(
			"study-hall-failed-attempts",
			JSON.stringify(this.failedAttempts)
		);
	}

	isAccountLocked(email) {
		const attempts = this.failedAttempts[email];
		if (!attempts) return false;

		const now = new Date().getTime();
		const lockoutTime = 15 * 60 * 1000; // 15 minutes

		if (attempts.count >= 5 && now - attempts.lastAttempt < lockoutTime) {
			return true;
		}

		// Reset if lockout period has passed
		if (attempts.count >= 5 && now - attempts.lastAttempt >= lockoutTime) {
			delete this.failedAttempts[email];
			this.saveFailedAttempts();
		}

		return false;
	}

	recordFailedAttempt(email) {
		if (!this.failedAttempts[email]) {
			this.failedAttempts[email] = { count: 0, lastAttempt: 0 };
		}

		this.failedAttempts[email].count++;
		this.failedAttempts[email].lastAttempt = new Date().getTime();
		this.saveFailedAttempts();
	}

	clearFailedAttempts(email) {
		delete this.failedAttempts[email];
		this.saveFailedAttempts();
	}

	saveUserData() {
		localStorage.setItem(
			"study-hall-users",
			JSON.stringify(this.authorizedUsers)
		);
	}

	loadUserData() {
		try {
			const saved = localStorage.getItem("study-hall-users");
			if (saved) {
				this.authorizedUsers = JSON.parse(saved);
			}
		} catch (error) {
			console.warn("Failed to load user data:", error);
		}
	}

	// Permission checking methods
	hasPermission(permission) {
		const user = this.getCurrentUser();
		if (!user || !user.permissions) return false;

		return (
			user.permissions.includes(permission) ||
			user.permissions.includes("admin")
		);
	}

	canAccessAdminPanel() {
		return this.hasPermission("admin");
	}

	canManageUsers() {
		return this.hasPermission("hr") || this.hasPermission("admin");
	}

	canViewReports() {
		return (
			this.hasPermission("hr") ||
			this.hasPermission("admin") ||
			this.hasPermission("operations")
		);
	}

	// Hierarchy methods
	getDirectReports(userId = null) {
		const currentUserId = userId || this.getCurrentUser()?.id;
		if (!currentUserId) return [];

		const user = this.authorizedUsers.find((u) => u.id === currentUserId);
		if (!user) return [];

		return this.authorizedUsers.filter((u) =>
			user.directReports.includes(u.id)
		);
	}

	getManager(userId = null) {
		const currentUserId = userId || this.getCurrentUser()?.id;
		if (!currentUserId) return null;

		const user = this.authorizedUsers.find((u) => u.id === currentUserId);
		if (!user || !user.managerId) return null;

		return this.authorizedUsers.find((u) => u.id === user.managerId);
	}

	getAllSubordinates(userId = null) {
		const currentUserId = userId || this.getCurrentUser()?.id;
		if (!currentUserId) return [];

		let subordinates = [];
		const directReports = this.getDirectReports(currentUserId);

		directReports.forEach((report) => {
			subordinates.push(report);
			subordinates = subordinates.concat(this.getAllSubordinates(report.id));
		});

		return subordinates;
	}
}

// Create and export a singleton instance
export const authSystem = new AuthSystem();
