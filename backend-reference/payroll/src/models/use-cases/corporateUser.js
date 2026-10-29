const CorporateUser = require("../entities/corporateUser");



exports.updateWpsDocuments = async (userId, documents) => {
    try {
        const updatedUser = await CorporateUser.findByIdAndUpdate(userId, {
            $set: {
                'wps.registrationStatus': 'INPROGRESS',
                'wps.wpsDocuments': documents
            }
        }, { new: true });
        console.log({ updatedUser })
        return updatedUser.wps;
    } catch (error) {
        throw new Error("Failed to update wps documents " + error.message);
    }
};

exports.updateCorporateUserEmail = async (userId, email) => {
    try {
        const updatedCorporateUser = await CorporateUser.findByIdAndUpdate(
            userId,
            { email },
            { new: true }
        );

        return updatedCorporateUser;
    } catch (error) {
        return error
    }
}