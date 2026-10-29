const asyncHandler = require("../../middlewares/async");
const flightBooking = require("../entities/flight/flightBooking");
const orders = require("../entities/order");
const { Op, literal } = require("sequelize");
const transaction = require("../entities/transaction");
const { ticketStatus } = require("../../enum/flight");
const credential = require("../entities/credential");
const { customLog } = require("../../utils/loggerHelper");

module.exports.fetchAllFlightBookings = asyncHandler(async (params) => {
    const { credentialId, limit , page, availability }=params
    const currentDate = new Date();

    let whereCondition = {
        credentialId: credentialId,
    };

    if (availability === 'expired') {
        whereCondition = {
            ...whereCondition,
            [Op.or]: [
                {
                    [Op.and]: [
                        literal(`JSON_UNQUOTE(JSON_EXTRACT(journey, '$[0].Origin.DepTime')) < '${currentDate.toISOString()}'`),
                    ],
                },
                {
                    bookingStatus: {
                        [Op.in]: ['CANCELLED_REQUEST_FOR_REFUND', 'CANCELLED_AND_REFUNDED'],
                    },
                },
            ],
        };
    } else if (availability === 'upcoming') {
        whereCondition = {
            ...whereCondition,
            [Op.and]: [
                literal(`JSON_UNQUOTE(JSON_EXTRACT(journey, '$[0].Origin.DepTime')) >= '${new Date().toISOString()}'`),
                {
                    bookingStatus: {
                        [Op.notIn]: ['CANCELLED_REQUEST_FOR_REFUND', 'CANCELLED_AND_REFUNDED', 'MODIFIED'],
                    }
                }
            ]
        };
    } else if (availability === 'modification_requested') {
        whereCondition = {
            ...whereCondition,
            bookingCurrentStatus: {
                [Op.in]: ['MODIFICATION_REQUESTED', 'MODIFIED', 'MODIFICATION_REJECTED', 'REQUESTED_FOR_CANCELLATION', 'CANCELLED_AND_REFUNDED'],
            },
        };
    }

    let includeOptions = [
        {
            model: transaction,
            attributes: ['id', 'corporateTxnId', 'transactionDate'],
        },
        {
            model: orders,
            attributes: ['id', 'baseAmount', 'status', 'paymentMode', 'ecomOrderStatus', 'shipmentStatus']
        }
    ];

    const result = await flightBooking.findAndCountAll({
        where: whereCondition,
        include: includeOptions,
        order: [['createdAt', 'DESC']],
        limit: limit,
        offset: (page - 1) * limit
    });
    return result;
});
module.exports.findOneBooking = asyncHandler(async (bookingId) => {
    const orderRecord = await orders.findOne({
        where: {
            id: bookingId,
        }
    });
    // if (orderRecord && orderRecord.orderResponse) {
    //     orderRecord.orderResponse = JSON.parse(orderRecord.orderResponse);
    // }
    return orderRecord;
});

module.exports.updateBookingStatus = asyncHandler(async (corporateTxnId, bookingStatus) => {
    const orderRecord = await orders.findOne({
        where: {
            corporateTxnId: corporateTxnId,
        }
    });
    if (orderRecord) {
        const orderResponse = JSON.parse(orderRecord.orderResponse);
        orderResponse.data[0].bookingStatus = bookingStatus;
        const updatedOrderResponse = JSON.stringify(orderResponse);
        await orders.update({
            orderResponse: updatedOrderResponse,
        }, {
            where: {
                corporateTxnId: corporateTxnId,
            },
        }
        )
    }
})

module.exports.createFlightBooking = async ({ booking, transactionResponse, req, traceId }) => {
    const bookingDetails = booking
    if(!bookingDetails) return;

    const { orderId, transactionId } = transactionResponse
    const { userContactDetails } = req.body.outbount
    //sub-corporate user checking
    if (req.user.role === 'CORPORATE_SUB_USER') {
        bookingDetails.subCorporateUserId = req.user.subCorporateId;
    }
    // if ticketStatus is inprogress schedule
    // return true
    try {
        let details = await flightBooking.create({
            customerInfo: req?.body?.customerInfo,
            TraceId: traceId, 
            BookingId: bookingDetails.BookingId, 
            PNR: bookingDetails.PNR,
            bookingStatus: ticketStatus[bookingDetails.TicketStatus],
            journey: bookingDetails.FlightItinerary?.Segments,
            passengers: bookingDetails.FlightItinerary?.Passenger,
            fare: bookingDetails.FlightItinerary?.Fare,
            orderId,
            transactionId,
            credentialId: req.user.id,
            userContactDetails: {
                email: userContactDetails.emailAddress, 
                phone: userContactDetails.phone, 
                phoneCode: userContactDetails.phoneCode 
            }
        })
        console.log({ details })
        return details;
    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: "Flight ticket create database failed", error})
        return error
    }
}

module.exports.findOneFlightBooking = asyncHandler(async ({ id }) => {
    const orderRecord = await flightBooking.findOne({
        where: { id },
        include: [
            {
                model: transaction,
                attributes: ['corporateTxnId'], 
            },
            {
                model: orders,
            },
            // {
            //     model: flightModifiedBookings,
            //     include: [
            //         {
            //             model: transaction,
            //             attributes: ['corporateTxnId', 'transactionDate']
            //         }
            //     ],
            // }
        ],
    });
    return orderRecord;
});

module.exports.findOneFlightBookingWithAllDetails = asyncHandler(async (where) => {
    const orderRecord = await flightBooking.findOne({
        where: where,
        include: [
            {
                model: transaction,
            },
            {
                model: orders,
            },
            // {
            //     model: flightModifiedBookings,
            //     include: [
            //         {
            //             model: transaction,
            //         },
            //         {
            //             model: orders,
            //         }
            //     ]
            // },
            {
                model: credential,
            },
        ],
    });
    return orderRecord;
});

module.exports.updateCancelledBookingStatus = asyncHandler(async (corporateTxnId, flightBookingId, bookingStatus) => {
    const orderRecord = await orders.findOne({
        where: {
            corporateTxnId: corporateTxnId,
        }
    });
    if (orderRecord) {
        const orderResponse = JSON.parse(orderRecord.orderResponse);
        console.log("✅✅orderResponse", orderResponse)
        orderResponse.data.bookingStatus = bookingStatus;
        const updatedOrderResponse = JSON.stringify(orderResponse);
        await orders.update({
            orderResponse: updatedOrderResponse,
            ecomOrderStatus: 'CANCELLED'
        }, {
            where: {
                corporateTxnId: corporateTxnId,
            },
        }
        )
    }
    // and update in flight booking table as CANCELLED_REQUEST_FOR_REFUND
    await flightBooking.update({
        bookingStatus: 'cancelled_request_for_refund',
        cancellationDate: new Date()
    }, {
        where: {
            id: flightBookingId,
        },
    })

})

module.exports.updateStatusByPNR = asyncHandler(async ({pnr, status}) => {
    return await flightBooking.update({
        bookingStatus: status,
    }, {
        where: {
            PNR: pnr,
        },
    })
}) 

module.exports.updateTicketDataByPNR = asyncHandler(async (pnr, updatedData) => {
    return await flightBooking.update(updatedData, {
        where: {
            PNR: pnr,
        },
    })
})