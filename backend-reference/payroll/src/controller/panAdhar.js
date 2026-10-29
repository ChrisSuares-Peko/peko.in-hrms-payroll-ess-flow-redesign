const axios = require('axios');
const asyncHandler = require("../middleware/async");
const ErrorResponse = require('../utils/error-response');
const Employee = require('../models/entities/employee');
const { findActiveIdentityConflict } = require('../models/use-cases/employee');
const { fetchVendorCredentials } = require('../utils/credentialsClient');
const { customLog } = require('../utils/loggerHelper');
const operatorsData = require('../utils/operatorsData.json');
const CASHFREE_VERIFICATION_ACCESS_KEY = operatorsData.taxIdVerification.accessKey;

async function getCashfreeVerificationConfig(accessKey) {
    let baseUrl, clientId, clientSecret;
    try {
        const serviceDetails = await fetchVendorCredentials({ accessKey });
        baseUrl = serviceDetails.vendor.apiUrl;
        clientId = serviceDetails.vendor.optional1;
        clientSecret = serviceDetails.vendor.optional2;
    } catch (e) {
        customLog(null, 'error', { message: `[panAdhar] Failed to fetch ${accessKey} credentials from DB, falling back to env vars`, error: e.message });
        baseUrl = process.env.CASH_FREE_VERIFICATION_URL;
        clientId = process.env.CASH_FREE_VERIFICATION_CLIENT_ID;
        clientSecret = process.env.CASH_FREE_VERIFICATION_SECRET;
    }
    return { baseUrl, clientId, clientSecret };
}

exports.verifyPan = asyncHandler(async (req, res, next) => {
    const { pan } = req.body;
    const employeeId = req.params.employeeId;

    const employee = await Employee.findOne({ _id: employeeId, corporateUser: req.user._id });
    if (!employee) {
        return next(new ErrorResponse('Employee not found', 404));
    }

    // employee.pan doesn't exist on the schema (only panNumber does) — this used to always
    // read undefined and never actually block re-verification. panVerified is the real,
    // persisted signal (see models/entities/employee.js).
    if (!pan) {
        return next(new ErrorResponse('PAN is required', 400));
    }

    // Checked before calling Cashfree so a duplicate doesn't cost a verification call.
    const panConflict = await findActiveIdentityConflict(employee.corporateUser, { panNumber: String(pan).trim().toUpperCase() }, employee._id);
    if (panConflict) {
        return next(new ErrorResponse('PAN already exists for another employee', 400));
    }

    const { baseUrl, clientId, clientSecret } = await getCashfreeVerificationConfig(CASHFREE_VERIFICATION_ACCESS_KEY);


    const config = {
        method: 'post',
        url: `${baseUrl}/verification/pan`,
        headers: {
            'Content-Type': 'application/json',
            'x-client-id': clientId,
            'x-client-secret': clientSecret,
            'x-api-version': '2023-08-01',
        },
        data: { pan, name: employee.personalInformation?.fullName },
    };
    
    customLog(req?.LogTraceId, 'info', { message: '[panAdhar:verifyPan] calling Cashfree PAN verification API', url: config.url, employeeId });

    let result;
    try {
        result = await axios(config);
        customLog(req?.LogTraceId, 'info', { message: '[panAdhar:verifyPan] Cashfree PAN API response received', status: result.status, valid: result.data?.valid, employeeId });
    } catch (error) {
        customLog(req?.LogTraceId, 'error', { message: '[panAdhar:verifyPan] Cashfree PAN API call failed', error: error.response?.data || error.message, employeeId });
        return next(
            new ErrorResponse(
                error.response?.data?.message || 'PAN verification failed',
                error.response?.status || 500
            )
        );
    }
    const response = result.data;

    if (response?.valid === true) {
        employee.employeeInformation.contractType = employee.employeeInformation.contractType
            .trim()
            .toUpperCase()
            .replace(/[\s-]+/g, "_");
        employee.panNumber = pan;
        employee.panVerified = true;
        await employee.save();
        return res.status(200).json({
            status: true,
            responseCode: '000',
            message: 'PAN verified successfully',
            data: response,
        });
    }

    return res.status(200).json({
        status: false,
        responseCode: '001',
        message: 'PAN not verified.Please provide valid PAN number',
        data: response,
    });
});

exports.generateAadhaarOtp = asyncHandler(async (req, res, next) => {
    const { aadhaarNumber } = req.body;
    const employeeId = req.params.employeeId;

    const employee = await Employee.findOne({ _id: employeeId, corporateUser: req.user._id });
    if (!employee) {
        return next(new ErrorResponse('Employee not found', 404));
    }

    if (!aadhaarNumber || aadhaarNumber.length !== 12) {
        return next(new ErrorResponse('Aadhaar number must be exactly 12 digits', 400));
    }

    const { baseUrl, clientId, clientSecret } = await getCashfreeVerificationConfig(CASHFREE_VERIFICATION_ACCESS_KEY);

    try {
        customLog(req?.LogTraceId, 'info', { message: '[panAdhar:generateAadhaarOtp] calling Cashfree Aadhaar OTP API', url: `${baseUrl}/verification/offline-aadhaar/otp`, employeeId });
        const response = await axios.post(
            `${baseUrl}/verification/offline-aadhaar/otp`,
            { aadhaar_number: aadhaarNumber },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'x-client-id': clientId,
                    'x-client-secret': clientSecret,
                },
            }
        );
        customLog(req?.LogTraceId, 'info', { message: '[panAdhar:generateAadhaarOtp] Cashfree Aadhaar OTP API response received', status: response.status, employeeId });

        employee.aadhaarVerificationId = response.data.verification_id;
        await employee.save();

        return res.status(200).json({
            status: true,
            responseCode: '000',
            message: 'OTP generated successfully',
            data: { ref_id: response.data.ref_id },
        });
    } catch (error) {
        return next(
            new ErrorResponse(
                error.response?.data?.message || 'Aadhaar OTP generation failed',
                error.response?.status || 500
            )
        );
    }
});


exports.verifyAadhaarOtp = asyncHandler(async (req, res, next) => {
    const { aadhaarNumber, otp, ref_id } = req.body;
    const employeeId = req.params.employeeId;

    const employee = await Employee.findOne({ _id: employeeId, corporateUser: req.user._id });
    if (!employee) {
        return next(new ErrorResponse('Employee not found', 404));
    }

    if (!aadhaarNumber || !otp) {
        return next(new ErrorResponse('Aadhaar number and OTP are required', 400));
    }

    const { baseUrl, clientId, clientSecret } = await getCashfreeVerificationConfig(CASHFREE_VERIFICATION_ACCESS_KEY);

    try {
        customLog(req?.LogTraceId, 'info', { message: '[panAdhar:verifyAadhaarOtp] calling Cashfree Aadhaar OTP verify API', url: `${baseUrl}/verification/offline-aadhaar/verify`, employeeId });
        const response = await axios.post(
            `${baseUrl}/verification/offline-aadhaar/verify`,
            { otp, ref_id, aadhaar_number: aadhaarNumber },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'x-client-id': clientId,
                    'x-client-secret': clientSecret,
                },
            }
        );
        customLog(req?.LogTraceId, 'info', { message: '[panAdhar:verifyAadhaarOtp] Cashfree Aadhaar OTP verify API response received', status: response.status, aadhaarStatus: response.data?.status, employeeId });

        if (response.data.status === 'VALID') {
            employee.aadhaarNumber = aadhaarNumber;
            employee.aadhaarVerified = true;
            await employee.save();

            return res.status(200).json({
                status: true,
                responseCode: '000',
                message: 'Aadhaar verified successfully',
                data: response.data,
            });
        }

        return res.status(400).json({
            status: false,
            responseCode: '001',
            message: response.data.message || 'OTP verification failed',
            data: response.data,
        });
    } catch (error) {
        return next(
            new ErrorResponse(
                error.response?.data?.message || 'Aadhaar OTP verification failed',
                error.response?.status || 500
            )
        );
    }
});
