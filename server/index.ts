import express from 'express';
import cors from 'cors';
import db, { seedData } from './db';

const app = express();
app.use(cors());
app.use(express.json());

// Seed on startup
seedData();

// Get all verbs/forms with their mastery data
app.get('/api/verbs', (req, res) => {
  const stmt = db.prepare('SELECT * FROM verbs');
  const verbs = stmt.all();
  res.json(verbs);
});

// Update specific verb activity (Config Grid)
app.post('/api/verbs/toggle', (req, res) => {
  const { id, is_active } = req.body;
  const stmt = db.prepare('UPDATE verbs SET is_active = ? WHERE id = ?');
  stmt.run(is_active ? 1 : 0, id);
  res.json({ success: true });
});

// Submit a quiz result
app.post('/api/quiz/result', (req, res) => {
  const { id, correct } = req.body;
  const verb = db.prepare('SELECT correct_count, attempt_count FROM verbs WHERE id = ?').get(id) as any;
  
  const newCorrect = verb.correct_count + (correct ? 1 : 0);
  const newAttempt = verb.attempt_count + 1;

  const stmt = db.prepare('UPDATE verbs SET correct_count = ?, attempt_count = ? WHERE id = ?');
  stmt.run(newCorrect, newAttempt, id);
  
  res.json({ success: true, newCorrect, newAttempt });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});