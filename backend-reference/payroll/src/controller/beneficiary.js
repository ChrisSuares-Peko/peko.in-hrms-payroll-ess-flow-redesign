const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/error-response');
const { customLog } = require('../utils/loggerHelper');
const {
    fetchVendorDetails,
    getDecentroBeneficiaries,
    addDecentroBeneficiary,
    verifyDecentroBeneficiary,
    modifyDecentroBeneficiary,
} = require('../models/use-cases/beneficiary');

async function getVendor(req, next) {
    const corporateId = req.user?.corporateId || req.user?._id;
    if (!corporateId) {
        next(new ErrorResponse('Corporate user not found', 400));
        return null;
    }
    const serviceDetails = await fetchVendorDetails({ corporateId, headers: req.headers });
    const vendor = serviceDetails.vendor;
    if (!vendor || !vendor.optional2 || !vendor.optional3) {
        next(new ErrorResponse('Vendor credentials are not configured', 500));
        return null;
    }
    return vendor;
}

exports.getBeneficiaries = asyncHandler(async (req, res, next) => {
    try {
        const vendor = await getVendor(req, next);
        if (!vendor) return;
        const { provider_code, sender_account_number, beneficiary_code, page } = req.query;

        if (!sender_account_number) {
            return next(new ErrorResponse('sender_account_number is required', 400));
        }

        const result = await getDecentroBeneficiaries({
            vendor,
            query: { provider_code, sender_account_number, beneficiary_code, page },
        });

        return res.status(200).json({
            status: true,
            message: 'Beneficiaries fetched successfully',
            data: result,
            responseCode: '000',
        });
    } catch (err) {
        customLog(req?.LogTraceId, 'error', { message: err?.message, data: err?.response?.data });
        return res.status(err?.response?.status || 400).json({
            status: false,
            message: err?.response?.data?.message || err?.message || 'Something went wrong. Please try again later.',
            data: {},
            responseCode: '001',
        });
    }
});

exports.addBeneficiary = asyncHandler(async (req, res, next) => {
    try {
        const vendor = await getVendor(req, next);
        if (!vendor) return;

        const { sender_account_number, account_number, ifsc, name, transfer_type, sender_mobile } = req.body;

        if (!sender_account_number || !account_number || !ifsc || !name || !transfer_type) {
            return next(new ErrorResponse('sender_account_number, account_number, ifsc, name, and transfer_type are required', 400));
        }

        const result = await addDecentroBeneficiary({
            vendor,
            payload: { sender_account_number, account_number, ifsc, name, transfer_type, sender_mobile },
        });

        return res.status(200).json({
            status: true,
            message: 'Beneficiary added successfully',
            data: result,
            responseCode: '000',
        });
    } catch (err) {
        customLog(req?.LogTraceId, 'error', { message: err?.message, data: err?.response?.data });
        return res.status(err?.response?.status || 400).json({
            status: false,
            message: err?.response?.data?.message || err?.message || 'Something went wrong. Please try again later.',
            data: {},
            responseCode: '001',
        });
    }
});

exports.verifyBeneficiary = asyncHandler(async (req, res, next) => {
    try {
        const vendor = await getVendor(req, next);
        if (!vendor) return;

        const { beneficiary_code, sender_account_number } = req.body;

        if (!beneficiary_code || !sender_account_number) {
            return next(new ErrorResponse('beneficiary_code and sender_account_number are required', 400));
        }

        const result = await verifyDecentroBeneficiary({
            vendor,
            payload: { beneficiary_code, sender_account_number },
        });

        return res.status(200).json({
            status: true,
            message: 'Beneficiary verified successfully',
            data: result,
            responseCode: '000',
        });
    } catch (err) {
        customLog(req?.LogTraceId, 'error', { message: err?.message, data: err?.response?.data });
        return res.status(err?.response?.status || 400).json({
            status: false,
            message: err?.response?.data?.message || err?.message || 'Something went wrong. Please try again later.',
            data: {},
            responseCode: '001',
        });
    }
});

exports.modifyBeneficiary = asyncHandler(async (req, res, next) => {
    try {
        const vendor = await getVendor(req, next);
        if (!vendor) return;

        const { beneficiary_code, sender_account_number } = req.body;

        if (!beneficiary_code || !sender_account_number) {
            return next(new ErrorResponse('beneficiary_code and sender_account_number are required', 400));
        }

        const result = await modifyDecentroBeneficiary({
            vendor,
            payload: { beneficiary_code, sender_account_number },
        });

        return res.status(200).json({
            status: true,
            message: 'Beneficiary modified successfully',
            data: result,
            responseCode: '000',
        });
    } catch (err) {
        customLog(req?.LogTraceId, 'error', { message: err?.message, data: err?.response?.data });
        return res.status(err?.response?.status || 400).json({
            status: false,
            message: err?.response?.data?.message || err?.message || 'Something went wrong. Please try again later.',
            data: {},
            responseCode: '001',
        });
    }
});
