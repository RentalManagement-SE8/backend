const Rental = require('../models/rentalModel');
const Booking = require('../models/bookingModel');
const { validateRental, validateBooking } = require('../utils/validators');
const axios = require('axios');
const config = require('../config');

// RENTAL CRUD OPERATIONS

exports.createRental = async (req, res) => {
    try {
        // Validate request body
        const { error } = validateRental(req.body);
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        const ownerId = req.userData.userId;

        // Create rental listing
        const rentalData = {
            ...req.body,
            owner: ownerId,
            status: 'pending' // All listings start as pending and need admin approval
        };

        const rental = new Rental(rentalData);
        await rental.save();

        // Notify admin about new listing (if notification service is available)
        try {
            await axios.post(`${config.services.notification}/notifications/new-listing`, {
                rentalId: rental._id,
                ownerId
            });
        } catch (notificationError) {
            console.error('Failed to send notification:', notificationError);
            // Continue anyway, not critical
        }

        res.status(201).json({
            message: 'Rental listing created successfully and pending approval',
            rental
        });
    } catch (error) {
        console.error('Create rental error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.getAllRentals = async (req, res) => {
    try {
        const {
            type,
            minPrice,
            maxPrice,
            city,
            country,
            startDate,
            endDate,
            page = 1,
            limit = 10,
            sort = 'createdAt'
        } = req.query;

        // Build query
        const query = { status: 'approved' }; // Only return approved listings

        if (type) query.type = type;
        if (city) query['location.city'] = new RegExp(city, 'i');
        if (country) query['location.country'] = new RegExp(country, 'i');

        if (minPrice || maxPrice) {
            query['price.amount'] = {};
            if (minPrice) query['price.amount'].$gte = Number(minPrice);
            if (maxPrice) query['price.amount'].$lte = Number(maxPrice);
        }

        // Date availability filtering
        if (startDate && endDate) {
            query.$and = [
                { 'availability.startDate': { $lte: new Date(startDate) } },
                { 'availability.endDate': { $gte: new Date(endDate) } },
                { 'availability.unavailableDates': {
                        $not: {
                            $elemMatch: {
                                $gte: new Date(startDate),
                                $lte: new Date(endDate)
                            }
                        }
                    }}
            ];
        }

        // Pagination
        const skip = (page - 1) * limit;

        // Sorting
        let sortOption = {};
        if (sort === 'priceAsc') sortOption = { 'price.amount': 1 };
        else if (sort === 'priceDesc') sortOption = { 'price.amount': -1 };
        else if (sort === 'rating') sortOption = { 'ratings.average': -1 };
        else sortOption = { createdAt: -1 }; // Default is newest first

        // Execute query
        const rentals = await Rental.find(query)
            .sort(sortOption)
            .skip(skip)
            .limit(Number(limit))
            .populate('owner', 'username');

        // Get total count for pagination
        const total = await Rental.countDocuments(query);

        res.status(200).json({
            rentals,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get all rentals error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.getRentalById = async (req, res) => {
    try {
        const rentalId = req.params.id;

        const rental = await Rental.findById(rentalId)
            .populate('owner', 'username email');

        if (!rental) {
            return res.status(404).json({ message: 'Rental not found' });
        }

        res.status(200).json({ rental });
    } catch (error) {
        console.error('Get rental by ID error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.updateRental = async (req, res) => {
    try {
        const rentalId = req.params.id;
        const ownerId = req.userData.userId;

        // Check if rental exists
        const rental = await Rental.findById(rentalId);
        if (!rental) {
            return res.status(404).json({ message: 'Rental not found' });
        }

        // Check if user is the owner
        if (rental.owner.toString() !== ownerId) {
            return res.status(403).json({ message: 'Unauthorized: You are not the owner of this listing' });
        }

        // Validate request body
        const { error } = validateRental(req.body);
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        // Prevent updating critical fields
        delete req.body.owner;
        delete req.body.status;
        delete req.body.ratings;
        delete req.body.reviewsCount;

        // Update rental
        const updatedRental = await Rental.findByIdAndUpdate(
            rentalId,
            { $set: req.body },
            { new: true, runValidators: true }
        );

        res.status(200).json({
            message: 'Rental updated successfully',
            rental: updatedRental
        });
    } catch (error) {
        console.error('Update rental error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.deleteRental = async (req, res) => {
    try {
        const rentalId = req.params.id;
        const ownerId = req.userData.userId;

        // Check if rental exists
        const rental = await Rental.findById(rentalId);
        if (!rental) {
            return res.status(404).json({ message: 'Rental not found' });
        }

        // Check if user is the owner or admin
        if (rental.owner.toString() !== ownerId && req.userData.role !== 'admin') {
            return res.status(403).json({ message: 'Unauthorized: You cannot delete this listing' });
        }

        // Check if there are any active bookings
        const activeBookings = await Booking.countDocuments({
            rental: rentalId,
            status: { $in: ['pending', 'confirmed'] }
        });

        if (activeBookings > 0) {
            return res.status(400).json({ message: 'Cannot delete rental with active bookings' });
        }

        // Delete rental
        await Rental.findByIdAndDelete(rentalId);

        res.status(200).json({ message: 'Rental deleted successfully' });
    } catch (error) {
        console.error('Delete rental error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// BOOKING OPERATIONS

exports.createBooking = async (req, res) => {
    try {
        // Validate request body
        const { error } = validateBooking(req.body);
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        const { rentalId, startDate, endDate, specialRequests } = req.body;
        const customerId = req.userData.userId;

        // Check if rental exists and is available
        const rental = await Rental.findOne({
            _id: rentalId,
            status: 'approved'
        });

        if (!rental) {
            return res.status(404).json({ message: 'Rental not found or not available' });
        }

        // Check if customer is not the owner
        if (rental.owner.toString() === customerId) {
            return res.status(400).json({ message: 'You cannot book your own listing' });
        }

        // Check date availability
        const bookingStartDate = new Date(startDate);
        const bookingEndDate = new Date(endDate);

        if (bookingStartDate >= bookingEndDate) {
            return res.status(400).json({ message: 'End date must be after start date' });
        }

        if (bookingStartDate < new Date() ||
            bookingStartDate < rental.availability.startDate ||
            bookingEndDate > rental.availability.endDate) {
            return res.status(400).json({ message: 'Selected dates are not available' });
        }

        // Check for date conflicts with existing bookings
        const conflictingBooking = await Booking.findOne({
            rental: rentalId,
            status: { $in: ['pending', 'confirmed'] },
            $or: [
                { startDate: { $lte: bookingEndDate }, endDate: { $gte: bookingStartDate } }
            ]
        });

        if (conflictingBooking) {
            return res.status(400).json({ message: 'Selected dates are already booked' });
        }

        // Calculate total price
        const days = Math.ceil((bookingEndDate - bookingStartDate) / (1000 * 60 * 60 * 24));
        let totalPrice = rental.price.amount;

        if (rental.price.period === 'hour') {
            totalPrice *= days * 24; // convert days to hours
        } else if (rental.price.period === 'day') {
            totalPrice *= days;
        } else if (rental.price.period === 'week') {
            totalPrice *= days / 7;
        } else if (rental.price.period === 'month') {
            totalPrice *= days / 30;
        }

        // Create booking
        const booking = new Booking({
            rental: rentalId,
            customer: customerId,
            startDate: bookingStartDate,
            endDate: bookingEndDate,
            totalPrice,
            specialRequests,
            status: rental.availability.instantBooking ? 'confirmed' : 'pending'
        });

        await booking.save();

        // Update rental unavailable dates
        await Rental.findByIdAndUpdate(rentalId, {
            $push: {
                'availability.unavailableDates': {
                    $each: getDatesInRange(bookingStartDate, bookingEndDate)
                }
            }
        });

        // Notify owner about new booking
        try {
            await axios.post(`${config.services.notification}/notifications/new-booking`, {
                bookingId: booking._id,
                rentalId,
                ownerId: rental.owner,
                customerId
            });
        } catch (notificationError) {
            console.error('Failed to send notification:', notificationError);
            // Continue anyway, not critical
        }

        res.status(201).json({
            message: `Booking ${booking.status === 'confirmed' ? 'confirmed' : 'submitted for approval'}`,
            booking
        });
    } catch (error) {
        console.error('Create booking error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.getUserBookings = async (req, res) => {
    try {
        const userId = req.userData.userId;
        const { status, page = 1, limit = 10 } = req.query;

        // Build query
        const query = { customer: userId };
        if (status) query.status = status;

        // Pagination
        const skip = (page - 1) * limit;

        // Execute query
        const bookings = await Booking.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit))
            .populate({
                path: 'rental',
                select: 'title type price location images'
            });

        // Get total count for pagination
        const total = await Booking.countDocuments(query);

        res.status(200).json({
            bookings,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get user bookings error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.getOwnerBookings = async (req, res) => {
    try {
        const ownerId = req.userData.userId;
        const { status, page = 1, limit = 10 } = req.query;

        // Get all rentals owned by the user
        const rentals = await Rental.find({ owner: ownerId }).select('_id');
        const rentalIds = rentals.map(r => r._id);

        // Build query
        const query = { rental: { $in: rentalIds } };
        if (status) query.status = status;

        // Pagination
        const skip = (page - 1) * limit;

        // Execute query
        const bookings = await Booking.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit))
            .populate({
                path: 'rental',
                select: 'title type price location images'
            })
            .populate({
                path: 'customer',
                select: 'username email'
            });

        // Get total count for pagination
        const total = await Booking.countDocuments(query);

        res.status(200).json({
            bookings,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get owner bookings error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.updateBookingStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, reason } = req.body;
        const userId = req.userData.userId;

        // Check if status is valid
        if (!['confirmed', 'cancelled', 'completed'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        // Find booking
        const booking = await Booking.findById(id)
            .populate({
                path: 'rental',
                select: 'owner'
            });

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Check authorization
        const isOwner = booking.rental.owner.toString() === userId;
        const isCustomer = booking.customer.toString() === userId;

        if (!isOwner && !isCustomer && req.userData.role !== 'admin') {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        // Additional validation based on status
        if (status === 'confirmed' && !isOwner && req.userData.role !== 'admin') {
            return res.status(403).json({ message: 'Only the owner or admin can confirm bookings' });
        }

        if (status === 'cancelled') {
            if (!reason) {
                return res.status(400).json({ message: 'Cancellation reason is required' });
            }

            booking.cancellationReason = reason;
            booking.cancellationDate = new Date();

            // Update rental availability
            await Rental.findByIdAndUpdate(booking.rental._id, {
                $pull: {
                    'availability.unavailableDates': {
                        $gte: booking.startDate,
                        $lte: booking.endDate
                    }
                }
            });
        }

        booking.status = status;
        await booking.save();

        // Send notification
        try {
            const notificationType = status === 'confirmed' ? 'booking-confirmed' :
                status === 'cancelled' ? 'booking-cancelled' : 'booking-completed';

            await axios.post(`${config.services.notification}/notifications/${notificationType}`, {
                bookingId: booking._id,
                rentalId: booking.rental._id,
                ownerId: booking.rental.owner,
                customerId: booking.customer
            });
        } catch (notificationError) {
            console.error('Failed to send notification:', notificationError);
            // Continue anyway, not critical
        }

        res.status(200).json({
            message: `Booking ${status} successfully`,
            booking
        });
    } catch (error) {
        console.error('Update booking status error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// HELPER FUNCTIONS

function getDatesInRange(startDate, endDate) {
    const dates = [];
    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
    }

    return dates;
}