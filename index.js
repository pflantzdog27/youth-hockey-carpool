// Full content for 'index.js' in the backend directory
// Youth Hockey Team Carpool App Backend

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected...'))
  .catch(err => console.error(err));

// Middleware
app.use(cors());
app.use(express.json()); // For parsing JSON in request bodies

// Define a simple route for testing
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Youth Hockey API!' });
});

// User Authentication Routes

const User = require('./models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Define a login route
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if user exists
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid Credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid Credentials' });
    }

    // Create and return JWT
    const payload = {
      user: {
        id: user.id,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: 360000 },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Use Routes
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// Carpool Routes
const carpoolRoutes = require('./routes/carpool'); // Corrected from 'carpools' to 'carpool'
app.use('/api/carpools', carpoolRoutes);

// Import the auth middleware
const authMiddleware = require('./authMiddleware');

// Protected Route Example
app.get('/api/auth/protected', authMiddleware, (req, res) => {
  res.json({ message: 'Welcome to the protected route, authorized user!' });
});

// Port configuration
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});