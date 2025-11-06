// Debug Test - Quick App Loading Diagnosis
// Run this in browser console to diagnose the loading issue

console.log("=== Study Hall App Debug Test ===");

// Test 1: Check if DOM elements exist
console.log("1. Checking DOM elements...");
const sidebar = document.getElementById("sidebar");
const contentArea = document.getElementById("contentArea");
const myTasksContainer = document.getElementById("myTasksContainer");

console.log("- Sidebar element:", sidebar ? "✅ Found" : "❌ Missing");
console.log("- Content area:", contentArea ? "✅ Found" : "❌ Missing");
console.log(
	"- My tasks container:",
	myTasksContainer ? "✅ Found" : "❌ Missing"
);

// Test 2: Check if app instance exists
console.log("2. Checking app instance...");
console.log(
	"- window.studyHallApp:",
	window.studyHallApp ? "✅ Found" : "❌ Missing"
);

if (window.studyHallApp) {
	console.log("- App current view:", window.studyHallApp.currentView);
	console.log(
		"- View manager:",
		window.studyHallApp.viewManager ? "✅ Found" : "❌ Missing"
	);
	console.log(
		"- Navigation manager:",
		window.studyHallApp.navigationManager ? "✅ Found" : "❌ Missing"
	);
}

// Test 3: Check for JavaScript errors
console.log("3. Checking for errors...");
window.addEventListener("error", (e) => {
	console.error("🚨 JavaScript Error:", e.error);
	console.error("🚨 File:", e.filename, "Line:", e.lineno);
});

// Test 4: Try manual render
console.log("4. Testing manual render...");
if (window.studyHallApp) {
	try {
		console.log("Attempting manual dashboard render...");
		window.studyHallApp.renderDashboard();
		console.log("✅ Manual render completed");
	} catch (error) {
		console.error("❌ Manual render failed:", error);
	}
}

console.log("=== Debug Test Complete ===");
console.log(
	"Copy and paste this entire block into your browser console to run the test."
);
