const express = require('express');
const router = express.Router();
const authMiddleware = require('../authMiddleware');
const Carpool = require('../models/Carpool');

// Create a new carpool (only for logged-in users)
router.post('/', authMiddleware, async (req, res) => {
    const { event, date, startLocation, endLocation } = req.body;

    try {
        const newCarpool = new Carpool({
            event,
            driver: req.user.id,
            date,
            startLocation,
            endLocation,
        });

        const carpool = await newCarpool.save();
        res.json(carpool);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Get all carpools
router.get('/', authMiddleware, async (req, res) => {
    try {
        const carpools = await Carpool.find()
            .populate('driver', 'name email')  // Populate the driver's name and email
            .populate('passengers', 'name email');  // Populate passengers' names and emails
        res.json(carpools);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Join an existing carpool
router.put('/join/:carpoolId', authMiddleware, async (req, res) => {
    try {
      const carpool = await Carpool.findById(req.params.carpoolId);
  
      if (!carpool) {
        return res.status(404).json({ message: 'Carpool not found' });
      }
  
      // Check if the user is already the driver
      if (carpool.driver.toString() === req.user.id) {
        return res.status(400).json({ message: 'Driver cannot join their own carpool as a passenger' });
      }
  
      // Check if the user is already a passenger
      if (carpool.passengers.includes(req.user.id)) {
        return res.status(400).json({ message: 'You are already a passenger in this carpool' });
      }
  
      // Add user to the passengers list
      carpool.passengers.push(req.user.id);
      await carpool.save();
  
      res.json({ message: 'Successfully joined the carpool', carpool });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  });
  

// Leave an existing carpool
router.put('/leave/:carpoolId', authMiddleware, async (req, res) => {
    try {
        const carpool = await Carpool.findById(req.params.carpoolId);

        if (!carpool) {
            return res.status(404).json({ message: 'Carpool not found' });
        }

        // Check if the user is in the passengers list
        if (!carpool.passengers.includes(req.user.id)) {
            return res.status(400).json({ message: 'You are not a passenger in this carpool' });
        }

        // Remove user from passengers list
        carpool.passengers = carpool.passengers.filter(
            (passengerId) => passengerId.toString() !== req.user.id
        );

        await carpool.save();

        res.json({ message: 'Successfully left the carpool', carpool });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
