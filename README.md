# 🔖 Bookmark Manager & URL Vault

A lightweight, local-first visual bookmark manager and URL organizer. Securely store, search, and categorize your favorite websites in a clean, visual folder-based workspace.

## ✨ Features

- **🗂️ Visual Categorization:** Organize bookmarks into custom folders and tag them for quick access.
- **🔍 Instant Search:** Live filter-as-you-type search matching titles, tags, and URLs.
- **🔗 Import/Export:** Secure backup and restore of bookmark databases as JSON.
- **🎨 Clean Responsive UI:** Optimized layout for seamless navigation on both desktop and mobile viewports.
- **💾 Local-First Architecture:** Uses local storage for fast and secure data persistence without relying on external databases.

## 🛠️ Tech Stack

- **Frontend Structure:** HTML5 & Semantic Elements
- **Styling:** Custom CSS3 layout tokens, variables, and responsive design
- **Logic:** Vanilla ES6+ JavaScript
- **State Management:** LocalStorage API
- **Serverless/API:** Serverless functions configured in `api` directory
- **Deployment:** Ready for Vercel deployment (`vercel.json`)

## 🚀 Getting Started

### Prerequisites

You only need a modern web browser to run this application locally!

### Running Locally

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd Bookmark-Manager
   ```

2. **Open directly:**
   You can simply open `index.html` in your browser.

3. **Or, run with a local server (recommended for API features):**
   ```bash
   npx serve .
   ```
   Navigate to `http://localhost:3000` (or the port specified by the runner).

## 📂 Project Structure

- `index.html`: Main application structure
- `style.css`: Custom styles and UI design
- `app.js`: Core logic for bookmark management, search, and categorization
- `api/`: Serverless endpoints for backend functionality
- `assets/`: Images, icons, and static files

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## 📝 License

This project is open-source and available under the [MIT License](LICENSE).
