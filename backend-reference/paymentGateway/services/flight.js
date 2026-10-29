const { customLog } = require("../utils/loggerHelper");
const { callTboWithRetry } = require("../utils/tboSession");

exports.retrieveBooking = async function(params) {
    try {
        let { BookingId, PNR, firstName, lastName, serviceDetails } = params

        const buildRetrieveBookingConfig = (tokenId) => ({
            method: 'post',
            url: `${serviceDetails.vendor.optional5}/rest/GetBookingDetails`,
            headers: {
                'Content-Type': 'application/json',
            },
            data: JSON.stringify({
                EndUserIp: serviceDetails.vendor.optional4,
                TokenId: tokenId,
                BookingId,
                PNR,
                "FirstName": firstName,
                "LastName": lastName
            })
        });

        const result = await callTboWithRetry({
            buildConfig: buildRetrieveBookingConfig,
            serviceDetails,
            loggerTraceId: params?.LogTraceId,
            endpoint: 'GetBookingDetails',
            logRequest: (config, isRetry) => customLog(params?.LogTraceId, 'info', {
                message: `[airline:GetBookingDetails] request${isRetry ? ' (retry)' : ''}`,
                endpoint: 'GetBookingDetails',
                bookingId: BookingId,
                pnr: PNR,
                requestUrl: config.url,
                requestMethod: config.method,
                requestBody: { ...JSON.parse(config.data), TokenId: '<redacted>' },
            }, 'VENDOR'),
            logResponse: (response, isRetry) => customLog(params?.LogTraceId, 'info', {
                message: `[airline:GetBookingDetails] response${isRetry ? ' (retry)' : ''}`,
                endpoint: 'GetBookingDetails',
                statusCode: response?.status,
                bookingId: response?.data?.Response?.FlightItinerary?.BookingId,
                pnr: response?.data?.Response?.FlightItinerary?.PNR,
                status: response?.data?.Response?.FlightItinerary?.Status,
                vendorErrorCode: response?.data?.Response?.Error?.ErrorCode,
                vendorErrorMessage: response?.data?.Response?.Error?.ErrorMessage,
                responseData: response?.data,
            }, 'VENDOR'),
        });

        if (!result && !result?.data || result.data.Response.Error.ErrorCode) throw new Error('Failed to retrieve booking data!');

        return {
            status: true,
            message: 'Success',
            booking: {
                ...result.data.Response.FlightItinerary
            }
        }
    } catch (error) {
        if (error?.response?.data) {
            customLog(params?.LogTraceId, "error", { message: "Flight Details fetch failed", data: error?.response?.data })
        } else {
            customLog(params?.LogTraceId, "error", { message: "Flight Details fetch failed", data: error })
        }
        let errorData = error?.response?.data
        return {
            status: false,
            message: 'Something went wrong while retrieve booking!',
            errorData
        }

    }
}