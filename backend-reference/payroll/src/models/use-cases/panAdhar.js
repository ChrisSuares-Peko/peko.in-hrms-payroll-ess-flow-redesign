const axios = require('axios');
const ErrorResponse = require('../../utils/error-response');
const asyncHandler = require('../../middleware/async');

const verifyPanUseCase = asyncHandler(async ({ panNumber, headers }) => {
    if (!panNumber) {
        throw new ErrorResponse('PAN number is required', 400);
    }

    try {
          const serverBaseUrl = process.env.SERVER_URL
        const response = await axios.post(
            `${serverBaseUrl}/api/v1/corporate/1031/officeAndBusiness/verification/pan`,
            { panNumber },
            {
                headers: {
                    Authorization: headers.authorization,
                    sessionid: headers.sessionid, // if required
                },
            }
        );

        if (response.data.status) {
            return response.data.data; // Verified PAN info
        } else {
            throw new ErrorResponse(response.data.message || 'PAN verification failed', 400);
        }
    } catch (error) {
        throw new ErrorResponse(
            error.response?.data?.message || error.message,
            error.response?.status || 500
        );
    }
});

module.exports = { verifyPanUseCase };
