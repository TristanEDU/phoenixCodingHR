# The Study Hall - AI Agent Instructions

## Project Overview

A single-page HR application with a ClickUp-inspired interface, featuring authentication, document management, task tracking, and role-based access control. The app follows a vanilla JavaScript architecture with localStorage persistence.

## Architecture Patterns

### Authentication System (`src/auth.js`)

- **Session Management**: Uses `study-hall-session` localStorage key with expiration times
- **Pre-configured Users**: Four hardcoded users in `authorizedUsers` array with specific roles
- **Route Protection**: Automatically redirects to `login.html` if not authenticated when accessing `app.html`
- **Remember Me**: Extends session from 8 hours to 30 days

### Main Application (`src/app.js`)

- **Single Class Pattern**: All functionality encapsulated in `StudyHallApp` class
- **View-based Routing**: Hash-based navigation (`#dashboard`, `#tasks`, etc.) with `showView()` method
- **State Management**: Uses multiple localStorage keys prefixed with `study-hall-`
- **Component Rendering**: Each view has dedicated render methods (`renderTasks()`, `renderDocuments()`, etc.)

### Data Persistence Patterns

```javascript
// Standard localStorage pattern used throughout
load[Entity]() {
    try {
        const saved = localStorage.getItem("study-hall-[entity]");
        return saved ? JSON.parse(saved) : defaultData;
    } catch (error) {
        return defaultData;
    }
}
```

## File Structure & Navigation

### Critical Path Dependencies

- `index.html` → `pages/login.html` → `pages/app.html`
- All pages reference `designs/style.css/style.css` (note the nested folder structure)
- Authentication required: `src/auth.js` must load before app functionality

### View System

Views are DOM elements with `.view` class and specific IDs:

- `dashboard-view` (default)
- `tasks-view`, `docs-view`, `policies-view`, etc.
- Navigation via `data-view` attributes on `.nav-item` elements

## Development Conventions

### Event Binding Pattern

```javascript
// Standard pattern in bindEvents()
document.querySelectorAll(".nav-item").forEach((item) => {
	item.addEventListener("click", (e) => {
		e.preventDefault();
		const view = item.dataset.view;
		this.navigateToView(view);
	});
});
```

### Modal Management

- Single modal container reused for different content types
- Always call `this.closeModal()` after form submission
- Use `this.showNotification(message, type)` for user feedback

### Role-Based Access Control

```javascript
// Check permissions before allowing navigation
const adminViews = ["roles", "users", "audit", "settings"];
if (
	adminViews.includes(viewName) &&
	!this.hasPermission("canAccessAdminPanel")
) {
	this.showNotification("Access denied. Insufficient permissions.", "error");
	return;
}
```

## Data Management Patterns

### Task System

- Auto-incremented IDs via `getNextTaskId()`
- User assignment via email matching with `getCurrentUser().email`
- Status tracking: `pending`, `in-progress`, `completed`
- Always refresh dashboard after task operations

### Document Management

Four distinct document types with separate storage:

- `documents` - Knowledge base articles
- `policies` - HR policies
- `trainings` - Training materials
- `templates` - Document templates

### Sidebar State Management

```javascript
// Section collapse states persisted
this.sectionStates = {
	favorites: true,
	dashboards: true,
	documentation: true,
	spaces: true,
};
```

## UI/UX Patterns

### Responsive Behavior

- Sidebar auto-collapses on mobile (`window.innerWidth <= 768`)
- Mobile menu button appears on small screens
- All navigation triggers `this.collapseSidebar()` on mobile

### Loading States

```javascript
// Standard loading pattern
container.innerHTML = '<div class="loading-placeholder">Loading...</div>';
// Replace with actual content after data processing
```

### Notification System

- `this.showNotification(message, "success"|"error")`
- Auto-dismisses error messages after 5 seconds
- Success messages used for confirmations

## Testing & Debugging

### Local Development

1. Open `index.html` directly in browser (no build step required)
2. Use browser dev tools to inspect localStorage keys prefixed `study-hall-`
3. Test authentication with pre-configured users in `src/auth.js`

### Key Debug Points

- Check `window.authSystem.getCurrentUser()` for auth status
- Inspect `window.studyHallApp.currentView` for navigation state
- localStorage corruption requires manual clearing of `study-hall-*` keys

## Integration Notes

### External Dependencies

- No external frameworks or build tools
- Uses native browser APIs (localStorage, fetch if needed)
- Font: Inter from system fonts or Google Fonts fallback

### Asset Paths

All pages in `/pages/` use relative paths:

- Stylesheet: `../designs/style.css/style.css`
- Scripts: `../src/auth.js`, `../src/app.js`
- Background image referenced in CSS: `../assets/images/StudyhallBackground.png`

When adding new features, follow the established patterns: create localStorage persistence methods, add view rendering logic, implement proper role-based access control, and ensure mobile responsiveness.
