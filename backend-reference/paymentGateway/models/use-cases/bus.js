const busBooking = require('../entities/busBooking');
const { customLog } = require('../../utils/loggerHelper');

module.exports.createBusBooking = async ({ ticketDetails, transactionResponse, req, contactEmail }) => {
    console.log('[bus:createBusBooking] called', { hasTicketDetails: !!ticketDetails, contactEmail });
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
