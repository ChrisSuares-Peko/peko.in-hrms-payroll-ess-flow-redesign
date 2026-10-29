/* eslint-disable no-unused-vars */
const fs = require("fs");
const axios = require("axios");

const asyncHandler = require("../../middlewares/async");
const { fetchAllCancelledFlightBookings, fetchAllModificationsRequests, updateStatusById, findOneFlightBookingWithAllDetails, fetchAllTicketedFlightBookings} = require("../../models/use-cases/flight");
const { generateCancelledExportData, generateModifiedExportData } = require("../../services/flight.js");
const ErrorResponse = require("../../utils/error-response");
const { generateExcelBufferAndType } = require('../../utils/generateExcelBufferAndType');
const { reportPdfTemplate } = require('../../utils/reportTemplate');
const { customLog } = require('../../utils/loggerHelper.js');
const { cancelPGTransaction } = require('../../utils/pgRefund');
const { refundWalletTransaction } = require('../../utils/walletTransaction.js');
const { puppeteerPdfToFile } = require("../../utils/puppeteer");
const { getValue, setValue } = require("../../utils/cacheDataMethods");
const { fetchServiceDetails, findServiceOperatorByAccessKey } = require("../../utils/checkAndFetchServiceDetails");
const { generateBookingExportData } = require("../../services/flight.js");
const puppeteer = require('puppeteer');

const accessKey = "tbo_airline";

// Helper function to get session token (similar to scheduler)
async function getSession(serviceDetails) {
    let tokenId = await getValue(`tokenId-${accessKey}`);
    const memberId = await getValue(`memberId-${accessKey}`);
    const agencyId = await getValue(`agencyId-${accessKey}`);
    if (tokenId) {
        return { 
            token: tokenId, 
            memberId: memberId, 
            agencyId: agencyId
        };
    } else {
        try {
            let data = JSON.stringify({
                ClientId: serviceDetails.vendor.optional3,
                UserName: serviceDetails.vendor.optional1,
                Password: serviceDetails.vendor.optional2,
                EndUserIp: serviceDetails.vendor.optional4,
            });
            
            let config = {
                method: "post",
                url: `${serviceDetails.vendor.healthUrl}/rest/Authenticate`,
                headers: {
                    "Content-Type": "application/json",
                    Accept: "*/*",
                },
                data: data,
            };
        
            const response = await axios(config);
            if (!response) {
                throw new Error("Authentication failed")
            } else {
                const now = Math.floor(Date.now() / 1000);
                const midnight = new Date();
                midnight.setHours(24, 0, 0, 0); 
                const expirySeconds = Math.floor(midnight.getTime() / 1000) - now;     

                await setValue(`tokenId-${accessKey}`, expirySeconds, response.data?.TokenId);
                await setValue(`memberId-${accessKey}`, expirySeconds, response.data?.Member?.MemberId);
                await setValue(`agencyId-${accessKey}`, expirySeconds, response.data?.Member?.AgencyId);

                return { 
                    token: response.data?.TokenId, 
                    memberId: response.data?.MemberId, 
                    agencyId: response.data?.AgencyId
                };
            }
        } catch (error) {
            if (error?.response?.data) {
                customLog(null, "error", { message: "Flight authenticate api call failed", error: error?.response?.data })
            } else {
                customLog(null, "error", { message: "Flight authenticate api call failed", error: error })
            }
            return { 
                token: "", 
                memberId: "", 
                agencyId: ""
            };
        }
    }
}

// Function to check cancellation status from vendor API
async function checkCancellationStatus(flightDetails, serviceDetails, token) {
    if (!flightDetails.changeRequestId) {
        throw new Error("Change request ID not found");
    }

    let data = JSON.stringify({
        EndUserIp: serviceDetails.vendor.optional4,
        TokenId: token, 
        ChangeRequestId: flightDetails.changeRequestId
    });
    
    let config = {
        method: 'post',
        url: `${serviceDetails.vendor.optional5}/rest/GetChangeRequestStatus`,
        headers: {
            'Content-Type': 'application/json'
        },
        data: data
    };

    try {
        const result = await axios(config);
        customLog(null, "info", { 
            message: "Flight ticket cancel status fetch api response", 
            res: result?.data?.Response, 
            data: config.data,
            BookingId: flightDetails.BookingId
        });
        
        if (!result || result?.data?.Response?.Error?.ErrorCode) {
            customLog(null, "error", { 
                message: "Flight ticket cancel status fetch api failed", 
                error: result?.data?.Response, 
                data: config.data 
            });
            throw new Error("Failed to fetch cancellation status from vendor");
        }
        
        // [NotSet = 0,Unassigned = 1,Assigned = 2,Acknowledged = 3,Completed = 4,Rejected = 5,Closed = 6,Pending = 7,Other = 8]
        const status = result.data.Response.ChangeRequestStatus;
        
        if (status === 4) {
            // Completed - Cancellation approved
            await updateStatusById({
                id: flightDetails.id, 
                status: 'CANCELLATION_APPROVED_BY_VENDOR'
            });
            return { status: 'CANCELLATION_APPROVED_BY_VENDOR', vendorStatus: status };
        } else if (status === 5 || status === 6) {
            // Rejected or Closed
            await updateStatusById({
                id: flightDetails.id, 
                status: 'CANCEL_REQUEST_REJECTED'
            });
            return { status: 'CANCEL_REQUEST_REJECTED', vendorStatus: status };
        } else {
            // Still pending
            return { status: flightDetails.bookingStatus, vendorStatus: status, message: 'Cancellation request is still pending' };
        }
    } catch (error) {
        if (error?.response?.data) {
            customLog(null, "error", { 
                message: "Flight ticket cancel status fetch api failed", 
                data: error?.response?.data 
            });
        } else {
            customLog(null, "error", { 
                message: "Flight ticket cancel status fetch api failed", 
                data: error 
            });
        }
        throw error;
    }
}


exports.listAllCancelled = asyncHandler(async (req, res, next) => {
    try {
        const limit = parseInt(req.query.limit) || 10
        const page = parseInt(req.query.page) || 1
        let { from, to, searchText, credentialId, partnerId } = req.query;
        const sort = req.query.sort && req.query.sort === 'ASC' ? 'ASC' : 'DESC';
        let sortField = req.query.sortField || 'cancellationDate'


        const bookingData = await fetchAllCancelledFlightBookings({ limit, page, credentialId, partnerId, from, to, searchText, sort, sortField });
        if (!bookingData) {
            return next(new ErrorResponse("No bookings found", 404))
        }
        // Return a standard success response
        return res.status(200).json({
            status: true,
            message: 'Bookings fetched successfully',
            responseCode: '000',
            data: {
                page: page,
                limit: limit,
                count: bookingData.count,
                bookings: bookingData.rows
            }
        })

    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: "An error occurred", error: error });
        return next(new ErrorResponse("Something went wrong", 500))
    }
});
//listAllCancelledPDF, listAllCancelledExcelCSV
exports.listAllCancelledExcelCSV = asyncHandler(async (req, res, next) => {
    const { type } = req.params;
    const sort = req.query.sort && req.query.sort === 'ASC' ? 'ASC' : 'DESC';
    let sortField = req.query.sortField || 'cancellationDate'
    let { from, to, searchText, credentialId, partnerId } = req.query;

    try {
        const bookingData = await fetchAllCancelledFlightBookings({ credentialId, partnerId, from, to, searchText, sort, sortField });
        if (!bookingData) {
            return next(new ErrorResponse("No bookings found", 404))
        }
        const data = await generateCancelledExportData(bookingData);
        if (!data) {
            return next(new ErrorResponse(`Something went wrong while generating report`, 500))
        } else if (data.length < 1) {
            return next(new ErrorResponse(`No data is available for export`, 409))
        } else {
            const { buffer, fileType } = await generateExcelBufferAndType(data, type)
            return res.status(200).json({
                'status': true,
                'data': { buffer, fileType },
                'message': 'Fetched excel/csv datas successfully',
                'responseCode': '000'
            })
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: false,
            message: `Something went wrong while generating report`,
            data: {},
            responseCode: '001'
        });
    }
});
exports.listAllCancelledPDF = asyncHandler(async (req, res, next) => {
    const sort = req.query.sort && req.query.sort === 'ASC' ? 'ASC' : 'DESC';
    let sortField = req.query.sortField || 'cancellationDate'
    let { from, to, searchText, credentialId, partnerId } = req.query;

    try {
        const bookingData = await fetchAllCancelledFlightBookings({ credentialId, partnerId, from, to, searchText, sort, sortField });
        if (!bookingData) {
            return next(new ErrorResponse("No bookings found", 404))
        }
        const data = await generateCancelledExportData(bookingData);
        if (!data) {
            return next(new ErrorResponse(`Something went wrong while generating report`, 500))
        } else if (data.length < 1) {
            return next(new ErrorResponse(`No data is available for export`, 409))
        }

        const templateDetails = {
            title: 'Air Ticket Requests Cancellation Report'
        }
        const reportHtmlWithStyle = reportPdfTemplate(data, templateDetails);
        let random = new Date().valueOf();
        const outputFile = `report-${random}.pdf`;

        // Use browser pooling for PDF generation
        const { status, buffer } = await puppeteerPdfToFile({
            html: reportHtmlWithStyle,
            outputFile,
            options: {
                scale: 0.6,
                format: 'A4',
                preferCSSPageSize: true
            }
        });

        // Clean up temp file
        try {
            if (fs.existsSync(outputFile)) {
                fs.unlinkSync(outputFile);
            }
        } catch (unlinkError) {
            // Ignore cleanup errors
        }

        if (!status || !buffer) {
            return next(new ErrorResponse('Failed to generate PDF', 500));
        }

        return res.status(200).json({
            status: true,
            message: 'report generated successfully.',
            data: {
                buffer,
                fileType: 'application/pdf'
            },
            responseCode: '000'
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: false,
            message: `Something went wrong while generating report`,
            data: {},
            responseCode: '001'
        });
    }
});

exports.listAllModification = asyncHandler(async (req, res, next) => {
    try {
        const limit = parseInt(req.query.limit) || 10
        const page = parseInt(req.query.page) || 1
        let { from, to, searchText, credentialId, partnerId, sort, sortField } = req.query;
        sort = sort ? sort.toUpperCase() : 'DESC';
        sortField = sortField || 'createdAt';


        const bookingData = await fetchAllModificationsRequests({ limit, page, credentialId, partnerId, from, to, searchText, sort, sortField }, ['id', 'createdAt', 'modificationStatus', 'modificationRequestedDate']);
        if (!bookingData) {
            return next(new ErrorResponse("No bookings found", 404))
        }
        // Return a standard success response
        return res.status(200).json({
            status: true,
            message: 'Bookings fetched successfully',
            responseCode: '000',
            data: {
                page: page,
                limit: limit,
                count: bookingData.count,
                bookings: bookingData.rows
            }
        })

    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: "An error occurred", error: error });
        return next(new ErrorResponse("Something went wrong", 500))
    }
});
// listAllModificationExcelCSV, listAllModificationPDF
exports.listAllModificationExcelCSV = asyncHandler(async (req, res, next) => {
    const { type } = req.params;
    const sort = req.query.sort && req.query.sort === 'ASC' ? 'ASC' : 'DESC';
    let sortField = req.query.sortField || 'createdAt'
    let { from, to, searchText, credentialId, partnerId } = req.query;

    try {
        const bookingData = await fetchAllModificationsRequests({ credentialId, from, to, searchText, partnerId }, ['id', 'createdAt', 'modificationStatus', 'modificationRequestedDate']);
        if (!bookingData) {
            return next(new ErrorResponse("No bookings found", 404))
        }
        const data = await generateModifiedExportData(bookingData);
        if (!data) {
            return next(new ErrorResponse(`Something went wrong while generating report`, 500))
        } else if (data.length < 1) {
            return next(new ErrorResponse(`No data is available for export`, 409))
        } else {
            const { buffer, fileType } = await generateExcelBufferAndType(data, type)
            return res.status(200).json({
                'status': true,
                'data': { buffer, fileType },
                'message': 'Fetched excel/csv datas successfully',
                'responseCode': '000'
            })
        }
    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: "An error occurred", error: error });
        return res.status(500).json({
            status: false,
            message: `Something went wrong while generating report`,
            data: {},
            responseCode: '001'
        });
    }
});

exports.listAllModificationPDF = asyncHandler(async (req, res, next) => {
    const sort = req.query.sort && req.query.sort === 'ASC' ? 'ASC' : 'DESC';
    let sortField = req.query.sortField || 'createdAt'
    let { from, to, searchText, credentialId, partnerId } = req.query;

    try {
        const bookingData = await fetchAllModificationsRequests({ credentialId, from, to, searchText, partnerId }, ['id', 'createdAt', 'modificationStatus', 'modificationRequestedDate']);
        if (!bookingData) {
            return next(new ErrorResponse("No bookings found", 404))
        }
        const data = await generateModifiedExportData(bookingData);
        if (!data) {
            return next(new ErrorResponse(`Something went wrong while generating report`, 500))
        } else if (data.length < 1) {
            return next(new ErrorResponse(`No data is available for export`, 409))
        }

        const templateDetails = {
            title: 'Air Ticket Modification Requests Report'
        }
        const reportHtmlWithStyle = reportPdfTemplate(data, templateDetails);
        let random = new Date().valueOf();
        const outputFile = `report-${random}.pdf`;

        // Use browser pooling for PDF generation
        const { status, buffer } = await puppeteerPdfToFile({
            html: reportHtmlWithStyle,
            outputFile,
            options: {
                scale: 0.6,
                format: 'A4',
                preferCSSPageSize: true
            }
        });

        // Clean up temp file
        try {
            if (fs.existsSync(outputFile)) {
                fs.unlinkSync(outputFile);
            }
        } catch (unlinkError) {
            // Ignore cleanup errors
        }

        if (!status || !buffer) {
            return next(new ErrorResponse('Failed to generate PDF', 500));
        }

        return res.status(200).json({
            status: true,
            message: 'report generated successfully.',
            data: {
                buffer,
                fileType: 'application/pdf'
            },
            responseCode: '000'
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: false,
            message: `Something went wrong while generating report`,
            data: {},
            responseCode: '001'
        });
    }
});

exports.refund = asyncHandler(async (req, res, next) => {
    const { BookingId, amount } = req.body

    try {
        const flightDetails = await findOneFlightBookingWithAllDetails({BookingId})
        if(!flightDetails) {
            throw new Error(`Flight details not found for BookingId ${BookingId}`);   
        }

        const rateLimitKey = `admin_status_check_${BookingId}`;
        const lastCheckTime = await getValue(rateLimitKey);
        const currentTime = Date.now();
        const oneHourInMs = 60 * 60 * 1000; // 1 hour in milliseconds
        
        if (lastCheckTime) {
            const timeSinceLastCheck = currentTime - parseInt(lastCheckTime);
            if (timeSinceLastCheck < oneHourInMs) {
                const remainingMinutes = Math.ceil((oneHourInMs - timeSinceLastCheck) / (60 * 1000));
                return next(new ErrorResponse(
                    `Status check rate limit exceeded. Please try again after ${remainingMinutes} minute(s).`, 
                    429
                ));
            }
        }

        // If status is not approved, try to check with vendor API
        if(flightDetails.bookingStatus !== "CANCELLATION_APPROVED_BY_VENDOR") {
            try {
                // Fetch service details
                const serviceDetails = await findServiceOperatorByAccessKey(accessKey);

                if (Object.prototype.hasOwnProperty.call(serviceDetails, "error")) {
                    throw new Error("Failed to fetch service details");
                }

                // Get session token
                const { token } = await getSession(serviceDetails);
                if (!token) {
                    throw new Error("Failed to authenticate with vendor");
                }

                // Check cancellation status from vendor
                const statusResult = await checkCancellationStatus(flightDetails, serviceDetails, token);
                
                // Update rate limit cache - set for 1 hour (only after API call)
                await setValue(rateLimitKey, 3600, currentTime.toString());
                
                // Refresh flight details after status update
                const updatedFlightDetails = await findOneFlightBookingWithAllDetails({BookingId});
                
                // If still not approved after check, return error
                if(updatedFlightDetails.bookingStatus !== "CANCELLATION_APPROVED_BY_VENDOR") {
                    return next(new ErrorResponse(
                        `Flight ticket cancellation is not approved by vendor yet. Current status: ${statusResult.message || updatedFlightDetails.bookingStatus}`, 
                        400
                    ));
                }
                
                Object.assign(flightDetails, updatedFlightDetails);
                
            } catch (statusError) {
                await setValue(rateLimitKey, 3600, currentTime.toString());
                
                customLog(req?.LogTraceId, 'error', { 
                    message: "Failed to check cancellation status from vendor", 
                    error: statusError,
                    BookingId 
                });
                
                if(flightDetails.bookingStatus !== "CANCELLATION_APPROVED_BY_VENDOR") {
                    return next(new ErrorResponse(
                        "Flight ticket cancellation is not approved by vendor yet. Status check failed, please try again later.", 
                        500
                    ));
                }
                return next(new ErrorResponse(
                    "Failed to check cancellation status from vendor", 500
                ));
            }
        }
        // Note: If status is already approved, we don't update rate limit since no API call was made
        
        const updateDetails = {
            corporateTxnId: flightDetails.transaction.corporateTxnId, 
            registeredById: flightDetails.credential.registeredBy, 
            partialRefund: {
                status: true, 
                walletRefund: amount
            }
        }
        if (flightDetails.paymentMode === 'PAYMENT GATEWAY') {
            const { status } = await cancelPGTransaction(flightDetails.corporateTxnId, amount);
            if (status) {
                await refundWalletTransaction(updateDetails);
                await updateStatusById({
                    id: flightDetails.id, 
                    status: 'CANCELLED_AND_REFUNDED'
                })
            }
            else {
                throw new Error("Something went wrong with cancelPGTransaction")
            }
        } else {
            await refundWalletTransaction(updateDetails);
            await updateStatusById({
                id: flightDetails.id, 
                status: 'CANCELLED_AND_REFUNDED'
            })
        }


        return res.status(200).json({
            status: true,
            message: "Flight ticket refund successful",
            responseCode: "000",
            data: {},
        });
    } catch (error) {
        customLog(req?.LogTraceId, 'error', { message: "Refund request failed", error})
        return next(new ErrorResponse("Something went wrong while fetching flight details"))
    }
    
})

exports.listAllBookings = asyncHandler(async (req, res, next) => {
    try {
        console.log("heyyyy")
        const limit = parseInt(req.query.limit) || 10
        const page = parseInt(req.query.page) || 1
        let { from, to, searchText, credentialId, partnerId } = req.query;
        console.log("gggggggg")
        const bookingData = await fetchAllTicketedFlightBookings({ limit, page, credentialId, from, to, searchText, partnerId });
        console.log("bookingData",bookingData)
       
        if (!bookingData) {
            return next(new ErrorResponse("No bookings found", 404))
        }

        return res.status(200).json({
            status: true,
            message: 'Bookings fetched successfully',
            responseCode: '000',
            data: {
                page: page,
                limit: limit,
                count: bookingData.count,
                bookings: bookingData.rows
            }
        })

    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: "An error occurred", error: error });
        return next(new ErrorResponse("Something went wrong", 400))
    }
});


exports.listAllBookingExcelCSV = asyncHandler(async (req, res, next) => {
    const limit = parseInt(req.query.limit) || 10
    const page = parseInt(req.query.page) || 1

    const { type } = req.params;
    const sort = req.query.sort && req.query.sort === 'ASC' ? 'ASC' : 'DESC';
    let sortField = req.query.sortField
    let { from, to, searchText, credentialId, partnerId } = req.query;

    try {
        const bookingData = await fetchAllTicketedFlightBookings({ limit, page, credentialId, partnerId, from, to, searchText });
        if (!bookingData) {
            return next(new ErrorResponse("No bookings found", 404))
        }
        const data = await generateBookingExportData(bookingData);
        if (!data) {
            return next(new ErrorResponse(`Something went wrong while generating report`, 500))
        } else if (data.length < 1) {
            return next(new ErrorResponse(`No data is available for export`, 409))
        } else {
            const { buffer, fileType } = await generateExcelBufferAndType(data, type)
            return res.status(200).json({
                'status': true,
                'data': { buffer, fileType },
                'message': 'Fetched excel/csv datas successfully',
                'responseCode': '000'
            })
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: false,
            message: `Something went wrong while generating report`,
            data: {},
            responseCode: '001'
        });
    }
});
exports.listAllBookingPDF = asyncHandler(async (req, res, next) => {

    const sort = req.query.sort && req.query.sort === 'ASC' ? 'ASC' : 'DESC';
    let sortField = req.query.sortField
    let { from, to, searchText, credentialId, partnerId } = req.query;
    try {
        const bookingData = await fetchAllTicketedFlightBookings({ credentialId, from, to, partnerId, searchText, sort, sortField });
        if (!bookingData) {
            return next(new ErrorResponse("No bookings found", 404))
        }
        const data = await generateBookingExportData(bookingData);
        if (!data) {
            return next(new ErrorResponse(`Something went wrong while generating report`, 500))
        } else if (data.length < 1) {
            return next(new ErrorResponse(`No data is available for export`, 409))
        }

        const templateDetails = {
            title: 'Air Ticket Bookings Report'
        }
        const reportHtmlWithStyle = reportPdfTemplate(data, templateDetails);
        let random = new Date().valueOf();

        // Create a browser instance with Puppeteer
        const browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });
        const page = await browser.newPage();
        // Set content to the page
        await page.setContent(reportHtmlWithStyle, { waitUntil: 'domcontentloaded' });

        // Generate PDF using Puppeteer
        const outputFile = `report-${random}.pdf`;
        await page.pdf({
            path: outputFile,
            format: 'A4',
            preferCSSPageSize: true
        });
        const buffer = fs.readFileSync(outputFile);
        browser.close();
        fs.unlinkSync(outputFile);
        return res.status(200).json({
            status: true,
            message: 'report generated successfully.',
            data: {
                buffer,
                fileType: 'application/pdf'
            },
            responseCode: '000'
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: false,
            message: `Something went wrong while generating report`,
            data: {},
            responseCode: '001'
        });
    }
});
