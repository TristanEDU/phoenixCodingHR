# Phoenix HR - Project Structure

## 📁 Directory Organization

```
phoenixCodingHR/
├── 📄 index.html                 # Landing page (marketing site)
├── 📄 README.md                  # Project documentation
├── 📁 pages/                     # All application pages
│   ├── 📄 app.html              # Main dashboard application
│   └── 📄 login.html            # Authentication page
├── 📁 src/                       # JavaScript source files
│   ├── 📄 app.js                # Main application logic
│   ├── 📄 auth.js               # Authentication system
│   └── 📄 main.js               # Landing page scripts
├── 📁 designs/                   # Stylesheets and design assets
│   └── 📁 style.css/
│       └── 📄 style.css         # Main stylesheet
├── 📁 assets/                    # Media and static assets
│   ├── 📁 images/               # Project images
│   └── 📁 icons/                # Icon files
└── 📁 docs/                      # Project documentation
```

## 🔗 Navigation Flow

1. **Landing Page** (`index.html`)

   - Marketing homepage
   - Links to authentication system

2. **Authentication** (`pages/login.html`)

   - Secure login portal
   - Session management
   - Redirects to dashboard on success

3. **Dashboard** (`pages/app.html`)
   - Main HR application
   - ClickUp-style interface
   - Protected by authentication

## 🛡️ Security Features

- Session-based authentication
- Route protection for dashboard
- Predefined user accounts for internal access
- Automatic logout and redirect functionality

## 🎨 Design System

- Consistent dark theme across all pages
- Professional HR-focused styling
- Responsive design for all screen sizes
- Custom CSS variables for easy theming

## 📝 Development Notes

- All pages in `/pages/` use relative paths to access assets
- Authentication system automatically handles redirects
- Modular JavaScript architecture with separate concerns
- CSS organized with clear section separation

## 🚀 Quick Start

1. Open `index.html` in a web browser
2. Click "Login" to access the authentication system
3. Use test credentials to access the dashboard
4. Explore the ClickUp-style interface and features

## 📋 Test Accounts

| Email                 | Password     | Role               |
| --------------------- | ------------ | ------------------ |
| admin@phoenixhr.com   | phoenix2025! | HR Manager         |
| hr@phoenixhr.com      | hr123secure  | HR Specialist      |
| manager@phoenixhr.com | mgr456pass   | Department Manager |
