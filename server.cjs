const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;
const SECRET_KEY = process.env.SECRET_KEY || 'your_super_secret_key_here'; // In production, use environment variables

// Allow all origins specifically to fix CORS for frontend
app.use(cors({ origin: '*' }));
app.use(express.json());

// Initialize SQLite Database
const db = new Database('./database.sqlite');
db.pragma('journal_mode = WAL'); // Recommended for better-sqlite3

console.log('Connected to the SQLite database using better-sqlite3.');

// Create Users Table
db.prepare(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE,
  password TEXT
)`).run();

// Create Ideas Table
db.prepare(`CREATE TABLE IF NOT EXISTS ideas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT,
  description TEXT,
  problemStatement TEXT,
  category TEXT,
  difficulty INTEGER,
  marketPotential TEXT,
  upvotes INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  visibility TEXT DEFAULT 'Active',
  expiry TEXT,
  createdAt TEXT,
  updatedAt TEXT,
  userId INTEGER,
  FOREIGN KEY(userId) REFERENCES users(id)
)`).run();

// Create Idea Favorited Tracking
db.prepare(`CREATE TABLE IF NOT EXISTS favorites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId INTEGER,
  ideaId INTEGER,
  UNIQUE(userId, ideaId)
)`).run();

// Helper Function: Map Market Potential to Number
function getMarketScore(marketPotential) {
    switch (marketPotential) {
        case 'Low': return 1;
        case 'Medium': return 2;
        case 'High': return 3;
        case 'Very High': return 4;
        default: return 1;
    }
}

// Authentication Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: "Unauthorized" });

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ error: "Forbidden" });
        req.user = user;
        next();
    });
};

// --- AUTHENTICATION ROUTES ---

app.post(['/api/register', '/register'], (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const hashedPassword = bcrypt.hashSync(password, 10);

    try {
        const stmt = db.prepare(`INSERT INTO users (email, password) VALUES (?, ?)`);
        const info = stmt.run(email, hashedPassword);
        const token = jwt.sign({ id: info.lastInsertRowid, email }, SECRET_KEY, { expiresIn: '24h' });
        res.json({ token, user: { id: info.lastInsertRowid, email } });
    } catch (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'Email already exists' });
        }
        return res.status(500).json({ error: 'Database error' });
    }
});

app.post(['/api/login', '/login'], (req, res) => {
    const { email, password } = req.body;

    try {
        const user = db.prepare(`SELECT * FROM users WHERE email = ?`).get(email);
        if (!user) return res.status(400).json({ error: 'Invalid credentials' });

        const validPassword = bcrypt.compareSync(password, user.password);
        if (!validPassword) return res.status(400).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ id: user.id, email }, SECRET_KEY, { expiresIn: '24h' });
        res.json({ token, user: { id: user.id, email } });
    } catch (err) {
        return res.status(500).json({ error: 'Database error' });
    }
});

// --- IDEA ROUTES ---

// Create new Idea
app.post('/api/ideas', authenticateToken, (req, res) => {
    const { title, description, problemStatement, category, difficulty, marketPotential, expiryHours } = req.body;
    const now = new Date().toISOString();

    let expiry = null;
    if (expiryHours) {
        const expiryDate = new Date();
        expiryDate.setHours(expiryDate.getHours() + parseInt(expiryHours));
        expiry = expiryDate.toISOString();
    }

    try {
        const stmt = db.prepare(
            `INSERT INTO ideas (title, description, problemStatement, category, difficulty, marketPotential, visibility, expiry, createdAt, updatedAt, userId) 
             VALUES (?, ?, ?, ?, ?, ?, 'Active', ?, ?, ?, ?)`
        );
        const info = stmt.run(title, description, problemStatement, category, difficulty, marketPotential, expiry, now, now, req.user.id);
        res.json({ id: info.lastInsertRowid });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all ideas (Trending logic applied)
app.get('/api/ideas', (req, res) => {
    const now = new Date().toISOString();

    try {
        const ideas = db.prepare(`SELECT * FROM ideas`).all();
        const favorites = db.prepare(`SELECT * FROM favorites`).all();

        const processedIdeas = ideas.map(idea => {
            // Calculate Idea Score = (Market Potential * 2) + Difficulty Score + Upvotes
            const marketScore = getMarketScore(idea.marketPotential);
            const diffScore = parseInt(idea.difficulty) || 1;
            const score = (marketScore * 2) + diffScore + idea.upvotes;

            // Check if expired
            let isArchived = false;
            if (idea.expiry && idea.expiry < now) {
                isArchived = true;
            }

            // Attach favorited map
            const favoritedBy = {};
            favorites.filter(f => f.ideaId === idea.id).forEach(f => favoritedBy[f.userId] = true);

            return { ...idea, score, isArchived, favoritedBy };
        });

        // Filter out hidden ideas unless requested by owner (handled primarily on frontend, but good practice here)
        // Sort by score (Trending)
        const sorted = processedIdeas.sort((a, b) => b.score - a.score);
        res.json(sorted);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add View count (When someone opens an idea)
app.post('/api/ideas/:id/view', (req, res) => {
    try {
        db.prepare(`UPDATE ideas SET views = views + 1 WHERE id = ?`).run(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Upvote an idea
app.post('/api/ideas/:id/upvote', authenticateToken, (req, res) => {
    // Logic allows multiple upvotes right now based on requirement (or single if desired, kept simple based on previous logic)
    try {
        db.prepare(`UPDATE ideas SET upvotes = upvotes + 1 WHERE id = ?`).run(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Toggle favorite
app.post('/api/ideas/:id/favorite', authenticateToken, (req, res) => {
    const userId = req.user.id;
    const ideaId = req.params.id;

    try {
        const row = db.prepare(`SELECT * FROM favorites WHERE userId = ? AND ideaId = ?`).get(userId, ideaId);

        if (row) {
            db.prepare(`DELETE FROM favorites WHERE userId = ? AND ideaId = ?`).run(userId, ideaId);
            res.json({ favorited: false });
        } else {
            db.prepare(`INSERT INTO favorites (userId, ideaId) VALUES (?, ?)`).run(userId, ideaId);
            res.json({ favorited: true });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update Idea
app.put('/api/ideas/:id', authenticateToken, (req, res) => {
    const { title, problemStatement, category, difficulty, marketPotential, visibility } = req.body;
    const now = new Date().toISOString();

    try {
        const idea = db.prepare(`SELECT userId FROM ideas WHERE id = ?`).get(req.params.id);
        if (!idea) return res.status(404).json({ error: "Not found" });
        if (idea.userId !== req.user.id) return res.status(403).json({ error: "Unauthorized" });

        db.prepare(
            `UPDATE ideas SET title = ?, problemStatement = ?, category = ?, difficulty = ?, marketPotential = ?, visibility = ?, updatedAt = ? WHERE id = ?`
        ).run(title, problemStatement, category, difficulty, marketPotential, visibility, now, req.params.id);

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Serve static frontend files directly from the Vite build output
app.use(express.static(path.join(__dirname, 'dist')));

// Catch-all 404 handler strictly for missed API routes
app.use('/api', (req, res) => {
    res.status(404).json({ error: "API Route not found" });
});

// Full-Stack Magic: Route any other non-API requests to the React Frontend!
app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
