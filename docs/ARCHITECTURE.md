# ⛩️ NIHONJUGATE Architecture

## ⚔️ System Overview

Nihonjugate is a precision-engineered Japanese verb conjugation trainer. It utilizes a full-stack architecture to provide persistent progress tracking, intelligent quiz logic, and a cyber-themed study interface.

## ⚡ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React (v18), Vite, TypeScript, Tailwind CSS |
| **Backend** | Node.js (Express), TypeScript |
| **Database** | SQLite3 via `better-sqlite3` |
| **Input** | Wanakana (Romaji-to-Hiragana/Kanji conversion) |
| **Persistence** | Local `verbs.db` generated from `verbs.csv` |

## 🏗️ Core Components

### 1. Database & Seeding (`server/db.ts`)
- **Schema**: A single `verbs` table storing dictionary forms, meaning, conjugated forms (Kanji/Kana/Romaji), verb classes, and mastery metrics (`correct_count`, `attempt_count`).
- **Seeding**: On server startup, `verbs.csv` is parsed and synced into `verbs.db`. It uses an `ON CONFLICT` strategy to update morphological rules while preserving user scores.
- **Migration**: Includes a safe migration layer to inject new schema columns (like `verb_class`) without wiping local history.

### 2. API Services (`server/index.ts`)
- `GET /api/verbs`: Fetches all verbs for the Configuration Grid and Quiz engine.
- `POST /api/verbs/toggle`: Activates or deactivates a specific verb/form.
- `POST /api/verbs/bulk-toggle`: Global select/deselect for all records.
- `POST /api/quiz/result`: Updates the score history for a specific verb record after a duel.

### 3. Morphological Brain (`src/utils/rules.ts`)
- **Rule Engine**: A centralized logic unit that maps verb classes (Godan-ku, Ichidan, Irregular-suru, etc.) to their conjugation rules.
- **Application Logic**: Dynamically calculates the "equation" (e.g., `Base + Suffix = Conjugated`) displayed in the quiz hint modal.
- **Exceptions**: Intercepts highly irregular cases (e.g., 行く) to provide custom grammatical explanations.

### 4. Quiz Engine (`src/components/Quiz.tsx`)
- **Weighted Randomness**: Prioritizes verbs with lower accuracy using a `1 / (rate + 0.1)` weight formula.
- **Game Loop**: Manages the state for the current question, user input (via Wanakana), feedback (IPPON vs. KIA), and streak/rank progression.
- **IME Support**: Automatically converts Romaji input into Hiragana/Kanji on the fly.

### 5. Tactical Grid (`src/components/ConfigGrid.tsx`)
- **Heatmap**: Visualizes mastery levels based on accuracy (Untouched, Struggling, Mastered).
- **Control Center**: Allows granular selection of verbs and forms to customize the training session.

## 🔄 Data Flow

1. **Initialization**: Server reads `verbs.csv` -> Populates/Updates `verbs.db` -> Serves API.
2. **Configuration**: Frontend fetches verbs -> User selects target forms in `ConfigGrid` -> API updates `is_active` in DB.
3. **Drill**: `Quiz` component pulls active verbs -> Selects one via weighted random algorithm.
4. **Validation**: User submits answer -> Frontend validates -> API updates success/failure counts in `verbs.db`.
5. **Feedback**: If failed, `Quiz` pulls morphological rules from `rules.ts` and displays them to the user.

## 📁 Project Structure

```text
nihonjugate/
├── server/
│   ├── db.ts           # SQLite & CSV Sync Logic
│   └── index.ts        # Express API Endpoints
├── src/
│   ├── components/
│   │   ├── Quiz.tsx    # Quiz Loop & Logic
│   │   ├── ConfigGrid.tsx # Heatmap & Config
│   │   └── ...
│   ├── utils/
│   │   └── rules.ts    # Conjugation Rules Engine
│   ├── App.tsx         # Routing & State Orchestration
│   └── types.ts        # Shared TypeScript Interfaces
├── verbs.csv           # Source of truth for verb data
└── verbs.db            # Local persistent storage
```
