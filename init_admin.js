const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');

const db = new sqlite3.Database('./database.sqlite');

async function createAdmin() {
    const email = 'admin@carbonlens.com';
    const password = 'admin'; // simple password for local project
    const hashedPassword = await bcrypt.hash(password, 10);

    db.run(`INSERT INTO USERS (role, name, age, email, password, location) VALUES ('admin', 'System Admin', 30, ?, ?, 'Global')`,
        [email, hashedPassword],
        function(err) {
            if (err) {
                console.log('Admin user might already exist:', err.message);
            } else {
                console.log('Admin created successfully.');
                console.log('Email: admin@carbonlens.com');
                console.log('Password: admin');
            }
            db.close();
        }
    );
}

createAdmin();
