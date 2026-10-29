const kybVerification = require('./../entities/kybVerification')
const corporateUser =require('./../entities/corporateUser')
const asyncHandler = require('./../../middlewares/async')
const { Op } = require('sequelize')

exports.getAllKybVerifications = asyncHandler(async (params) => {
    try {
        let { limit, offset, from, to, sort, searchText, column, partnerId } = params;

        let whereCondition = {};

        if (searchText) {
            whereCondition[Op.or] = [
                { documentNumber: { [Op.like]: `%${searchText}%` } },
                { legalNameOfBusiness: { [Op.like]: `%${searchText}%` } },
                { nameMatchingScore: { [Op.like]: `%${searchText}%` } },
            ];
        }

        if (from && to) {
            const tomorrow = new Date(to);
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);

            whereCondition.createdAt = {
                [Op.between]: [new Date(from), tomorrow],
            };
        }

        const allowedColumns = ["createdAt"];
        const safeColumn = allowedColumns.includes(column) ? column : "createdAt";
        const safeSort = sort === "ASC" ? "ASC" : "DESC";

        const order = [[safeColumn, safeSort]];

        const kybVerifications = await kybVerification.findAndCountAll({
            where: whereCondition,
            // F-OTH-06: scope to the caller's own partner when locked to one — without this,
            // any caller could see every partner's corporate KYB data.
            include: partnerId
                ? [{ model: corporateUser, attributes: [], where: { registeredBy: partnerId }, required: true }]
                : [],
            limit: limit || 10,
            offset: offset || 0,
            order,
        });

        const corporateUserIds = [
            ...new Set(kybVerifications.rows.map((kyb) => kyb.corporateUserId)),
        ];

        const corporateUsers = await corporateUser.findAll({
            where: { id: corporateUserIds },
            attributes: ["id", "gstVerified", "panVerified"],
        });

        const corporateUserMap = {};
        corporateUsers.forEach((user) => {
            corporateUserMap[user.id] = {
                gstVerified: user.gstVerified,
                panVerified: user.panVerified,
            };
        });

        const updatedKybVerifications = kybVerifications.rows.map((kyb) => {
            const corporateData = corporateUserMap[kyb.corporateUserId] || {};
            const fieldName = kyb.documentType === "gst" ? "gstVerified" : "panVerified";

            return {
                ...kyb.toJSON(),
                [fieldName]: corporateData[fieldName] ?? null,
            };
        });

        return {
            count: kybVerifications.count,
            rows: updatedKybVerifications,
        };
    } catch (error) {
        throw new Error("Error fetching KYB verifications: " + error.message);
    }
});


exports.updateStatus = asyncHandler(async (params) => {
    try {

        let{panVerified,gstVerified,partnerId}=params
        // Find corporate user by ID
        // F-OTH-06: scoped to the caller's own partner when locked to one — without this, a
        // partner-A admin could approve/reject PAN/GST verification for a partner-B corporate.
        const user = await corporateUser.findOne({
            where: { id: params.corporateUserId, ...(partnerId ? { registeredBy: partnerId } : {}) }
        });

        if (!user) {
            return { success: false, message: "Corporate user not found" };
        }

        // Update only if values are provided
        if (panVerified !== undefined) user.panVerified = panVerified;
        if (gstVerified !== undefined) user.gstVerified = gstVerified;

        // Save changes
        await user.save();

        return { success: true, message: "Verification status updated successfully", data: user };
    } catch (error) {
        console.error("Error updating verification status:", error);
        throw new Error("Internal Server Error");
    }
});