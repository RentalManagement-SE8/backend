const Joi = require('joi');

exports.validateRental = (data) => {
    const schema = Joi.object({
        title: Joi.string().required(),
        type: Joi.string().valid('apartment', 'car', 'boat', 'equipment', 'other').required(),
        description: Joi.string().required(),
        price: Joi.object({
            amount: Joi.number().required(),
            period: Joi.string().valid('hour', 'day', 'week', 'month').required()
        }).required(),
        location: Joi.object({
            address: Joi.string().allow(''),
            city: Joi.string().required(),
            state: Joi.string().allow(''),
            zipCode: Joi.string().allow(''),
            country: Joi.string().required(),
            coordinates: Joi.object({
                lat: Joi.number(),
                lng: Joi.number()
            })
        }).required(),
        features: Joi.array().items(Joi.string()),
        specifications: Joi.object({
            bedrooms: Joi.number(),
            bathrooms: Joi.number(),
            area: Joi.number(),
            make: Joi.string(),
            model: Joi.string(),
            year: Joi.number(),
            mileage: Joi.number(),
            boatType: Joi.string(),
            length: Joi.number(),
            capacity: Joi.number(),
            additionalSpecs: Joi.object()
        }),
        images: Joi.array().items(
            Joi.object({
                url: Joi.string().required(),
                caption: Joi.string().allow('')
            })
        ),
        availability: Joi.object({
            startDate: Joi.date().required(),
            endDate: Joi.date().required(),
            unavailableDates: Joi.array().items(Joi.date()),
            instantBooking: Joi.boolean().default(true)
        }).required(),
        rules: Joi.array().items(Joi.string())
    });

    return schema.validate(data);
};

exports.validateBooking = (data) => {
    const schema = Joi.object({
        rentalId: Joi.string().required(),
        startDate: Joi.date().required(),
        endDate: Joi.date().required(),
        specialRequests: Joi.string().allow('')
    });

    return schema.validate(data);
};