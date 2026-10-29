const axios = require("axios");

const { getValue, setValue } = require("../utils/cacheDataMethods");
const { customLog } = require("../utils/loggerHelper");
const { fetchAllFlightBookings, updateStatusById } = require("../models/use-cases/flight");
const { fetchServiceDetails } = require("../utils/checkAndFetchServiceDetails");
const operatorsData = require("../utils/operatorsData.json");

const accessKey = operatorsData["flight"]["accessKey"];

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
                // "X-API-KEY": serviceDetails.X_API_KEY,
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

// Shared with the hold-release sweeper to reuse the cached TBO token.
exports.getSession = getSession;

exports.updateAirlineTicketStatus = async () => {
  try {

    // find all flight ticket with status cancelation request
    const bookingData = await fetchAllFlightBookings();
    customLog(null, "info", { bookingDataCount: bookingData?.length, message: "Fetched booking data" });
    
    // call vendor api for all of the ticket
    if(bookingData.length) {
        bookingData.forEach( async item => {
            // forEach does not await async callbacks, so catch per item or the error is lost
            try {
                const credentialId = item.credentialId
                const packageId = item.corporatePackageId
                const corporateUserId = item.corporateUserId

                const serviceDetails = await fetchServiceDetails({
                    credentialId,
                    accessKey,
                    packageId,
                    corporateUserId
                });

                if (Object.prototype.hasOwnProperty.call(serviceDetails, "error")) {
                    return serviceDetails;
                }
                const { token } = await getSession(serviceDetails)
                await updateChangeRequestStatus(item, serviceDetails, token, item.registeredBy);
            } catch (error) {
                customLog(null, "error", { message: "updateAirlineTicketStatus failed for booking", bookingId: item?.id, error: error?.message || error });
            }
        })
    }
    
  } catch (error) {
    customLog(null, "error", { message:"Error in updateAirlineTicketStatus", error })
    throw error;
  }
};

// fetch ticket status from vendor api, update db and initiate refund
// eslint-disable-next-line no-unused-vars
const updateChangeRequestStatus = async (ticket, serviceDetails, token, registeredBy) => {
    if(!ticket.changeRequestId) return; 

    let data = JSON.stringify({
        EndUserIp: serviceDetails.vendor.optional4,
        TokenId: token, 
        ChangeRequestId: ticket.changeRequestId
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
        customLog(null, "info", { message: "Flight ticket cancel status fetch api response", res: result?.data?.Response, data: config.data})
        if (!result || result?.data?.Response?.Error?.ErrorCode) {
            customLog(null, "error", { message: "Flight ticket cancel status fetch api failed", error: result.data.Response, data: config.data})
            return;
        }
        
        // [NotSet = 0,Unassigned = 1,Assigned = 2,Acknowledged = 3,Completed = 4,Rejected = 5,Closed = 6,Pending = 7,Other = 8]
        const status = result.data.Response.ChangeRequestStatus;
        customLog(null, "info", { status, ticketId: ticket.id, message: "Change request status received" });
        let response; 
        if(status === 4) {
            response = await updateStatusById({
                id: ticket.id, 
                status: 'CANCELLATION_APPROVED_BY_VENDOR'
            })

            // const updateDetails = {
            //     corporateTxnId: ticket.corporateTxnId, 
            //     registeredById: registeredBy, 
            //     partialRefund: {
            //         status: true, 
            //         walletRefund: ticket.refundedAmount
            //     }
            // }

            // if (ticket.paymentMode === 'PAYMENT GATEWAY') {
            //     const { status } = await cancelPGTransaction(ticket.corporateTxnId, ticket.refundedAmount);
            //     if (status) {
            //         await refundWalletTransaction(updateDetails);
            //     }
            // } else {
            //     await refundWalletTransaction(updateDetails);
            // }
        }
        else if(status === 5 || status == 6) {
            response = await updateStatusById({
                id: ticket.id, 
                status: 'CANCEL_REQUEST_REJECTED'
            })
        }
        if(response && !response[0]) {
            customLog(null, "error", { message: "Failed to update flight cancelation status in db", data: {status, ticketId: ticket.id}, dbResponse: response, })
        }
    } catch (error) {
        if (error?.response?.data) {
            customLog(null, "error", { message: "Flight ticket cancel status fetch api failed", data: error?.response?.data })
        } else {
            customLog(null, "error", { message: "Flight ticket cancel status fetch api failed", data: error })
        }
    }
}