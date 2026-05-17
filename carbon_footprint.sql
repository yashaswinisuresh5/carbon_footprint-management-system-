-- ==========================================
-- CARBON FOOTPRINT MANAGEMENT SYSTEM
-- Relational Database Schema & Queries
-- ==========================================

-- 1. DATABASE CREATION (Optional for MySQL/PostgreSQL)
-- CREATE DATABASE carbon_footprint_db;
-- USE carbon_footprint_db;

-- ==========================================
-- 2. TABLE DEFINITIONS (DDL)
-- ==========================================

-- USERS Table
CREATE TABLE IF NOT EXISTS USERS (
    id INTEGER PRIMARY KEY AUTOINCREMENT, -- Use INT AUTO_INCREMENT PRIMARY KEY for MySQL
    role TEXT DEFAULT 'user',             -- 'user' or 'admin'
    name TEXT NOT NULL,
    age INTEGER,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    location TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- CARBON_ACTIVITY Table
CREATE TABLE IF NOT EXISTS CARBON_ACTIVITY (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL,                   -- 'transport', 'electricity', 'waste', 'fuel'
    value REAL NOT NULL,                  -- amount consumed/travelled
    unit TEXT NOT NULL,                   -- 'km', 'kWh', 'kg', 'L'
    date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES USERS(id) ON DELETE CASCADE
);

-- CARBON_EMISSION Table
-- Stores the calculated CO2 impact of each activity
CREATE TABLE IF NOT EXISTS CARBON_EMISSION (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    activity_id INTEGER NOT NULL,
    co2_amount REAL NOT NULL,             -- Calculated CO2 in kg
    date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES USERS(id) ON DELETE CASCADE,
    FOREIGN KEY(activity_id) REFERENCES CARBON_ACTIVITY(id) ON DELETE CASCADE
);

-- RECOMMENDATION_TEMPLATES Table
-- Admin managed eco-recommendations based on emission levels
CREATE TABLE IF NOT EXISTS RECOMMENDATION_TEMPLATES (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    level TEXT NOT NULL,                  -- 'low', 'medium', 'high', or 'all'
    content TEXT NOT NULL,
    impact TEXT NOT NULL
);


-- ==========================================
-- 3. INITIAL DATA (DML)
-- ==========================================

-- Insert Default Admin Account
INSERT INTO USERS (role, name, age, email, password, location) 
VALUES ('admin', 'System Admin', 30, 'admin@carbonlens.com', 'hashed_password_here', 'Global');

-- Insert Sample Recommendation Templates
INSERT INTO RECOMMENDATION_TEMPLATES (level, content, impact) VALUES 
('high', 'Switch to public transport or carpooling to significantly cut your transport emissions.', 'Saves up to 94 kg CO2/mo'),
('medium', 'Upgrade your home lighting to LED bulbs and switch off appliances when not in use.', 'Saves up to 20 kg CO2/mo'),
('low', 'Great job! Maintain your low footprint by composting organic waste locally.', 'Saves up to 5 kg CO2/mo'),
('all', 'Plant a tree in your local neighborhood to offset your unavoidable emissions.', 'Offsets 22 kg CO2/yr');


-- ==========================================
-- 4. COMMON APPLICATION QUERIES (DML/DQL)
-- ==========================================

-- A. Register a New User
-- INSERT INTO USERS (name, age, email, password, location) VALUES (?, ?, ?, ?, ?);

-- B. User Login Authentication
-- SELECT * FROM USERS WHERE email = ? AND role = 'user';

-- C. Insert a New Carbon Activity
-- INSERT INTO CARBON_ACTIVITY (user_id, type, value, unit) VALUES (?, ?, ?, ?);

-- D. Insert the Calculated Emission for that Activity
-- INSERT INTO CARBON_EMISSION (user_id, activity_id, co2_amount) VALUES (?, ?, ?);

-- E. Fetch User Dashboard (All Activities)
-- SELECT * FROM CARBON_ACTIVITY WHERE user_id = ? ORDER BY date DESC;

-- F. Fetch Total CO2 Emissions for a User
-- SELECT SUM(co2_amount) as total FROM CARBON_EMISSION WHERE user_id = ?;

-- G. Fetch Admin View (All Activities with User Names and CO2 Amounts) (JOIN QUERY)
/*
SELECT A.*, U.name, E.co2_amount 
FROM CARBON_ACTIVITY A 
JOIN USERS U ON A.user_id = U.id 
JOIN CARBON_EMISSION E ON A.id = E.activity_id 
ORDER BY A.date DESC;
*/

-- H. Fetch Recommendations based on User's total emission level
/*
SELECT * FROM RECOMMENDATION_TEMPLATES 
WHERE level = ? OR level = 'all';
*/
