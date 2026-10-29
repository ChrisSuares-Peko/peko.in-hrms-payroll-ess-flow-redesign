const {
    create,
    findAllTickets,
    getExcel,
    findOneTicketWithTicketId,
    updateWithTicketId,
    DeleteWithTicketId
} = require('../../models/use-cases/support')
const asyncHandler = require('../../middlewares/async')
const ErrorResponse = require('../../utils/error-response')
const { getOneTransaction } = require('../../models/use-cases/transaction')
const { default: axios } = require('axios')
const { findOneWithCredentialId, update: corporateUserUpdate, } = require('../../models/use-cases/corporateUser')
const { findServiceOperatorByAccessKey,  } = require('../../utils/checkAndFetchServiceDetails')
const { customLog } = require('../../utils/loggerHelper');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { FRESHDESK_ACCESS_KEY, FRESHDESK_AUTH_PASSWORD_FILLER, FRESHDESK_STATUS_MAP, FRESHDESK_PRIORITY_MAP } = require('../../utils/constants');
const accessKey = FRESHDESK_ACCESS_KEY

let status = FRESHDESK_STATUS_MAP
let priority = FRESHDESK_PRIORITY_MAP
async function checkService() {

    const serviceDetails = await findServiceOperatorByAccessKey(accessKey)
    if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
        return serviceDetails
    }
    let apiUrl = serviceDetails.vendor.apiUrl

    return {
        client_id: serviceDetails.vendor.optional1,
        API_URL: apiUrl
    }
}
exports.createMessage = asyncHandler(async (req, res, next) => {
    try {
        const { screenshot, screenshotImageFormat, issueType, module, description } = req.body;

        let corporateId = req.user.id
        let corporateDetails = await findOneWithCredentialId(corporateId)

        let supportId = corporateDetails.supportId

        let serviceDetails = await checkService()

        if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
            return next(new ErrorResponse(serviceDetails.error, 400))
        }

        const URL = serviceDetails.API_URL;
        const token = serviceDetails.client_id;

        if (!token) {
            const fakeTicketId = Math.floor(Math.random() * 1000000);
            const data = { issueType, module, description, ticketId: fakeTicketId, corporateUserId: req.user.corporateId, screenshot, screenshotImageFormat };
            await create(data, req.user);

            return res.status(200).json({
                status: true,
                data: null,
                message: "Ticket created successfully",
                responseCode: '000',
            });
        }

        let url = `${URL}/api/v2/tickets`;
        const formData = new FormData();

        if (screenshot && screenshotImageFormat && screenshot !== '' && screenshotImageFormat !== '') {
            const fileTypeMap = {
                'png': 'image/png',
                'jpeg': 'image/jpeg',
                'jpg': 'image/jpeg',
                'pdf': 'application/pdf'
            };
            const contentType = fileTypeMap[screenshotImageFormat] || 'application/octet-stream';
            const filename = `screenshot.${screenshotImageFormat}`;
            const tempFilePath = path.join(os.tmpdir(), filename);
            try {
                const buffer = Buffer.from(screenshot, 'base64');
                fs.writeFileSync(tempFilePath, buffer);
                const fileStream = fs.createReadStream(tempFilePath);
                formData.append('attachments[]', fileStream, { filename, contentType });
            } catch (fileErr) {
                customLog(req?.LogTraceId, "error", { message: fileErr?.message, context: "screenshot_processing" });
            }
        }

        formData.append('email', req.user.email);
        formData.append('name', req.user.name);
        formData.append('phone', req.user.mobileNo);
        formData.append('priority', 1);
        formData.append('status', 2);
        formData.append('subject', module);
        formData.append('description', description);
        formData.append('type', issueType);
        formData.append('custom_fields[cf_module]', module);
        formData.append('custom_fields[cf_credential_id]', corporateId);

        const username = token;
        const password = FRESHDESK_AUTH_PASSWORD_FILLER;
        const Token = Buffer.from(`${username}:${password}`, 'utf8').toString('base64');

        const config = {
            method: 'post',
            url: url,
            headers: {
                ...formData.getHeaders(),
                'Authorization': `Basic ${Token}`,
                'Accept': 'application/json'
            },
            data: formData
        };

        let response = await axios(config);

        if (response && (response.status === 200 || response.status === 201) && response.data) {
            let ticket = response.data
            let requester_id = ticket["requester_id"]
            let ticketId = ticket["id"]

            if (supportId === null || (supportId !== requester_id && supportId !== null)) {
                await corporateUserUpdate({ corporateId }, { supportId: requester_id }, req.user);
            }
            const data = { issueType, module, description, ticketId, corporateUserId: req.user.corporateId, screenshot, screenshotImageFormat };
            await create(data, req.user)
            return res.status(200).json({
                status: true,
                data: ticket,
                message: "Ticket created successfully",
                responseCode: '000',
            });
        } else {
            return next(new ErrorResponse('Something went wrong. Please try again later.', 400));
        }
    } catch (err) {
        customLog(req?.LogTraceId, "error", { message: err?.message, data: err?.response?.data });
        return res.status(400).json({
            status: false,
            message: "Something went wrong. Please try again later.",
            data: {},
            responseCode: '001'
        });
    }
});


exports.findAllMessageAndCount = asyncHandler(async (req, res) => {

    let { from, to, searchText, page, itemsPerPage } = req.query;
    let corporateId = req.user.corporateId

    let module = req.query.module ? decodeURIComponent(req.query.module) : undefined

    // Parse page and itemsPerPage to integers (you can also use parseInt)
    page = page ? parseInt(page) : 1;
    itemsPerPage = itemsPerPage ? parseInt(itemsPerPage) : null;
    let limit = itemsPerPage

    // Calculate offset based on page and itemsPerPage
    let offset;
    if (page && itemsPerPage) {
        offset = (page - 1) * itemsPerPage;
    }

    let exludeAttribute = ['updatedAt', 'systemUserId']

    let params = {
        from,
        to,
        module,
        searchText,
        // sort,
        // filter,
        limit,
        offset,
        corporateId,
        exludeAttribute
    }

    const messageData = await findAllTickets(params);

    return res.json({
        status: true,
        data: {
            recordsTotal: messageData.count,
            data: messageData.rows,
        },
        message: 'Fetched all tickets successfully',
        responseCode: '000',
    });
});

async function deleteTicketAttachment(URL, token, id) {
    let url = `${URL}/api/v2/attachments/${id}`

    // Basic Auth credentials- password is not required
    const username = token;
    const password = FRESHDESK_AUTH_PASSWORD_FILLER;
    const Token = Buffer.from(`${username}:${password}`, 'utf8').toString('base64');

    const config = {
        method: 'delete',
        url: url,
        headers: {
            'Authorization': `Basic ${Token}`,
            'Accept': 'application/json'
        }
    };
    try {
        let response = await axios(config)

        if (response && response.status === 204) {

            return true
        } else {
            return false
        }
    } catch (err) {
       
        return false
    }
}
exports.updateMessage = asyncHandler(async (req, res, next) => {
    const { screenshot, screenshotImageFormat, issueType, module, attachmentId } = req.body;
    let { id } = req.params;

    if (!id) {
        return next(new ErrorResponse('Ticket Id is not provided.', 400))
    }

    // tickets are owned by corporateUser.id, not credentialId directly — resolve it so
    // the update is scoped to this caller's own tickets, never another corporate's.
    const corporateUser = await findOneWithCredentialId(req.user.id);
    if (!corporateUser) {
        return next(new ErrorResponse('Unauthorized access.', 403))
    }
    const corporateUserId = corporateUser.id;

    let serviceDetails = await checkService()

    if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
        return next(new ErrorResponse(serviceDetails.error, 400))
    }

    const URL = serviceDetails.API_URL;
    const token = serviceDetails.client_id;

    if (!token) {
        // Skip third-party request if token is not available, and proceed with the update logic
        await updateWithTicketId(id, { module, issueType }, corporateUserId);

        return res.status(200).json({
            status: true,
            data: { module, issueType }, // No ticket data returned, since no third-party API call
            message: "Ticket updated successfully without third-party request",
            responseCode: '000',
        });
    }

    let url = `${URL}/api/v2/tickets/${id}`;
    const formData = new FormData();

    if (screenshot && screenshotImageFormat) {
        if (screenshot !== '' && screenshotImageFormat !== '') {
            const fileTypeMap = {
                'png': 'image/png',
                'jpeg': 'image/jpeg',
                'jpg': 'image/jpeg',
                'pdf': 'application/pdf'
            };
            const contentType = fileTypeMap[screenshotImageFormat] || 'application/octet-stream';
            const filename = `screenshot.${screenshotImageFormat}`;
            const tempFilePath = path.join(os.tmpdir(), filename);

            try {
                const buffer = Buffer.from(screenshot, 'base64');
                fs.writeFileSync(tempFilePath, buffer);
                const fileStream = fs.createReadStream(tempFilePath);
                formData.append('attachments[]', fileStream, { filename, contentType });
                console.log("File appended to FormData!");
            } catch (error) {
                console.error("Error while processing the file:", error);
            }
        }
    }

    if (module) formData.append('subject', module);
    if (issueType) formData.append('type', issueType);
    if (module) formData.append('custom_fields[cf_module]', module);

    if ((screenshot && screenshotImageFormat && attachmentId != null) || (attachmentId != null && screenshot == null)) {
        await deleteTicketAttachment(URL, token, attachmentId);

        if (!module && !issueType) {
            return res.status(200).json({
                status: true,
                data: {},
                message: "Attachment removed successfully",
                responseCode: '000',
            });
        }
    }

    const username = token;
    const password = FRESHDESK_AUTH_PASSWORD_FILLER;
    const Token = Buffer.from(`${username}:${password}`, 'utf8').toString('base64');

    const config = {
        method: 'put',
        url: url,
        headers: {
            ...formData.getHeaders(),
            'Authorization': `Basic ${Token}`,
            'Accept': 'application/json'
        },
        data: formData
    };
    try {
        let response = await axios(config);

        if (response && (response.status === 200 || response.status === 201) && response.data) {
            let ticket = response.data;

            await updateWithTicketId(id, { module, issueType }, corporateUserId);

            return res.status(200).json({
                status: true,
                data: ticket,
                message: "Ticket updated successfully",
                responseCode: '000',
            });
        } else {
            return next(new ErrorResponse('Something went wrong. Please try again later.', 400));
        }
    } catch (err) {
        customLog(req?.LogTraceId, "error", { message: err?.message, data: err?.response?.data });
        return res.status(400).json({
            status: false,
            message: "Something went wrong. Please try again later.",
            data: {
                message: err?.response?.data?.description
            },
            responseCode: '001'
        });
    }
});

exports.deleteMessage = asyncHandler(async (req, res, next) => {
    let { id } = req.params;

    if (!id) {
        return next(new ErrorResponse('Ticket Id is not provided.', 400))
    }

    const corporateUser = await findOneWithCredentialId(req.user.id);
    if (!corporateUser) {
        return next(new ErrorResponse('Unauthorized access.', 403))
    }
    const corporateUserId = corporateUser.id;

    let serviceDetails = await checkService()

    if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
        return next(new ErrorResponse(serviceDetails.error, 400))
    }

    const URL = serviceDetails.API_URL;
    const token = serviceDetails.client_id;

    if (!token) {
        // Skip third-party request if token is not available, and proceed with local deletion
        try {
            await DeleteWithTicketId(id, corporateUserId);

            return res.status(200).json({
                status: true,
                data: {},
                message: "Ticket deleted locally without third-party request",
                responseCode: '000',
            });
        } catch (err) {
            return next(new ErrorResponse('Failed to delete ticket from local database.', 500));
        }
    }

    let url = `${URL}/api/v2/tickets/${id}`;
    const username = token;
    const password = FRESHDESK_AUTH_PASSWORD_FILLER;
    const Token = Buffer.from(`${username}:${password}`, 'utf8').toString('base64');

    const config = {
        method: 'delete',
        url: url,
        headers: {
            'Authorization': `Basic ${Token}`,
            'Accept': 'application/json'
        }
    };
    try {
        let response = await axios(config);

        if (response && response.status === 204) {
            await DeleteWithTicketId(id, corporateUserId);

            return res.status(200).json({
                status: true,
                data: {},
                message: "Ticket deleted successfully",
                responseCode: '000',
            });
        } else {
            return next(new ErrorResponse('Something went wrong. Please try again later.', 400));
        }
    } catch (err) {
        customLog(req?.LogTraceId, "error", { message: err?.message, data: err?.response?.data });
        return res.status(400).json({
            status: false,
            message: "Something went wrong. Please try again later.",
            data: {
                message: err?.response?.data?.description
            },
            responseCode: '001'
        });
    }
})


exports.deleteAttachment = asyncHandler(async (req, res, next) => {
    let { id } = req.params;

    if (!id) {
        return next(new ErrorResponse('Ticket Id is not provided.', 400))
    }

    let serviceDetails = await checkService()

    if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
        return next(new ErrorResponse(serviceDetails.error, 400))
    }

    const URL = serviceDetails.API_URL;
    const token = serviceDetails.client_id;

    if (token) {
        try {
            let response = await deleteTicketAttachment(URL, token, id);

            if (response) {
                return res.status(200).json({
                    status: true,
                    data: {},
                    message: "Attachments deleted successfully",
                    responseCode: '000',
                });
            } else {
                return next(new ErrorResponse('Something went wrong. Please try again later.', 400));
            }
        } catch (err) {
            customLog(req?.LogTraceId, "error", { message: err?.message, data: err?.response?.data });

            return res.status(400).json({
                status: false,
                message: "Something went wrong. Please try again later.",
                data: {
                    message: err?.response?.data?.description
                },
                responseCode: '001'
            });
        }
    } else {
        // Mock successful response when no token is available
        return res.status(200).json({
            status: true,
            data: {},
            message: "Attachments deleted successfully (mocked response)",
            responseCode: '000',
        });
    }
});

exports.getExcel = asyncHandler(async (req, res, next) => {
    const from = req.query.fromDate
    const to = req.query.toDate
    let order = req.query.orderCol,
        column = req.query.column
    let status = req.query.status
    const corporateUserId = req.user.corporateId;
    let params = {
        from,
        to,
        order,
        column,
        status,
        corporateUserId
    }
    let result = await getExcel(params)
    if (!result) {
        return next(new ErrorResponse(`Something went wrong while updating message`, 200))
    } else {
        return res.status(200).json({
            'status': true,
            'data': result,
            'message': 'excel created successfully',
            'responseCode': '000'
        })
    }
})

//create chat
exports.createChatMessage = asyncHandler(async (req, res, next) => {

    let { body, id } = req.body;

    let corporateId = req.user.id
    let corporateDetails = await findOneWithCredentialId(corporateId)

    let supportId = corporateDetails.supportId

    if (!id) {
        return next(new ErrorResponse('Ticket Id is not provided.', 400))
    }

    let serviceDetails = await checkService()

    if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
        return next(new ErrorResponse(serviceDetails.error, 400))
    }

    const URL = serviceDetails.API_URL;
    const token = serviceDetails.client_id;

    if (token) {

        let url = `${URL}/api/v2/tickets/${id}/reply`

        const formData = new FormData();

        formData.append('body', body);
        if (supportId) formData.append('user_id', supportId);

        // Basic Auth credentials- password is not required
        const username = token;
        const password = FRESHDESK_AUTH_PASSWORD_FILLER;
        const Token = Buffer.from(`${username}:${password}`, 'utf8').toString('base64');

        const config = {
            method: 'post',
            url: url,
            headers: {
                ...formData.getHeaders(),
                'Authorization': `Basic ${Token}`,
                'Accept': 'application/json'
            },
            data: formData
        };
        try {
            let response = await axios(config);

            if (response && (response.status === 200 || response.status === 201) && response.data) {
                let conversations = response.data;
                return res.status(200).json({
                    status: true,
                    data: conversations,
                    message: "Conversation created successfully",
                    responseCode: '000',
                });
            } else {
                return next(new ErrorResponse('Something went wrong. Please try again later.', 400));
            }
        } catch (err) {
            customLog(req?.LogTraceId, "error", { message: err?.message, data: err?.response?.data });

            return res.status(400).json({
                status: false,
                message: "Something went wrong. Please try again later.",
                data: {
                    message: err?.response?.data?.description
                },
                responseCode: '001'
            });
        }
    } else {
        // Mock successful response when token is not available
        return res.status(200).json({
            status: true,
            data: { mock: true, body, id, supportId },
            message: "Conversation created successfully (mocked response)",
            responseCode: '000',
        });
    }
});

//get chat
exports.getAllChatMessage = asyncHandler(async (req, res, next) => {

    let { id } = req.params;

    if (!id) {
        return next(new ErrorResponse('Ticket Id is not provided.', 400))
    }

    let corporateId = req.user.id
    let corporateDetails = await findOneWithCredentialId(corporateId)

    let supportId = corporateDetails.supportId

    let serviceDetails = await checkService()

    if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
        return next(new ErrorResponse(serviceDetails.error, 400))
    }

    const URL = serviceDetails.API_URL;
    const token = serviceDetails.client_id;

    if (token) {
        let url = `${URL}/api/v2/tickets/${id}/conversations`

        const username = token;
        const password = FRESHDESK_AUTH_PASSWORD_FILLER;
        const Token = Buffer.from(`${username}:${password}`, 'utf8').toString('base64');

        const config = {
            method: 'get',
            url: url,
            headers: {
                'Authorization': `Basic ${Token}`,
                'Accept': 'application/json'
            },
        };

        try {
            let response = await axios(config);

            if (response && (response.status === 200 || response.status === 201) && response.data) {
                let conversations = response.data;
                return res.status(200).json({
                    status: true,
                    data: { conversations, requesterId: supportId },
                    message: "Conversation fetched successfully",
                    responseCode: '000',
                });
            } else {
                return next(new ErrorResponse('Something went wrong. Please try again later.', 400));
            }
        } catch (err) {
            customLog(req?.LogTraceId, "error", { message: err?.message, data: err?.response?.data });
            return res.status(400).json({
                status: false,
                message: "Something went wrong. Please try again later.",
                data: {
                    message: err?.response?.data?.description
                },
                responseCode: '001'
            });
        }
    } else {
        // Mocked response when token is not available
        return res.status(200).json({
            status: true,
            data: {
                conversations: [
                    {
                        id: "mock_1",
                        body: "This is a mocked conversation message.",
                        created_at: new Date().toISOString(),
                        requesterId: supportId
                    }
                ],
                requesterId: supportId
            },
            message: "Mocked conversation data (since token is missing)",
            responseCode: '000',
        });
    }
});

exports.fetchBillPayments = asyncHandler(async (req, res, next) => {
    try {
        const { transactionId } = req.body
        const billData = await getOneTransaction({ transactionId })
        if (billData) {
            return res.status(200).json({
                'status': true,
                'data': billData,
                'message': 'fetched bill payments successfully',
                'responseCode': '000'
            });
        } else {
            return next(new ErrorResponse(`Please check your transction Id`, 501));
        }
    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message, data: error?.response?.data })
        return next(new ErrorResponse(`Unable to fetch bill details`, 501));
    }
})

exports.fetchTicketDetails = asyncHandler(async (req, res, next) => {

    let { id } = req.params;

    // if (!id) {
    //     return next(new ErrorResponse('Ticket Id is not provided.', 400))
    // }

    let serviceDetails = await checkService()

    if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
        return next(new ErrorResponse(serviceDetails.error, 400))
    }

    const URL = serviceDetails.API_URL;
    const token = serviceDetails.client_id;

    if (!token) {
        try {
            const data = await findOneTicketWithTicketId(id);

            return res.status(200).json({
                status: true,
                data: {
                    ...data,
                    attachments: [],
                    custom_fields: { cf_module: data?.module },
                    type: data?.issueType,
                    created_at: data?.createdAt
                },
                message: "Fetched ticket details successfully",
                responseCode: '000',
            });
        } catch (err) {
            console.log(err)
            return next(new ErrorResponse('Something went wrong. Please try again later.', 500));
        }
    }

    let url = `${URL}/api/v2/tickets/${id}`;
    const username = token;
    const password = FRESHDESK_AUTH_PASSWORD_FILLER;
    const Token = Buffer.from(`${username}:${password}`, 'utf8').toString('base64');

    const config = {
        method: 'get',
        url: url,
        headers: {
            'Authorization': `Basic ${Token}`,
            'Accept': 'application/json'
        },
    };

    try {
        let response = await axios(config);

        if (response && (response.status === 200 || response.status === 201) && response.data) {
            let ticket = response.data;
            ticket["status"] = status[ticket["status"]];
            ticket["priority"] = priority[ticket["priority"]];

            return res.status(200).json({
                status: true,
                data: ticket,
                message: "Fetched ticket details successfully",
                responseCode: '000',
            });
        } else {
            return next(new ErrorResponse('Something went wrong. Please try again later.', 400));
        }
    } catch (err) {
        customLog(req?.LogTraceId, "error", { message: err?.message, data: err?.response?.data });
        return res.status(400).json({
            status: false,
            message: "Something went wrong. Please try again later.",
            data: {
                message: err?.response?.data?.description
            },
            responseCode: '001'
        });
    }
});


// update chat ID of freshdesk
exports.updateChatId = asyncHandler(async (req, res, next) => {
    try {
        let corporateId = req.user.id
        let { restoreId } = req.body

        let result = await corporateUserUpdate({ corporateId }, { chatId: restoreId }, req.user)

        if (!result) {
            return next(new ErrorResponse('Something went wrong. Please try again later.', 400))
        } else {
            return res.status(200).json({
                status: true,
                message: "Chat ID updated successfully",
                data: {},
                responseCode: '000'
            });
        }

    } catch (err) {
        return res.status(400).json({
            status: false,
            message: "Something went wrong. Please try again later.",
            data: {},
            responseCode: '001'
        });
    }

})