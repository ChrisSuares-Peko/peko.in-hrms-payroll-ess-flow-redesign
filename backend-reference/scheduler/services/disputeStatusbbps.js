const { findOneWithId } = require("../models/use-cases/corporateUser");
const { findAllTickets, updateTicketStatus } = require("../models/use-cases/support");
const { fetchServiceDetails } = require("../utils/checkAndFetchServiceDetails");
const { XMLParser, XMLBuilder } = require("fast-xml-parser");
const { customLog } = require("../utils/loggerHelper");
const { generateRequestId, encrypt, decrypt } = require("../utils/billPayments_utils");
const axios = require("axios");
const operatorsData = require("../utils/operatorsData.json");

const { accessKey } = operatorsData.billavenue;

exports.disputeStatus = async () => {
  customLog(null, "info", { message: "Transaction Support Ticket Processor started" });
  try {

    const tickets = await findAllTickets({
      issueType: "Transaction",
      status: "PENDING",
    });

    if (!tickets.length) {
      customLog(null, "info", { message: "No pending transaction tickets found" });
      return;
    }
    for (const ticket of tickets) {
      try {
        const corporateUserId = ticket.corporateUserId;
        const corporateDetails = await findOneWithId(corporateUserId);
        const { packageId, credentialId } = corporateDetails;
        const bbpsSupportHistory = ticket.bbpsSupportHistory;
        const requestId = generateRequestId();

        customLog(null, "info", { ticketId: ticket.id, message: "Processing ticket" });

        const serviceDetails = await fetchServiceDetails({
          credentialId,
          accessKey,
          packageId,
          corporateUserId,
        });

        if (Object.prototype.hasOwnProperty.call(serviceDetails, "error")) {
          customLog(null, "error", { error: serviceDetails["error"], ticketId: ticket.id });
          continue;
        }

        const requestBody = {
          complaintType: bbpsSupportHistory?.requestBody?.complaintType,
          complaintId: bbpsSupportHistory?.complaintId,
        };

        const encryptionKey = serviceDetails.vendor.optional4;
        const URL = serviceDetails.vendor.apiUrl;

        const builder = new XMLBuilder({ ignoreAttributes: false, format: true });
        let xmlPayload = builder.build({ complaintTrackingReq: requestBody });
        xmlPayload = `<?xml version="1.0" encoding="UTF-8"?>\n${xmlPayload}`;

        customLog(null, "info", { xmlPayload, ticketId: ticket.id });

        const encRequest = encrypt(xmlPayload, encryptionKey);
        const data = {
          accessCode: serviceDetails.vendor.optional3,
          requestId,
          encRequest,
          ver: serviceDetails.vendor.optional2,
          instituteId: serviceDetails.vendor.optional1,
        };
        const parameters = new URLSearchParams(data).toString();
        const url = `${URL}/billpay/extComplaints/track/xml`;

        const config = {
          method: "POST",
          url,
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          data: parameters,
        };

        // const sessionId = req.headers.sessionid
        // const token = req.headers.authorization
        // const id = req.user.id
        // const dummyConfig = {
        //   method: "POST",
        //   url: `https://uatinapi.pekoapp.com/api/v1/corporate/${id}/payment/bbps/proxy-api`,
        //   headers: { "sessionid": sessionId, "Authorization": token },
        //   data: config,
        // }
        // const result = await axios(dummyConfig)
        // const response = { data: result.data.data.response }

        const response = await axios(config);
        customLog(null, "info", { response: response?.data, ticketId: ticket.id });

        const decryptedResponse = decrypt(response.data, encryptionKey);
        const parser = new XMLParser({ ignoreAttributes: false, parseTagValue: false });
        const parsedResponse = parser.parse(decryptedResponse);

        customLog(null, "info", {
          decryptedResponse,
          parsedResponse,
          ticketId: ticket.id,
        });

        if (parsedResponse?.complaintTrackingResp?.responseCode === "000") {
          customLog(null, "info", {
            ticketId: ticket.id,
            message: "Complaint status fetched successfully",
          });
          const status = parsedResponse?.complaintTrackingResp?.complaintStatus;
          if (status !== "ASSIGNED") {
            if (status === "RESOLVED") {
              await updateTicketStatus(ticket.id, status, true);
            } else {
              await updateTicketStatus(ticket.id, status, false);
            }
          }
        } else {
          throw new Error(parsedResponse?.complaintTrackingResp?.responseReason || "Unexpected vendor response");
        }

      } catch (innerError) {
        customLog(null, "error", {
          error: innerError.message,
          ticketId: ticket?.id,
          message: "Error while processing ticket",
        });
        continue;
      }
    }

    customLog(null, "info", { message: "Transaction Support Ticket Processor completed" });
    return "Dispute status check completed successfully.";
  } catch (error) {
    customLog(null, "error", {
      message: "Unhandled error in scheduler function",
      error: error.message,
    });
    return "Internal server error in scheduler.";
  }
};