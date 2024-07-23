const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const db = require('./database');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const SECRET_KEY = 'your_secret_key';

// User registration endpoint
app.post('/register', (req, res) => {
  const { username, password } = req.body;
  bcrypt.hash(password, 10, (err, hash) => {
    if (err) return res.status(500).send(err.message);

    db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, hash], (err) => {
      if (err) return res.status(500).send(err.message);
      res.status(201).send('User registered');
    });
  });
});


// User login endpoint
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
    if (err) return res.status(500).send(err.message);
    if (!user) return res.status(404).send('User not found');

    bcrypt.compare(password, user.password, (err, result) => {
      if (err) return res.status(500).send(err.message);
      if (!result) return res.status(401).send('Invalid credentials');

      const token = jwt.sign({ id: user.id }, SECRET_KEY, { expiresIn: '1h' });
      res.json({ token });
    });
  });
});


// Middleware to verify token
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(403).send('No token provided');

  // Remove 'Bearer ' prefix if present
  const tokenString = token.startsWith('Bearer ') ? token.slice(7, token.length) : token;

  jwt.verify(tokenString, SECRET_KEY, (err, decoded) => {
    if (err) {
      console.error('Token verification error:', err.message);
      return res.status(500).send('Failed to authenticate token');
    }
    req.userId = decoded.id;
    next();
  });
};

// Get notes endpoint
app.get('/notes', verifyToken, (req, res) => {
  db.all('SELECT * FROM notes WHERE user_id = ?', [req.userId], (err, rows) => {
    if (err) return res.status(500).send(err.message);
    res.json(rows);
  });
});

// Create note endpoint
app.post('/notes', verifyToken, (req, res) => {
  const { title, content } = req.body;
  db.run('INSERT INTO notes (user_id, title, content) VALUES (?, ?, ?)', [req.userId, title, content], (err) => {
    if (err) return res.status(500).send(err.message);
    res.status(201).send('Note created');
  });
});

// Delete note endpoint
app.delete('/notes/:id', verifyToken, (req, res) => {
  const { id } = req.params;
  console.log(`Delete request received for note ID: ${id} by user ID: ${req.userId}`);
  db.run('DELETE FROM notes WHERE id = ? AND user_id = ?', [id, req.userId], function(err) {
    if (err) {
      console.error('Error executing DELETE query:', err.message);
      return res.status(500).send('Error deleting note');
    }
    if (this.changes === 0) {
      console.warn('Note not found or unauthorized access for ID:', id);
      return res.status(404).send('Note not found or unauthorized');
    }
    res.status(200).send('Note deleted');
  });
});

// Get all assessments
app.get('/assessments', (req, res) => {
  db.all('SELECT * FROM assessments', (err, rows) => {
    if (err) return res.status(500).send(err.message);
    res.json(rows);
  });
});

// Register for an assessment
app.post('/assessments/register', verifyToken, (req, res) => {
  const { assessmentId } = req.body;
  db.run('INSERT INTO user_assessments (user_id, assessment_id) VALUES (?, ?)', [req.userId, assessmentId], function(err) {
    if (err) return res.status(500).send(err.message);
    res.status(201).send('Registered for assessment');
  });
});

// Unregister from an assessment
app.delete('/assessments/unregister/:assessmentId', (req, res) => {
  const assessmentId = req.params.assessmentId;
  const token = req.headers['authorization'];

  if (!token) return res.status(403).send('No token provided');

  const tokenString = token.startsWith('Bearer ') ? token.slice(7) : token;

  jwt.verify(tokenString, SECRET_KEY, (err, decoded) => {
    if (err) return res.status(500).send('Failed to authenticate token');

    const userId = decoded.id;

    db.run('DELETE FROM user_assessments WHERE user_id = ? AND assessment_id = ?', [userId, assessmentId], function(err) {
      if (err) {
        console.error('Error during unregister:', err.message);
        return res.status(500).send('Error during unregister');
      }
      if (this.changes === 0) {
        return res.status(404).send('Not registered or already unregistered');
      }
      res.status(200).send('Unregistered from assessment');
    });
  });
});






// Get assessments user is registered for
app.get('/user/assessments', verifyToken, (req, res) => {
  db.all('SELECT a.* FROM assessments a INNER JOIN user_assessments ua ON a.id = ua.assessment_id WHERE ua.user_id = ?', [req.userId], (err, rows) => {
    if (err) return res.status(500).send(err.message);
    res.json(rows);
  });
});


// Start server
app.listen(5000, () => {
  console.log('Server running on port 5000');
});
