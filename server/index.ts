import express from 'express';
import cors from 'cors';
import db, { seedData } from './db'; // Removed .ts extension (ts-node should resolve this with proper config)

const app = express();

// Update CORS to allow your Network IP
// Or, for a local study tool, just allow all local traffic:
app.use(cors());

// SECURITY: Restrict CORS
//const allowedOrigins = [process.env.FRONTEND_ORIGIN || 'http://localhost:5173'];
//app.use(cors({ origin: allowedOrigins }));

app.use(express.json());

// Seed on startup
try {
  seedData();
} catch (error) {
  console.error("Failed to seed database:", error);
}

// Get all verbs
app.get('/api/verbs', (_req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM verbs');
    const verbs = stmt.all();
    res.json(verbs);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

// Update specific verb
app.post('/api/verbs/toggle', (req, res) => {
  try {
    const { id, is_active } = req.body;
    const stmt = db.prepare('UPDATE verbs SET is_active = ? WHERE id = ?');
    stmt.run(is_active ? 1 : 0, id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Update failed" });
  }
});

// Bulk update
app.post('/api/verbs/bulk-toggle', (req, res) => {
  try {
    const { set_active } = req.body;
    
    // VALIDATION: Ensure boolean
    if (typeof set_active !== 'boolean') {
      return res.status(400).json({ error: "Invalid input" });
    }

    const val = set_active ? 1 : 0;
    const stmt = db.prepare('UPDATE verbs SET is_active = ?');
    stmt.run(val);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Bulk update failed" });
  }
});

// Quiz Result
app.post('/api/quiz/result', (req, res) => {
  try {
    const { id, correct } = req.body;
    const verb = db.prepare('SELECT correct_count, attempt_count FROM verbs WHERE id = ?').get(id) as any;
    
    if (!verb) return res.status(404).json({ error: "Verb not found" });

    const newCorrect = verb.correct_count + (correct ? 1 : 0);
    const newAttempt = verb.attempt_count + 1;

    const stmt = db.prepare('UPDATE verbs SET correct_count = ?, attempt_count = ? WHERE id = ?');
    stmt.run(newCorrect, newAttempt, id);
    
    res.json({ success: true, newCorrect, newAttempt });
  } catch (err) {
    res.status(500).json({ error: "Failed to save result" });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});