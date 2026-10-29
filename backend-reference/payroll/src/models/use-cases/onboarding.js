const Employee = require("../entities/employee");
const HrSettings = require("../entities/hrSettings");
const BankDetails = require("../entities/bankDetails");
const { addEmployeeBankDetails } = require("./bankDetails");

exports.getOnboardingDocumentsCatalog = async (corporateUserId) => {
    const existingHrSettings = await HrSettings.findOne({ corporateUser: corporateUserId });
    const catalog = existingHrSettings?.onboardingDocuments?.length
        ? existingHrSettings.onboardingDocuments
        : HrSettings.DEFAULT_ONBOARDING_DOCUMENTS;

    return catalog.filter(doc => doc.required);
};

// Upsert-by-key: replace any existing employeeDocuments entries matching the
// submitted keys, then push the new ones — mirrors updateMultipleDocuments'
// find-or-push loop but keyed by the stable catalog `key` instead of `name`.
exports.replaceEmployeeDocuments = async (employeeId, corporateUserId, docs) => {
    const employee = await Employee.findOne({
        _id: employeeId,
        corporateUser: corporateUserId,
        isEmployeeDeleted: false,
    });

    if (!employee) return null;

    for (const newDoc of docs) {
        const existingIndex = employee.employeeDocuments.findIndex(doc => doc.key === newDoc.key);
        if (existingIndex !== -1) {
            employee.employeeDocuments[existingIndex] = newDoc;
        } else {
            employee.employeeDocuments.push(newDoc);
        }
    }

    return await employee.save();
};

exports.upsertOnboardingBankDetails = async (employeeId, corporateUserId, bankDetailsData) => {
    return await addEmployeeBankDetails({
        employeeId,
        corporateUserID: corporateUserId,
        bankDetailsData: { ...bankDetailsData, isDefaultAccount: true },
    });
};

exports.updateOnboardingEmergencyContact = async (employeeId, corporateUserId, fields) => {
    return await Employee.findOneAndUpdate(
        { _id: employeeId, corporateUser: corporateUserId, isEmployeeDeleted: false },
        {
            $set: {
                'personalInformation.emergencyContactName': fields.emergencyContactName,
                'personalInformation.emergencyContactNo': fields.emergencyContactNo,
                'personalInformation.emergencyContactRelation': fields.emergencyContactRelation,
                isCompleted: true,
            },
        },
        { new: true }
    );
};

// Applies an approved profile-update-request onto the live employee doc; keys are personalInformation.* sub-field names.
exports.updateEmployeeProfileFields = async (employeeId, fields) => {
    const setObj = {};
    for (const [key, value] of Object.entries(fields)) {
        if (value !== undefined) setObj[`personalInformation.${key}`] = value;
    }
    if (Object.keys(setObj).length === 0) return null;

    return await Employee.findOneAndUpdate(
        { _id: employeeId, isEmployeeDeleted: false },
        { $set: setObj },
        { new: true }
    );
};

// Bank details live in a separate collection (keyed by employeeId) — updates the default account if one exists, else creates it.
exports.updateApprovedBankDetails = async (employeeId, corporateUserId, fields) => {
    const existing = await BankDetails.findOne({ employeeId, isDefaultAccount: true });

    if (existing) {
        Object.entries(fields).forEach(([key, value]) => {
            if (value !== undefined) existing[key] = value;
        });
        return await existing.save();
    }

    const result = await addEmployeeBankDetails({
        employeeId,
        corporateUserID: corporateUserId,
        bankDetailsData: { ...fields, isDefaultAccount: true },
    });
    return result.bankDetails;
};
