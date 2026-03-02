# NIHONJUGATE (日本十Gate) ⛩️

> **Tactical Verb Systems.**
> A precision-engineered Japanese verb conjugation trainer built for rapid acquisition of Godan and Ichidan morphology.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Status](https://img.shields.io/badge/status-operational-red)

## ⚔️ Overview

**Nihonjugate** is a full-stack study tool designed to drill Japanese verb conjugations. Unlike standard flashcards, it focuses purely on the mechanical rules of morphology across **15 verb forms** (e.g., Past, Te-form, Causative-Passive, etc.).

It utilizes a **Weighted Random Algorithm** to prioritize verbs and forms you are struggling with, ensuring efficient training sessions.

## ⚡ Features

* **Cyber-Samurai UI:** A dark-mode, immersive interface built with Tailwind CSS.
* **Intelligent Input:** Integrated **Wanakana** library automatically converts Romaji input to Hiragana/Kanji on the fly.
* **Tactical Config Grid:**
    * Heatmap visualization of mastery levels (Untouched, Struggling, Mastered).
    * Bulk Select/Deselect for targeted training sessions.
* **Weighted Randomness:** The "Duel" mode prioritizes items with lower accuracy scores.
* **Gamification:**
    * Real-time streak tracking.
    * Dynamic ranking titles (Ashigaru → Samurai → Daimyo → Shogun → Kami).
* **SQLite Persistence:** Your progress is saved locally to `verbs.db`.

## 🛠️ Tech Stack

**Frontend:**
* **Framework:** React (v18) + Vite
* **Language:** TypeScript
* **Styling:** Tailwind CSS (v3) + PostCSS
* **Input Handling:** Wanakana (IME support)

**Backend:**
* **Runtime:** Node.js (Express)
* **Database:** SQLite3 (via `better-sqlite3`)
* **Runner:** `ts-node-dev` for hot-reloading TypeScript

## 🚀 Getting Started

### Prerequisites
* Node.js (v18 or higher recommended)
* npm

### Installation

1.  **Clone the repository** (or navigate to root):
    ```bash
    cd nihonjugate
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Initialize the Dojo:**
    ```bash
    npm run dev
    ```

    * This command uses `concurrently` to launch both the backend and frontend.
    * **Server:** Runs on `http://localhost:3001` (Auto-seeds database on first run).
    * **Client:** Runs on `http://localhost:5173`.

## 🎮 Usage Guide

1.  **Configuration (The Grid):**
    * On startup, navigate to the **GRID**.
    * Click **DESELECT ALL** to clear the default set.
    * Click specific Verb cards or Forms to activate them (Active items appear brighter).
    * *Tip:* Red items indicate areas where your accuracy is low.

2.  **The Duel:**
    * Click **DUEL** to enter the quiz mode.
    * Type the answer in **Romaji**. The input will convert to Hiragana automatically.
    * Press **Enter** to submit.
    * If correct: Press **Enter** again to advance.
    * If incorrect: The correct answer is displayed. Type it out or press Enter to continue.

## 📖 Documentation

* [Architecture Overview](docs/ARCHITECTURE.md) - Technical breakdown of the project structure and data flow.
* [Release Notes](RELEASE-NOTES.md) - History of version updates.

## 📁 Project Structure

```text
nihonjugate/
├── server/
│   ├── index.ts        # Express API & Routes
│   └── db.ts           # SQLite Connection & CSV Seeding Logic
├── src/
│   ├── components/
│   │   ├── ConfigGrid.tsx  # Heatmap & Selection UI
│   │   ├── Quiz.tsx        # Main Game Loop & Wanakana logic
│   │   └── ErrorBoundary.tsx # Crash protection
│   ├── App.tsx         # Layout & Routing (State-based)
│   └── main.tsx        # React Entry Point
├── verbs.db            # Local SQLite database (Generated on start)
├── tailwind.config.js  # UI Theme Configuration
└── tsconfig.json       # TypeScript Rules