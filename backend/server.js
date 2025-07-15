const express = require('express');
const admin = require('./firebaseAdmin');
const authenticateToken = require('./authMiddleware');

const app = express();
const port = 3001;

app.use(express.json());

// Protected route: Get all users from Firestore
app.get('/users', authenticateToken, async (req, res) => {
  try {
    const snapshot = await admin.firestore().collection('users').get();
    const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Protected route: Add a user to Firestore
app.post('/users', authenticateToken, async (req, res) => {
  try {
    const data = req.body;
    const ref = await admin.firestore().collection('users').add(data);
    res.json({ id: ref.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Protected route: Get leaderboard (global top scores)
app.get('/leaderboard', authenticateToken, async (req, res) => {
  try {
    const snapshot = await admin.firestore().collection('scores')
      .orderBy('score', 'desc')
      .limit(10)
      .get();
    const leaderboard = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Express server running at http://localhost:${port}`);
}); 