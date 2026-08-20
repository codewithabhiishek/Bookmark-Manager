# 🔖 Retro Bookmark Manager & URL Vault

> A lightning-fast, local-first visual bookmark manager with a retro hacker terminal aesthetic, sound effects, instant keyboard navigation, and secure cross-device cloud sync.

---

## ✨ Features

- **⚡ Zero Friction (Local-First by Default):** Use the app immediately with zero logins, signups, or popups. All bookmarks persist in browser `localStorage`.
- **🔑 Secure Secret Sync Keys:** Optional cloud sync across laptop, phone, and tablet using high-entropy private passkeys.
- **🛡️ 100% Privacy & Open-Source Safe:** Open-source visitors safely use their own offline storage. No stranger can view, edit, or overwrite your personal links.
- **🔍 Spotlight Search (`/` Shortcut):** Press `/` anywhere to launch a command-palette style search with arrow-key navigation and instant URL filtering.
- **★ Pinned Stickers Strip:** Pin your most-visited websites to a prominent top sticker bar for one-click access.
- **🗂️ Category Boards & Drag-to-Reorder:** Organize links into customizable category cards with retro color tags and reorder links via drag-and-drop.
- **🎨 Retro Terminal Aesthetic:** CRT scanlines, pixelated headings, animated ticker marquees, and Web Audio 8-bit sound effects.
- **🌐 Smart Multi-Tier Favicon Engine:** Multi-stage fallback pipeline (Local Project Assets → DuckDuckGo → Google S2 → Direct Origin → Retro Monogram Badge).
- **📱 PWA & Auto-Update:** Installable as a standalone progressive web app with automatic version reload on new deployments.

---

## 📖 How to Use

### 1. 🖥️ Using Locally (Guest / Offline Mode)
* Simply open the application in your browser.
* Click **`[+ ADD LINK]`** or **`[+ ADD CATEGORY]`** to organize your links.
* Everything is saved automatically into your browser's local storage.
* No account, email, or database connection is needed.

### 2. 🔑 Enabling Cloud Sync (For Cross-Device Access)
If you want to access your bookmarks on both your laptop and mobile phone:
1. Click the **`[☁️ SYNC: LOCAL]`** button in the top action bar.
2. Click **`[ ⚡ GENERATE NEW SECURE KEY ]`**.
3. A unique 128-bit private key (e.g., `zen-a1b2-c3d4-e5f6-7890`) will be generated, copied to your clipboard, and your current bookmarks will be saved to your private cloud vault.
4. The button will turn green: **`[☁️ SYNC: ACTIVE]`**.

### 3. 📱 Syncing on Your Phone or Another Device
1. Open the website on your phone.
2. Click **`[☁️ SYNC: LOCAL]`**.
3. Paste your sync key into the **"LINK EXISTING KEY"** input box and click **`[ CONNECT ]`**.
4. All your bookmarks and categories will instantly sync! Any future changes on either device will synchronize in real-time.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| **`/`** | Open Spotlight Search palette from anywhere |
| **`↑` / `↓`** | Navigate search results up and down |
| **`Enter`** | Open selected search result |
| **`ESC`** | Close search palette or active modal |
| **`Double-Click Title`** | Quick-rename category |

---

## 🔒 Security & Privacy Architecture

- **Multi-Tenant Key Partitioning:** In the database (Vercel KV / Redis), bookmarks are isolated under `bookmarks_vault_${syncKey}`. Each user's data is completely separated.
- **Unguessable Cryptographic Keys:** Keys are generated with 128+ bits of entropy via `crypto.getRandomValues()`.
- **Payload Validation & DOS Protection:** The `/api/bookmarks` endpoint enforces strict JSON schema validation, caps array sizes, and limits payload size to 2 MB.
- **XSS & Injection Hardening:** All user-supplied URLs, titles, and categories are strictly HTML-escaped and sanitized before DOM injection.

---

## 🛠️ Tech Stack

- **Frontend:** HTML5, Vanilla CSS3 (Custom CRT Scanline Variables), Vanilla ES Modules.
- **Audio:** Native Web Audio API Synthesizer (Zero external audio files).
- **Backend API:** Vercel Edge Serverless Functions (`api/bookmarks.js`).
- **Database:** Vercel KV / Upstash Redis (Key-Value Storage).
- **Deployment:** Vercel.

---

## 🚀 Local Development Setup

### 1. Clone the repository
```bash
git clone https://github.com/codewithabhiishek/Bookmark-Manager.git
cd Bookmark-Manager
```

### 2. Run locally
You can serve the folder using any static file server:
```bash
# Using npx serve
npx serve .

# Or using Python
python3 -m http.server 3000
```
Open `http://localhost:3000` in your browser.

### 3. Environment Variables (Optional for Cloud Sync)
If you want to test cloud synchronization locally, create a `.env.local` file with your Vercel KV / Upstash credentials:
```env
KV_REST_API_URL="https://your-database.upstash.io"
KV_REST_API_TOKEN="your_upstash_rest_token"
```
Then run using Vercel CLI:
```bash
npx vercel dev
```

---

## 📂 Project Structure

```
├── api/
│   └── bookmarks.js          # Edge API endpoint with multi-tenant sync validation
├── assets/
│   └── project-icons/        # Custom project favicon assets
├── index.html                # Application layout & dialog templates
├── style.css                 # Retro terminal styling & CRT scanline effects
├── app.js                    # Application logic, sync management & UI rendering
├── favicon.ico / .svg        # Application branding favicons
├── vercel.json               # Vercel deployment & routing configuration
└── README.md                 # Project documentation
```

---

## 🤝 Contributing

Contributions, issues, and feature suggestions are welcome! Feel free to open a pull request or submit an issue.

---

## 📝 License

Distributed under the **MIT License**. Feel free to customize and make it your own!

