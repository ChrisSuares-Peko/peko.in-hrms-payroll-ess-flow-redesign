const HrSettings = require("../../entities/payroll/hrSettings");



exports.findOneHrSettings = async (corporateUserId) => {

    try {
        return await HrSettings.findOne({ corporateUser: corporateUserId })
            .populate('corporateUser');

    } catch (error) {
        return error
    }
};

exports.restrictPayrollSettings = async (corporateUserID) => {

    try {
        return await HrSettings.findOneAndUpdate(
            { corporateUser: corporateUserID },
            {
                'payrollSettings.isEditable': false // Setting isEditable to false
            },
            { new: true }
        );

    } catch (error) {
        return error
    }
};

exports.getHrsettings = async (corporateUser) => {
    try {
        return await HrSettings.find({corporateUser})
    } catch (error) {
        return error;
    }
}

exports.getHrSettingsUsingCorporateId = async (corporateUser) => {
    try {
        return await HrSettings.find({
            corporateUser,
            $and: [
                { "payrollSettings.organizationWorkingDays": { $exists: true, $ne: null } },
                { "payrollSettings.salaryCycleDay": { $exists: true, $ne: null } },
                { "payrollSettings.payrollStartsFrom": { $exists: true, $ne: null } },
                { "officialDocuments.hrManagerName": { $exists: true, $ne: null } },
                { "officialDocuments.hrManagerSignature": { $exists: true, $ne: null } },
                { "officialDocuments.companyOfficialStamp": { $exists: true, $ne: null } }
            ]
        });
    } catch (error) {
        return error;
    }
}