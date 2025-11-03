Phoenix Coding HR — Theme and Landing Page

What I added

- `designs/style.css/style.css`: Reusable theme stylesheet for all pages.
- `index.html`: Linked the stylesheet, cleaned up header/footer, and pointed the module script to `src/main.js`.

How to preview

1. Open `index.html` in your browser (double-click or use Live Server extension).
2. The page uses the CSS file at `designs/style.css/style.css`.

How to use the theme on other pages

- Add this line inside the `<head>` of any page:

<link rel="stylesheet" href="designs/style.css/style.css">

Notes

- The CSS file path follows the existing `designs/style.css/` folder in the project. If you'd prefer a flat `designs/style.css` file, I can move it and update the link.
- `src/main.js` is currently empty; include any small interactions there.

Next steps (optional)

- Add a small build step (PostCSS) or move the stylesheet to `designs/style.css` if you want a simpler path.
