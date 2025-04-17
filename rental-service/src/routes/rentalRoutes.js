const express = require('express');
const rentalController = require('../controllers/rentalController');
const { authMiddleware } = require('../middlewares/auth');
const router = express.Router();

// Rental CRUD Routes
router.post('/rentals', authMiddleware, rentalController.createRental);
router.get('/rentals', rentalController.getAllRentals);
router.get('/rentals/:id', rentalController.getRentalById);
router.put('/rentals/:id', authMiddleware, rentalController.updateRental);
router.delete('/rentals/:id', authMiddleware, rentalController.deleteRental);

// Booking Routes
router.post('/bookings', authMiddleware, rentalController.createBooking);
router.get('/user-bookings', authMiddleware, rentalController.getUserBookings);
router.get('/owner-bookings', authMiddleware, rentalController.getOwnerBookings);
router.put('/bookings/:id/status', authMiddleware, rentalController.updateBookingStatus);

module.exports = router;