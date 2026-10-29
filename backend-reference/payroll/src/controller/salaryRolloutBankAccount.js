const Joi = require('joi');
const asyncHandler = require('../middleware/async');
const OrganizationSettings = require('../models/entities/organizationSettings');
const {
    findAllByCorporateUser,
    createOne,
    updateById,
    deleteById,
    setPrimary: setPrimaryUseCase,
    findById,
    findDuplicateByAccount,
} = require('../models/use-cases/salaryRolloutBankAccount');
const ErrorResponse = require('../utils/error-response');

const accountSchema = Joi.object({
    accountHolderName: Joi.string().required(),
    bankName: Joi.string().required(),
    accountNumber: Joi.string().required(),
    ifscCode: Joi.string().required(),
    accountType: Joi.string().valid('savings', 'current').required(),
    branch: Joi.string().allow('', null).optional(),
});

const normalizeAccountNumber = (value) => String(value || '').trim();
const normalizeIfscCode = (value) => String(value || '').trim().toUpperCase();

const isDuplicateOfPayrollSettingsBank = async (corporateUserId, accountNumber, ifscCode) => {
    const organizationSettings = await OrganizationSettings.findOne({ corporateUser: corporateUserId });
    const bankDetails = organizationSettings?.bankDetails;

    if (!bankDetails?.accountNumber || !bankDetails?.ifscCode) {
        return false;
    }

    return (
        normalizeAccountNumber(bankDetails.accountNumber) === accountNumber &&
        normalizeIfscCode(bankDetails.ifscCode) === ifscCode
    );
};

const ensureUniqueBankAccount = async (corporateUserId, accountNumber, ifscCode, excludeId) => {
    const existingBank = await findDuplicateByAccount(corporateUserId, accountNumber, ifscCode, excludeId);
    const existingPayrollSettingsBank = await isDuplicateOfPayrollSettingsBank(
        corporateUserId,
        accountNumber,
        ifscCode
    );

    if (existingBank || existingPayrollSettingsBank) {
        throw new ErrorResponse('Bank account already exists', 400);
    }
};

exports.listAccounts = asyncHandler(async (req, res) => {
    const corporateUserId = req.user._id;

    const data = await findAllByCorporateUser(corporateUserId);

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'Salary rollout bank accounts fetched successfully',
        data,
    });
});

exports.addAccount = asyncHandler(async (req, res) => {
    const corporateUserId = req.user._id;

    await accountSchema.validateAsync(req.body);

    const { accountHolderName, bankName, accountNumber, ifscCode, accountType, branch } = req.body;
    const normalizedAccountNumber = normalizeAccountNumber(accountNumber);
    const normalizedIfscCode = normalizeIfscCode(ifscCode);

    await ensureUniqueBankAccount(corporateUserId, normalizedAccountNumber, normalizedIfscCode);

    const existing = await findAllByCorporateUser(corporateUserId);
    const isPrimary = existing.length === 0;

    const data = await createOne({
        corporateUser: corporateUserId,
        accountHolderName,
        bankName,
        accountNumber: normalizedAccountNumber,
        ifscCode: normalizedIfscCode,
        accountType,
        branch: branch || null,
        isPrimary,
    });

    return res.status(201).json({
        status: true,
        responseCode: '000',
        message: 'Bank account added successfully',
        data,
    });
});

exports.updateAccount = asyncHandler(async (req, res) => {
    const corporateUserId = req.user._id;
    const { id } = req.params;

    await accountSchema.validateAsync(req.body);

    const account = await findById(id);
    if (!account || String(account.corporateUser) !== String(corporateUserId)) {
        throw new ErrorResponse('Bank account not found', 404);
    }

    const { accountHolderName, bankName, accountNumber, ifscCode, accountType, branch } = req.body;
    const normalizedAccountNumber = normalizeAccountNumber(accountNumber);
    const normalizedIfscCode = normalizeIfscCode(ifscCode);

    await ensureUniqueBankAccount(corporateUserId, normalizedAccountNumber, normalizedIfscCode, id);

    const data = await updateById(id, {
        accountHolderName,
        bankName,
        accountNumber: normalizedAccountNumber,
        ifscCode: normalizedIfscCode,
        accountType,
        branch: branch || null,
    });

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'Bank account updated successfully',
        data,
    });
});

exports.deleteAccount = asyncHandler(async (req, res) => {
    const corporateUserId = req.user._id;
    const { id } = req.params;

    const account = await findById(id);
    if (!account || String(account.corporateUser) !== String(corporateUserId)) {
        throw new ErrorResponse('Bank account not found', 404);
    }

    await deleteById(id);

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'Bank account deleted successfully',
        data: {},
    });
});

exports.setPrimary = asyncHandler(async (req, res) => {
    const corporateUserId = req.user._id;
    const { id } = req.params;

    const account = await findById(id);
    if (!account || String(account.corporateUser) !== String(corporateUserId)) {
        throw new ErrorResponse('Bank account not found', 404);
    }

    const data = await setPrimaryUseCase(id, corporateUserId);

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'Primary bank account updated successfully',
        data,
    });
});
