const DomainHostingPlans = require("../entities/domainHostingPlans");

exports.findByVendorKey = async ({ productId, planId, billingCycle }) => {
    const where = { productId };
    if (planId !== undefined) where.planId = planId || null;
    if (billingCycle !== undefined) where.billingCycle = billingCycle || null;
    return await DomainHostingPlans.findOne({ where, raw: true });
};
