// The Study Hall - Main Entry Point
// Orchestrates module loading and app initialization with proper dependency injection

import { authSystem } from "./auth.js";
import { StudyHallApp } from "./app.js";

// Global app instance for backward compatibility with onclick handlers
let studyHallApp;

// Initialize app when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
	console.log("DOM Content Loaded - starting app initialization");
	try {
		// Initialize the application
		studyHallApp = new StudyHallApp();

		// Make app globally accessible for onclick handlers (temporary backward compatibility)
		window.studyHallApp = studyHallApp;

		console.log("StudyHallApp instance created successfully:", studyHallApp);

		// Add debug functions for development
		setupDebugFunctions();

		// Global error handler
		window.addEventListener("error", (event) => {
			console.error("Global error caught:", event.error);
			console.error("Error details:", event);
		});

		console.log("Application initialization completed successfully!");
	} catch (error) {
		console.error("Failed to initialize StudyHallApp:", error);
		console.error("Error stack:", error.stack);
	}
});

// Setup debug functions for development
function setupDebugFunctions() {
	// Add global debug function
	window.debugApp = () => {
		console.log("StudyHallApp debug info:");
		console.log("- Instance exists:", !!studyHallApp);
		console.log("- showTaskModal method:", typeof studyHallApp?.showTaskModal);
		console.log("- Auth system:", !!studyHallApp?.authSystem);
		console.log(
			"- Current user:",
			studyHallApp?.authSystem?.getCurrentUser()?.name
		);
	};

	// Add simple test function to verify onclick works
	window.testButtonClick = () => {
		alert("Button click test successful! The global scope is working.");
		console.log(
			"Test button clicked - studyHallApp available:",
			!!studyHallApp
		);
	};

	// Add debug function for document UI manager
	window.testDocumentUIManager = () => {
		console.log("DocumentUIManager test:");
		console.log("- Available:", !!window.documentUIManager);
		console.log("- Type:", typeof window.documentUIManager);
		if (window.documentUIManager) {
			console.log(
				"- showCreateDocumentModal method:",
				typeof window.documentUIManager.showCreateDocumentModal
			);
			console.log(
				"- showImportModal method:",
				typeof window.documentUIManager.showImportModal
			);
			// Test method call
			try {
				window.documentUIManager.showCreateDocumentModal();
				console.log("- showCreateDocumentModal call: SUCCESS");
			} catch (error) {
				console.error("- showCreateDocumentModal call: ERROR", error);
			}
		}
	};

	// Add test for TaskManager
	window.testTaskManager = () => {
		console.log("TaskManager test:");
		console.log("- Available:", !!studyHallApp?.taskManager);
		console.log("- Type:", typeof studyHallApp?.taskManager);
		if (studyHallApp?.taskManager) {
			console.log(
				"- loadTaskTemplates method:",
				typeof studyHallApp.taskManager.loadTaskTemplates
			);
			console.log(
				"- loadDependencies method:",
				typeof studyHallApp.taskManager.loadDependencies
			);
			console.log(
				"- Templates loaded:",
				studyHallApp.taskManager.taskTemplates?.length || 0
			);
			console.log(
				"- Dependencies loaded:",
				studyHallApp.taskManager.taskDependencies?.length || 0
			);
		} else {
			console.error("TaskManager not available");
		}
	};

	// Add test for modal closing
	window.testModalClose = () => {
		console.log("Testing modal close functionality:");

		// Test creating a simple modal
		if (studyHallApp && typeof studyHallApp.createModal === "function") {
			console.log("Creating test modal...");
			const modal = studyHallApp.createModal(
				"Test Modal",
				"<p>This is a test modal. Try closing it with X, Escape, or clicking outside.</p>"
			);
			console.log("Modal created:", modal);
			console.log("Current modal reference:", studyHallApp.currentModal);

			// Add a test close button
			const testCloseBtn = document.createElement("button");
			testCloseBtn.textContent = "Test Close";
			testCloseBtn.onclick = () => {
				console.log("Test close button clicked");
				studyHallApp.closeModal();
			};
			modal.querySelector(".modal-body").appendChild(testCloseBtn);
		} else {
			console.error("createModal method not available");
		}
	};

	// Add comprehensive modal state debug
	window.debugModalState = () => {
		console.log("=== Modal State Debug ===");
		console.log("currentModal reference:", studyHallApp?.currentModal);
		console.log(
			"All modal-overlay elements:",
			document.querySelectorAll(".modal-overlay")
		);
		console.log(
			"customModalOverlay element:",
			document.getElementById("customModalOverlay")
		);
		console.log("Body children count:", document.body.children.length);

		// List all modal-like elements
		const allModals = document.querySelectorAll('[class*="modal"]');
		console.log("All modal-related elements:", allModals);
		allModals.forEach((el, i) => {
			console.log(`Modal ${i}:`, el.className, el.id);
		});
	};

	// Add force modal close for testing
	window.forceCloseAllModals = () => {
		console.log("=== Forcing close of all modals ===");

		// Reset app reference
		if (studyHallApp) {
			studyHallApp.currentModal = null;
		}

		// Remove all modal-related elements
		const allModalSelectors = [
			".modal-overlay",
			"#customModalOverlay",
			"#dashboardModalOverlay",
			"#modalContainer",
			'[class*="modal-"]',
			'[id*="modal"]',
			'[id*="Modal"]',
		];
		allModalSelectors.forEach((selector) => {
			const elements = document.querySelectorAll(selector);
			console.log(`Removing ${elements.length} elements matching: ${selector}`);
			elements.forEach((el) => {
				try {
					el.remove();
				} catch (error) {
					console.error(`Error removing element:`, error);
				}
			});
		});

		console.log("Force close completed");
	};

	// Add test for dashboard modal specifically
	window.testDashboardModal = () => {
		console.log("Testing dashboard modal functionality:");

		if (
			studyHallApp &&
			typeof studyHallApp.showCreateDashboardModal === "function"
		) {
			console.log("Opening dashboard modal...");
			studyHallApp.showCreateDashboardModal();

			// Add emergency close button to dashboard modal
			setTimeout(() => {
				const dashboardModal = document.getElementById("dashboardModalOverlay");
				if (dashboardModal) {
					const emergencyBtn = document.createElement("button");
					emergencyBtn.textContent = "EMERGENCY CLOSE";
					emergencyBtn.style.cssText =
						"position: absolute; top: 10px; right: 10px; z-index: 10001; background: red; color: white; border: none; padding: 5px 10px; cursor: pointer;";
					emergencyBtn.onclick = () => {
						console.log("Emergency dashboard close clicked");
						dashboardModal.remove();
						if (studyHallApp) studyHallApp.currentModal = null;
					};
					dashboardModal.appendChild(emergencyBtn);
					console.log("Emergency close button added to dashboard modal");
				}
			}, 100);
		} else {
			console.error("showCreateDashboardModal method not available");
		}
	};

	console.log("Debug functions available:");
	console.log("- debugApp() - Show app debug info");
	console.log("- testButtonClick() - Test button functionality");
	console.log("- testDocumentUIManager() - Test document UI");
	console.log("- testTaskManager() - Test task manager");
	console.log("- testModalClose() - Test modal closing");
	console.log("- debugModalState() - Debug modal state");
	console.log("- forceCloseAllModals() - Force close all modals");
	console.log("- testDashboardModal() - Test dashboard modal");
}

// Export for potential use in other modules
export { studyHallApp };
