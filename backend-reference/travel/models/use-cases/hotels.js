const asyncHandler = require("../../middlewares/async");
const { customLog } = require("../../utils/loggerHelper");
const orders = require("../entities/order");
const { Op,literal } = require("sequelize");
const credential = require("../entities/credential");
const { handleSortFields } = require('../../utils/sortHandle');


module.exports.fetchBookings = asyncHandler(async (params) => {
    const { credentialId, serviceOperatorId, limit, page, subCorporateUserId } = params

    let whereCondition = {
        credentialId: credentialId,
        serviceOperatorId: serviceOperatorId,
        orderResponse: {
            [Op.ne]: null // This condition checks for 'not equal to null', need to get the booking faild tickets also
        }
    };

    if (subCorporateUserId) {
        whereCondition.subCorporateUserId = subCorporateUserId
    }

    const result = await orders.findAndCountAll({
        where: whereCondition,
        order: [['transactionDate', 'DESC']],
        limit: limit,
        offset: (page - 1) * limit
    });
    return result;
});

module.exports.updateBookingStatus = asyncHandler(async (params) => {
    customLog(null, "info", { params, message: "params for update booking status" });

    const {ConfirmationNo,totalCancellationCharges,partialRefund,bookingStatus,ChangeRequestId}=params

    // const CancellationCharges = totalCancellationCharges?.CancellationFees+totalCancellationCharges.CancellationServiceCharge

    try {

        const orderRecord = await orders.findOne({
            where: {
                providerId: ConfirmationNo,
            },
        });

        if (!orderRecord) {
            throw new Error(`No order found for providerId: ${ConfirmationNo}`);
        }


        const orderResponse = JSON.parse(orderRecord.orderResponse);
       
        if (ChangeRequestId) {
            orderResponse.ChangeRequestId = ChangeRequestId;
        }
        orderResponse.bookingStatus = bookingStatus;

        const updatedOrderResponse = JSON.stringify(orderResponse);
     
        const [affectedRows] = await orders.update({
            orderResponse: updatedOrderResponse,
            shipmentStatus: {
                bookingStatus: bookingStatus,
                cancellationDate: new Date(),
                // cancellationResponse: cancellationResponse,
                totalCancellationCharges: totalCancellationCharges,
                refundDetails:partialRefund
            }
        }, {
            where: {
                providerId: ConfirmationNo,
            },
        }
        )

        if (affectedRows === 0) {
            throw new Error(`No rows were updated for providerId: ${ConfirmationNo}`);
        }

    } catch (error) {
        customLog(null,"error",{'error':error})
        throw error;
    }
});

module.exports.fetchAllCancelledHotelBookings = async (params) => {
    try {
        const {
            limit = 10,
            page = 1,
            credentialId,
            from,
            to,
            searchText ,partnerId= ""
        } = params;

        let whereClause = {
            [Op.and]: [
                // This filters records where 'orderResponse' has a 'bookingStatus' = "Processed"
                literal(`JSON_VALID(orderResponse) AND JSON_UNQUOTE(JSON_EXTRACT(orderResponse, '$.bookingStatus')) = "Processed"`),
            ]
        };

        if (from && to) {
            const tomorrow = new Date(to);
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);
            whereClause.createdAt = {
                [Op.between]: [from, tomorrow]
            };
        }

        if (searchText?.trim()) {
            whereClause[Op.and].push({
                [Op.or]: [
                    { corporateTxnId: { [Op.like]: `${searchText}%` } },
                    { id: { [Op.like]: `${searchText}%` } },
                    { providerId: { [Op.like]: `${searchText}%` } },
                    { '$credential.name$': { [Op.like]: `${searchText}%` } },
                    { '$credential.username$': { [Op.like]: `${searchText}%` } }
                ]
            });
        }

        if (partnerId) {
            whereClause.serviceOperatorId = partnerId;
        }

        let includeOptions = [
            {
                model: credential,
                attributes: ['id', 'username', 'name', 'email'],
                ...(credentialId && credentialId !== "" && {
                    where: { id: credentialId }
                })
            },
        ];

        const result = await orders.findAndCountAll({
            where: whereClause,
            include: includeOptions,
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit, 10),
            offset: (parseInt(page, 10) - 1) * parseInt(limit, 10)
        });

        return result;
    } catch (error) {
        console.log({ error });
        return false;
    }
}

module.exports.fetchAllHotelBookings = asyncHandler(async (params, attributes = undefined) => {
    try {
        const {
            credentialId,
            partnerId,
            limit,
            page,
            subCorporateUserId,
            searchText,
            from,
            to,
            serviceProviderId,
            sort,
            sortField,
        } = params;
        let order = handleSortFields(sortField, sort);
        let whereClause = {
            orderResponse: { [Op.ne]: null },
            serviceOperatorId: serviceProviderId
        };

        if (subCorporateUserId) {
            whereClause.subCorporateUserId = subCorporateUserId;
        }
        if (credentialId) {
            whereClause["$credential.id$"] = credentialId;
        }
        if (partnerId) {
            whereClause.serviceOperatorId = partnerId;
        }

        if (searchText?.trim()) {
            whereClause[Op.or] = [
                { corporateTxnId: { [Op.like]: `${searchText}%` } },
                { id: { [Op.like]: `${searchText}%` } },
                { providerId: { [Op.like]: `${searchText}%` } },
                literal(`credential.name LIKE '${searchText}%'`),
                literal(`credential.username LIKE '${searchText}%'`)
            ];
        }

        if (from && to) {
            let tomorrow = new Date(to);
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);

            whereClause.createdAt = {
                [Op.between]: [from, tomorrow]
            };
        }

        const pagination = (limit && page)
            ? {
                limit: parseInt(limit, 10),
                offset: (parseInt(page, 10) - 1) * parseInt(limit, 10)
            }
            : {};

        let includeOptions = [
            {
                model: credential,
                attributes: ["id", "username", "name", "email"],
                required: false,
            },

        ];

        const result = await orders.findAndCountAll({
            where: whereClause,
            include: includeOptions,
            order,
            attributes,
            ...pagination
        });

        return result;

    } catch (error) {
        console.log({ error });
        return false;
    }
});


