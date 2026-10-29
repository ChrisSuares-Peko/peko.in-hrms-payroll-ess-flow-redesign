/* eslint-disable no-unused-vars */
const pkgModel = require('./../entities/package')
const Sequelize = require('sequelize')
const sequelizeConfig = require('../../configs/database/index')
const {
    Op
} = require("sequelize");
const asyncHandler = require('./../../middlewares/async');
const { PACKAGE_COMMISSION, reviewedChange } = require('../../utils/configuredFlag')
const { applyCommissionMarkup } = require('../../utils/applyCommissionMarkup')

const SERVICE_PACKAGE_TYPE = '2'
const cashback = require('../entities/cashback');
const { formattedDateTime, formatNumberWithLocalString } = require('../../utils/formatter');
const { handleSortFields } = require('../../utils/sortHandle');
const sequelize = require("../../configs/database/index");
const partnerPermission = require('../entities/partnerPermission');
const serviceOperator = require('../entities/serviceOperator');

exports.createPackage = asyncHandler(async (params) => {
    try {
        return await pkgModel.create(params)
    } catch (error) {
        console.log(error.message)
    } finally {
        console.log("PACKAGE CREATE ROUTE CALLED")
    }
});

exports.findPackageCashback = asyncHandler(async (id) => {
    try {
        return await cashback.findAll({
            where: {
                packageId: id
            },
            raw: true
        })
    } catch (error) {
        console.log(error)
    } finally {
        console.log("PACKAGE ASSOCIATED WITH CASHBACK ROUTE CALLED")
    }
})

exports.findAllActivePackage = async (attributes = undefined, partnerId, excludeBasic = false, excludeServicePackages = false) => {
    try {
        let whereClause = {
            status: true
        }
        if (partnerId === "default") {
            whereClause.partnerId = null;
        } else if (!partnerId) {
            delete whereClause.partnerId;
        } else {
            whereClause.partnerId = partnerId;
        }
        if (excludeServicePackages) {
            whereClause.type = '1';
        }
        if (excludeBasic) {
            // The basic plan is a regular package: service packages (type '2') are never dropped by it.
            const basicPriority = await pkgModel.min('priorityLevel', {
                where: { type: { [Op.ne]: '2' }, ...whereClause, priorityLevel: { [Op.ne]: null } },
            });
            whereClause[Op.and] = [
                {
                    [Op.or]: [
                        { type: '2' },
                        { priorityLevel: { [Op.or]: [{ [Op.ne]: basicPriority }, { [Op.eq]: null }] } },
                    ],
                },
            ];
        }
        return await pkgModel.findAll({
            where: whereClause,
            raw: true,
            attributes,
            order: [['packageName', 'ASC']],
        })
    } catch (error) {
       
        return false
    } 
}


exports.deletePackage = async (params) => {
    try {

        return await pkgModel.destroy({
            where: {
                id: params.id
            }
        })
    } catch (error) {
        console.log(error.message.message)
    } finally {
        console.log("PAKAGE DELETE ROUTE CALLED")
    }
}

exports.findAllPackagesCount = asyncHandler(async (params) => {
    try {
        let {
            limit,
            offset,
            searchText,
            sort,
            sortField,
            partnerId,
            type,
            isAdmin = false,
        } = params;

        const allowedSortFields = [
            "id",
            "packageName",
            "createdAt",
            "priorityLevel",
            "packageType",
            "status",
        ];

        const safeSortField = allowedSortFields.includes(sortField)
            ? sortField
            : "id";

        const safeSort = sort === "ASC" ? "ASC" : "DESC";

        const orderClause = `packages.${safeSortField} ${safeSort}`;

        let whereClause = `
        WHERE 
          (
            packages.id LIKE :searchText OR 
            packages.packageName LIKE :searchText OR
            packages.packageType LIKE :searchText OR
            packages.accessCode LIKE :searchText OR
            packages.priorityLevel LIKE :searchText OR
            packages.packagePrices LIKE :searchText OR
            credentials.name LIKE :searchText
          )
          AND packages.type = :type
      `;

        if (partnerId === "default") {
            whereClause += ` AND packages.partnerId IS NULL`;
        } else if (partnerId) {
            whereClause += ` AND packages.partnerId = :partnerId`;
        }

        const query = `
        SELECT 
          packages.*,
          credentials.name AS partnerName
        FROM packages
        LEFT JOIN credentials 
          ON packages.partnerId = credentials.id
        ${whereClause}
        ORDER BY ${orderClause}
        LIMIT :limit
        OFFSET :offset;
      `;

        const replacements = {
            searchText: `%${searchText || ""}%`,
            limit: parseInt(limit, 10) || 10,
            offset: parseInt(offset, 10) || 0,
            type,
        };

        if (partnerId && partnerId !== "default") {
            replacements.partnerId = partnerId;
        }

        const data = await sequelizeConfig.query(query, {
            replacements,
            type: Sequelize.QueryTypes.SELECT,
        });

        const countQuery = `
        SELECT COUNT(*) AS totalCount
        FROM packages
        LEFT JOIN credentials 
          ON packages.partnerId = credentials.id
        ${whereClause};
      `;
        const totalCountResult = await sequelizeConfig.query(countQuery, {
            replacements,
            type: Sequelize.QueryTypes.SELECT,
        });

        if (String(type) === SERVICE_PACKAGE_TYPE) {
            await applyCommissionMarkup(data, "packagePrices.monthly", null, isAdmin, "packagePrices.monthlyTotalCommission");
            await applyCommissionMarkup(data, "packagePrices.annually", null, isAdmin, "packagePrices.annuallyTotalCommission");
        }

        return {
            rows: data,
            count: totalCountResult[0].totalCount,
        };
    } catch (error) {
        console.log(error);
        throw { message: "Something went wrong" };
    }
});

exports.packagesAndCountExport = asyncHandler(async (params) => {
    try {
        let { searchText, sort, sortField, partnerId, packageType } = params;

        const allowedSortFields = [
            "id",
            "packageName",
            "createdAt",
            "priorityLevel",
            "packageType",
            "status"
        ];

        const safeSortField = allowedSortFields.includes(sortField)
            ? sortField
            : "id";

        const safeSort = sort === "ASC" ? "ASC" : "DESC";

        const orderClause = `packages.${safeSortField} ${safeSort}`;

        let whereClause = `
        WHERE 
          (
            packages.id LIKE :searchText OR 
            packages.packageName LIKE :searchText OR
            packages.description LIKE :searchText OR
            packages.serviceList LIKE :searchText OR
            packages.packageType LIKE :searchText OR
            packages.accessCode LIKE :searchText OR
            packages.priorityLevel LIKE :searchText OR
            packages.packagePrices LIKE :searchText OR
            credentials.name LIKE :searchText
          )
          AND packages.type = :packageType
      `;

        if (partnerId === "default") {
            whereClause += ` AND packages.partnerId IS NULL`;
        } else if (partnerId) {
            whereClause += ` AND packages.partnerId = :partnerId`;
        }

        const query = `
        SELECT 
          packages.*,
          credentials.name AS partnerName
        FROM packages
        LEFT JOIN credentials 
          ON packages.partnerId = credentials.id
        ${whereClause}
        ORDER BY ${orderClause}
      `;

        const replacements = {
            searchText: `%${searchText || ""}%`,
            packageType,
        };

        if (partnerId && partnerId !== "default") {
            replacements.partnerId = partnerId;
        }

        const data = await sequelizeConfig.query(query, {
            replacements,
            type: Sequelize.QueryTypes.SELECT,
        });

        let finalData = []

        data.forEach((limitData) => {
            let prices = {};

            try {
                prices =
                    typeof limitData.packagePrices === "string"
                        ? JSON.parse(limitData.packagePrices)
                        : limitData.packagePrices || {};
            } catch {
                prices = {};
            }

            finalData.push({
                Date: limitData.createdAt
                    ? formattedDateTime(limitData.createdAt)
                    : "Not Available",
                "Package Name": limitData.packageName || "Not Available",
                "Partner Name": limitData.partnerName || "Not Available",
                "Monthly Price": prices.monthly
                    ? "₹ " + formatNumberWithLocalString(prices.monthly)
                    : "0.00",
                "Annual Price": prices.annually
                    ? "₹ " + formatNumberWithLocalString(prices.annually)
                    : "0.00",
                "Priority Level": limitData.priorityLevel || "Not Available",
                Status: limitData.status > 0 ? "Active" : "In Active",
            })
        })
        return finalData
    } catch (error) {
        console.log(error);
        throw { message: "Something went wrong" };
    }
})


exports.getExcelCSVData = asyncHandler(async () => {

    const data = await pkgModel.findAndCountAll({
        order: [
            ['createdAt', 'DESC']
        ],
        raw: true,
        nest: true
    })

    let finalData = []
    data.rows.forEach(function (packageData) {
        finalData.push({
            'ID': packageData.id,
            'Package Name': packageData.packageName ? packageData.packageName : 'Not Available',
            'Package Price': packageData.packagePrice ? parseFloat(packageData.packagePrice).toFixed(2) + '₹' : 'Not Available',
            'Package Description': packageData.description ? packageData.description : 'Not Available',
            'Status': packageData.status ? packageData.status : 'Not Available'
        })
    })
    return finalData
})

exports.findOneIndividualPackage = asyncHandler(async (params) => {
    const { accessCode, partnerId } = params
    console.log("🚀 ~ exports.findOneIndividualPackage=asyncHandler ~ params:", params);
    try {
        return await pkgModel.findOne({
            where: { accessCode: accessCode, partnerId: partnerId },
            raw: true
        })
    } catch (error) {
        console.log(error)
        return false
    }
});

exports.updatePackage = asyncHandler(async (data, id) => {
    const transaction = data.transaction || await sequelize.transaction(); // Start a transaction

    try {
        const reviewed = await reviewedChange({
            load: () => pkgModel.findOne({ where: { id }, attributes: PACKAGE_COMMISSION.fields, raw: true, transaction }),
            incoming: data,
            group: PACKAGE_COMMISSION,
            table: 'packages',
            id,
        });
        const result = await pkgModel.update(reviewed, { where: { id: id }, transaction });

        if (!data.transaction) await transaction.commit(); // Commit transaction if successful

        return { success: result[0] !== 0, message: 'Package updated successfully.' }
    } catch (error) {
        console.error(error);
        if (!data.transaction) await transaction.rollback(); // Rollback transaction in case of error
        return { success: false, message: 'Something went wrong.' }
    }
});

const pricedPackages = (serviceAccessCodes = []) =>
    serviceAccessCodes.length
        ? { [Op.or]: [{ type: '1' }, { type: '2', accessCode: { [Op.in]: serviceAccessCodes } }] }
        : { type: '1' };

exports.updatePackagePricing = async (id, { packagePrices, discount }, { serviceAccessCodes } = {}) => {
    const existing = await pkgModel.findOne({
        where: { id, ...pricedPackages(serviceAccessCodes) },
        attributes: ['id'],
        raw: true,
    });
    if (!existing) return null;
    await pkgModel.update({ packagePrices, discount }, { where: { id } });
    return { id: existing.id, packagePrices, discount };
};

// Bulk configure — one request applying the same pricing to every selected subscription.
exports.updatePackagePricingBulk = async (ids, { packagePrices, discount }, { serviceAccessCodes } = {}) => {
    await pkgModel.update(
        { packagePrices, discount },
        { where: { id: { [Op.in]: ids }, ...pricedPackages(serviceAccessCodes) } }
    );
    return { ids, packagePrices, discount };
};

exports.findAllPackages = asyncHandler(async (params) => {
    try {
        return await pkgModel.findAll({
            where: params,
            raw: true
        })
    } catch (error) {
        console.log(error)
    } finally {
        console.log("PACKAGE FIND All ROUTE CALLED")
    }
});

exports.findOnePackage = asyncHandler(async (params) => {
    try {
        return await pkgModel.findOne({
            where: params,
            raw: true
        })
    } catch (error) {
        console.log(error)
    } finally {
        console.log("PACKAGE FIND ONE ROUTE CALLED")
    }
})
exports.findAllPartnerPackage = asyncHandler(async (params,packageIds) => {
    try {
        return await pkgModel.findAll({
            where: {
                type: 1,
                id: {
                    [Op.in]: packageIds
                }
            },
            raw: true
        })
    } catch (error) {
        console.log(error)
    } finally {
        console.log("PARTNER PACKAGE FIND ROUTE CALLED")
    }
})
exports.createCloneNewPartner = asyncHandler(async (params) => {
    let transaction = await sequelize.transaction();
    try {
        let {bulkPackagesdata,newPartnerId,partnerPermissions,cashbackIds,packageIds} =params
        let oldBulkPackagesdata = bulkPackagesdata;
        let mapOldNewPkgs=[];
        // let packageIds= oldBulkPackagesdata.map(item=>item.id)
        // let bulkCashBackdata = await findAllPartnerCashBacks(packageIds);
        let bulkCashBackdata = await findAllPartnerCashBacks(cashbackIds);
        // let partnerPermissionDetails = await partnerPermission.update(partnerPermissions,{ where: { registeredBy: newPartnerId },transaction: transaction });
        let partnerPermissionDetails = await partnerPermission.update({permissions:partnerPermissions}, { where: { registeredBy: newPartnerId }, transaction: transaction });
        for (const item of oldBulkPackagesdata) {
            const preData = item;
            const id = item.id
            delete preData.id
            delete preData.isCommissionConfigured
            preData.partnerId = newPartnerId
           const newPackageData= await pkgModel.create(preData, { transaction: transaction });
           mapOldNewPkgs.push({...item,newId:newPackageData.id,id:id})           
        }
        bulkCashBackdata.forEach((itemCashBack,indexIst)=>{
            mapOldNewPkgs.forEach((itemPkg,indexSec)=>{
               if (itemCashBack.packageId === itemPkg.id){
                bulkCashBackdata[indexIst].packageId = itemPkg.newId
                delete bulkCashBackdata[indexIst].id
               }
            })
            
        })
         bulkCashBackdata.forEach(row => {
            delete row.isSurchargeConfigured
         })
         const newBulkPackagesdata = await cashback.bulkCreate(bulkCashBackdata, {
            transaction: transaction,
          });
          await transaction.commit();
        // await transaction.rollback();
        return {newBulkPackagesdata:newBulkPackagesdata,mapOldNewPkgs:mapOldNewPkgs}
    }
    catch (error) {
        await transaction.rollback();
        console.log(error)
    } finally {
        console.log("CREATE CLONE PARTNER ROUTE CALLED")
    }
})

const findAllPartnerCashBacks = async (cashbackIds) => {
    try {
        const result = await cashback.findAll({
            where: {
                id: {
                    [Op.in]: cashbackIds
                },
            },
            raw: true
        });
        return result;
    } catch (error) {
        console.log(error);
        throw error; // Optionally rethrow the error if needed
    } finally {
        console.log("PARTNER CASHBACK ROUTE CALLED");
    }
}

exports.findPartnerPermissions = asyncHandler(async (partnerId) => {
    try {
        return await partnerPermission.findOne({
            where: {registeredBy:partnerId},
            attributes: { exclude: ['id'] },
            raw: true
        })
    } catch (error) {
        console.log(error)
    } finally {
        console.log("FIND PARTNER PERMISSION ROUTE CALLED")
    }
})
exports.findPackagesCashback = asyncHandler(async (partnerId) => {
    try {
        let whereClause = { type: 1 };

        if (partnerId !== undefined) {
            whereClause.partnerId = partnerId;
        }

        let packageIds = await pkgModel.findAll({
            where: whereClause,
            attributes: ["id"],
            raw: true,
        })

        packageIds = packageIds.map((item) => item.id);

        if (!packageIds.length) {
            return [];
        }

        const packageData = await cashback.findAll({
            where: {
                packageId: {
                    [Op.in]: packageIds,
                },
            },
            attributes: ["packageId", "id"],
            include: [
                {
                    model: pkgModel,
                    attributes: ["id", "packageName"],
                },
                {
                    model: serviceOperator,
                    attributes: ["serviceProvider", "accessKey"],
                },
            ],
            raw: true,
        });

        return mergePackages(packageData);
    } catch (error) {
        console.log(error);
        throw error;
    } finally {
        console.log("FIND PARTNER PERMISSION ROUTE CALLED");
    }
});

const mergePackages = (data) => {
    return data.reduce((acc, currentItem) => {
        const packageData = {
            id: currentItem["package.id"] ?? null,
            packageName: currentItem["package.packageName"] ?? null,
        };

        const serviceOperatorData = {
            serviceProvider: currentItem["serviceOperator.serviceProvider"] ?? null,
            accessKey: currentItem["serviceOperator.accessKey"] ?? null,
            id: currentItem.id,
        };

        // Find if this packageId already exists in the accumulator
        const existingPackage = acc.find(item => item.packageId === currentItem.packageId);

        if (existingPackage) {
            // If the package already exists, push the new serviceOperator to the serviceOperators array
            existingPackage.serviceOperators.push(serviceOperatorData);
        } else {
            // If the packageId doesn't exist yet, create a new entry
            acc.push({
                packageId: currentItem.packageId,
                package: packageData,
                serviceOperators: [serviceOperatorData] // Start the array with the first service operator
            });
        }

        return acc;
    }, []);
};

exports.findAllActiveServicePackage = asyncHandler(async (attributes = undefined, partnerId, excludeBasic = false) => {
    try {
        let whereClause = {
            type:1,
            status: true
        }
        if (partnerId === "default") {
            whereClause.partnerId = null;
        } else if (!partnerId) {
            delete whereClause.partnerId;
        } else {
            whereClause.partnerId = partnerId;
        }


        if (excludeBasic) {
            whereClause.packageName = {
                [Op.ne]: 'Basic'
            };
        }
        return await pkgModel.findAll({
            where: whereClause,
            raw: true,
            attributes,
            order: [['packageName', 'ASC']],
        })
    } catch (error) {
        console.log(error)
        throw error;
    } finally {
        console.log("PACKAGE FIND All ROUTE CALLED")
    }
});