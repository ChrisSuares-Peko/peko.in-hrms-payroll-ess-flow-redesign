const Sequelize = require("sequelize");

const flightBooking = require("../entities/flights/flightBooking");
const sequelizeConfig = require("../../configs/database/index");
const asyncHandler = require("../../middlewares/async");

module.exports.fetchAllFlightBookings = asyncHandler(async () => {
    const query = `
        SELECT
            flightBookings.*,
            credentials.registeredBy,
            corporateUsers.id AS corporateUserId,
            corporateUsers.packageId AS corporatePackageId,
            orders.corporateTxnId, 
            orders.paymentMode
        FROM
            flightBookings
        JOIN
            credentials ON flightBookings.credentialId = credentials.id
        JOIN
            corporateUsers ON flightBookings.credentialId = corporateUsers.credentialId
        JOIN
            orders ON flightBookings.orderId = orders.id
        WHERE
            flightBookings.bookingStatus = 'CANCELLED_REQUEST_FOR_REFUND' 
    `;
    
    const result = await sequelizeConfig.query(query, {
        type: Sequelize.QueryTypes.SELECT,
    });

    return result;
});


module.exports.updateStatusById = asyncHandler(async ({id, status}) => {
    return await flightBooking.update({
        bookingStatus: status,
    }, {
        where: {
            id,
        },
    })
}) 