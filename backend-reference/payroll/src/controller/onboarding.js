const asyncHandler = require("../middleware/async");
const Employee = require("../models/entities/employee");
const {
    getOnboardingDocumentsCatalog,
    replaceEmployeeDocuments,
    upsertOnboardingBankDetails,
    updateOnboardingEmergencyContact,
} = require("../models/use-cases/onboarding");

exports.getRequiredOnboardingDocuments = asyncHandler(async (req, res) => {
    const employeeId = req.user._id;
    const employee = await Employee.findOne({ _id: employeeId, isEmployeeDeleted: false }, ['corporateUser']);

    if (!employee) {
        return res.status(404).json({
            status: false,
            responseCode: '001',
            message: 'Employee profile not found',
            data: {},
        });
    }

    const requiredDocuments = await getOnboardingDocumentsCatalog(employee.corporateUser);

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'Retrieved required onboarding documents successfully',
        data: { requiredDocuments },
    });
});

exports.submitOnboardingDocuments = asyncHandler(async (req, res, next) => {
    const employeeId = req.user._id;
    const { employeeDocuments } = req.body;

    if (!Array.isArray(employeeDocuments) || !employeeDocuments.length) {
        return res.status(400).json({
            status: false,
            responseCode: '001',
            message: 'employeeDocuments must be a non-empty array',
            data: {},
        });
    }

    const employee = await Employee.findOne({ _id: employeeId, isEmployeeDeleted: false }, ['corporateUser']);
    if (!employee) {
        return res.status(404).json({
            status: false,
            responseCode: '001',
            message: 'Employee profile not found',
            data: {},
        });
    }

    const updated = await replaceEmployeeDocuments(employeeId, employee.corporateUser, employeeDocuments);
    if (!updated) {
        return next(new Error('Failed to save onboarding documents'));
    }

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'Onboarding documents submitted successfully',
        data: { employeeDocuments: updated.employeeDocuments },
    });
});

exports.submitOnboardingBank = asyncHandler(async (req, res) => {
    const employeeId = req.user._id;
    const { accountName, bankName, accountNumber, ifscCode, upiId } = req.body;

    const employee = await Employee.findOne({ _id: employeeId, isEmployeeDeleted: false }, ['corporateUser']);
    if (!employee) {
        return res.status(404).json({
            status: false,
            responseCode: '001',
            message: 'Employee profile not found',
            data: {},
        });
    }

    const result = await upsertOnboardingBankDetails(employeeId, employee.corporateUser, {
        accountName,
        bankName,
        accountNumber,
        ifscCode,
        upiId,
    });

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'Bank details submitted successfully',
        data: result.bankDetails,
    });
});

exports.submitOnboardingEmergency = asyncHandler(async (req, res) => {
    const employeeId = req.user._id;
    const { emergencyContactName, emergencyContactNo, emergencyContactRelation } = req.body;

    const employee = await Employee.findOne({ _id: employeeId, isEmployeeDeleted: false }, ['corporateUser']);
    if (!employee) {
        return res.status(404).json({
            status: false,
            responseCode: '001',
            message: 'Employee profile not found',
            data: {},
        });
    }

    const updated = await updateOnboardingEmergencyContact(employeeId, employee.corporateUser, {
        emergencyContactName,
        emergencyContactNo,
        emergencyContactRelation,
    });

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'Emergency contact submitted successfully',
        data: { personalInformation: updated.personalInformation, isCompleted: updated.isCompleted },
    });
});
