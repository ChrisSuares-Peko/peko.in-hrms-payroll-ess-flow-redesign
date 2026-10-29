'use strict';

const governmentServicesApplication = require('../entities/governmentServicesApplication');

// Resolves the application behind an engagement_id — used by callRm's shared
// (non-Business-Registration) path to find the applicant's own contact number
// (phoneNumber) to dial as the Exotel lead.
exports.findByVendorEngagementId = async (credentialId, vendorEngagementId) => {
  return await governmentServicesApplication.findOne({
    where: { credentialId, vendorEngagementId },
    order: [['createdAt', 'DESC']],
  });
};
