import Database from 'better-sqlite3';
import { parse } from 'csv-parse/sync';
import fs from 'fs';
import path from 'path';

const db = new Database('verbs.db');

export interface VerbRecord {
  id: number;
  dictionary_kanji: string;
  meaning: string;
  form_name: string;
  conj_kanji: string;
  conj_kana: string;
  conj_romaji: string;
  verb_class: string;
  correct_count: number;
  attempt_count: number;
  is_active: number; // 0 or 1
}

// Initialize Schema (Added verb_class)
db.exec(`
  CREATE TABLE IF NOT EXISTS verbs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dictionary_kanji TEXT,
    dictionary_kana TEXT,
    dictionary_romaji TEXT,
    meaning TEXT,
    form_name TEXT,
    conj_kanji TEXT,
    conj_kana TEXT,
    conj_romaji TEXT,
    verb_class TEXT,
    correct_count INTEGER DEFAULT 0,
    attempt_count INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    UNIQUE(dictionary_kanji, form_name)
  )
`);

// MIGRATION: Safely add verb_class if it doesn't exist (protects existing score data)
try {
  const columns = db.pragma('table_info(verbs)') as { name: string }[];
  if (!columns.some(col => col.name === 'verb_class')) {
    db.exec(`ALTER TABLE verbs ADD COLUMN verb_class TEXT DEFAULT 'Unknown'`);
    console.log("Migration: Added 'verb_class' column to database.");
  }
} catch (err) {
  console.error("Migration failed:", err);
}

export const seedData = () => {
    // Dynamically resolve the path so it works regardless of where the script is run from
    const csvPath = path.resolve(__dirname, '../verbs.csv');
    
    if (!fs.existsSync(csvPath)) {
        console.error(`Error: Could not find ${csvPath}. Database seeding skipped.`);
        return;
    }

    const fileContent = fs.readFileSync(csvPath, 'utf-8');

    const records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true
    });

    const insert = db.prepare(`
        INSERT INTO verbs (
            dictionary_kanji, dictionary_kana, dictionary_romaji, meaning, 
            form_name, conj_kanji, conj_kana, conj_romaji, verb_class
        ) VALUES (
            @Dictionary_Kanji, @Dictionary_Kana, @Dictionary_Romaji, @Meaning, 
            @Form_Name, @Conj_Kanji, @Conj_Kana, @Conj_Romaji, @Verb_Class
        )
        ON CONFLICT(dictionary_kanji, form_name) DO UPDATE SET
            verb_class = excluded.verb_class,
            conj_kanji = excluded.conj_kanji,
            conj_kana = excluded.conj_kana
    `);

    const insertMany = db.transaction((rows) => {
        for (const row of rows) insert.run(row);
    });

    insertMany(records);
    console.log(`Database synced with ${records.length} records from verbs.csv.`);
};

export default db;