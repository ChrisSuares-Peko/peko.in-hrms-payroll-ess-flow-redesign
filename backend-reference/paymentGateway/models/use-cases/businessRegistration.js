'use strict';

const businessRegistration = require('../entities/businessRegistration');

exports.findApplicationById = async applicationId =>
    businessRegistration.findOne({ where: { applicationId } });

exports.markApplicationPaid = async (applicationId, data) => {
    const application = await businessRegistration.findOne({ where: { applicationId } });
    if (!application) throw new Error('Application not found');
    return application.update(data);
};
