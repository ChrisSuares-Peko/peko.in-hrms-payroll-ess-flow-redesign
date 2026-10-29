'use strict';

const companyIncorporation = require('../entities/companyIncorporation');

exports.updateApplicationStatus = async (applicationId, statusData) => {
    const application = await companyIncorporation.findOne({ where: { applicationId } });
    if (!application) throw new Error('Application not found');
    return await application.update(statusData);
};
