const CorporateUser = require("../../entities/corporateUser");

exports.updateWpsDocuments = async (userId, documents) => {
    if (!userId) {
        throw new Error('User ID is required');
    }
    try {
        const updatedUser = await CorporateUser.findByIdAndUpdate(userId, {
            $set: {
                'wps.registrationStatus': 'INPROGRESS',
                'wps.wpsDocuments': documents
            }
        }, { new: true });
        return updatedUser.wps;
    } catch (error) {
        throw new Error("Failed to update wps documents " + error.message);
    }
};
