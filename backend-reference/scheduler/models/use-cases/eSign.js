const asyncHandler = require('../../middlewares/async');
const eSign = require('../entities/eSign');
const { Op } = require("sequelize");



exports.findESignDoc = asyncHandler(async () => {
    try {
        const currentDate = new Date();

        const eSignDoc = await eSign.findAll({
            attributes: [
                'docket_title',
                'expiry_date',
                'reminder_interval',
                'reminder',
                'status',
                'createdAt',
                'signers_info',
                'credentialId'
            ],
            where: {
                status: 'PENDING',
                expiry_date: {
                    [Op.gt]: currentDate // Filter  with non-expired dates at the database level
                },
                reminder: true // Filter  where reminder is true
            },
            raw: true // ensures the result is a plain JavaScript object
        });

        return { status: true, data: eSignDoc };

    } catch (error) {
        console.error("Error fetching eSign documents:", error);
        return { status: false, message: 'Something went wrong while fetching the document' };
    }
});
exports.findESignDocToDelete = asyncHandler(async () => {
    try {
        const currentDate = new Date();
        const eSignDoc = await eSign.findAll({
            attributes: [
                'docket_title',
                'expiry_date',
                'reminder_interval',
                'reminder',
                'status',
                'createdAt',
                'signers_info',
                'doc_expiry_date',
                'document_url',
                'audit_trail_url',
                'id'
            ],
            where: {
                status: 'COMPLETED',
                doc_expiry_date: {
                    [Op.lt]: currentDate 
                },
                [Op.or]: [
                    { document_url: { [Op.ne]: null } },
                    { audit_trail_url: { [Op.ne]: null } }
                ]
            },
            raw: true 
        });    
   
        return { status: true, data: eSignDoc };
    } catch (error) {
        console.error("Error deleting eSign documents:", error);
        return { status: false, message: 'Something went wrong while processing the document deletion' };
    }
});

