const Joi = require("joi");


exports.validateEsimPayment = (req, res, next) => {
  try {
    const schema = Joi.object({
      amount: Joi.alternatives().try(
        Joi.number().min(1),
        Joi.string().custom((value, helpers) => {
          const number = parseFloat(value);
          if (isNaN(number) || number < 1) {
            return helpers.error('any.invalid');
          }
          return value;
        })
      ).required().messages({
        'any.required': 'Amount is required.',
        'string.empty': 'Amount cannot be empty.',
        'any.invalid': 'Amount must be a non-negative number.',
      }),
      packageId: Joi.alternatives()
        .try(Joi.number(), Joi.string())
        .required()
        .messages({
          "any.required": "Package ID is required",
        }),
      quantity: Joi.number().allow(null).required().messages({
        "any.required": "Quantity is required",
        "number.base": "Quantity must be a number",
      }),
      operatorImage: Joi.string().allow(null).required().uri().messages({
        "any.required": "Operator image URL is required",
        "string.base": "Operator image URL must be a string",
        "string.uri": "Operator image URL must be a valid URL",
      }),
      operatorName: Joi.string().required().messages({
        "any.required": "Operator name is required",
        "string.base": "Operator name must be a string",
      }),
      isRechargable: Joi.boolean().allow(null).required().messages({
        "any.required": "Rechargeable status is required",
        "boolean.base": "Rechargeable status must be a boolean",
      }),
      accessKey: Joi.string().required().messages({
        "any.required": "Access key is required",
        "string.base": "Access key must be a string",
      }),
      type: Joi.string().required().messages({
        "any.required": "Type is required",
        "string.base": "Type must be a string",
      }),
      iccid: Joi.string().allow(null).optional().messages({
        "string.base": "ICCID must be a string or null",
      }),
      packageType: Joi.string().allow(null).optional().messages({
        "string.base": "packageType must be a string or null",
      }),
      region: Joi.string().allow(null).optional().messages({
        "string.base": "region must be a string or null",
      }),
      countries: Joi.array().allow(null).optional()
    });

    // Validate the request body against the schema
    const result = schema.validate(req.body);

    if (result.error) {
      // If validation fails, throw an error with the validation message
      throw new Error(result.error.details[0].message);
    }

    next();
  } catch (err) {
    console.error(err);
    next(err);
  }
};

exports.validateFlightSearchTicket = (req, res, next) => {
  try {
    const flightSegmentSchema = Joi.object({
      departureAirportCode: Joi.string().required().messages({
        "any.required": "Departure airport code is required",
        "string.base": "Departure airport code must be a string",
      }),
      departureDate: Joi.string().required().messages({
        "any.required": "Departure date is required",
      }),
      departureTimeFrom: Joi.string().required().messages({
        "any.required": "Departure time from is required",
        "string.base": "Departure time from must be a string",
        "string.pattern.base":
          "Departure time from must be in HH:MM format (00:00 - 23:59)",
      }),
      departureTimeTo: Joi.string().required().messages({
        "any.required": "Departure time to is required",
        "string.base": "Departure time to must be a string",
      }),
      arrivalTimeFrom: Joi.string().required().messages({
        "any.required": "Arrival time from is required",
        "string.base": "Arrival time from must be a string",
      }),
      arrivalTimeTo: Joi.string().required().messages({
        "any.required": "Arrival time to is required",
        "string.base": "Arrival time to must be a string",
      }),
      arrivalAirportCode: Joi.string().required().messages({
        "any.required": "Arrival airport code is required",
        "string.base": "Arrival airport code must be a string",
      }),
      cabinPreferences: Joi.array()
        .items(Joi.number().positive())
        .required()
        .messages({
          "any.required": "Cabin preferences are required",
          "array.base": "Cabin preferences must be an array of numbers",
          "array.items": "Cabin preferences must contain only positive numbers",
        }),
    });

    const passengerDataSchema = Joi.object({
      adultCount: Joi.number().required().integer().min(0).messages({
        "any.required": "Number of adults is required",
        "number.base": "Number of adults must be a number",
        "number.integer": "Number of adults must be an integer",
        "number.min": "Number of adults cannot be negative",
      }),
      childCount: Joi.number().required().integer().min(0).messages({
        "any.required": "Number of children is required",
        "number.base": "Number of children must be a number",
        "number.integer": "Number of children must be an integer",
        "number.min": "Number of children cannot be negative",
      }),
      infantCount: Joi.number().required().integer().min(0).messages({
        "any.required": "Number of infants is required",
        "number.base": "Number of infants must be a number",
        "number.integer": "Number of infants must be an integer",
        "number.min": "Number of infants cannot be negative",
      }),
    });

    const tripTypeSchema = Joi.string().required().messages({
      "any.required": "Trip type is required",
      "any.only": 'Trip type must be either "oneWay" or "roundTrip"',
    });

    const flightSegmentsSchema = Joi.array()
      .items(flightSegmentSchema)
      .required()
      .messages({
        "any.required": "Flight segments are required",
        "array.base": "Flight segments must be an array",
      });

    const flightBookingPayloadSchema = Joi.object({
      tripType: tripTypeSchema,
      flightSegments: flightSegmentsSchema,
      passengerData: passengerDataSchema,
    });

    // Validate the request body against the schema
    const result = flightBookingPayloadSchema.validate(req.body);

    if (result.error) {
      // If validation fails, throw an error with the validation message
      throw new Error(result.error.details[0].message);
    }

    next();
  } catch (err) {
    console.error(err);
    next(err);
  }
};

exports.validateFlightFareRules = (req, res, next) => {
  try {
    const schema = Joi.object({
      offerId: Joi.string().required().messages({
        "string.base": "Offer ID must be a string",
        "string.empty": "Offer ID cannot be empty",
        "any.required": "Offer ID is required",
      }),
      conversationId: Joi.string().required().messages({
        "string.base": "Conversation ID must be a string",
        "string.empty": "Conversation ID cannot be empty",
        "any.required": "Conversation ID is required",
      }),
    });

    // Validate the request body against the schema
    const result = schema.validate(req.body);

    if (result.error) {
      // If validation fails, throw an error with the validation message
      throw new Error(result.error.details[0].message);
    }

    next();
  } catch (err) {
    console.error(err);
    next(err);
  }
};

exports.validateFlightProvBook = (req, res, next) => {
  try {
    const schema = Joi.object({
      offerId: Joi.string().required().messages({
        "string.base": "Offer ID must be a string",
        "string.empty": "Offer ID cannot be empty",
        "any.required": "Offer ID is required",
      }),
      conversationId: Joi.string().required().messages({
        "string.base": "Conversation ID must be a string",
        "string.empty": "Conversation ID cannot be empty",
        "any.required": "Conversation ID is required",
      }),
      details: Joi.object().required().messages({
        "any.required": "Details is required",
      }),
      passengers: Joi.array().required().messages({
        "any.required": "Passenger is required",
      }),
      customerInfo: Joi.object().required().messages({
        "any.required": "CustomerInfo is required",
      }),
      journey: Joi.array().required().messages({
        "any.required": "Journey is required",
      }),
    });

    // Validate the request body against the schema
    const result = schema.validate(req.body);

    if (result.error) {
      // If validation fails, throw an error with the validation message
      throw new Error(result.error.details[0].message);
    }

    next();
  } catch (err) {
    console.error(err);
    next(err);
  }
};

exports.validateFlightCancel = (req, res, next) => {
  try {
    const conversationIdSchema = Joi.string().required().messages({
      "string.base": "Conversation ID must be a string",
      "string.empty": "Conversation ID cannot be empty",
      "any.required": "Conversation ID is required",
    });

    const selectedCorporateTxnIdSchema = Joi.string().required().messages({
      "string.base": "Selected Corporate Transaction ID must be a string",
      "string.empty": "Selected Corporate Transaction ID cannot be empty",
      "any.required": "Selected Corporate Transaction ID is required",
    });

    const bookingReferenceIdSchema = Joi.string().required().messages({
      "string.base": "Booking Reference ID must be a string",
      "string.empty": "Booking Reference ID cannot be empty",
      "any.required": "Booking Reference ID is required",
    });

    const schema = Joi.object({
      conversationId: conversationIdSchema,
      selectedCorporateTxnId: selectedCorporateTxnIdSchema,
      bookingReferenceId: bookingReferenceIdSchema,
    });

    // Validate the request body against the schema
    const result = schema.validate(req.body);

    if (result.error) {
      // If validation fails, throw an error with the validation message
      throw new Error(result.error.details[0].message);
    }

    next();
  } catch (err) {
    console.error(err);
    next(err);
  }
};

exports.validateFlightAncSearch = (req, res, next) => {
  try {
    const schema = Joi.object({
      offerId: Joi.string().required().messages({
        "string.base": "Offer ID must be a string",
        "string.empty": "Offer ID cannot be empty",
        "any.required": "Offer ID is required",
      }),
      conversationId: Joi.string().required().messages({
        "string.base": "Conversation ID must be a string",
        "string.empty": "Conversation ID cannot be empty",
        "any.required": "Conversation ID is required",
      }),
      bookingReferenceId: Joi.string().optional().messages({
        "string.base": "Booking Reference ID must be a string",
      }),
      supplierLocator: Joi.string().allow(null).optional().messages({
        "string.base": "Supplier locator must be a string",
      }),
      isLcc: Joi.boolean().required().messages({
        "string.base": "Is LCC must be a string",
        "any.required": "Is LCC is required",
      }),
    });

    // Validate the request body against the schema
    const result = schema.validate(req.body);

    if (result.error) {
      // If validation fails, throw an error with the validation message
      throw new Error(result.error.details[0].message);
    }

    next();
  } catch (err) {
    console.error(err);
    next(err);
  }
};

exports.validateFlightAncProvBook = (req, res, next) => {
  try {
    const ancillarySchema = Joi.object({
      ancType: Joi.string().required().messages({
        "any.required": "Ancillary type is required",
      }),
      ancillaryOfferId: Joi.string().required().messages({
        "string.empty": "Ancillary offer ID cannot be empty",
        "any.required": "Ancillary offer ID is required",
      }),
      passengerKey: Joi.string().required().messages({
        "string.empty": "Passenger key cannot be empty",
        "any.required": "Passenger key is required",
      }),
      segmentKey: Joi.string().required().messages({
        "string.empty": "Segment key cannot be empty",
        "any.required": "Segment key is required",
      }),
    }).required();

    const schema = Joi.object({
      selectedAncillaries: Joi.array()
        .items(ancillarySchema)
        .required()
        .messages({
          "any.required": "Selected ancillaries are required",
        }),
      conversationId: Joi.string().required().messages({
        "string.base": "Conversation ID must be a string",
        "string.empty": "Conversation ID cannot be empty",
        "any.required": "Conversation ID is required",
      }),
      isLcc: Joi.boolean().required().messages({
        "boolean.base": "Is LCC must be a boolean value",
        "any.required": "Is LCC is required",
      }),
      offerId: Joi.string().required().messages({
        "string.empty": "Offer ID cannot be empty",
        "any.required": "Offer ID is required",
      }),
    });

    // Validate the request body against the schema
    const result = schema.validate(req.body);

    if (result.error) {
      // If validation fails, throw an error with the validation message
      throw new Error(result.error.details[0].message);
    }

    next();
  } catch (err) {
    console.error(err);
    next(err);
  }
};

exports.validateFlightPayment = (req, res, next) => {
  try {
    const ancillarySchema = Joi.object({
      ancType: Joi.string().required().messages({
        "any.required": "Ancillary type is required",
      }),
      ancillaryOfferId: Joi.string().required().messages({
        "string.empty": "Ancillary offer ID cannot be empty",
        "any.required": "Ancillary offer ID is required",
      }),
      passengerKey: Joi.string().required().messages({
        "string.empty": "Passenger key cannot be empty",
        "any.required": "Passenger key is required",
      }),
      segmentKey: Joi.string().required().messages({
        "string.empty": "Segment key cannot be empty",
        "any.required": "Segment key is required",
      }),
    }).required();

    const schema = Joi.object({
      conversationId: Joi.string().required().messages({
        "string.base": "Conversation ID must be a string",
        "string.empty": "Conversation ID cannot be empty",
        "any.required": "Conversation ID is required",
      }),
      isLcc: Joi.boolean().required().messages({
        "boolean.base": "Is LCC must be a boolean value",
        "any.required": "Is LCC is required",
      }),
      fare: Joi.number().required().messages({
        "number.base": "Fare must be a number value",
        "any.required": "Fare is required",
      }),
      totalAncillaryPrice: Joi.number().required().messages({
        "number.base": "Total ancillary price must be a number value",
        "any.required": "Total ancillary price is required",
      }),
      offerId: Joi.string().required().messages({
        "string.empty": "Offer ID cannot be empty",
        "any.required": "Offer ID is required",
      }),
      ancillaryDetails: Joi.alternatives().try(
        Joi.object({
          selectedAncillaries: Joi.array().items(ancillarySchema).optional(),
          conversationId: Joi.string().optional().messages({
            "string.base": "Conversation ID must be a string",
            "string.empty": "Conversation ID cannot be empty",
          }),
          isLcc: Joi.boolean().optional().messages({
            "boolean.base": "Is LCC must be a boolean value",
          }),
          offerId: Joi.string().optional().messages({
            "string.empty": "Offer ID cannot be empty",
          }),
        }),
        Joi.array()
      ),
      passengers: Joi.array().required().messages({
        "any.required": "Passengers are required",
      }),
      customerInfo: Joi.object().required().messages({
        "any.required": "Customer Info is required",
      }),
      amount: Joi.alternatives().try(
        Joi.number(),
        Joi.string()
      ).required()
        .messages({
          'any.required': 'Amount is required.',
          'string.empty': 'Amount cannot be empty.'
        }),
      currencyCode: Joi.string().required().messages({
        "any.required": "Currency code is required",
      }),
      accessKey: Joi.string().required().messages({
        "any.required": "AccessKey is required",
      }),
    });

    // Validate the request body against the schema
    const result = schema.validate(req.body);

    if (result.error) {
      // If validation fails, throw an error with the validation message
      throw new Error(result.error.details[0].message);
    }

    next();
  } catch (err) {
    console.error(err);
    next(err);
  }
};

exports.validateHotelSearch = (req, res, next) => {
  try {
    const roomSchema = Joi.object({
      adult: Joi.number()
        .integer()
        .required()
        .messages({
          'number.base': 'Number of adults must be a valid number',
          'number.integer': 'Number of adults must be an integer',
          'any.required': 'Number of adults is required'
        }),
      child: Joi.number()
        .integer()
        .required()
        .messages({
          'number.base': 'Number of children must be a valid number',
          'number.integer': 'Number of children must be an integer',
          'any.required': 'Number of children is required'
        }),
      roomIndex: Joi.number()
        .integer()
        .required()
        .messages({
          'number.base': 'Room index must be a valid number',
          'number.integer': 'Room index must be an integer',
          'any.required': 'Room index is required'
        }),
      childAge: Joi.array()
        .items(Joi.number()
          .integer()
          .optional()
          .messages({
            'number.base': 'Child age must be a valid number',
            'number.integer': 'Child age must be an integer',
          }))
    });

    const payloadSchema = Joi.object({
      userId: Joi.number()
        .optional(),
      userType: Joi.string()
        .optional(),
      country: Joi.string()
        .required()
        .messages({
          'string.empty': 'Country cannot be empty',
          'any.required': 'Country is required'
        }),
      city: Joi.string()
        .required()
        .messages({
          'string.empty': 'City cannot be empty',
          'any.required': 'City is required'
        }),
      checkIn: Joi.date()
        .iso()
        .required()
        .messages({
          'date.base': 'Check-in date must be a valid date',
          'date.format': 'Check-in date must be in ISO 8601 format',
          'any.required': 'Check-in date is required'
        }),
      checkOut: Joi.date()
        .iso()
        .greater(Joi.ref('checkIn'))
        .required()
        .messages({
          'date.base': 'Check-out date must be a valid date',
          'date.format': 'Check-out date must be in ISO 8601 format',
          'date.greater': 'Check-out date must be after check-in date',
          'any.required': 'Check-out date is required'
        }),
      rooms: Joi.array()
        .items(roomSchema)
        .required()
        .messages({
          'any.required': 'Rooms information is required'
        }),
      originCountry: Joi.string()
        .required()
        .messages({
          'string.empty': 'Origin country cannot be empty',
          'any.required': 'Origin country is required'
        })
    });

    // Validate the request body against the schema
    const result = payloadSchema.validate(req.body);

    if (result.error) {
      // If validation fails, throw an error with the validation message
      throw new Error(result.error.details[0].message);
    }

    next();
  } catch (err) {
    console.error(err);
    next(err);
  }
};

exports.validateHotelAndRoomDetails = (req, res, next) => {
  try {
    const payloadSchema = Joi.object({
      userId: Joi.number().optional()
        .messages({
          'number.base': 'User ID must be a number.',
        }),
      userType: Joi.string().optional(),
      hotelKey: Joi.string().required()
        .messages({
          'any.required': 'Hotel key is required.',
        }),
      searchKey: Joi.string().required()
        .messages({
          'any.required': 'Search key is required.',
        }),
      conversationId: Joi.string().required()
        .messages({
          'any.required': 'Conversation ID is required.',
        })
    });
    // Validate the request body against the schema
    const result = payloadSchema.validate(req.body);

    if (result.error) {
      // If validation fails, throw an error with the validation message
      throw new Error(result.error.details[0].message);
    }

    next();
  } catch (err) {
    console.error(err);
    next(err);
  }
};

exports.validateHotelPreBook = (req, res, next) => {
  try {
    const payloadSchema = Joi.object({
      userId: Joi.number().optional(),
      userType: Joi.string().optional(),
      hotelKey: Joi.string().required()
        .messages({
          'any.required': 'Hotel key is required.',
        }),
      conversationId: Joi.string().required()
        .messages({
          'any.required': 'Conversation ID is required.',
        }),
      searchKey: Joi.string().required()
        .messages({
          'any.required': 'Search key is required.',
        }),
      rooms: Joi.array().items(Joi.object({
        roomKey: Joi.string().required()
          .messages({
            'any.required': 'Room key is required.',
          }),
        roomIndex: Joi.number().required()
          .messages({
            'any.required': 'Room index is required.',
            'number.base': 'Room index must be a number.',
          })
      })).required()
    });
    // Validate the request body against the schema
    const result = payloadSchema.validate(req.body);

    if (result.error) {
      // If validation fails, throw an error with the validation message
      throw new Error(result.error.details[0].message);
    }

    next();
  } catch (err) {
    console.error(err);
    next(err);
  }
};

exports.validateHotelBook = (req, res, next) => {
  try {
    const payloadSchema = Joi.object({
      conversationId: Joi.string().required()
        .messages({
          'any.required': 'Conversation ID is required.',
        }),
      hotelKey: Joi.string().required()
        .messages({
          'any.required': 'Hotel key is required.',
        }),
      searchKey: Joi.string().required()
        .messages({
          'any.required': 'Search key is required.',
        }),
      clientReference: Joi.string().required()
        .messages({
          'any.required': 'Client reference is required.'
        }),
      hotelContact: Joi.object({
        email: Joi.string().optional().allow(null, ''),
  phoneNumber: Joi.string().optional().allow(null, ''),
        checkInTime: Joi.string().required()
          .messages({
            'any.required': 'Check-in time is required.'
          }),
        checkOutTime: Joi.string().required()
          .messages({
            'any.required': 'Check-out time is required.'
          }),
        image: Joi.string().optional().allow(null, ''),
        address: Joi.string().required()
          .messages({
            'any.required': 'Hotel contact address is required.'
          }),
        city: Joi.string().required()
          .messages({
            'any.required': 'City is required.'
          }),
        country: Joi.string().required()
          .messages({
            'any.required': 'Country is required.'
          })
      }).required(),
      amount: Joi.alternatives().try(
        Joi.number(),
        Joi.string()
      ).required()
        .messages({
          'any.required': 'Amount is required.',
          'string.empty': 'Amount cannot be empty.'
        }),
      stayDateRange: Joi.object({
        checkIn: Joi.string().required()
          .messages({
            'any.required': 'Check-in date is required.',
          }),
        checkOut: Joi.string().required()
          .messages({
            'any.required': 'Check-out date is required.',
          })
      }).required(),
      bookingKey: Joi.string().required()
        .messages({
          'any.required': 'Booking key is required.',
        }),
      rooms: Joi.array().items(Joi.object({
        roomKey: Joi.string().required()
          .messages({
            'any.required': 'Room key is required.',
          }),
        roomIndex: Joi.number().required()
          .messages({
            'any.required': 'Room index is required.',
            'number.base': 'Room index must be a number.',
          }),
        passengers: Joi.array().items(Joi.object({
          passengerKey: Joi.number().required(),
          isLead: Joi.boolean().required(),
          ptc: Joi.string().required(),
          mealPreference: Joi.string().optional().allow(null, ''),
          passengerInfo: Joi.object({
            surname: Joi.string().required(),
            gender: Joi.string().required(),
            birthDate: Joi.string().required(),
            nameTitle: Joi.string().required(),
            middleName: Joi.string().allow('').required(),
            givenName: Joi.string().required()
          }).required(),
          contact: Joi.object({
            postalAddress: Joi.object({
              label: Joi.string().required(),
              street: Joi.array().items(Joi.string().required()).required(),
              postalCode: Joi.string().required(),
              cityName: Joi.string().required(),
              countryCode: Joi.string().required()
            }).required(),
            contactProvided: Joi.array().items(Joi.object({
              emailAddress: Joi.array().items(Joi.string().email()).required(),
              phone: Joi.array().items(Joi.object({
                label: Joi.string().required(),
                areaCode: Joi.number().integer().required(),
                phoneNumber: Joi.string().required()
              })).required()
            })).required()
          }).required()
        })).required()
      })).required(),
      currency: Joi.string().required()
        .messages({
          'any.required': 'Currency is required.'
        }),
      culture: Joi.string().required()
        .messages({
          'any.required': 'Culture is required.'
        }),
      accessKey: Joi.string().required()
        .messages({
          'any.required': 'Access key is required.'
        }),
      taxDetails: Joi.object({
        taxName: Joi.string().required(),
        registerNumber: Joi.string().required(),
        companyName: Joi.string().required(),
        emailAddress: Joi.string().email().required(),
        phoneNumber: Joi.string().required(),
        address: Joi.string().required()
      }).required(),
      paymentDetails: Joi.object({
        paymentMode: Joi.string().required(),
        cardInfo: Joi.string().allow('').required(),
        address: Joi.object({
          label: Joi.string().required(),
          street: Joi.array().items(Joi.string().required()).required(),
          postalCode: Joi.string().required(),
          cityName: Joi.string().required(),
          countryCode: Joi.string().required()
        }).required()
      }).required(),
      billingEmail: Joi.string().email().required()
        .messages({
          'any.required': 'Billing email is required.',
          'string.email': 'Billing email must be a valid email address.'
        })
    });
    // Validate the request body against the schema
    const result = payloadSchema.validate(req.body);

    if (result.error) {
      // If validation fails, throw an error with the validation message
      throw new Error(result.error.details[0].message);
    }

    next();
  } catch (err) {
    console.error(err);
    next(err);
  }
};

exports.validateHotelCancellationCharge = (req, res, next) => {
  try {
    const payloadSchema = Joi.object({
      userId: Joi.number().optional()
        .messages({
          'number.base': 'User ID must be a number.',
        }),
      userType: Joi.string().optional(),
      conversationId: Joi.string().required()
        .messages({
          'any.required': 'Conversation ID is required.',
        }),
      bookingReferenceId: Joi.string().required()
        .messages({
          'any.required': 'Booking reference ID is required.'
        })
    });
    // Validate the request body against the schema
    const result = payloadSchema.validate(req.body);

    if (result.error) {
      // If validation fails, throw an error with the validation message
      throw new Error(result.error.details[0].message);
    }

    next();
  } catch (err) {
    console.error(err);
    next(err);
  }
};

exports.validateHotelCancelBooking = (req, res, next) => {
  try {
    const payloadSchema = Joi.object({
      userId: Joi.number().optional()
        .messages({
          'number.base': 'User ID must be a number.',
        }),
      userType: Joi.string().optional(),
      bookingReferenceId: Joi.string().required()
        .messages({
          'any.required': 'Booking reference ID is required.'
        }),
      conversationId: Joi.string().required()
        .messages({
          'any.required': 'Conversation ID is required.'
        }),
      selectedCorporateTxnId: Joi.string().required()
        .messages({
          'any.required': 'Selected corporate transaction ID is required.',
        })
    });
    // Validate the request body against the schema
    const result = payloadSchema.validate(req.body);

    if (result.error) {
      // If validation fails, throw an error with the validation message
      throw new Error(result.error.details[0].message);
    }

    next();
  } catch (err) {
    console.error(err);
    next(err);
  }
};

exports.validateCreateMerchant = (req, res, next) => {
  try {
     const schema = Joi.object({
          profileName: Joi.string().required().messages({
               'string.base': 'ProfileName must be a string',
               'any.required': 'ProfileName is required',
          }),
          merchantEmail: Joi.string().email().required().messages({
               'string.base': 'MerchantEmail must be a string',
               'string.email': 'MerchantEmail must be a valid email address',
               'any.required': 'MerchantEmail is required',
          }),
          merchantMobileNo: Joi.string()
               .pattern(/^[0-9]{10}$/)
               .required()
               .messages({
                    'string.base': 'MerchantMobileNo must be a string',
                    'string.pattern.base': 'MerchantMobileNo must be a 10-digit numeric string',
                    'any.required': 'MerchantMobileNo is required',
               }),
          merchantAddress: Joi.string().allow('').messages({
               'string.base': 'MerchantAddress must be a string',
          }),
          merchantCity: Joi.string().required().messages({
               'string.base': 'MerchantCity must be a string',
               'any.required': 'MerchantCity is required',
          }),
          merchantPinCode: Joi.string()
               .length(6)
               .pattern(/^[0-9]+$/)
               .required()
               .messages({
                    'string.base': 'MerchantPinCode must be a string',
                    'string.length': 'MerchantPinCode must be 6 digits long',
                    'string.pattern.base': 'MerchantPinCode must be numeric',
                    'any.required': 'MerchantPinCode is required',
               }),
          saveSenderAddress: Joi.boolean().required().messages({
               'boolean.base': 'SaveSenderAddress must be a boolean',
               'any.required': 'SaveSenderAddress is required',
          }),
     })
     const result = schema.validate(req.body)

     if (result.error) {
          // If validation fails, throw an error with the validation message
          throw new Error(result.error.details[0].message)
     }

     next()
  } catch (error) {
     console.error(error)
     next(error)
  }
   
  }

exports.validateLogisticsUpdateAddress = (req, res, next) => {
  try {
    const payloadSchema = Joi.object({
      name: Joi.string().max(50).optional()
        .messages({ 'string.max': 'Full name must not exceed 50 characters.' }),
      addressLine1: Joi.string().min(10).max(100).pattern(/\d/).optional()
        .messages({
          'string.min': 'Address line 1 must be at least 10 characters.',
          'string.max': 'Address line 1 must not exceed 100 characters.',
          'string.pattern.base': 'Address line 1 must include a house / flat / road number.'
        }),
      addressLine2: Joi.string().allow('').max(100).optional()
        .messages({ 'string.max': 'Address line 2 must not exceed 100 characters.' }),
      city: Joi.string().optional(),
      countryCode: Joi.string().optional(),
      country: Joi.string().allow('').optional(),
      state: Joi.string().allow('').optional(),
      email: Joi.string().email().optional()
        .messages({ 'string.email': 'Email must be a valid email address.' }),
      default: Joi.number().integer().valid(0, 1).optional(),
      phoneNumber: Joi.string().optional(),
      zipCode: Joi.string().allow('').optional(),
    });
    const result = payloadSchema.validate(req.body);
    if (result.error) {
      throw new Error(result.error.details[0].message);
    }
    next();
  } catch (err) {
    console.error(err);
    next(err);
  }
};

exports.validateLogisticsAddAdress = (req, res, next) => {
  try {
    const payloadSchema = Joi.object({
      name: Joi.string().max(50).required()
        .messages({
          'any.required': 'Name is required.',
          'string.max': 'Full name must not exceed 50 characters.'
        }),
      addressLine1: Joi.string().min(10).max(100).pattern(/\d/).required()
        .messages({
          'any.required': 'Address line 1 is required.',
          'string.min': 'Address line 1 must be at least 10 characters.',
          'string.max': 'Address line 1 must not exceed 100 characters.',
          'string.pattern.base': 'Address line 1 must include a house / flat / road number.'
        }),
      addressLine2: Joi.string().allow('').max(100).optional()
        .messages({ 'string.max': 'Address line 2 must not exceed 100 characters.' }),
      city: Joi.string().required()
        .messages({
          'any.required': 'City is required.'
        }),
      countryCode: Joi.string().required()
        .messages({
          'any.required': 'Country code is required.',
        }),
      country: Joi.string().allow('').optional(),
      state: Joi.string().allow('').optional(),
      email: Joi.string().email().required()
        .messages({
          'any.required': 'Email is required.',
          'string.email': 'Email must be a valid email address.'
        }),
      default: Joi.number().integer().valid(0, 1).required()
        .messages({
          'any.required': 'Default value is required.',
          'number.base': 'Default value must be a number.',
          'number.integer': 'Default value must be an integer.',
          'any.only': 'Default value must be either 0 or 1.'
        }),
      phoneNumber: Joi.string().required()
        .messages({
          'any.required': 'Phone number is required.'
        }),
      zipCode: Joi.string().allow('').optional(),
      isReceiver: Joi.number().integer().valid(0, 1).required()
        .messages({
          'any.required': 'Is receiver value is required.',
          'number.base': 'Is receiver value must be a number.',
          'number.integer': 'Is receiver value must be an integer.',
          'any.only': 'Is receiver value must be either 0 or 1.'
        })
    });
    // Validate the request body against the schema
    const result = payloadSchema.validate(req.body);

    if (result.error) {
      // If validation fails, throw an error with the validation message
      throw new Error(result.error.details[0].message);
    }

    next();
  } catch (err) {
    console.error(err);
    next(err);
  }
};

exports.validateLogisticsCalculateRate = (req, res, next) => {
  try {
    const payloadSchema = Joi.object({
         originPinCode: Joi.number()
              .required(),

         destinationPinCode: Joi.number()
              .required(),

         packageWeight: Joi.number()
              .positive() 
              .required(),

         serviceType: Joi.string()
              .valid('NORMAL', 'SPEED') 
              .required(),

         orderCategory: Joi.string()
              .required(),

         recieveSMS: Joi.boolean().required(),

         orderDate: Joi.date()
              .iso() // Ensures the date is in ISO 8601 format
              .required(),
    })
    // Validate the request body against the schema
    const result = payloadSchema.validate(req.body);

    if (result.error) {
      // If validation fails, throw an error with the validation message
      throw new Error(result.error.details[0].message);
    }

    next();
  } catch (err) {
    console.error(err);
    next(err);
  }
};

exports.validateLogisticsPayment = (req, res, next) => {
  try {
    const payloadSchema = Joi.object({
         pickupLocation: Joi.number()
              .integer() // Ensures it's an integer
              .required(),
         senderAddress: Joi.object({
              Line1: Joi.string().required().messages({
                   'string.base': 'Origin address line 1 must be a string',
                   'any.required': 'Origin address line 1 is required',
              }),

              Line2: Joi.string().allow('').optional().messages({
                   'string.base': 'Origin address line 2 must be a string',
              }),

              Line3: Joi.string().required().messages({
                   'string.base': 'Origin address line 3 must be a string',
                   'any.required': 'Origin address line 3 is required',
              }),

              City: Joi.string().required().messages({
                   'string.base': 'Origin city must be a string',
                   'any.required': 'Origin city is required',
              }),
              State: Joi.string().required().messages({
                   'string.base': 'State must be a string',
                   'any.required': 'State is required',
              }),
              PostCode: Joi.string()
                   .length(6)
                   .pattern(/^[0-9]+$/)
                   .required()
                   .messages({
                        'string.base': 'Origin postcode must be a string',
                        'string.length': 'Origin postcode must be exactly 6 characters',
                        'string.pattern.base': 'Origin postcode must be numeric',
                        'any.required': 'Origin postcode is required',
                   }),

              CountryCode: Joi.string().length(2).required().messages({
                   'string.base': 'Origin country code must be a string',
                   'string.length': 'Origin country code must be exactly 2 characters',
                   'any.required': 'Origin country code is required',
              }),

              Description: Joi.string().required().messages({
                   'string.base': 'Origin description must be a string',
                   'any.required': 'Origin description is required',
              }),

              Remark: Joi.string().allow('').messages({
                   'string.base': 'Remark must be a string',
              }),

              id: Joi.number().integer().required().messages({
                   'number.base': 'ID must be a number',
                   'number.integer': 'ID must be an integer',
                   'any.required': 'ID is required',
              }),
         }).required(),
         customerName: Joi.string().required().messages({
              'string.base': 'CustomerName must be a string',
              'any.required': 'CustomerName is required',
         }),
         customerAddress: Joi.string().required().messages({
              'string.base': 'CustomerAddress must be a string',
              'any.required': 'CustomerAddress is required',
         }),

         customerCity: Joi.string().required().messages({
              'string.base': 'CustomerCity must be a string',
              'any.required': 'CustomerCity is required',
         }),

         customerPinCode: Joi.string()
              .length(6)
              .pattern(/^[0-9]+$/) // Ensures it's a numeric string
              .required(),

         customerMobileNo: Joi.string()
              .pattern(/^[0-9]{10}$/)
              .required()
              .messages({
                   'string.base': 'CustomerMobileNo must be a string',
                   'string.pattern.base': 'CustomerMobileNo must be a 10-digit numeric string',
                   'any.required': 'CustomerMobileNo is required',
              }),

              orderDate: Joi.string()
              .pattern(/^\d{2}-\d{2}-\d{4} \d{2}:\d{2}:\d{2}$/)
              .required()
              .messages({
                'string.pattern.base': 'OrderDate must be in the format DD-MM-YYYY HH:mm:ss',
                'any.required': 'OrderDate is required',
              })
,            

         orderAmount: Joi.number().positive().required().messages({
              'number.base': 'OrderAmount must be a number',
              'number.positive': 'OrderAmount must be a positive number',
              'any.required': 'OrderAmount is required',
         }),
         orderWeight: Joi.number()
              .positive() // Ensures the weight is positive
              .required()
              .messages({
                   'number.base': 'OrderWeight must be a number',
                   'number.positive': 'OrderWeight must be a positive number',
                   'any.required': 'OrderWeight is required',
              }),

         orderCategory: Joi.string().required().messages({
              'string.base': 'OrderCategory must be a string',
              'any.required': 'OrderCategory is required',
         }),

         serviceType: Joi.string().valid('NORMAL', 'SPEED').required().messages({
              'string.base': 'ServiceType must be a string',
              'string.valid': 'ServiceType must be one of NORMAL, SPEED',
              'any.required': 'ServiceType is required',
         }),

         sendSms: Joi.boolean().required(),
         accessKey: Joi.string().required().messages({
              'any.required': 'Access key is required.',
         }),
    })
    // Validate the request body against the schema
    const result = payloadSchema.validate(req.body);

    if (result.error) {
      // If validation fails, throw an error with the validation message
      throw new Error(result.error.details[0].message);
    }

    next();
  } catch (err) {
    console.error(err);
    next(err);
  }
};

// ─── Logistics V3 (Shiprocket) validators ────────────────────────────────────

exports.validateLogisticsdeliveryFee = (req, res, next) => {
  try {
    const schema = Joi.object({
      weight: Joi.number().positive().required().messages({
        'any.required': 'Weight is required.',
        'number.positive': 'Weight must be a positive number.',
      }),
      originPostCode: Joi.string().required().messages({
        'any.required': 'Origin pin code is required.',
      }),
      destinationPostCode: Joi.string().required().messages({
        'any.required': 'Destination pin code is required.',
      }),
      height: Joi.number().positive().optional(),
      width: Joi.number().positive().optional(),
      length: Joi.number().positive().optional(),
      isReturn: Joi.boolean().optional(),
      originCity: Joi.string().allow('').optional(),
      destinationCity: Joi.string().allow('').optional(),
    });

    const { error } = schema.validate(req.body);
    if (error) throw new Error(error.details[0].message);
    next();
  } catch (err) {
    console.error(err);
    next(err);
  }
};

exports.validateLogisticsInternationalDeliveryFee = (req, res, next) => {
  try {
    const schema = Joi.object({
      weight: Joi.number().positive().required().messages({
        'any.required': 'Weight is required.',
        'number.positive': 'Weight must be a positive number.',
      }),
      originPostCode: Joi.string().required().messages({
        'any.required': 'Origin pin code is required.',
      }),
      destinationCountryCode: Joi.string().min(1).required().messages({
        'any.required': 'Destination country code is required.',
        'string.min': 'Destination country code is required.',
      }),
      height: Joi.number().positive().optional(),
      width: Joi.number().positive().optional(),
      length: Joi.number().positive().optional(),
    });

    const { error } = schema.validate(req.body);
    if (error) throw new Error(error.details[0].message);
    next();
  } catch (err) {
    console.error(err);
    next(err);
  }
};

exports.validateLogisticsCreateShipment = (req, res, next) => {
  try {
    const addressSchema = Joi.object({
      name: Joi.string().required(),
      mobile: Joi.alternatives().try(Joi.string(), Joi.number()).required(),
      addressLine: Joi.string().required(),
      postCode: Joi.alternatives().try(Joi.string(), Joi.number()).required(),
      city: Joi.string().required(),
      countryCode: Joi.string().required(),
      state: Joi.string().allow('').optional(),
      email: Joi.string().email().allow('').optional(),
      phoneNumber: Joi.alternatives().try(Joi.string(), Joi.number()).optional(),
    }).unknown(true);

    const schema = Joi.object({
      amount: Joi.number().positive().required().messages({ 'any.required': 'Amount is required.' }),
      originAddress: addressSchema.required(),
      destinationAddress: addressSchema.required(),
      shipmentDetails: Joi.object({
        weight: Joi.number().positive().required(),
        height: Joi.number().optional(),
        width: Joi.number().optional(),
        length: Joi.number().optional(),
      }).unknown(true).required(),
      items: Joi.array().items(Joi.object({
        name: Joi.string().optional(),
        description: Joi.string().allow('').optional(),
        sku: Joi.string().allow('').optional(),
        quantity: Joi.number().optional(),
        units: Joi.number().optional(),
        price: Joi.number().optional(),
        hsn: Joi.string().allow('').optional(),
        hsn_code: Joi.string().allow('').optional(),
      }).unknown(true)).optional(),
      deliveryPartnerData: Joi.object({
        deliveryCompanyId: Joi.alternatives().try(Joi.string(), Joi.number()).required(),
        courierName: Joi.string().allow('').optional(),
      }).unknown(true).required(),
      isReturn: Joi.boolean().optional(),
      deliveredTxnId: Joi.alternatives().try(Joi.string(), Joi.number()).when('isReturn', {
        is: true,
        then: Joi.required(),
        otherwise: Joi.optional(),
      }),
      role: Joi.string().optional(),
      subCorporateId: Joi.alternatives().try(Joi.string(), Joi.number()).optional(),
      subCorporateEmail: Joi.string().email().allow('').optional(),
      subCorporateUsername: Joi.string().optional(),
      paymentGatewayResponse: Joi.object().optional(),
      pgAmount: Joi.number().optional(),
      successUrl: Joi.string().uri().optional(),
      failureUrl: Joi.string().uri().optional(),
      couponCode: Joi.string().allow('').optional(),
      consentAgreed: Joi.boolean().valid(true).required().messages({
        'any.required': 'Consent is required.',
        'any.only': 'You must agree to the terms before proceeding.',
      }),
    }).unknown(true);

    const { error } = schema.validate(req.body);
    if (error) throw new Error(error.details[0].message);
    next();
  } catch (err) {
    console.error(err);
    next(err);
  }
};

exports.validateCancelShipment = (req, res, next) => {
  try {
    const schema = Joi.object({
      orderId: Joi.alternatives().try(Joi.string(), Joi.number()).required().messages({
        'any.required': 'Order ID is required.',
      }),
    }).unknown(true);

    const { error } = schema.validate(req.body);
    if (error) throw new Error(error.details[0].message);
    next();
  } catch (err) {
    console.error(err);
    next(err);
  }
};

exports.validateTrackLogistics = (req, res, next) => {
  try {
    const schema = Joi.object({
      trackingNumber: Joi.alternatives().try(Joi.string(), Joi.number()).required().messages({
        'any.required': 'Tracking number is required.',
      }),
    }).unknown(true);

    const { error } = schema.validate(req.body);
    if (error) throw new Error(error.details[0].message);
    next();
  } catch (err) {
    console.error(err);
    next(err);
  }
};

exports.validateBalanceCheck = (req, res, next) => {
  try {
    const schema = Joi.object({
      amount: Joi.number().positive().required().messages({
        'any.required': 'Amount is required.',
        'number.positive': 'Amount must be a positive number.',
      }),
    }).unknown(true);

    const { error } = schema.validate(req.body);
    if (error) throw new Error(error.details[0].message);
    next();
  } catch (err) {
    console.error(err);
    next(err);
  }
};

exports.validateBusinessPanUpload = (req, res, next) => {
  try {
    const schema = Joi.object({
      base64String: Joi.string().required().messages({
        'string.base': 'File must be a string.',
        'any.required': 'File is required.',
      }),
      imageFormat: Joi.string().valid('pdf', 'jpg', 'jpeg', 'png').required().messages({
        'any.only': 'File format must be pdf, jpg, jpeg, or png.',
        'any.required': 'File format is required.',
      }),
    }).unknown(true);

    const { error } = schema.validate(req.body);
    if (error) throw new Error(error.details[0].message);
    next();
  } catch (err) {
    console.error(err);
    next(err);
  }
};
