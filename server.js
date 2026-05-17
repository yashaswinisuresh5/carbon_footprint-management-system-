const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const session = require('express-session');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Serve static files from 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: 'supersecret_eco_key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // false for localhost
}));

// Initialize DB
const db = new sqlite3.Database('./database.sqlite', (err) => {
    if (err) console.error(err.message);
    else console.log('Connected to the SQLite database.');
});

// Create tables
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS USERS (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        role TEXT DEFAULT 'user',
        name TEXT,
        age INTEGER,
        email TEXT UNIQUE,
        password TEXT,
        location TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS CARBON_ACTIVITY (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        type TEXT,
        value REAL,
        unit TEXT,
        date DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES USERS(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS CARBON_EMISSION (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        activity_id INTEGER,
        co2_amount REAL,
        date DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES USERS(id),
        FOREIGN KEY(activity_id) REFERENCES CARBON_ACTIVITY(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS RECOMMENDATION_TEMPLATES (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        level TEXT,
        content TEXT,
        impact TEXT
    )`);
});

// --- AUTH ROUTES ---

app.post('/api/register', async (req, res) => {
    const { name, age, email, password, location } = req.body;
    if (!name || !age || !email || !password || !location) {
        return res.status(400).json({ error: 'All fields are required.' });
    }
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.run(`INSERT INTO USERS (name, age, email, password, location) VALUES (?, ?, ?, ?, ?)`,
            [name, age, email, hashedPassword, location],
            function (err) {
                if (err) return res.status(400).json({ error: 'Email already exists.' });
                res.json({ success: true, message: 'Registration successful.' });
            }
        );
    } catch (e) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    db.get(`SELECT * FROM USERS WHERE email = ? AND role = 'user'`, [email], async (err, user) => {
        if (err || !user) return res.status(401).json({ error: 'Invalid credentials.' });
        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(401).json({ error: 'Invalid credentials.' });
        
        req.session.userId = user.id;
        req.session.role = user.role;
        res.json({ success: true, user: { id: user.id, name: user.name, email: user.email } });
    });
});

app.post('/api/admin-login', (req, res) => {
    const { email, password } = req.body;
    db.get(`SELECT * FROM USERS WHERE email = ? AND role = 'admin'`, [email], async (err, user) => {
        if (err || !user) return res.status(401).json({ error: 'Invalid admin credentials.' });
        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(401).json({ error: 'Invalid admin credentials.' });
        
        req.session.userId = user.id;
        req.session.role = 'admin';
        res.json({ success: true, user: { id: user.id, name: user.name, email: user.email } });
    });
});

app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

// Middleware for authentication
function isAuthenticated(req, res, next) {
    if (req.session.userId && req.session.role === 'user') return next();
    res.status(401).json({ error: 'Unauthorized' });
}

function isAdmin(req, res, next) {
    if (req.session.userId && req.session.role === 'admin') return next();
    res.status(401).json({ error: 'Unauthorized Admin' });
}

// --- USER ROUTES ---

app.get('/api/me', isAuthenticated, (req, res) => {
    db.get(`SELECT id, name, email, age, location, created_at FROM USERS WHERE id = ?`, [req.session.userId], (err, user) => {
        if (err || !user) return res.status(404).json({ error: 'User not found' });
        res.json({ success: true, user });
    });
});

app.post('/api/activity', isAuthenticated, (req, res) => {
    const { type, value, unit } = req.body;
    if (!type || !value || !unit) return res.status(400).json({ error: 'All fields required' });
    
    // Simple calculation logic
    let co2 = 0;
    if (type === 'electricity') co2 = value * 0.5; // 0.5 kg CO2 per kWh
    else if (type === 'transport') co2 = value * 0.14; // 0.14 kg CO2 per km
    else if (type === 'waste') co2 = value * 1.5; // 1.5 kg CO2 per kg waste
    else if (type === 'fuel') co2 = value * 2.3; // 2.3 kg CO2 per L

    db.run(`INSERT INTO CARBON_ACTIVITY (user_id, type, value, unit) VALUES (?, ?, ?, ?)`,
        [req.session.userId, type, value, unit],
        function (err) {
            if (err) return res.status(500).json({ error: 'Failed to add activity' });
            const activityId = this.lastID;
            
            db.run(`INSERT INTO CARBON_EMISSION (user_id, activity_id, co2_amount) VALUES (?, ?, ?)`,
                [req.session.userId, activityId, co2],
                (err2) => {
                    if (err2) return res.status(500).json({ error: 'Failed to record emission' });
                    res.json({ success: true, co2_amount: co2 });
                }
            );
        }
    );
});

app.get('/api/dashboard', isAuthenticated, (req, res) => {
    const userId = req.session.userId;
    db.all(`SELECT * FROM CARBON_ACTIVITY WHERE user_id = ? ORDER BY date DESC`, [userId], (err, activities) => {
        db.all(`SELECT * FROM CARBON_EMISSION WHERE user_id = ?`, [userId], (err, emissions) => {
            const totalCo2 = emissions.reduce((sum, e) => sum + e.co2_amount, 0);
            
            // Calculate by type
            const byType = { electricity: 0, transport: 0, waste: 0, fuel: 0 };
            const typeEmissions = { electricity: 0, transport: 0, waste: 0, fuel: 0 };
            
            activities.forEach(a => {
                byType[a.type] += a.value;
            });
            emissions.forEach((e, i) => {
                const act = activities.find(a => a.id === e.activity_id);
                if (act) typeEmissions[act.type] += e.co2_amount;
            });
            
            res.json({
                success: true,
                totalCo2,
                activities,
                emissions,
                byType,
                typeEmissions
            });
        });
    });
});

app.get('/api/recommendations', isAuthenticated, (req, res) => {
    // Generate recommendation based on user's total emission
    const userId = req.session.userId;
    db.all(`SELECT SUM(co2_amount) as total FROM CARBON_EMISSION WHERE user_id = ?`, [userId], (err, row) => {
        const total = (row && row[0] && row[0].total) || 0;
        let level = 'low';
        if (total > 500) level = 'high';
        else if (total > 200) level = 'medium';
        
        db.all(`SELECT * FROM RECOMMENDATION_TEMPLATES WHERE level = ? OR level = 'all'`, [level], (err, recs) => {
            res.json({ success: true, level, total, recommendations: recs });
        });
    });
});

// --- ADMIN ROUTES ---
app.get('/api/admin/users', isAdmin, (req, res) => {
    db.all(`SELECT id, name, email, age, location, created_at FROM USERS WHERE role = 'user'`, (err, users) => {
        res.json({ success: true, users });
    });
});

app.get('/api/admin/activities', isAdmin, (req, res) => {
    db.all(`SELECT A.*, U.name, E.co2_amount FROM CARBON_ACTIVITY A 
            JOIN USERS U ON A.user_id = U.id 
            JOIN CARBON_EMISSION E ON A.id = E.activity_id ORDER BY A.date DESC`, (err, activities) => {
        res.json({ success: true, activities });
    });
});

app.post('/api/admin/recommendation', isAdmin, (req, res) => {
    const { level, content, impact } = req.body;
    db.run(`INSERT INTO RECOMMENDATION_TEMPLATES (level, content, impact) VALUES (?, ?, ?)`,
        [level, content, impact], (err) => {
            if (err) return res.status(500).json({ error: 'Failed' });
            res.json({ success: true });
        });
});

// Catch all for SPA
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log('Server is running on http://localhost:' + PORT);
});
