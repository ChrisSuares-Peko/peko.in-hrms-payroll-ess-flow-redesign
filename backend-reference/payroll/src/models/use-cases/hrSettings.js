const HrSettings = require("../entities/hrSettings");
const CorporateUser = require('../entities/corporateUser');
const OrganizationSettings = require("../entities/organizationSettings");


exports.findOneHrSettings = async (corporateUserId) => {
    try {
        return await OrganizationSettings.findOne({ corporateUser: corporateUserId })
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
        return await HrSettings.find({ corporateUser })
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

exports.updateHrSetting = async (corporateUserID, hrSettingsData) => {
    try {
        return await HrSettings.findOneAndUpdate(
            { corporateUser: corporateUserID },
            hrSettingsData,
            { new: true }
        );
    } catch (error) {
        console.log(error);
        return error;
    }
};

exports.hrSettingsUpdate = async (corporateUserID, hrSettingsData) => {
    try {
        return await HrSettings.findOneAndUpdate(
            { corporateUser: corporateUserID },
            hrSettingsData,
            { new: true }
        );
    } catch (error) {
        console.log(error);
        return error;
    }
};

exports.updateExistingHrSettings = async (corporateUserID, hrSettingsData) => {
    try {
        return await HrSettings.findOneAndUpdate(
            { corporateUser: corporateUserID },
            hrSettingsData,
            { new: true }
        );
    } catch (error) {
        console.log(error);
        return error;
    }
};

exports.updateOnboardingDocuments = async (corporateUserID, onboardingDocuments) => {
    try {
        return await HrSettings.findOneAndUpdate(
            { corporateUser: corporateUserID },
            { $set: { onboardingDocuments }, $setOnInsert: { corporateUser: corporateUserID } },
            { new: true, upsert: true }
        );
    } catch (error) {
        console.log(error);
        return error;
    }
};

exports.updateGracePeriod = async (corporateUserID, gracePeriodMinutes) => {
    try {
        return await HrSettings.findOneAndUpdate(
            { corporateUser: corporateUserID },
            { $set: { gracePeriodMinutes }, $setOnInsert: { corporateUser: corporateUserID } },
            { new: true, upsert: true }
        );
    } catch (error) {
        console.log(error);
        return error;
    }
};

exports.updateCheckInOutStatus = async (corporateUserID, checkInOutEnabled) => {
    try {
        return await HrSettings.findOneAndUpdate(
            { corporateUser: corporateUserID },
            { $set: { checkInOutEnabled }, $setOnInsert: { corporateUser: corporateUserID } },
            { new: true, upsert: true }
        );
    } catch (error) {
        console.log(error);
        return error;
    }
};

exports.updateDefaultWorkSchedule = async (corporateUserID, defaultWorkSchedule) => {
    try {
        return await HrSettings.findOneAndUpdate(
            { corporateUser: corporateUserID },
            { $set: { defaultWorkSchedule }, $setOnInsert: { corporateUser: corporateUserID } },
            { new: true, upsert: true }
        );
    } catch (error) {
        console.log(error);
        return error;
    }
};

exports.updateWpsFields = async (corporateUserID, body) => {
    try {
        let wpsUpdate = {
            // Define the update object for the nested fields within the 'wps' object
            $set: {
                'wps.employerReference': body.employerReference,
                'wps.employerRoutingCode': body.employerRoutingCode,
                'wps.employerId': body.employerId
            }
        };

        return await CorporateUser.findOneAndUpdate({ _id: corporateUserID }, wpsUpdate, { new: true });
    } catch (error) {
        console.log(error);
        return error;
    }
};