# ⛩️ Nihonjugate Release Notes

## v1.3.0: Mission Control & iOS Protocols
**Release Date:** January 27, 2026
**Focus:** Configuration UI & iOS Compatibility

### 🗺️ Tactical Grid Upgrades
* **Rich Intel Display:** Configuration buttons now display the **Kanji and Kana preview** for every conjugation form, allowing users to see exactly what they are enabling before selecting it.
* **Bulk Command Protocols:**
    * **Global Override:** Added "SELECT ALL" and "DESELECT ALL" buttons to instantly toggle the entire database.
    * **Unit Control:** Added per-verb "Select All" / "Clear" buttons to quickly configure specific verb groups (e.g., enabling all forms of *Taberu*).

### 📱 Mobile Field Fixes
* **iOS Keyboard Sync:** Implemented a synchronous focus override to bypass Safari's security restrictions. Clicking "NEXT ❯" on an iPhone now correctly forces the keyboard to remain open/re-open for the subsequent question.

## v1.2.0: Mobile Maneuverability
**Release Date:** January 26, 2026
**Focus:** Mobile Navigation & Accessibility

### 📱 Mobile Upgrades
* **"Next Question" Button:** Introduced explicit "NEXT ❯" and "CONTINUE ❯" buttons that appear after answering. This solves the issue where dismissing the mobile keyboard left the user without an "Enter" key to advance the quiz.
* **Layout Stability:** Increased the feedback area minimum height (`min-h-[8rem]`) to accommodate the new buttons without causing layout shifts or jumpiness.

## v1.1.0: Audio Intelligence
**Release Date:** January 26, 2026
**Focus:** Audio Feedback & Accessibility

### 🔊 New Features
* **Pronunciation Support:** Integrated the browser's native **Text-to-Speech (TTS)** engine.
    * Added a "Speaker" icon next to quiz results (both "IPPON" and "KILLED IN ACTION").
    * configured for `ja-JP` locale with a slightly reduced speed (0.9x) for clearer articulation.
* **Mobile Touch Optimization:** Audio controls are sized (`p-2`) to ensure friendly touch targets on mobile devices without cluttering the UI.

### 🛠️ Technical Improvements
* **SoC Refactoring:** Extracted the Audio logic into a dedicated `AudioButton` sub-component to prevent unnecessary re-renders and maintain DRY code.
* **Accessibility:** Added specific `aria-labels` and `type="button"` attributes to audio controls to ensure screen reader compatibility and prevent accidental form submissions.

---

## v1.0.0: Tactical Verb Systems
**Release Date:** January 25, 2026
**Codename:** *The Cyber-Samurai*

### ⚔️ Overview
The initial production-ready release of Nihonjugate. This version establishes the core loop: a full-stack Japanese verb conjugation trainer focusing on mechanical morphology rules across 15 different verb forms.

### 🚀 Key Features

#### 🧠 Tactical Drill Engine
* **Weighted Random Algorithm:** Prioritizes verbs you struggle with using a `1 / (correct_rate + 0.1)` weight formula.
* **Wanakana Integration:** Real-time IMEMode converts Romaji input into Hiragana/Kanji instantly.
* **Gamification:** Live streak tracking with dynamic ranks:
    * 🦶 **Ashigaru** (Foot Soldier)
    * ⚔️ **Samurai**
    * 🏯 **Daimyo**
    * 👹 **Shogun**
    * ⚡ **Kami** (God)
* **Blur/Reveal Hint System:**
    * Dictionary forms and meanings are **encrypted (blurred)** by default.
    * Click-to-reveal functionality with auto-reveal on failure.

#### 📱 Mobile Field Operations
* **Adaptive Viewport:** Uses `100dvh` to handle mobile browser chrome resizing seamlessly.
* **Fixed HUD:** The Rank and Combo bar are pinned to the top (`fixed`) with a high Z-index, ensuring stats remain visible when the keyboard slides up.
* **Keyboard Optimization:** Disabled auto-correct, auto-capitalization, and "ghost space" insertion for smooth Romaji entry.
* **Network Mode:** Added `npm run dev:lan` to allow local network testing on mobile devices.

#### 🗺️ Mission Configuration
* **Tactical Grid:** Heatmap dashboard visualizing mastery levels (Untouched, Struggling, Mastered).
* **Granular Control:** Toggle specific verbs or forms to create custom study sets.
* **Bulk Operations:** "Select All" / "Deselect All" for rapid setup.

### 🛠️ Technical Specifications
* **Stack:** React (Vite), TypeScript, Tailwind CSS, Node.js (Express), SQLite.
* **Persistence:** Local `verbs.db` stores attempts/scores for ~180 unique verb forms.
* **Security:** Configurable CORS via `.env`.
* **Deployment:** Production-hardened with Error Boundaries and CommonJS compatibility fixes.