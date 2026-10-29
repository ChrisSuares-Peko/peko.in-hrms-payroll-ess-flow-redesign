const Joi = require("joi");

function formatValidationError(error) {
  const path = error.details[0].path;
  if (path.includes("SeatDynamic")) {
    return "Invalid seat selection. Please re-select your seat and try again.";
  }
  if (path.includes("MealDynamic")) {
    return "Invalid meal selection. Please re-select your meal and try again.";
  }
  if (path.includes("Baggage")) {
    return "Invalid baggage selection. Please re-select your baggage and try again.";
  }
  if (path.includes("passengers")) {
    const passengerIndex = path.find((p) => typeof p === "number");
    const num = passengerIndex !== undefined ? ` ${passengerIndex + 1}` : "";
    return `Invalid details for passenger${num}. Please check and try again.`;
  }
  if (path.includes("outbount") || path.includes("inbount")) {
    return "Invalid flight booking details. Please try again.";
  }
  return "Invalid request. Please check your details and try again.";
}

exports.validateFlightSearch = (req, res, next) => {
  try {
    const schema = Joi.object({
      tripType: Joi.number().valid(1, 2, 3).required().messages({
        "number.base": "TripType must be a number",
        "any.only": "TripType must be either one-way or round-trip",
        "any.required": "TripType is required",
      }),

      flightSegments: Joi.array()
        .items(
          Joi.object({
            Origin: Joi.string().length(3).required().messages({
              "string.base": "Origin must be a string",
              "string.length": "Origin must be 3 characters (airport code)",
              "any.required": "Origin is required",
            }),
            Destination: Joi.string().length(3).required().messages({
              "string.base": "Destination must be a string",
              "string.length": "Destination must be 3 characters (airport code)",
              "any.required": "Destination is required",
            }),
            FlightCabinClass: Joi.number().required().messages({
              "number.base": "FlightCabinClass must be a number",
              "any.required": "FlightCabinClass is required",
            }),
            PreferredDepartureTime: Joi.date().iso().required().messages({
              "date.base": "PreferredDepartureTime must be a valid date",
              "date.format": "PreferredDepartureTime must be in ISO format",
              "any.required": "PreferredDepartureTime is required",
            }),
          })
        )
        .min(1)
        .required()
        .messages({
          "array.base": "FlightSegments must be an array",
          "array.min": "At least one flight segment is required",
          "any.required": "FlightSegments is required",
        }),

      passengerData: Joi.object({
        adultCount: Joi.number().min(1).required().messages({
          "number.base": "AdultCount must be a number",
          "number.min": "At least one adult passenger is required",
          "any.required": "AdultCount is required",
        }),
        childCount: Joi.number().min(0).required().messages({
          "number.base": "ChildCount must be a number",
          "any.required": "ChildCount is required",
        }),
        infantCount: Joi.number().min(0).required().messages({
          "number.base": "InfantCount must be a number",
          "any.required": "InfantCount is required",
        }),
      })
        .required()
        .messages({
          "object.base": "PassengerData must be an object",
          "any.required": "PassengerData is required",
        }),
    });

    const result = schema.validate(req.body);

    if (result.error) {
      throw new Error(result.error.details[0].message);
    }
    next();
  } catch (error) {
    console.error(error);
    next(error);
  }
};

exports.validateFareRules = (req, res, next) => {
  try {
    const schema = Joi.object({
      TraceId: Joi.string().uuid().required().messages({
        "string.base": "TraceId must be a string",
        "string.guid": "TraceId must be a valid UUID",
        "any.required": "TraceId is required",
      }),

      ResultIndex: Joi.string().required().messages({
        "string.base": "ResultIndex must be a string",
        "any.required": "ResultIndex is required",
      }),

      InbountResultIndex: Joi.string().allow("").messages({
        "string.base": "InbountResultIndex must be a string",
      }),
    });

    const result = schema.validate(req.body);

    if (result.error) {
      throw new Error(result.error.details[0].message);
    }

    next();
  } catch (error) {
    console.error(error);
    next(error);
  }
};

exports.validateSSR = (req, res, next) => {
  try {
    const schema = Joi.object({
      data: Joi.object({
        TraceId: Joi.string().uuid().required().messages({
          "string.base": "TraceId must be a string",
          "string.guid": "TraceId must be a valid UUID",
          "any.required": "TraceId is required",
        }),

        ResultIndex: Joi.string().required().messages({
          "string.base": "ResultIndex must be a string",
          "any.required": "ResultIndex is required",
        }),

        InbountResultIndex: Joi.string().allow("").messages({
          "string.base": "InbountResultIndex must be a string",
        }),
        price: Joi.number().required(),
      })
        .required()
        .messages({
          "any.required": "Data object is required",
        }),
    });

    const result = schema.validate(req.body);

    if (result.error) {
      throw new Error(result.error.details[0].message);
    }
    next();
  } catch (error) {
    console.error(error);
    next(error);
  }
};

exports.validatePayment = (req, res, next) => {
  try {
    const fareSchema = Joi.object({
      BaseFare: Joi.number().required(),
      Tax: Joi.number().required(),
      // YQTax: Joi.number().required(),
      // AdditionalTxnFeeOfrd: Joi.number().required(),
      // AdditionalTxnFeePub: Joi.number().required(),
    });

    const baggageSchema = Joi.object({
      AirlineCode: Joi.string().required(),
      FlightNumber: Joi.string().required(),
      WayType: Joi.number().required(),
      Code: Joi.string().required(),
      Description: Joi.any(),
      Weight: Joi.number().required(),
      Currency: Joi.string().required(),
      Price: Joi.number().required(),
      Origin: Joi.string().required(),
      Destination: Joi.string().required(),
    }).unknown(true);

    const seatSchema = Joi.object({
      AirlineCode: Joi.string().required(),
      FlightNumber: Joi.string().required(),
      CraftType: Joi.string().required(),
      Origin: Joi.string().required(),
      Destination: Joi.string().required(),
      AvailablityType: Joi.number().required(),
      Description: Joi.any(),
      Code: Joi.string().required(),
      RowNo: Joi.string().required(),
      SeatNo: Joi.string().required(),
      SeatType: Joi.number().required(),
      SeatWayType: Joi.number().required(),
      Compartment: Joi.number().required(),
      Deck: Joi.number().required(),
      Currency: Joi.string().required(),
      Price: Joi.number().required(),
    }).unknown(true);

    const passengerSchema = Joi.object({
      passengerId: Joi.string().required(),
      Title: Joi.string().required(),
      FirstName: Joi.string().required(),
      LastName: Joi.string().required(),
      PaxType: Joi.number().required(),
      DateOfBirth: Joi.string().allow(""),
      Gender: Joi.number().required(),
      PassportNo: Joi.string().allow(""),
      PassportExpiry: Joi.string().allow(""),
      PassportIssueDate: Joi.string().allow(""),
      AddressLine1: Joi.string().required(),
      AddressLine2: Joi.string().allow(""),
      City: Joi.string().required(),
      CellCountryCode: Joi.string().required(),
      ContactNo: Joi.string().required(),
      Email: Joi.string().email().required(),
      IsLeadPax: Joi.boolean().required(),
      Fare: fareSchema.required(),
      MealDynamic: Joi.array(),
      Baggage: Joi.array().items(baggageSchema),
      SeatDynamic: Joi.array().items(seatSchema),
      Nationality: Joi.string().required(),
      CountryCode: Joi.string().required(),
      CountryName: Joi.string().required(),
      PAN: Joi.string().allow(""),
      GSTCompanyAddress: Joi.string().allow(""),
      GSTCompanyContactNumber: Joi.string().allow(""),
      GSTCompanyName: Joi.string().allow(""),
      GSTNumber: Joi.string().allow(""),
      GSTCompanyEmail: Joi.string().allow(""),
    }).unknown(true);

    const userContactSchema = Joi.object({
      emailAddress: Joi.string().email().required(),
      phone: Joi.string().required(),
      phoneCode: Joi.string().required(),
    });

    const schema = Joi.object({
      outbount: Joi.object({
        IsPriceChangeAccepted: Joi.boolean().optional(),
        ResultIndex: Joi.string().required(),
        BookingId: Joi.number().allow(null, "").optional(),
        PNR: Joi.string().allow(null, "").optional(),
        passengers: Joi.array().items(passengerSchema).required(),
        userContactDetails: userContactSchema.required(),
        TraceId: Joi.string().required(),
        isLcc: Joi.boolean().required(),
        amount: Joi.number().required(),
        // Journey segments, used to fingerprint the itinerary for hold reuse. Optional.
        itinerary: Joi.array().items(Joi.any()),
      }).required(),
      amount: Joi.number().optional(),
      inbount: Joi.any().allow(null),
      accessKey: Joi.string().required(),
    });

    const result = schema.validate(req.body);

    if (result.error) {
      throw new Error(formatValidationError(result.error));
    }
    next();
  } catch (error) {
    next(error);
  }
};

exports.validateBooking = (req, res, next) => {
  try {
    const fareSchema = Joi.object({
      BaseFare: Joi.number().required(),
      Tax: Joi.number().required(),
      // YQTax: Joi.number().required(),
      // AdditionalTxnFeeOfrd: Joi.number().required(),
      // AdditionalTxnFeePub: Joi.number().required(),
    });

    const passengerSchema = Joi.object({
      passengerId: Joi.string().required(),
      Title: Joi.string().required(),
      FirstName: Joi.string().required(),
      LastName: Joi.string().required(),
      PaxType: Joi.number().required(),
      DateOfBirth: Joi.string().allow(""),
      Gender: Joi.number().required(),
      PassportNo: Joi.string().allow(""),
      PassportExpiry: Joi.string().allow(""),
      PassportIssueDate: Joi.string().allow(""),
      AddressLine1: Joi.string().required(),
      AddressLine2: Joi.string().allow(""),
      City: Joi.string().required(),
      CellCountryCode: Joi.string().required(),
      ContactNo: Joi.string().required(),
      Email: Joi.string().email().required(),
      IsLeadPax: Joi.boolean().required(),
      Fare: fareSchema.required(),
      MealDynamic: Joi.array(),
      Baggage: Joi.array(),
      SeatDynamic: Joi.array(),
      Nationality: Joi.string().required(),
      CountryCode: Joi.string().required(),
      CountryName: Joi.string().required(),
      PAN: Joi.string().allow(""),
      GSTCompanyAddress: Joi.string().allow(""),
      GSTCompanyContactNumber: Joi.string().allow(""),
      GSTCompanyName: Joi.string().allow(""),
      GSTNumber: Joi.string().allow(""),
      GSTCompanyEmail: Joi.string().allow(""),
    }).unknown(true);

    const userContactSchema = Joi.object({
      emailAddress: Joi.string().email().required(),
      phone: Joi.string().required(),
      phoneCode: Joi.string().required(),
    });

    const outbountSchema = Joi.object({
      ResultIndex: Joi.string().required(),
      passengers: Joi.array().items(passengerSchema).required(),
      userContactDetails: userContactSchema.required(),
      TraceId: Joi.string().required(),
      isLcc: Joi.boolean().required(),
      amount: Joi.number().required(),
      // Journey segments, used to fingerprint the itinerary for hold reuse. Optional.
      itinerary: Joi.array().items(Joi.any()),
    });

    const schema = Joi.object({
      data: Joi.object({
        outbount: outbountSchema.required(),
        inbount: Joi.any().allow(null),
      }).required(),
    });

    const result = schema.validate(req.body);

    if (result.error) {
      throw new Error(formatValidationError(result.error));
    }
    next();
  } catch (error) {
    next(error);
  }
};

exports.validateAmount = (req, res, next) => {
  try {
    const schema = Joi.object({
      amount: Joi.number().greater(0).required().messages({
        "number.base": "Amount must be a number",
        "number.greater": "Amount must be greater than 0",
        "any.required": "Amount is required",
      }),
      passengers: Joi.array()
        .items(Joi.object().unknown(true)) // accept any shape for passenger
        .min(1)
        .required()
        .messages({
          "array.base": "Passengers must be an array",
          "array.min": "At least one passenger is required",
          "any.required": "Passengers are required",
        }),
      traceId: Joi.string().required(),

    });

    const result = schema.validate(req.body);

    if (result.error) {
      throw new Error(result.error.details[0].message);
    }
    next();
  } catch (error) {
    console.error(error);
    next(error);
  }
};

exports.validateFareCalendar = (req, res, next) => {
  try {
    const schema = Joi.object({
      tripType: Joi.number().valid(1, 2, 3).required().messages({
        "number.base": "TripType must be a number",
        "any.only": "TripType must be either one-way or round-trip",
        "any.required": "TripType is required",
      }),

      flightSegments: Joi.array()
        .items(
          Joi.object({
            Origin: Joi.string().length(3).required().messages({
              "string.base": "Origin must be a string",
              "string.length": "Origin must be 3 characters (airport code)",
              "any.required": "Origin is required",
            }),
            Destination: Joi.string().length(3).required().messages({
              "string.base": "Destination must be a string",
              "string.length": "Destination must be 3 characters (airport code)",
              "any.required": "Destination is required",
            }),
            FlightCabinClass: Joi.number().required().messages({
              "number.base": "FlightCabinClass must be a number",
              "any.required": "FlightCabinClass is required",
            }),
            PreferredDepartureTime: Joi.date().iso().required().messages({
              "date.base": "PreferredDepartureTime must be a valid date",
              "date.format": "PreferredDepartureTime must be in ISO format",
              "any.required": "PreferredDepartureTime is required",
            }),
          })
        )
        .min(1)
        .required()
        .messages({
          "array.base": "FlightSegments must be an array",
          "array.min": "At least one flight segment is required",
          "any.required": "FlightSegments is required",
        }),

      passengerData: Joi.object({
        adultCount: Joi.number().min(1).required().messages({
          "number.base": "AdultCount must be a number",
          "number.min": "At least one adult passenger is required",
          "any.required": "AdultCount is required",
        }),
        childCount: Joi.number().min(0).required().messages({
          "number.base": "ChildCount must be a number",
          "any.required": "ChildCount is required",
        }),
        infantCount: Joi.number().min(0).required().messages({
          "number.base": "InfantCount must be a number",
          "any.required": "InfantCount is required",
        }),
      })
        .required()
        .messages({
          "object.base": "PassengerData must be an object",
          "any.required": "PassengerData is required",
        }),
    });

    const result = schema.validate(req.body);

    if (result.error) {
      throw new Error(result.error.details[0].message);
    }
    next();
  } catch (error) {
    console.error(error);
    next(error);
  }
};

exports.validateCancellationCharge = (req, res, next) => {
  try {
    const schema = Joi.object({
      id: Joi.number().required().messages({
        "any.required": "ID is required",
        "number.base": "ID must be a number",
      }),
    });

    const result = schema.validate(req.body);

    if (result.error) {
      throw new Error(result.error.details[0].message);
    }
    next();
  } catch (error) {
    next(error);
  }
};
