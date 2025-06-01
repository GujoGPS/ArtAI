# ArtAI: Your Intelligent PDF Analyzer 📄🧠

> A web application to help you read, understand, and chat with your PDF documents using AI-powered summaries and contextual Q&A.

[![React](https://img.shields.io/badge/React-18.x-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Gemini API](https://img.shields.io/badge/Gemini_API-Google_AI-4285F4?style=for-the-badge&logo=google-cloud&logoColor=white)](https://ai.google.dev/docs/gemini_api_overview)
[![Status](https://img.shields.io/badge/Status-Active_Development-green?style=for-the-badge)]()

---

### Table of Contents
* [📖 About The Project](#-about-the-project)
* [✨ Key Features](#-key-features)
* [🛠️ Technologies Used](#️-technologies-used)
* [⚙️ How It Works](#️-how-it-works)
* [❔❔ Getting Started](#-getting-started)
  * [Prerequisites](#prerequisites)
  * [Environment Variables](#environment-variables)
  * [Installation](#installation)
* [📂 Folder Structure](#-folder-structure)

---

## 📖 About The Project

**ArtAI** is a React-based web application designed to enhance your PDF reading experience. It leverages the power of Google's Gemini AI to provide insightful summaries of entire documents and allows for contextual conversations based on the PDF content. Your chat history and document summaries are conveniently saved locally in your browser, linked to the unique content of each PDF, ensuring you can pick up where you left off, even if you rename the file.

This tool is perfect for students, researchers, or anyone who needs to quickly grasp the essence of PDF documents and interact with their content intelligently.

---

## ✨ Key Features

- **Secure PDF Handling:** PDFs are processed client-side; only extracted text for AI interaction is sent to the API.
- **Interactive PDF Viewer:**
    - Upload and view PDF documents directly in the browser.
    - Smooth page-by-page navigation.
- **AI-Powered Summarization:**
    - Generates a comprehensive summary of the entire PDF document upon first load (if no summary is already stored for that PDF content).
- **Contextual AI Chat:**
    - Engage in conversations with the AI about the loaded PDF.
    - The AI uses both the full document summary and the text of the currently viewed page to provide relevant answers.
    - Supports general Q&A even without a PDF loaded.
- **Markdown Support:** AI responses are rendered with Markdown formatting for better readability (bold, lists, etc.).
- **User-Friendly Interface:**
    - Auto-resizing chat input box for longer messages.
    - Collapsible sidebar displaying a history of recently opened PDFs.
- **Persistent Local History:**
    - Chat conversations and document summaries are saved in the browser's `localStorage`.
    - History is associated with the PDF's content hash, making it resilient to file renaming.

---

## 🛠️ Technologies Used

- **Frontend:** [React](https://reactjs.org/) (v18.x) with [TypeScript](https://www.typescriptlang.org/)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **PDF Rendering:** [react-pdf](https://github.com/wojtekmaj/react-pdf) (which uses PDF.js)
- **AI Integration:** [@google/genai](https://www.npmjs.com/package/@google/genai) for Google's Gemini API
- **Markdown Rendering:** [react-markdown](https://github.com/remarkjs/react-markdown) with `remark-gfm`
- **Text Area Autosize:** [react-textarea-autosize](https://github.com/Andarist/react-textarea-autosize)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) (via CDN for simplicity in this setup)
- **Content Hashing:** Web Crypto API (SHA-256)

---

## ⚙️ How It Works

1.  **PDF Upload & Hashing:**
    - When a user uploads a PDF, the application reads its content client-side.
    - A unique SHA-256 hash is calculated from the file's binary content. This hash serves as the identifier for the PDF's content.
2.  **History & Summary Retrieval:**
    - The app checks `localStorage` for an existing entry associated with the calculated hash.
    - If an entry exists, it loads the saved chat messages and the previously generated document summary.
3.  **Text Extraction & Summarization (if needed):**
    - Text is extracted from the currently viewed page for immediate contextual chat.
    - If no summary is found in `localStorage` for the PDF's hash, the application extracts text from all pages of the PDF. This full text is then sent to the Gemini API to generate a comprehensive summary. The summary is then saved to `localStorage`.
4.  **AI Interaction (Chat):**
    - When the user sends a message, the application constructs a prompt for the Gemini API.
    - This prompt includes:
        - The general summary of the entire PDF (if available).
        - The extracted text from the currently viewed page.
        - The user's question.
    - The AI's response is then displayed in the chat interface.
5.  **Local Storage:**
    - All chat messages and the document summary are saved in the browser's `localStorage`, keyed by the PDF's content hash. This ensures data persistence across sessions for the same PDF content, regardless of filename changes.

---

## 🚀 Getting Started

To run a local copy of ArtAI, follow these steps.

### Prerequisites

- [Node.js](https://nodejs.org/en/) (v18 or newer recommended)
- `npm` (usually comes with Node.js)

### Environment Variables

Create a `.env` file in the root directory of the project and add your Gemini API Key:

```env
GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE