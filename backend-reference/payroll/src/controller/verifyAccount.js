const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/error-response');
const { customLog } = require('../utils/loggerHelper');
const { validateCashfreeBankAccount } = require('../models/use-cases/verifyAccount');
const BankDetails = require('../models/entities/bankDetails');
const { filterEmployeesOfCorporate } = require('../utils/tenantScope');


exports.bulkVerifyAccounts = asyncHandler(async (req, res, next) => {
    try {
        const { employeeIds } = req.body;

        if (!Array.isArray(employeeIds) || employeeIds.length === 0)
            return next(new ErrorResponse('employeeIds array is required', 400));

        const ownedEmployeeIds = new Set((await filterEmployeesOfCorporate(employeeIds, req.user._id)).map(String));

        const results = await Promise.all(employeeIds.map(async (employeeId) => {
            try {
                if (!ownedEmployeeIds.has(String(employeeId)))
                    return { employeeId, success: false, message: 'Employee not found' };

                const bankDetails = await BankDetails.findOne({ employeeId, isDefaultAccount: true });

                if (!bankDetails || !bankDetails.accountNumber || !bankDetails.ifscCode)
                    return { employeeId, success: false, message: 'No valid bank details found' };

                const result = await validateCashfreeBankAccount({
                    payload: {
                        beneficiary_details: {
                            account_number: bankDetails.accountNumber,
                            ifsc: bankDetails.ifscCode,
                        },
                    },
                });

                bankDetails.bankAccountStatus = result?.accountValid ? 'Completed' : 'Failed';
                await bankDetails.save();

                return {
                    employeeId,
                    success: result?.accountValid === true,
                    message: result?.message,
                    bankAccountStatus: bankDetails.bankAccountStatus,
                    data: result,
                };
            } catch (err) {
                console.log("errrro is here")
                console.log(err?.message, `Error verifying bank account for employee ${employeeId}`);
                customLog(null, 'error', { message: `Error verifying bank account for employee ${employeeId}`, error: err.message });
                return { employeeId, success: false, message: err.message };
            }
        }));

        const succeeded = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;

        return res.status(200).json({
            status: failed === 0,
            message: `Bulk verification complete: ${succeeded} succeeded, ${failed} failed`,
            data: {
                summary: { total: results.length, succeeded, failed },
                results,
            },
            responseCode: failed === 0 ? '000' : '001',
        });
    } catch (err) {
        customLog(req?.LogTraceId, 'error', { message: err?.message, data: err?.response?.data });
        return res.status(err?.response?.status || 500).json({
            status: false,
            message: err?.message || 'Something went wrong. Please try again later.',
            data: {},
            responseCode: '001',
        });
    }
});

exports.verifyAccount = asyncHandler(async (req, res, next) => {
    try {
        const {
            perform_name_match,
            beneficiary_details,
        } = req.body;

        if (!beneficiary_details?.account_number || !beneficiary_details?.ifsc) {
            return next(new ErrorResponse('beneficiary_details with account_number and ifsc are required', 400));
        }

        const payload = {
            perform_name_match,
            beneficiary_details,
        };

        const result = await validateCashfreeBankAccount({ payload });

        return res.status(200).json({
            status: true,
            message: result?.message || 'Bank account verified successfully',
            data: result,
            responseCode: result?.valid ? '000' : '001',
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
