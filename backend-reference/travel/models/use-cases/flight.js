const asyncHandler = require("../../middlewares/async");
const flightBooking = require("../entities/flight/flightBooking");
const orders = require("../entities/order");
const { Op, literal, Sequelize } = require("sequelize");
const transaction = require("../entities/transaction");
const { ticketStatus } = require("../../enum/flight");
const credential = require("../entities/credential");
const { flightModifiedBookings } = require("../entities/flight");
const { customLog } = require("../../utils/loggerHelper");
// const sequelize = require('../../configs/database/index');
const { handleSortFields } = require("../../utils/sortHandle");


module.exports.fetchAllFlightBookings = asyncHandler(async (params) => {
    const { credentialId, limit, page, availability } = params

    const nowISO = new Date().toISOString();

    let whereCondition = {
        credentialId: credentialId,
    };

    if (availability === 'expired') {
        whereCondition = {
            ...whereCondition,
            [Op.or]: [
                {
                    [Op.and]: [
                        literal(`JSON_UNQUOTE(JSON_EXTRACT(journey, '$[0].Origin.DepTime')) < '${nowISO}'`),
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
                literal(`JSON_UNQUOTE(JSON_EXTRACT(journey, '$[0].Origin.DepTime')) >= '${nowISO}'`),
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
            attributes: ['id', 'baseAmount', 'status', 'paymentMode', 'ecomOrderStatus', 'shipmentStatus', 'corporateTxnId']
        }
    ];

    const result = await flightBooking.findAndCountAll({
        where: whereCondition,
        include: includeOptions,
        order: [['createdAt', 'DESC']],
        limit: limit,
        offset: (page - 1) * limit, 
        nest: true,
        raw: true
    });
    return result;
});
module.exports.fetchAllCancelledFlightBookings = async (params) => {
    try {
        const { limit, page, credentialId, partnerId, from, to, searchText = "" } = params;

        const likeSearch = `${searchText || ""}%`;

        let whereClause = {
            [Op.and]: [
                {
                    [Op.or]: [
                        { bookingStatus: 'CANCELLED_REQUEST_FOR_REFUND' },
                        { bookingStatus: 'CANCELLED_AND_REFUNDED' },
                        { bookingCurrentStatus: 'REQUESTED_FOR_CANCELLATION' },
                        { bookingCurrentStatus: 'CANCELLED_AND_REFUNDED' }, 
                        { bookingCurrentStatus: 'CANCELLATION_APPROVED_BY_VENDOR' },
                    ]
                }
            ]
        };
        if (partnerId) {
            whereClause["$credential.registeredBy$"] = partnerId;
        }

        // --------------------------
        // DATE FILTER
        // --------------------------
        if (from && to) {
            let start = new Date(from);
            start.setHours(0, 0, 0, 0);

            let end = new Date(to);
            end.setDate(end.getDate() + 1);
            end.setHours(0, 0, 0, 0);

            whereClause.createdAt = { [Op.between]: [start, end] };
        }

        // --------------------------
        // GLOBAL SEARCH (like ticketed)
        // --------------------------
        if (searchText.trim()) {
            const st = `%${searchText.trim()}%`;

            whereClause[Op.and].push({
                [Op.or]: [
                    // Corporate ID
                    Sequelize.where(Sequelize.col("credential.username"), { [Op.like]: st }),

                    // Corporate Name
                    Sequelize.where(Sequelize.col("credential.name"), { [Op.like]: st }),

                    // Corporate Transaction ID
                    Sequelize.where(Sequelize.col("transaction.corporateTxnId"), { [Op.like]: st }),

                ]
            });
        }


        // --------------------------
        // INCLUDE BLOCKS (NO FILTER IN JOIN)
        // --------------------------
        let includeOptions = [
            {
                model: flightModifiedBookings,
                required: false,
                include: [
                    {
                        model: transaction,
                        attributes: ['corporateTxnId', 'transactionDate', 'status'],
                        required: false
                    },
                    {
                        model: orders,
                        attributes: ['paymentMode'],
                        required: false
                    }
                ]
            },
            {
                model: credential,
                attributes: ['id', 'username', 'name', 'email', 'registeredBy'],
                include: [
                    {
                        model: credential,
                        as: 'registeredByCredential',
                        attributes: ['id', 'name'],
                        required: false
                    }
                ],
                required: false,
                ...(credentialId && { where: { id: credentialId } })
            },
            {
                model: orders,
                required: false,
                where: {
                    orderResponse: { [Op.ne]: null }
                },
                attributes: [
                    'id', 'amountInINR', 'baseAmount', 'status',
                    'paymentMode', 'ecomOrderStatus',
                    'shipmentStatus'
                ]
            },
            {
                model: transaction,
                required: false,

                attributes: ['id', 'corporateTxnId', 'debitAmount', 'status', 'transactionDate'],
                where: {
                    [Op.or]: [{ corporateTxnId: { [Op.like]: likeSearch + '%' } }]
                }
            }
        ];

        // --------------------------
        // PAGINATION
        // --------------------------
        const pagination = limit && page ? {
            limit: parseInt(limit),
            offset: (parseInt(page) - 1) * parseInt(limit)
        } : {};

        // --------------------------
        // FINAL QUERY
        // --------------------------
        const result = await flightBooking.findAndCountAll({
            where: whereClause,
            include: includeOptions,
            attributes: ['id', 'createdAt', 'fare', 'bookingCurrentStatus', 'bookingStatus', 'refundedAmount', 'cancellationDate', 'BookingId'],
            order: [['createdAt', 'DESC']],
            distinct: true,
            subQuery: false,
            ...pagination
        });

        return result;

    } catch (error) {
        customLog(null, "error", { message: "Error fetching cancelled flight bookings", error });
        throw { message: "Something went wrong" };
    }
}
module.exports.fetchAllModificationsRequests = async (params, attributes = undefined) => {
    try {
        const { limit, page, credentialId, partnerId, from, to, searchText, sort, sortField } = params;

        const likeSearch = `%${searchText || ""}%`;
        let order = handleSortFields(sortField, sort);
        let whereClause = {
            [Op.and]: [
                {
                    [Op.or]: [
                        { modificationStatus: 'MODIFICATION_REQUESTED' },
                        { modificationStatus: 'MODIFICATION_QUOTE_RECEIVED' },
                        { modificationStatus: 'MODIFICATION_PAYMENT_COMPLETED' },
                        { modificationStatus: 'MODIFICATION_REJECTED' },
                        { modificationStatus: 'TICKETED' },
                        { modificationStatus: 'REQUESTED_FOR_CANCELLATION' },
                        { modificationStatus: 'CANCELLED_AND_REFUNDED' }
                    ]
                },
                {
                    [Op.or]: [
                        { '$flightBooking.bookingReferenceId$': { [Op.like]: likeSearch } },
                        { '$credential.username$': { [Op.like]: likeSearch } },
                        { '$credential.name$': { [Op.like]: likeSearch } },
                        { '$transaction.corporateTxnId$': { [Op.like]: likeSearch } },
                        { '$flightBooking->transaction.corporateTxnId$': { [Op.like]: `${likeSearch}%` } }

                    ]
                }
            ]
        };
        if (from && to) {
            let tomorrow = new Date(to);
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);
            whereClause.createdAt = {
                [Op.between]: [from, tomorrow]
            };
        }

        if (partnerId) {
            whereClause["$credential.registeredBy$"] = partnerId;
        }
        let includeOptions = [
            {
                model: credential,
                attributes: ['id', 'username', 'name', 'email', 'registeredBy'],
                include: [
                    {
                        model: credential,
                        as: 'registeredByCredential',
                        attributes: ['id', 'name'],
                        required: false
                    }
                ],
                ...(credentialId && {
                    where: { id: credentialId }
                })
            },
            {
                model: transaction,                      // direct transaction
                as: 'transaction',                       // 🔥 FIX: ensure alias
                attributes: ['id', 'corporateTxnId']
            },
            {
                model: orders,
                attributes: ['id', 'amountInINR', 'baseAmount']
            },
            {
                model: flightBooking,
                as: 'flightBooking',                     // 🔥 FIX: ensure alias
                include: [
                    {
                        model: transaction,
                        as: 'transaction',               // nested transaction alias
                        attributes: ['id', 'corporateTxnId']
                    }
                ]
            }
        ];

        const pagination =
        limit && page
            ? {
                limit: parseInt(limit, 10),
                offset: (parseInt(page, 10) - 1) * parseInt(limit, 10)
            }
            : {};

        return await flightModifiedBookings.findAndCountAll({
            where: whereClause,
            include: includeOptions,
            order,
            ...pagination,
            attributes

        });

    } catch (error) {
        customLog(null, "error", { message: "An error occurred", error });
        return false;
    }
};
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


    // TBO echoes back PassportNo on FlightItinerary.Passenger but NOT the passenger's passport
    // expiry/issue dates, so the persisted (vendor) array loses them and booking details render "NA".
    // Merge the user-entered passport dates back in from the request, matched by name + passenger type.
    let passengersToSave = bookingDetails.FlightItinerary?.Passenger;
    const requestPassengers = req?.body?.outbount?.passengers;
    if (Array.isArray(passengersToSave) && Array.isArray(requestPassengers) && requestPassengers.length) {
        const norm = value => String(value ?? "").trim().toLowerCase();
        const passengerKey = p => `${norm(p.FirstName)}|${norm(p.LastName)}|${p.PaxType ?? ""}`;
        const requestByKey = new Map(requestPassengers.map(p => [passengerKey(p), p]));
        passengersToSave = passengersToSave.map(p => {
            const match = requestByKey.get(passengerKey(p));
            if (!match) return p;
            return {
                ...p,
                PassportExpiry: p.PassportExpiry || match.PassportExpiry || "",
                PassportIssueDate: p.PassportIssueDate || match.PassportIssueDate || "",
            };
        });
    }

    try {
        let details = await flightBooking.create({
            customerInfo: req?.body?.customerInfo,
            TraceId: traceId,
            BookingId: bookingDetails.BookingId,
            PNR: bookingDetails.PNR,
            bookingStatus: ticketStatus[bookingDetails.TicketStatus],
            journey: bookingDetails.FlightItinerary?.Segments,
            passengers: passengersToSave,
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

// credentialId is required: an orderId alone would return any customer's booking.
module.exports.findFlightBookingByOrderID = asyncHandler(async (orderId, credentialId) => {
    if (!orderId || !credentialId) return [];
    const orderRecord = await flightBooking.findAll({
        where: { orderId, credentialId },
        include: [
            {
                model: transaction,
                attributes: ['corporateTxnId'], 
            },
            {
                model: orders,
            }
        ],
        raw: true, 
        nest: true,
    });
    return orderRecord;
});

module.exports.findFlightBookingByBookingId = asyncHandler(async (bookingId) => {
    const orderRecord = await flightBooking.findOne({
        where: { 
            BookingId: bookingId
         },
        raw: true, 
        nest: true,
        
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

module.exports.updateCancelledBookingStatus = asyncHandler(async ({corporateTxnId, flightBookingId, ChangeRequestId, refundedAmount}) => {
    await orders.update({
        ecomOrderStatus: 'CANCELLED'
    }, {
        where: {
            corporateTxnId: corporateTxnId,
        },
    })

    let bookingStatusString = "CANCELLED_REQUEST_FOR_REFUND"; 
    // if([0, 1, 2, 3, 7, 8].includes(ChangeRequestStatus)) {
    //     bookingStatusString = 'CANCELLED_REQUEST_FOR_REFUND'
    // }
    // else if(ChangeRequestStatus === 4){
    //     bookingStatusString = 'CANCELLED_AND_REFUNDED'
    // }

    await flightBooking.update({
        bookingStatus: bookingStatusString,
        cancellationDate: new Date(),
        changeRequestId: ChangeRequestId, 
        refundedAmount
    }, {
        where: {
            id: flightBookingId,
        },
    })
    
    // const orderRecord = await orders.findOne({
    //     where: {
    //         corporateTxnId: corporateTxnId,
    //     }
    // });
    // if (orderRecord) {
    //     const orderResponse = JSON.parse(orderRecord.orderResponse);
    //     console.log("✅✅orderResponse", orderResponse)
    //     orderResponse.data.bookingStatus = bookingStatus;
    //     const updatedOrderResponse = JSON.stringify(orderResponse);
    //     await orders.update({
    //         orderResponse: updatedOrderResponse,
    //         ecomOrderStatus: 'CANCELLED'
    //     }, {
    //         where: {
    //             corporateTxnId: corporateTxnId,
    //         },
    //     }
    //     )
    // }
    // // and update in flight booking table as CANCELLED_REQUEST_FOR_REFUND
    // await flightBooking.update({
    //     bookingStatus: 'cancelled_request_for_refund',
    //     cancellationDate: new Date()
    // }, {
    //     where: {
    //         id: flightBookingId,
    //     },
    // })

})

module.exports.updateStatusById = asyncHandler(async ({id, status}) => {
    return await flightBooking.update({
        bookingStatus: status,
    }, {
        where: {
            id,
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

module.exports.fetchAllTicketedFlightBookings = asyncHandler(async (params, attributes = undefined) => {
    try {
        let {
            credentialId,
            partnerId,
            limit,
            page,
            subCorporateUserId,
            searchText = "",
            sortField = "createdAt",
            sort = "DESC",
            from,
            to,
        } = params;

        let pagination = {};
        if (limit) {
            pagination.limit = parseInt(limit);
            pagination.offset = (page - 1) * parseInt(limit);
        }

        let order = [[sortField || "createdAt", sort]];

        let whereCondition = {};

        if (subCorporateUserId) {
            whereCondition.subCorporateUserId = subCorporateUserId;
        }

        if (from && to) {
            let start = new Date(from);
            start.setHours(0, 0, 0, 0);

            let end = new Date(to);
            end.setDate(end.getDate() + 1);
            end.setHours(0, 0, 0, 0);

            whereCondition.createdAt = { [Op.between]: [start, end] };
        }

        if (credentialId) {
            whereCondition["$credential.id$"] = credentialId;
        }

        // Default option: filter by credential.registeredBy IS NULL
        if (partnerId === 'default') {
            whereCondition["$credential.registeredBy$"] = null;
        } else if (partnerId) {
            whereCondition["$credential.registeredBy$"] = partnerId;
        }

        let includeOptions = [
            {
                model: credential,
                attributes: ["id", "username", "name", "email", "registeredBy"],
                include: [
                    {
                        model: credential,
                        as: 'registeredByCredential',
                        attributes: ['id', 'name'],
                        required: false
                    }
                ],
                required: false,
            },
            {
                model: transaction,
                attributes: ["id", "corporateTxnId"],
                required: false,
            },
            {
                model: orders,
                attributes: [
                    "id",
                    "amountInINR",
                    "baseAmount",
                    "status",
                    "paymentMode",
                    "ecomOrderStatus",
                    "shipmentStatus",
                ],
                required: false,
            },
          
        ];

        if (searchText?.trim()) {
            const st = `%${searchText.trim()}%`;
            whereCondition[Op.and] = whereCondition[Op.and] || [];

            whereCondition[Op.and].push({
                [Op.or]: [
                    Sequelize.where(Sequelize.col("credential.username"), { [Op.like]: st }),
                    Sequelize.where(Sequelize.col("credential.name"), { [Op.like]: st }),
                    Sequelize.where(Sequelize.col("transaction.corporateTxnId"), { [Op.like]: st }),
                    Sequelize.where(Sequelize.col("BookingId"), { [Op.like]: st }),
                
                ],
            });
        }

        const result = await flightBooking.findAndCountAll({
            where: whereCondition,
            include: includeOptions,
            attributes,
            order,
            ...pagination,
            distinct: true,
            subQuery: false,
        });

        return result;
    } catch (error) {
        customLog(null, "error", { message: "Error fetching flight bookings", error });
        throw { message: "Something went wrong" };
    }
});

