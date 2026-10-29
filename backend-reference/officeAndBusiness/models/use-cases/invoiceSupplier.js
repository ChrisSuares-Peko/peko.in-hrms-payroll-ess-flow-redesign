const invoiceSuppliers = require('./../entities/invoiceSuppliers')
const asyncHandler = require('../../middlewares/async')
const corporateUser = require('../entities/corporateUser');
const credential = require('../entities/credential');
const { handleSortFields } = require('../../utils/sortHandle');
const { Op } = require("sequelize");
const { formattedDateTime ,capitalizeFirstLetter } = require('../../utils/formatter');

exports.createNewSupplier = asyncHandler(async (params) => {
    try {
        return await invoiceSuppliers.create(params)
    } catch (error) {
        return false
    }
})

exports.updateSupplier = asyncHandler(async (data, supplierCode) => {
    try {
        const [affectedCount] = await invoiceSuppliers.update(data, {
            where: {
                supplierCode: supplierCode
            }
        })
        return affectedCount > 0
    } catch (error) {
        return false
    }
})


exports.findOneInvoiceSupplier = asyncHandler(async (params) => {
    try {
        return await invoiceSuppliers.findOne({
            include: [{
                model: corporateUser,
                attributes: ['id', 'credentialId', 'name', 'email', 'mobileNo'],
                include: [{
                    model: credential,
                }]
            }],
            where: {
                corporateUserId: params.corporateUserId
            },
            attributes: ['id', 'supplierEmail', 'kybStatus', 'rejectReason', 'agreementDetails','businessType'],
            nest: true,
        })
    } catch (error) {
        console.log(error)
        return false
    }
})


exports.findCorporateUserWithDetails = async (params) => {
    try {

        if (!params || !params.corporateUserId) {
            throw new Error("CorporateUserId is required");
        }

        // Query the corporateUser model with related models
        const corporateUserData = await corporateUser.findOne({
            include: [
                {
                    model: credential,

                }
            ],
            where: {
                id: params.corporateUserId
            },
            attributes: ['id', 'name', 'email', 'mobileNo'],
            nest: true,
        });

        // If no corporateUser is found, return null or throw an error
        if (!corporateUserData) {
            throw new Error('Corporate user not found');
        }

        return corporateUserData;
    } catch (error) {
        console.error('Error fetching corporate user with details:', error.message);
        return false;
    }
};



exports.updateOneInvoiceSupplier = asyncHandler(async (params) => {
    const { supplierCode, rejectReason, status } = params

    const [affectedRows] = await invoiceSuppliers.update({
        kybStatus: status,
        rejectReason: rejectReason
    }, {
        where: { supplierCode: supplierCode }
    });

    if (affectedRows > 0) {
        // Retrieve the updated row
        const updatedRow = await invoiceSuppliers.findOne({
            include: [{
                model: corporateUser,
                attributes: ['id', 'credentialId', 'name', 'email', 'mobileNo'],
                include: [{
                    model: credential,
                }]
            }],
            where: { supplierCode: supplierCode },
            // raw: true,
            nest: true,
        });
        return updatedRow;
    } else {
        return null;
    }
})

exports.findAllInvoiceSuppliers = async (params) => {
    try {
        let { page, itemsPerPage, searchText, sort, sortField } = params
        let order = handleSortFields(sortField, sort)
        const searchPattern = `%${searchText}%`;
        // Prepare the where clause
        let whereClause = {
            [Op.or]: [
                {
                    supplierEmail: {
                        [Op.like]: searchPattern
                    }
                },
                {
                    kybStatus: {
                        [Op.like]: searchPattern
                    }
                },
                {
                    eSignStatus: {
                        [Op.like]: searchPattern
                    }
                },
                // Search in corporateUser fields
                {
                    '$corporateUser.name$': {
                        [Op.like]: searchPattern
                    }
                },
                {
                    '$corporateUser.mobileNo$': {
                        [Op.like]: searchPattern
                    }
                },
                // Search in credential fields
                {
                    '$corporateUser.credential.username$': {
                        [Op.like]: searchPattern
                    }
                }
            ]
        };

        let includeCondition = {
            model: corporateUser,
            attributes: ['id', 'name', 'mobileNo', 'credentialId'],
            include: [{
                model: credential,
                attributes: ['id', 'username']
            }]
        };

        return await invoiceSuppliers.findAndCountAll({
            include: [includeCondition],
            where: whereClause,
            order: order,
            limit: itemsPerPage,
            offset: (page - 1) * itemsPerPage,
            raw: true,
            nest: true,
        })
    } catch (error) {
        console.log({ error })
        return false
    }
}

exports.collectorKybExport = async (params) => {
    try {
        let { searchText, sort, sortField } = params
        let order = handleSortFields(sortField, sort)
        const searchPattern = `%${searchText}%`;
        // Prepare the where clause
        let whereClause = {
            [Op.or]: [{
                supplierCode: {
                    [Op.like]: searchPattern
                }
            }, {
                supplierEmail: {
                    [Op.like]: searchPattern
                }
            }, {
                kybStatus: {
                    [Op.like]: searchPattern
                }
            },
            {
                '$corporateUser.name$': {
                    [Op.like]: searchPattern
                }
            },
            {
                '$corporateUser.mobileNo$': {
                    [Op.like]: searchPattern
                }
            },
            // Search in credential fields
            {
                '$corporateUser.credential.username$': {
                    [Op.like]: searchPattern
                }
            }
            ]
        };

        let includeCondition = {
            model: corporateUser,
            attributes: ['id', 'name', 'mobileNo', 'credentialId'],
            include: [{
                model: credential,
                attributes: ['id', 'username'],
            }]
        };

        const data = await invoiceSuppliers.findAndCountAll({
            include: [includeCondition],
            where: whereClause,
            order: order,
            raw: true,
            nest: true,
        })
        let finalData = []

        data.rows.forEach(function (limitData) {
            finalData.push({
                Date: limitData.createdAt ? formattedDateTime(limitData.createdAt) : 'Not Available',
                "Corporate Name": limitData.corporateUser?.name ? limitData.corporateUser?.name : "Not Available",
                "Corporate ID": limitData.corporateUser ? limitData.corporateUser.credential.username : "Not Available",
                "Supplier Code": limitData.supplierCode ? limitData.supplierCode : "Not Available",
                "Email": limitData.supplierEmail ? limitData.supplierEmail : "Not Available",
                "Mobile Number": limitData.corporateUser ? limitData.corporateUser.mobileNo : "Not Available",
                "KYB Status": limitData.kybStatus ? capitalizeFirstLetter(limitData.kybStatus) : "Not Available",
            })
        })
        return finalData
    } catch (error) {
        console.log({ error })
        return false
    }

}

exports.updateSupplierStatus = asyncHandler(async (params) => {
    try {
        const { corporateId, kybStatus, rejectReason } = params

        const updateFields = {};
        if (kybStatus) updateFields.kybStatus = kybStatus;
        if (rejectReason) updateFields.rejectReason = rejectReason;

        const [affectedRows] = await invoiceSuppliers.update(
            updateFields, {
            where: { corporateUserId: corporateId }
        });

        const updatedRow = await invoiceSuppliers.findOne({
            include: [{
                model: corporateUser,
                attributes: ['id', 'credentialId', 'name', 'email', 'mobileNo'],
                include: [{
                    model: credential,
                }]
            }],
            where: { corporateUserId: corporateId },
            // raw: true,
            nest: true,
        });

        return { isUpdated: affectedRows > 0, supplierData: updatedRow }
    } catch (error) {
        console.log("🚀 ~ exports.updateSupplierStatus=asyncHandler ~ error:", error);
        return false
    }
})

exports.findAgreementToUpdate = asyncHandler(async ({ document_id, docket_id }) => {
    try {
        const agreement = await invoiceSuppliers.findOne({
            include: [
                {
                    model: corporateUser,
                    attributes: ['id', 'credentialId', 'name', 'email', 'mobileNo'],
                    include: [{
                        model: credential,
                    }]
                }
            ],
            where: {
                [Op.and]: [
                    { 'agreementDetails.document_id': document_id },
                    { 'agreementDetails.docket_id': docket_id }
                ]
            },
            nest: true
        });

        if (agreement) {
            return { status: true, data: agreement };
        } else {
            return { status: false, message: 'eSign document not found' };
        }
    } catch (error) {
        console.log({ error });
        return { status: false, message: 'Something went wrong while fetching the document' };
    }
});


exports.createOrUpdateSupplier = asyncHandler(async (params) => {
    try {
        const existingSupplier = await invoiceSuppliers.findOne({
            where: { corporateUserId: params.corporateUserId }
        });

        if (existingSupplier) {
            // Update the existing supplier
            const updatedSupplier = await invoiceSuppliers.update(
                { agreementDetails: params.agreementDetails },
                { where: { corporateUserId: params.corporateUserId } }
            );
            return updatedSupplier ? true : false;
        } else {
            // Create a new supplier if not found
            return await invoiceSuppliers.create(params);
        }
    } catch (error) {
        console.error('Error creating or updating supplier:', error);
        return false;
    }
});



exports.findSupplierByCorporateUserId = async (corporateUserId) => {
    try {
        const supplier = await invoiceSuppliers.findOne({
            where: { corporateUserId: corporateUserId }
        });

        return supplier;  // Will return the supplier if found, else null
    } catch (error) {
        console.error('Error finding supplier by corporateUserId:', error);
        return null;  // Return null if an error occurs
    }
};

exports.updateStatusFromWebhook = asyncHandler(async (corporateUserId, statusType) => {
    try {
        const result = await invoiceSuppliers.update(
            { kybStatus: statusType },
            { where: { corporateUserId } }
        );
        
        if (!result[0]) return false;
        return true
        
    } catch (error) {
        console.error("Error updating status:", error);

        throw new Error(error.message || "Failed to update status");
    }
});
