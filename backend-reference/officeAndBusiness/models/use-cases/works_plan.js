const { Op } = require("sequelize")
const asyncHandler = require("../../middlewares/async")
const works = require("../entities/works")
const work_plans = require("../entities/works_plan")
const { handleSortFields } = require("../../utils/sortHandle")
const { PLAN_COMMISSION, reviewedChange } = require("../../utils/configuredFlag")
const { formattedDateTime, formatNumberWithLocalString } = require("../../utils/formatter")
const { customLog } = require("../../utils/loggerHelper")
const credential = require("../entities/credential")
const { applyCommissionMarkup } = require("../../utils/applyCommissionMarkup")

exports.findAllPlans = asyncHandler(async (params) => {
    const plans = await work_plans.findAll({
            where:{
                workId:params.workId,
                status: true
            }
    })
    await applyCommissionMarkup(plans, "price", params.credentialId)
    return plans
})

exports.findOnePlan = asyncHandler(async (params) => {
    const plan = await work_plans.findOne({
            where:{
                id:params.id
        }
    })
    await applyCommissionMarkup(plan, "price", params.credentialId)
    return plan
})

exports.findOnePlanDetails = asyncHandler(async (params) => {
    const plan = await work_plans.findOne({
        where: {
            id: params.id
        },
        include: [
            {
                model: works
            }
        ]
    });
    await applyCommissionMarkup(plan, "price", params.credentialId);
    return plan;
});

exports.fetchAllWorksPlan = asyncHandler(async (params, attributes = undefined) => {
    try {
        let {
            from,
            to,
            searchText,
            sort,
            limit,
            offset,
            sortField,
            partnerId,
            isAdmin = false
        } = params
        let order = handleSortFields(sortField, sort)

        let whereClause = {
            [Op.or]: [{
                name: {
                    [Op.like]: '%' + searchText + '%'
                }
            },
            {
                price: {
                    [Op.like]: '%' + searchText + '%'
                }
            },
            {
                '$work.name$': {
                    [Op.like]: '%' + searchText + '%',
                },
            }
            ]
        }
        if (partnerId) {
            if (partnerId === 'default') partnerId = null
            whereClause['$work.credential.registeredByCredential.id$'] = {
                [Op.eq]: partnerId
            };
        }
        if (from && to) {
            // Adjust 'to' date to end of day
            const tomorrow = new Date(to);
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);
            whereClause.createdAt = {
                [Op.between]: [from, tomorrow]
            }
        }

        const result = await work_plans.findAndCountAll({
            include: [
                {
                    model: works,
                    include: [
                        {
                            model: credential,
                            as: 'credential',
                            attributes: ['id', 'name'],
                            include: [
                                {
                                    model: credential,
                                    as: 'registeredByCredential', // Use the alias for credential's self-association
                                    attributes: ['id', 'name'],
                                },
                            ],
                            required: false,
                        }
                    ],
                }
            ],
            where: whereClause,
            order: order,
            limit: limit,
            offset: offset,
            attributes,
            raw: true,
            nest: true
        });

        await applyCommissionMarkup(result.rows, "price", null, isAdmin)
        return result
    } catch (error) {
          customLog(null, 'error', { error: error.message });

        throw { message: 'Something went wrong' };
    }

})
exports.workPlansExport = asyncHandler(async (params, attributes = undefined) => {
    try {
        let {
            from,
            to,
            searchText,
            sort,
            sortField,
            partnerId
        } = params
        let order = handleSortFields(sortField, sort)

        let whereClause = {
            [Op.or]: [{
                name: {
                    [Op.like]: '%' + searchText + '%'
                }
            },
            {
                description: {
                    [Op.like]: '%' + searchText + '%'
                }
            },
            {
                price: {
                    [Op.like]: '%' + searchText + '%'
                }
            },
            {
                billingCycle: {
                    [Op.like]: '%' + searchText + '%'
                }
            },
            {
                features: {
                    [Op.like]: '%' + searchText + '%'
                }
            },
            {
                '$work.name$': {
                    [Op.like]: '%' + searchText + '%',
                },
            }
            ]
        }

        if (from && to) {
            // Adjust 'to' date to end of day
            const tomorrow = new Date(to);
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);
            whereClause.createdAt = {
                [Op.between]: [from, tomorrow]
            }
        }
        if (partnerId) {
            if (partnerId === 'default') partnerId = null
            whereClause['$work.credential.registeredByCredential.id$'] = {
                [Op.eq]: partnerId
            };
        }

        const data = await work_plans.findAndCountAll({
            include: [
                {
                    model: works,
                    include: [
                        {
                            model: credential,
                            as: 'credential',
                            attributes: ['id', 'name'],
                            include: [
                                {
                                    model: credential,
                                    as: 'registeredByCredential', // Use the alias for credential's self-association
                                    attributes: ['id', 'name'],
                                },
                            ],
                            required: false,
                        }
                    ],
                }
            ],
            where: whereClause,
            order: order,
            attributes,
            raw: true,
            nest: true
        });

        let finalData = []
        data.rows.forEach(function (limitData) {
            const partnerName = limitData?.work?.credential?.registeredByCredential?.name || 'Default'
            finalData.push({
                Date: limitData.createdAt ? formattedDateTime(limitData.createdAt) : 'Not Available',
                "Plan Name": limitData.name ? limitData.name : "Not Available",
                "Work Name": limitData.work?.name ? `${limitData.work?.name}` : "Not Available",
                "Partner Name": partnerName,
                Price: limitData.price ? "AED " + formatNumberWithLocalString(limitData.price) : "Not Available",
                // "Billing Cycle": limitData.billingCycle ? limitData.billingCycle : "Not Available",
                Status: limitData.status > 0 ? "Active" : "Inactive",
            })
        })
        return finalData
    } catch (error) {
          customLog(null, 'error', { error: error.message });
         throw { message: 'Something went wrong' };
    }

})

exports.create = asyncHandler(async (params) => {
    const responseData = await work_plans.create(params)
    if (!responseData) {
        return false;
    }
    return responseData
})

exports.update = asyncHandler(async (data, params) => {
   
    const reviewed = await reviewedChange({
        load: () => work_plans.findOne({ where: { id: params.id }, attributes: PLAN_COMMISSION.fields, raw: true }),
        incoming: data,
        group: PLAN_COMMISSION,
        table: "work_plans",
        id: params.id,
    })
    const responseData = await work_plans.update(reviewed, {
      where: {
          id: params.id
      }
  })
    if (!responseData) {
        return false;
    }
    return responseData
})

exports.Delete = asyncHandler(async (params) => {
    return await work_plans.destroy({
        where: {
            id: params.id
        }
    })
})

exports.findOnePlanWithWorkId = asyncHandler(async (params) => {
    return await work_plans.findOne({
            where:{
                workId:params.id
        }
    })
})