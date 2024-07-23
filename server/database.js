const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

// Create users and notes tables
db.serialize(() => {
  db.run('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, email TEXT UNIQUE, password TEXT)');
  db.run('CREATE TABLE IF NOT EXISTS notes (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, title TEXT, content TEXT, FOREIGN KEY(user_id) REFERENCES users(id))');
  db.run('CREATE TABLE IF NOT EXISTS assessments (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, description TEXT)');
  db.run('CREATE TABLE IF NOT EXISTS user_assessments (user_id INTEGER, assessment_id INTEGER, FOREIGN KEY(user_id) REFERENCES users(id), FOREIGN KEY(assessment_id) REFERENCES assessments(id), PRIMARY KEY(user_id, assessment_id))');

  const assessments = [
    { id: 1, name: 'CODING CHALLENGE', description: 'Solve the given basic codes to crack the challenge' },
    { id: 2, name: 'CODING CHALLENGE', description: 'Solve the given advanced codes to crack the challenge' },
    { id: 3, name: 'PROJECT SUBMISSION', description: 'Go through the project details and submit the project' },
    { id: 4, name: 'PROJECT QUIZ', description: 'An exciting quiz that lets you crack the challenge' },
    { id: 5, name: 'LODE ASSIGNMENT', description: 'Follow the assignment requirements and crack the challenge' },
    { id: 6, name: 'LIVE ASSIGNMENT', description: 'Crack the live assignment to get the internship' },
    { id: 7, name: 'PORTFOLIO ASSIGNMENT', description: 'Follow the assignment requirements and crack the challenge' }
  ];

  assessments.forEach(assessment => {
    db.run('INSERT OR IGNORE INTO assessments (id, name, description) VALUES (?, ?, ?)', [assessment.id, assessment.name, assessment.description]);
  });


  // Insert sample users if they do not already exist
  const sampleUsers = [
    { username: 'user1', email: 'user1@example.com', password: 'password1' },
    { username: 'user2', email: 'user2@example.com', password: 'password2' }
  ];

  sampleUsers.forEach(user => {
    db.get('SELECT * FROM users WHERE username = ?', [user.username], (err, row) => {
      if (err) throw err;
      if (!row) {
        bcrypt.hash(user.password, 10, (err, hash) => {
          if (err) throw err;

          db.run('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', [user.username, user.email, hash], (err) => {
            if (err) throw err;
          });
        });
      }
    });
  });
});

module.exports = db;