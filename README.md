# ArtAI: Your Intelligent PDF Analyzer 📄🧠

> A web application to help you read, understand, and chat with your PDF documents using AI-powered summaries and contextual Q&A.

### Table of Contents

* [📖 About The Project](#-about-the-project)
* [✨ Key Features](#-key-features)
* [🛠️ Technologies Used](#️-technologies-used)
* [⚙️ How It Works (Updated)](#️-how-it-works-updated)
* [🚀 Getting Started](#-getting-started)
  * [Prerequisites](#prerequisites)
  * [Environment Variables (Backend)](#environment-variables-backend)
  * [Installation](#installation)
  * [Running the Application](#running-the-application)
* [📂 Folder Structure](#-folder-structure)

---

## 📖 About The Project

**ArtAI** is a React-based web application designed to enhance your PDF reading experience. It leverages the power of Google's Gemini AI (via a secure backend proxy) to provide insightful summaries of entire documents and allows for contextual conversations based on the PDF content. Your chat history and document summaries are conveniently saved locally in your browser, linked to the unique content of each PDF, ensuring you can pick up where you left off, even if you rename the file.

This tool is perfect for students, researchers, or anyone who needs to quickly grasp the essence of PDF documents and interact with their content intelligently.

---

## ✨ Key Features

* **Secure API Key Handling:** Your Gemini API key is stored securely on the backend and never exposed to the frontend/browser.
* **Interactive PDF Viewer:**
  * Upload and view PDF documents directly in the browser.
  * Smooth page-by-page navigation.
* **AI-Powered Summarization:**
  * Generates a comprehensive summary of the entire PDF document upon first load (if no summary is already stored for that PDF content).
* **Contextual AI Chat:**
  * Engage in conversations with the AI about the loaded PDF.
  * The AI uses both the full document summary and the text of the currently viewed page to provide relevant answers.
  * Supports general Q&A even without a PDF loaded.
* **Markdown Support:** AI responses are rendered with Markdown formatting for better readability (bold, lists, etc.).
* **User-Friendly Interface:**
  * Auto-resizing chat input box for longer messages.
  * Collapsible sidebar displaying a history of recently opened PDFs.
* **Persistent Local History:**
  * Chat conversations and document summaries are saved in the browser's `localStorage`.
  * History is associated with the PDF's content hash, making it resilient to file renaming.

---

## 🛠️ Technologies Used

* **Frontend:** [React](https://reactjs.org/) (v18.x) with [TypeScript](https://www.typescriptlang.org/)
* **Backend:** [Node.js](https://nodejs.org/) with [Express.js](https://expressjs.com/)
* **Build Tool:** [Vite](https://vitejs.dev/)
* **PDF Rendering:** [react-pdf](https://github.com/wojtekmaj/react-pdf) (which uses PDF.js)
* **AI Integration:** [@google/generative-ai](https://www.npmjs.com/package/@google/generative-ai) (on the backend) for Google's Gemini API
* **Markdown Rendering:** [react-markdown](https://github.com/remarkjs/react-markdown) with `remark-gfm`
* **Text Area Autosize:** [react-textarea-autosize](https://github.com/Andarist/react-textarea-autosize)
* **Styling:** [Tailwind CSS](https://tailwindcss.com/) (via CDN for simplicity in this setup)
* **Content Hashing:** Web Crypto API (SHA-256)

---

## ⚙️ How It Works (Updated)

1. **PDF Upload & Hashing:**
   * When a user uploads a PDF, the application reads its content client-side.
   * A unique SHA-256 hash is calculated from the file's binary content. This hash serves as the identifier for the PDF's content.
2. **History & Summary Retrieval:**
   * The app checks `localStorage` for an existing entry associated with the calculated hash.
   * If an entry exists, it loads the saved chat messages and the previously generated document summary.
3. **Text Extraction & Summarization (if needed):**
   * Text is extracted from the currently viewed page for immediate contextual chat.
   * If no summary is found in `localStorage` for the PDF's hash, the application extracts text from all pages of the PDF. This full text is then sent as part of a prompt to the **local backend server**.
   * The backend server securely calls the Gemini API to generate a comprehensive summary. The summary is returned to the frontend and then saved to `localStorage`.
4. **AI Interaction (Chat):**
   * When the user sends a message, the application constructs a prompt.
   * This prompt includes:
     * The general summary of the entire PDF (if available).
     * The extracted text from the currently viewed page.
     * The user's question.
   * The frontend sends this complete prompt to the **local backend server**.
   * The backend server securely calls the Gemini API.
   * The AI's response is returned to the frontend and displayed in the chat interface.
5. **Local Storage:**
   * All chat messages and the document summary are saved in the browser's `localStorage`, keyed by the PDF's content hash.

---

## 🚀 Getting Started

To run a local copy of ArtAI, follow these steps.

### Prerequisites

* [Node.js](https://nodejs.org/en/) (v18 or newer recommended)
* `npm` (usually comes with Node.js)

### Environment Variables (Backend)

Create a `.env` file in the **root directory** of the project. This file will be used by the backend server to store your Gemini API Key securely.

```
# .env
GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
```

**Important:** Ensure this `.env` file is listed in your `.gitignore` file to prevent it from being committed to version control.

### Installation

1. Clone the repository (if you haven't already):
   ```bash
   git clone <your-repo-url>
   cd <your-repo-name>
   ```

2. Install NPM packages for both frontend and backend:
   ```bash
   npm install
   ```

### Running the Application

You need to run two processes concurrently: the Vite development server for the frontend and the Node.js server for the backend.

1.  **Start the Backend Server:**
    Open a terminal window and run:
    ```bash
    npm run server
    ```
    This will start the backend proxy server, typically on `http://localhost:3001`.

2.  **Start the Frontend Development Server:**
    Open a *new* terminal window (do not close the backend server's terminal) and run:
    ```bash
    npm run dev
    ```
    This will start the Vite development server, typically on `http://localhost:5173`. Your browser should open to this address automatically, or you can navigate to it manually.

Alternatively, you can use the `start` script which uses `npm-run-all` to run both concurrently (if you've installed `npm-run-all` as a dev dependency, which is included in the updated `package.json`):
```bash
npm start
```

---

## 📂 Folder Structure

```
/
├── public/
│   └── ... # Public assets
├── src/
│   ├── components/
│   │   ├── ChatInterface.tsx
│   │   ├── PdfViewer.tsx
│   │   └── Sidebar.tsx
│   ├── services/
│   │   └── geminiService.ts # Now calls the backend
│   ├── App.tsx
│   ├── index.css
│   ├── index.tsx
│   ├── types.ts
│   └── vite-env.d.ts
├── .env               # (Local, DO NOT COMMIT) API Key for the backend
├── .gitignore
├── index.html
├── package.json
├── package-lock.json
├── README.md
├── server.mjs         # (NEW) Express backend server
├── tsconfig.json
└── vite.config.ts     # (Modified) No longer injects API_KEY
