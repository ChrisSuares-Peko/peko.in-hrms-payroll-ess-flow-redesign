const asyncHandler = require('../../middlewares/async')
const {
    Op
} = require("sequelize");
const credential = require('../entities/credential');
const corporateTaxRegistration = require('../entities/corporateTaxRegistration');
const { handleSortFields } = require('../../utils/sortHandle');
const { formattedDateTime, capitalizeFirstLetter } = require('../../utils/formatter');
const { customLog } = require('../../utils/loggerHelper');


exports.findAllCorporateTaxRegistration = async (params, userId = false, attributes = undefined) => {
    try {
        let { page, itemsPerPage, searchText, sort, sortField,from,to, subCorporateUserId } = params
        let order = handleSortFields(sortField,sort)
        const searchPattern = `%${searchText}%`;
        // Prepare the where clause
        let whereClause = {
            [Op.or]: [{
                companyName: {
                    [Op.like]: searchPattern
                }
            }, {
                contactPerson: {
                    [Op.like]: searchPattern
                }
            }, {
                email: {
                    [Op.like]: searchPattern
                }
            },
            {
                '$credential.name$': {
                    [Op.like]: searchPattern
                }
            },
            { status: { [Op.like]: searchPattern } },
            {
                '$credential.username$': {
                    [Op.like]: searchPattern
                }
            }]
        };

        // If userId is available, add it to the where clause
        if (userId) {
            whereClause.credentialId = userId;
        }
        
        if (from && to) {
            whereClause.createdAt = {
                [Op.between]: [new Date(from), new Date(new Date(to).setHours(23, 59, 59, 999))]
            };
        }

        if (subCorporateUserId) {
            whereClause.subCorporateUserId = subCorporateUserId;
        }
        return await corporateTaxRegistration.findAndCountAll({
            attributes,
            include: [{
                model: credential,
                attributes: ['id', 'name', 'username']
            }],
            where: whereClause,
            order: order,
            limit: itemsPerPage,
            offset: (page - 1) * itemsPerPage,
            raw: true,
            nest: true,
        })
    } catch (error) {
        customLog(null, 'error', { error: error.message });
        return false
    }

}
exports.corporateTaxRegistrationExport = async (params, userId = false) => {
    try {
        let { searchText, sort, sortField,from,to } = params
        let order = handleSortFields(sortField,sort)
        const searchPattern = `%${searchText}%`;
        // Prepare the where clause
        let whereClause = {
            [Op.or]: [{
                companyName: {
                    [Op.like]: searchPattern
                }
            }, {
                contactPerson: {
                    [Op.like]: searchPattern
                }
            }, {
                email: {
                    [Op.like]: searchPattern
                }
            },
            {
                '$credential.name$': {
                    [Op.like]: searchPattern
                }
            },
            {
                '$credential.username$': {
                    [Op.like]: searchPattern
                }
            }]
        };

        // If userId is available, add it to the where clause
        if (userId) {
            whereClause.credentialId = userId;
        }
        if (from && to) {
            whereClause.createdAt = {
                [Op.between]: [new Date(from), new Date(new Date(to).setHours(23, 59, 59, 999))]
            };
        }
        const data = await corporateTaxRegistration.findAndCountAll({
            include: [{
                model: credential,
                attributes: ['id', 'name', 'username']
            }],
            where: whereClause,
            order: order,
            raw: true,
            nest: true,
        })
        let finalData = []
        data.rows.forEach(function (limitData) {
            // let tradeLicenses = "";
            // if (limitData.tradeLicenseDoc.length) {
            //     limitData.tradeLicenseDoc.forEach((license, i) => {
            //         const key = `tradeLicenseDoc_${i+1}`;
            //         if (license[key]) {
            //             tradeLicenses += `${license[key]},`;
            //         }
            //     });
            //     // Remove the trailing comma
            //     tradeLicenses = tradeLicenses.slice(0, -1);
            // } else {
            //     tradeLicenses = "Not Available";
            // }
            finalData.push({
                Date: limitData.createdAt ? formattedDateTime(limitData.createdAt) : 'Not Available',
                "Company Name": limitData.companyName ? limitData.companyName : "Not Available",
                "Corporate Name": limitData.credential?.name ? limitData.credential?.name : "Not Available",
                "Corporate ID": limitData.credential?.username ? limitData.credential?.username : "Not Available",
                "Contact Person": limitData.contactPerson ? limitData.contactPerson : "Not Available",
                // "Trade License": tradeLicenses,
                // "Corporate Governance": limitData.corporateGovernanceDoc ? limitData.corporateGovernanceDoc : "Not Available",
                // "Emirates ID": limitData.emiratesIDDoc ? limitData.emiratesIDDoc : "Not Available",
                // "Passport": limitData.passportDoc ? limitData.passportDoc : "Not Available",
                // "Tax Period": limitData.taxPeriod ? limitData.taxPeriod : "Not Available",
                "Email ID": limitData.email ? limitData.email : "Not Available",
                // "Mobile Number": limitData.phoneNumber ? limitData.phoneNumber : "Not Available",
                Status: limitData.status ? capitalizeFirstLetter(limitData.status) : "Not Available",
            })
        })
        return finalData
    } catch (error) {
        customLog(null, 'error', { error: error.message });
        return false
    }

}

exports.updateRegistration = asyncHandler(async (registrationId, data) => {
    return await corporateTaxRegistration.update(data, {
        where: {
            id: registrationId
        }
    })

})

exports.findOneRegistration = asyncHandler(async (registrationId) => {

    return await corporateTaxRegistration.findOne({
        where: {
            id: registrationId
        }, 
        include: [{
            model: credential,
            attributes: ['id', 'name', 'username', 'registeredBy']
        }],
        raw: true,
        nest: true,
    });

})


exports.createCorporateTaxRegistration = asyncHandler(async (params, serviceDetails) => {
    try {
        let { vendor: { optional1 } } = serviceDetails
        // Check if optional1 exists and is a valid number
        if (!optional1 || isNaN(parseFloat(optional1))) {
            return false;
        }
        const serviceAmount = parseFloat(optional1);
        const quantity = params?.quantity || 0
        const amount = params?.amount || 0

        let calculatedAmount = serviceAmount * quantity
        console.log({ serviceAmount, calculatedAmount, amount, quantity })
        if (calculatedAmount !== amount) {
            return false;
        }
    
    
        const res = await corporateTaxRegistration.create(params)
        if (!res) {
            return false;
        }
        return res
    } catch (error) {
        console.log({ error })
        return false;
    }
})

exports.findOneCorporateTaxRegistration = asyncHandler(async (credentialId) => {
    try {
        let data = await corporateTaxRegistration.findOne({
            where: {
                credentialId: credentialId
            }
        });
        if (data) {
            return data
        } else {
            return false
        }

    } catch (error) {
        return false
    }
})

exports.updateCorporateTaxRegistration = asyncHandler(async (id, params) => {
    try {
        params['status'] = 'PENDING'
        // Update the corporate tax registration record with the given id
        const updatedRegistration = await corporateTaxRegistration.update(params, {
            where: { id: id }
        });

        // Check if any record was updated
        if (updatedRegistration[0] === 1) {
            return true; // Return true if successfully updated
        } else {
            return false; // Return false if record with the given id was not found
        }
    } catch (error) {
        console.error("Error updating corporate tax registration:", error);
        return false; // Return false if any error occurred during the update process
    }
});