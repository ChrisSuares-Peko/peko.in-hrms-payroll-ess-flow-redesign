const { Op } = require('sequelize');
const busBooking = require('../entities/busBooking');
const credential = require('../entities/credential');
const transaction = require('../entities/transaction');
const order = require('../entities/order');
const { customLog } = require('../../utils/loggerHelper');

module.exports.createBusBooking = async ({ ticketDetails, transactionResponse, req, contactEmail }) => {
    if (!ticketDetails) return;

    const { orderId, transactionId } = transactionResponse;

    const subCorporateUserId = req.user.role === 'CORPORATE_SUB_USER' ? req.user.subCorporateId : null;

    // inventoryItems is an object for single seat, array for multiple seats
    const items = Array.isArray(ticketDetails.inventoryItems)
        ? ticketDetails.inventoryItems
        : (ticketDetails.inventoryItems ? [ticketDetails.inventoryItems] : []);

    const passengers = items.map(item => ({
        seatName: item.seatName,
        fare: item.fare,
        baseFare: item.baseFare,
        grandTotalFare: item.grandTotalFare,
        ladiesSeat: item.ladiesSeat,
        malesSeat: item.malesSeat,
        serviceTax: item.serviceTax,
        operatorServiceCharge: item.operatorServiceCharge,
        passenger: item.passenger,
    }));

    const fare = {
        bookingFee: ticketDetails.bookingFee,
        serviceCharge: ticketDetails.serviceCharge,
        inventoryItems: items.map(i => ({
            fare: i.fare,
            baseFare: i.baseFare,
            grandTotalFare: i.grandTotalFare,
            serviceTax: i.serviceTax,
            operatorServiceCharge: i.operatorServiceCharge,
        })),
    };

    const tripDetails = {
        inventoryId: ticketDetails.inventoryId,
        doj: ticketDetails.doj,
        dateOfIssue: ticketDetails.dateOfIssue,
        serviceStartTime: ticketDetails.serviceStartTime,
        sourceCity: ticketDetails.sourceCity,
        sourceCityId: ticketDetails.sourceCityId,
        destinationCity: ticketDetails.destinationCity,
        destinationCityId: ticketDetails.destinationCityId,
        pickUpLocation: ticketDetails.pickupLocation,
        pickUpLocationId: ticketDetails.pickupLocationId,
        pickUpLocationAddress: ticketDetails.pickUpLocationAddress,
        pickUpLocationLandmark: ticketDetails.pickupLocationLandmark,
        pickUpTime: ticketDetails.pickupTime,
        pickUpContactNo: ticketDetails.pickUpContactNo,
        firstBoardingPointTime: ticketDetails.firstBoardingPointTime,
        dropLocation: ticketDetails.dropLocation,
        dropLocationId: ticketDetails.dropLocationId,
        dropLocationAddress: ticketDetails.dropLocationAddress,
        dropLocationLandmark: ticketDetails.dropLocationLandmark,
        dropTime: ticketDetails.dropTime,
        primeDepartureTime: ticketDetails.primeDepartureTime,
        MTicketEnabled: ticketDetails.MTicketEnabled,
        partialCancellationAllowed: ticketDetails.partialCancellationAllowed,
        contactEmail: contactEmail || null,
    };

    customLog(req?.LogTraceId, 'info', { message: '[bus:createBusBooking] storing contactEmail in tripDetails', contactEmail: tripDetails.contactEmail });

    try {
        const record = await busBooking.create({
            tin: ticketDetails.tin,
            pnr: ticketDetails.pnr,
            bookingStatus: ticketDetails.status || ticketDetails.Status || 'Booked',
            travels: ticketDetails.travels,
            busType: ticketDetails.busType,
            tripDetails,
            passengers,
            fare,
            cancellationPolicy: ticketDetails.cancellationPolicy,
            orderId,
            transactionId,
            credentialId: req.user.id,
            subCorporateUserId,
        });
        return record;
    } catch (error) {
        customLog(req?.LogTraceId, 'error', { message: 'Bus ticket create database failed', error });
        return error;
    }
};

module.exports.getBusBookingByOrderId = async ({ orderId }) => {
    try {
        return await busBooking.findOne({ where: { orderId } });
    } catch (error) {
        customLog(null, 'error', { message: 'getBusBookingByOrderId failed', error });
        return null;
    }
};

module.exports.fetchAllCancelledBusBookings = async (params) => {
    try {
        const { limit = 10, page = 1, credentialId, partnerId, from, to, searchText = '' } = params;

        const orderWhere = {
            status: { [Op.in]: ['CANCELLED', 'REFUND_REQUESTED', 'REFUNDED'] },
        };

        const whereClause = {};

        if (credentialId) whereClause.credentialId = credentialId;

        if (from && to) {
            const toDate = new Date(to);
            toDate.setDate(toDate.getDate() + 1);
            toDate.setHours(0, 0, 0, 0);
            whereClause.createdAt = { [Op.between]: [from, toDate] };
        }

        if (partnerId) {
            whereClause['$credential.registeredBy$'] = partnerId === 'default' ? null : partnerId;
        }

        if (searchText?.trim()) {
            whereClause[Op.or] = [
                { tin: { [Op.like]: `${searchText}%` } },
                { travels: { [Op.like]: `${searchText}%` } },
                { '$order.corporateTxnId$': { [Op.like]: `${searchText}%` } },
                { '$credential.name$': { [Op.like]: `${searchText}%` } },
                { '$credential.username$': { [Op.like]: `${searchText}%` } },
            ];
        }

        const includeOptions = [
            {
                model: credential,
                attributes: ['id', 'name', 'username', 'email', 'registeredBy'],
            },
            {
                model: order,
                attributes: ['id', 'corporateTxnId', 'amountInINR', 'status', 'paymentMode', 'shipmentStatus'],
                where: orderWhere,
            },
            {
                model: transaction,
                attributes: ['id', 'corporateTxnId', 'transactionDate'],
            },
        ];

        return await busBooking.findAndCountAll({
            where: whereClause,
            include: includeOptions,
            order: [['createdAt', 'DESC']],
            limit: params.limit ? parseInt(limit) : undefined,
            offset: params.limit ? (parseInt(page) - 1) * parseInt(limit) : undefined,
            nest: true,
            raw: true,
        });
    } catch (error) {
        customLog(null, 'error', { message: 'fetchAllCancelledBusBookings failed', error });
        throw error;
    }
};
