"use strict";

const flagOf = (value) => {
    if (value === undefined || value === null || value === "") return null;
    if (value === true || value === 1 || value === "1" || value === "true") return true;
    if (value === false || value === 0 || value === "0" || value === "false") return false;
    return Boolean(value);
};

const unconfiguredPlanName = (plans, operatorFlag, serviceName) => {
    for (const plan of plans) {
        const own = flagOf(plan?.isCommissionConfigured);
        const configured = own === null ? operatorFlag : own;
        if (configured !== true) return plan?.name || (own === null ? serviceName : "this plan");
    }
    return null;
};

const configurationGaps = ({ serviceDetails, planDetails = [], isPekoSale = false } = {}) => {
    if (isPekoSale) {
        return { commissionNotConfiguredFor: null, surchargeNotConfiguredFor: null };
    }

    const serviceName = serviceDetails?.serviceProvider || "this service";
    const commissionName = serviceDetails?.commissionConfigurationName || serviceName;
    const operatorFlag = flagOf(serviceDetails?.isCommissionConfigured);
    const plans = Array.isArray(planDetails) ? planDetails : [];
    const gatedPlans = plans.filter((plan) => !plan?.isAddOn);

    let commissionNotConfiguredFor = null;
    if (plans.length) {
        commissionNotConfiguredFor = unconfiguredPlanName(gatedPlans, operatorFlag, commissionName);
    } else if (operatorFlag !== true) {
        commissionNotConfiguredFor = commissionName;
    }

    const surchargeGap = flagOf(serviceDetails?.isSurchargeConfigured) === false;
    const packageId = Number(serviceDetails?.packageId);

    return {
        commissionNotConfiguredFor,
        surchargeNotConfiguredFor: surchargeGap ? serviceName : null,
        ...(surchargeGap && Number.isFinite(packageId) && packageId > 0
            ? { surchargeNotConfiguredPackageId: packageId }
            : {}),
    };
};

module.exports = { flagOf, configurationGaps };
