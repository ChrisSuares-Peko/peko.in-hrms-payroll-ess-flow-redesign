const partnerServiceAccess = require('../entities/partnerServiceAccess');

exports.findPartnerServiceAccess = async (partnerId, attributes = undefined) =>
    partnerServiceAccess.findOne({
        where: {
            partnerId,
            status: true,
        },
        attributes,
        raw: true,
        nest: true,
    });
