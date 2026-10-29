
const { Op, col, fn, Sequelize } = require("sequelize");
const esim = require("../entities/esim");
const serviceOperator = require("../entities/serviceOperator");
const vendors = require("../entities/vendor");
const asyncHandler = require("../../middlewares/async");
const { PLAN_COMMISSION, reviewedChange } = require("../../utils/configuredFlag");
const { formattedDateTime, formatNumberWithLocalString } = require("../../utils/formatter");
const countries = require("../../public/countries.json");
const { REGION_LABEL_TO_CODE, isRegionalPlan, getRegionLabel, isExcludedCountry } = require("../../utils/esimPlanHelpers");
const { applyCommissionMarkup } = require("../../utils/applyCommissionMarkup");

exports.createEsim = asyncHandler(async (data) => {
    try {
        const plan = await esim.create(data);
        if (!plan) {
            return false;
        }
        return plan;
    } catch (error) {
        console.log("🚀 ~ exports.create=asyncHandler ~ error:", error);
        return false;
    }
});

exports.findAllEsimsAndCount = asyncHandler(
    async ({ sortField, sort, itemsPerPage, page, searchText, isActive, isAdmin = false }) => {
        try {
            const offset = (page - 1) * itemsPerPage;
            const limit = itemsPerPage;

            let order = [];
            if (sortField && sort) {
                if (sortField === 'dataMBs') {
                    order.push([Sequelize.cast(Sequelize.col('dataMBs'), 'UNSIGNED'), sort.toUpperCase()]);
                } 
                else if (sortField === 'periodDays') {
                    order.push([Sequelize.cast(Sequelize.col('periodDays'), 'UNSIGNED'), sort.toUpperCase()]);
                }
                else {
                    order.push([sortField, sort.toUpperCase()]);
                }
            }

            let where = {};
            if (searchText) {
                where = {
                    [Op.or]: [
                        { name: { [Op.like]: `%${searchText}%` } },
                        { country: { [Op.like]: `%${searchText}%` } },
                        { coverageId: { [Op.like]: `%${searchText}%` } },
                        { planId: { [Op.like]: `%${searchText}%` } },
                        { dataMBs: { [Op.like]: `%${searchText}%` } },
                        { periodDays: { [Op.like]: `%${searchText}%` } },
                        { amount: { [Op.like]: `%${searchText}%` } },
                        { status: { [Op.like]: `%${searchText}%` } },
                    ],
                };
            }

            if (isActive) {
                where.status = true;
            }

            const result = await esim.findAndCountAll({
                where,
                order,
                offset,
                limit,
            });

            await applyCommissionMarkup(result.rows, "amount", null, isAdmin);

            return {
                success: true,
                message: "Esim Plans fetched successfully",
                data: result,
            };
        } catch (error) {
            console.error("Error finding Esim Plans:", error);
            return {
                success: false,
                message: "An error occurred while fetching Esim Plans",
            };
        }
    }
);

exports.findAllActiveEsims = asyncHandler(async () => {
    try {
        const result = await esim.findAll({
            where: {
                status: true
            },
            order: [['createdAt', 'DESC']]
        });

        if (!result || result.length === 0) {
            return {
                success: false,
                message: "No active Esim Plans found"
            };
        }

        return {
            success: true,
            message: "Active Esim Plans fetched successfully",
            data: result
        };
    } catch (error) {
        console.error("Error finding active Esim Plans:", error);
        return {
            success: false,
            message: "An error occurred while fetching active Esim Plans"
        };
    }
});

exports.updateEsim = asyncHandler(async (id, updateData) => {
    try {
        const [updatedRowsCount, updatedEsims] = await esim.update(updateData, {
            where: { id: id },
            returning: true,
        });

        if (updatedRowsCount === 0) {
            console.log({
                success: false,
                message: "Esim Plans not found or no changes were made",
            });
            return {
                success: false,
                message: "Esim Plans not found or no changes were made",
            };
        }

        return {
            success: true,
            message: "Esim Plans updated successfully",
            data: updatedEsims[0],
        };
    } catch (error) {
        console.error("Error updating Esim Plans:", error);
        return {
            success: false,
            message: "An error occurred while updating the Esim Plans",
        };
    }
});

exports.findEsimByName = asyncHandler(async (name) => {
    try {
        const result = await esim.findOne({
            where: {
                name: name,
            },
        });

        if (!result) {
            return {
                success: false,
                message: "Esim Plans not found",
            };
        }

        return {
            success: true,
            message: "Esim Plans fetched successfully",
            data: result,
        };
    } catch (error) {
        console.error("Error finding Esim Plans by name:", error);
        return {
            success: false,
            message: "An error occurred while fetching the Esim Plans",
        };
    }
});

exports.getUniqueCountries = asyncHandler(async () => {
    try {
        const countryMap = {};
        const nameToCode = {};
        for (const c of countries) {
            countryMap[c.value] = c.label;
            nameToCode[c.label] = c.value;
        }
        const nonTunzCountries = await esim.findAll({
            attributes: [
                [fn("DISTINCT", col("country")), "country"]
            ],
            where: {
                status: true,
                provider: {
                    [Op.ne]: "tunz"
                }
            },
            raw: true
        });
        const tunzPlans = await esim.findAll({
            attributes: ["includedCountries", "coverageId", "name"],
            where: {
                status: true,
                provider: "tunz"
            },
            raw: true
        });

        const countrySet = new Set();

        // Add non-Tunz countries — Bondio stores full names, normalize to code
        nonTunzCountries.forEach(item => {
            if (item.country) {
                const code = nameToCode[item.country] || item.country;
                countrySet.add(code);
            }
        });

        // Add Tunz countries — already stored as codes; regional plans belong to the regions dropdown
        tunzPlans.forEach(plan => {
            if (isRegionalPlan(plan)) return;
            if (Array.isArray(plan.includedCountries)) {
                plan.includedCountries.forEach(countryObj => {
                    if (countryObj?.code) {
                        countrySet.add(countryObj.code);
                    }
                });
            }
        });

        // Convert Set to sorted array
        const uniqueCountries = Array.from(countrySet)
            .sort()
            .map(code => ({
                code,
                country: countryMap[code] || code
            }))
            .filter(({ code, country }) => !isExcludedCountry(code) && !isExcludedCountry(country));

        return uniqueCountries;

    } catch (error) {
        console.log("Error fetching unique countries:", error);
        return false;
    }
});

exports.getPlanOptionsByCountry = asyncHandler(async (country, provider, credentialId) => {
    try {
        if (isExcludedCountry(country)) return [];

        let allPlans = [];

        if (!provider || provider !== "tunz") {
            const bondioPlans = await esim.findAll({
                attributes: ['dataMBs', 'periodDays', 'country', 'networks', 'amount', 'planId', ...PLAN_COMMISSION.fields],
                where: {
                    country,
                    status: true
                },
                raw: true
            });

            allPlans.push(...bondioPlans);
        }

        if (!provider || provider === "tunz") {
            const tunzPlans = await esim.findAll({
                attributes: ['dataMBs', 'periodDays', 'includedCountries', 'networks', 'amount', 'planId', 'coverageId', 'name', ...PLAN_COMMISSION.fields],
                where: {
                    status: true,
                    provider: "tunz"
                },
                raw: true
            });

            const filteredTunzPlans = tunzPlans.filter(plan =>
                !isRegionalPlan(plan) &&
                Array.isArray(plan.includedCountries) &&
                plan.includedCountries.some(c => c.name === country)
            );

            const formattedTunzPlans = filteredTunzPlans.map(plan => ({
                ...plan,
                country
            }));

            allPlans.push(...formattedTunzPlans);
        }

        await applyCommissionMarkup(allPlans, "amount", credentialId);

        //  GROUP by dataMBs + periodDays
        const grouped = {};

        for (const plan of allPlans) {
            const key = `${plan.dataMBs}_${plan.periodDays}`;

            if (!grouped[key]) {
                grouped[key] = plan;
            } else {
                // keep cheaper one
                if (Number(plan.amount) < Number(grouped[key].amount)) {
                    grouped[key] = plan;
                }
            }
        }

        const finalPlans = Object.values(grouped);

        finalPlans.sort((a, b) => {
            if (Number(a.dataMBs) !== Number(b.dataMBs)) {
                return Number(a.dataMBs) - Number(b.dataMBs);
            }
            return Number(a.periodDays) - Number(b.periodDays);
        });

        const seenPlanIds = new Set();
        const dedupedPlans = finalPlans.filter(plan => {
            if (seenPlanIds.has(plan.planId)) return false;
            seenPlanIds.add(plan.planId);
            return true;
        });

        // 🔹 5. Keep response format unchanged
        return dedupedPlans.map(plan => ({
            planId: plan.planId,
            dataGB: Number(plan.dataMBs) / 1024,
            validityDays: plan.periodDays,
            price: Number(plan.amount),
            currency: '₹',
            country,
            networks: plan.networks,
        }));

    } catch (error) {
        console.log("Error in getPlanOptionsByCountry:", error);
        return false;
    }
});

exports.getRegionOptions = asyncHandler(async () => {
    try {
        const tunzPlans = await esim.findAll({
            attributes: ['coverageId', 'includedCountries', 'name'],
            where: {
                status: true,
                provider: "tunz"
            },
            raw: true
        });

        const regionMap = {};

        for (const plan of tunzPlans) {
            if (!isRegionalPlan(plan)) continue;
            if (!regionMap[plan.coverageId]) {
                regionMap[plan.coverageId] = {
                    code: plan.coverageId,
                    region: getRegionLabel(plan.coverageId, plan.name),
                    countries: (plan.includedCountries || []).filter(
                        c => !isExcludedCountry(c?.code) && !isExcludedCountry(c?.name)
                    ),
                };
            }
        }

        return Object.values(regionMap).sort((a, b) => a.region.localeCompare(b.region));
    } catch (error) {
        console.log("Error in getRegionOptions:", error);
        return false;
    }
});

exports.getPlanOptionsByRegion = asyncHandler(async (regionCode, credentialId) => {
    try {
        const tunzPlans = await esim.findAll({
            attributes: ['dataMBs', 'periodDays', 'networks', 'amount', 'planId', 'coverageId', 'name', ...PLAN_COMMISSION.fields],
            where: {
                status: true,
                provider: "tunz",
                coverageId: regionCode
            },
            raw: true
        });

        await applyCommissionMarkup(tunzPlans, "amount", credentialId);

        const regionLabel = getRegionLabel(regionCode, tunzPlans[0]?.name);

        tunzPlans.sort((a, b) => {
            if (Number(a.dataMBs) !== Number(b.dataMBs)) {
                return Number(a.dataMBs) - Number(b.dataMBs);
            }
            return Number(a.periodDays) - Number(b.periodDays);
        });

        return tunzPlans.map(plan => ({
            planId: plan.planId,
            dataGB: Number(plan.dataMBs) / 1024,
            validityDays: plan.periodDays,
            price: Number(plan.amount),
            currency: '₹',
            country: regionLabel,
            networks: plan.networks,
        }));
    } catch (error) {
        console.log("Error in getPlanOptionsByRegion:", error);
        return false;
    }
});

exports.getPlan = asyncHandler(async (orders, credentialId) => {
    try {
        let subtotalAmount = 0;
        let totalQuantity = 0;
        const plans = [];

        for (const order of orders) {
            const { country, data, validity, quantity } = order;

            if (!country || data == null || !validity) {
                throw new Error('Invalid order payload');
            }

            // Blocked destinations can't be purchased even via direct API calls
            if (isExcludedCountry(country)) {
                throw new Error(`Plan not found for ${country}`);
            }

            const candidatePlans = await esim.findAll({
                where: {
                    dataMBs: data,
                    periodDays: validity,
                    status: true,
                },
                attributes: [
                    'amount',
                    'planId',
                    'name',
                    'dataMBs',
                    'periodDays',
                    'country',
                    'includedCountries',
                    'networks',
                    'provider',
                    'coverageId',
                    ...PLAN_COMMISSION.fields
                ],
                raw: true,
            });

            // 🔹 Now filter by country / region
            const regionCode = REGION_LABEL_TO_CODE[country];
            const plan = candidatePlans.find(p => {
                // Regional order — match by Tunz coverage set
                if (regionCode) {
                    return p.provider === 'tunz' && p.coverageId === regionCode;
                }

                // Bondio-style (single country column)
                if (p.country && p.country === country) {
                    return true;
                }

                // Tunz-style (includedCountries array); regional plans are only sold via regions
                if (Array.isArray(p.includedCountries)) {
                    return !isRegionalPlan(p) && p.includedCountries.some(c => c.name === country);
                }

                return false;
            });

            if (!plan) {
                throw new Error(`Plan not found for ${country}`);
            }

            await applyCommissionMarkup(plan, "amount", credentialId);

            const qty = Number(quantity || 1);
            const planAmount = Number(plan.amount) * qty;

            subtotalAmount += planAmount;
            totalQuantity += qty;

            // For Tunz plans, add country from order payload since includedCountries is an array
            // For Bondio plans, country is already in the plan object
            const planWithCountry = {
                ...plan,
                country: plan.country || country, // Use existing country or set from order
                quantity: qty,
                totalAmount: planAmount,
            };

            plans.push(planWithCountry);
        }

        return {
            plans,
            subtotalAmount,
            totalQuantity,
        };
    } catch (error) {
        console.error('Error in getPlan:', error);
        return false;
    }
});

exports.checkService = asyncHandler(async (accessKey) => {
    try {
        let whereClause = {
            accessKey
        }
        const serviceOperatorData = await serviceOperator.findOne({
            include: [{
                model: vendors,
                attributes: ['apiUrl', 'optional1', 'optional2', 'optional3', 'optional4', 'optional5']
            }],
            where: whereClause,
            raw: true,
            nest: true,
        })
        if (!serviceOperatorData) {
            return false;
        }
        return serviceOperatorData;
    } catch (error) {
        console.log("🚀 ~ exports.create=asyncHandler ~ error:", error);
        return false;
    }
});

exports.findEsimById = asyncHandler(async (id) => {
    try {
        const result = await esim.findOne({
            where: {
                id,
            },
        });

        if (!result) {
            return {
                success: false,
                message: "Esim Plans not found",
            };
        }

        return {
            success: true,
            message: "Esim Plans fetched successfully",
            data: result,
        };
    } catch (error) {
        console.error("Error finding Esim Plans by Id:", error);
        return {
            success: false,
            message: "An error occurred while fetching the Esim Plans",
        };
    }
});

exports.getPlanByPlanId = asyncHandler(async (planId) => {
    try {
        const plan = await esim.findOne({
            where: {
                planId: planId,
                status: true,
            },
            attributes: ['amount', 'planId', 'name', 'dataMBs', 'periodDays','country','provider','coverageId'],
            raw: true,
        });

        return plan;
    } catch (error) {
        console.log("Error in getPlanByPlanId:", error);
        return false;
    }
})

exports.esimPlansExport = asyncHandler(async (params) => {
    try {
        let { searchText, sort, sortField } = params;
        let order = [];
        if (sortField && sort) {
            order.push([sortField, sort.toUpperCase()]);
        }

        let where = {};
        if (searchText) {
            where = {
                [Op.or]: [
                    { name: { [Op.like]: `%${searchText}%` } },
                    { country: { [Op.like]: `%${searchText}%` } },
                    { coverageId: { [Op.like]: `%${searchText}%` } },
                    { planId: { [Op.like]: `%${searchText}%` } },
                    { dataMBs: { [Op.like]: `%${searchText}%` } },
                    { periodDays: { [Op.like]: `%${searchText}%` } },
                    { amount: { [Op.like]: `%${searchText}%` } },
                    { status: { [Op.like]: `%${searchText}%` } },
                ],
            };
        }

        const result = await esim.findAndCountAll({
            where,
            order,
        });

        let finalData = [];
        result.rows.forEach(function (limitData) {
            finalData.push({
                "Date": limitData.createdAt ? formattedDateTime(limitData.createdAt) : "Not Available",
                "Name": limitData.name ? limitData.name : "Not Available",
                "Data Pack": limitData.dataMBs == null ? "Not Available" :
                limitData.dataMBs === 0 ? "Unlimited" :
                (limitData.dataMBs / 1024 % 1 === 0 ?
                    (limitData.dataMBs / 1024) + " GB" :
                    (limitData.dataMBs / 1024).toFixed(2) + " GB"
                ),
                "Validity": limitData.periodDays ? limitData.periodDays + " days" : "Not Available",
                "Amount": limitData.amount ? "₹ "  + formatNumberWithLocalString(limitData.amount) : "₹ 0.00",
                "Country": limitData.country ? limitData.country : "Not Available",          
                "Status": limitData.status ? limitData.status  === 1 ?  "Active" : "Inactive" : "Not Available",
            });
        });
        return finalData;
    } catch (error) {
        console.log(error);
        throw { message: "Something went wrong" };
    }
});

exports.getPlanOptionsByPlanId = asyncHandler(async (planId) => {
    try {
        const plans = await esim.findAll({
            attributes: ['dataMBs', 'periodDays'],
            where: {
                planId,
                status: true,
            },
            raw: true,
        });

        const groupedPlans = plans.reduce((acc, plan) => {
            const { dataMBs, periodDays } = plan;

            if (!(dataMBs in acc)) {
                acc[dataMBs] = { dataMBs, periodDays: new Set() };
            }

            acc[dataMBs].periodDays.add(periodDays);
            return acc;
        }, {});

        const result = Object.values(groupedPlans).map(plan => ({
            dataMBs: plan.dataMBs,
            periodDays: Array.from(plan.periodDays)
        }));

        return result;
    } catch (error) {
        console.log("Error in getPlanOptionsByPlanId:", error);
        return false;
    }
});
exports.findEsimPlanByPlanId = asyncHandler(async (planId) => {
    try {
        const result = await esim.findOne({
            where: {
                planId,
            },
        });

        if (!result) {
            return {
                success: false,
                message: "Esim Plans not found",
            };
        }

        return {
            success: true,
            message: "Esim Plans fetched successfully",
            data: result,
        };
    } catch (error) {
        console.error("Error finding Esim Plans by Plan Id:", error);
        return {
            success: false,
            message: "An error occurred while fetching the Esim PlanId",
        };
    }
});

exports.updateEsimByPlanId = asyncHandler(async (planId, updateData) => {
    try {
        const reviewed = await reviewedChange({
            load: () => esim.findOne({ where: { planId }, attributes: PLAN_COMMISSION.fields, raw: true }),
            incoming: updateData,
            group: PLAN_COMMISSION,
            table: "esimPlans",
            id: planId,
        });
        const [updatedRowsCount, updatedEsims] = await esim.update(reviewed, {
            where: { planId },
            returning: true,
        });

        if (updatedRowsCount === 0) {
            console.log({
                success: false,
                message: "Esim Plans not found or no changes were made",
            });
            return {
                success: false,
                message: "Esim Plans not found or no changes were made",
            };
        }

        return {
            success: true,
            message: "Esim Plans updated successfully",
            data: updatedEsims[0],
        };
    } catch (error) {
        console.error("Error updating Esim Plans:", error);
        return {
            success: false,
            message: "An error occurred while updating the Esim Plans",
        };
    }
});
