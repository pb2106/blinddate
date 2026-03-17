const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 5000;
const SECRET_KEY = process.env.SECRET_KEY || 'your_super_secret_key_here'; // In production, use environment variables

// Allow all origins specifically to fix CORS for frontend
app.use(cors({ origin: '*' }));
app.use(express.json());

// Initialize SQLite Database
const db = new sqlite3.Database('./database.sqlite', (err) => {
    if (err) {
        console.error('Error opening database: ', err.message);
    } else {
        console.log('Connected to the SQLite database.');

        // Create Users Table
        db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE,
      password TEXT
    )`);

        // Create Ideas Table
        // visibility: 'Active' or 'Hidden'
        // archived: boolean
        db.run(`CREATE TABLE IF NOT EXISTS ideas (
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
    )`);

        // Create Idea Favorited Tracking
        db.run(`CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER,
      ideaId INTEGER,
      UNIQUE(userId, ideaId)
    )`);
    }
});

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

    db.run(`INSERT INTO users (email, password) VALUES (?, ?)`, [email, hashedPassword], function (err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(400).json({ error: 'Email already exists' });
            }
            return res.status(500).json({ error: 'Database error' });
        }
        const token = jwt.sign({ id: this.lastID, email }, SECRET_KEY, { expiresIn: '24h' });
        res.json({ token, user: { id: this.lastID, email } });
    });
});

app.post(['/api/login', '/login'], (req, res) => {
    const { email, password } = req.body;

    db.get(`SELECT * FROM users WHERE email = ?`, [email], (err, user) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (!user) return res.status(400).json({ error: 'Invalid credentials' });

        const validPassword = bcrypt.compareSync(password, user.password);
        if (!validPassword) return res.status(400).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ id: user.id, email }, SECRET_KEY, { expiresIn: '24h' });
        res.json({ token, user: { id: user.id, email } });
    });
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

    db.run(
        `INSERT INTO ideas (title, description, problemStatement, category, difficulty, marketPotential, visibility, expiry, createdAt, updatedAt, userId) 
     VALUES (?, ?, ?, ?, ?, ?, 'Active', ?, ?, ?, ?)`,
        [title, description, problemStatement, category, difficulty, marketPotential, expiry, now, now, req.user.id],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID });
        }
    );
});

// Get all ideas (Trending logic applied)
app.get('/api/ideas', (req, res) => {
    const now = new Date().toISOString();

    // We load favorites manually due to sqlite limitation avoiding complex pivot queries here
    db.all(`SELECT * FROM ideas`, [], (err, ideas) => {
        if (err) return res.status(500).json({ error: err.message });

        db.all(`SELECT * FROM favorites`, [], (err, favorites) => {
            if (err) return res.status(500).json({ error: err.message });

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
        });
    });
});

// Add View count (When someone opens an idea)
app.post('/api/ideas/:id/view', (req, res) => {
    db.run(`UPDATE ideas SET views = views + 1 WHERE id = ?`, [req.params.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// Upvote an idea
app.post('/api/ideas/:id/upvote', authenticateToken, (req, res) => {
    // Logic allows multiple upvotes right now based on requirement (or single if desired, kept simple based on previous logic)
    db.run(`UPDATE ideas SET upvotes = upvotes + 1 WHERE id = ?`, [req.params.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// Toggle favorite
app.post('/api/ideas/:id/favorite', authenticateToken, (req, res) => {
    const userId = req.user.id;
    const ideaId = req.params.id;

    db.get(`SELECT * FROM favorites WHERE userId = ? AND ideaId = ?`, [userId, ideaId], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });

        if (row) {
            db.run(`DELETE FROM favorites WHERE userId = ? AND ideaId = ?`, [userId, ideaId], (err) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ favorited: false });
            });
        } else {
            db.run(`INSERT INTO favorites (userId, ideaId) VALUES (?, ?)`, [userId, ideaId], (err) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ favorited: true });
            });
        }
    });
});

// Update Idea
app.put('/api/ideas/:id', authenticateToken, (req, res) => {
    const { title, problemStatement, category, difficulty, marketPotential, visibility } = req.body;
    const now = new Date().toISOString();

    // Only allow owner to update
    db.get(`SELECT userId FROM ideas WHERE id = ?`, [req.params.id], (err, idea) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!idea) return res.status(404).json({ error: "Not found" });
        if (idea.userId !== req.user.id) return res.status(403).json({ error: "Unauthorized" });

        db.run(
            `UPDATE ideas SET title = ?, problemStatement = ?, category = ?, difficulty = ?, marketPotential = ?, visibility = ?, updatedAt = ? WHERE id = ?`,
            [title, problemStatement, category, difficulty, marketPotential, visibility, now, req.params.id],
            function (err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ success: true });
            }
        );
    });
});

// Catch-all 404 handler that returns JSON
app.use((req, res) => {
    res.status(404).json({ error: "Route not found" });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
