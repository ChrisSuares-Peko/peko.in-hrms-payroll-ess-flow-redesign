const agreement = require("../entities/agreement");
const corporateUser = require("../entities/corporateUser");
const InvoiceCustomerV2 = require("../entities/invoiceCustomerV2");
const invoicingV2 = require("../entities/invoicingV2");
const SubCorporateUser = require("../entities/subCorporateUsers");
const eSign = require("../entities/eSign");
const { Op, fn, col } = require("sequelize");
const Sequelize = require("sequelize");
const asyncHandler = require("../../middlewares/async");

exports.createAgreement = asyncHandler(async (params) => {
    return await agreement.create(params);
});

exports.findAllAgreementsAndCount = asyncHandler(async (params) => {
    const { from, to, limit, offset, searchText, sort, sortField, userId, subCorporateUserId, status, customerId } = params;

    const whereClause = {};

    if (userId) {
        whereClause.corporateUserId = userId;
    }

    if (status) {
        whereClause.status = Array.isArray(status)
            ? { [Op.in]: status }
            : status;
    }

    if (customerId) {
        whereClause.customerId = customerId;
    }

    if (subCorporateUserId) {
        whereClause.subCorporateUserId = subCorporateUserId;
    }

    if (searchText) {
        whereClause[Op.or] = [
            { agreementNumber: { [Op.like]: `%${searchText}%` } },
            Sequelize.where(fn('CONCAT', col('agreements.prefix'), col('agreements.agreementNumber')), { [Op.like]: "%" + searchText + "%" }),
            { status: { [Op.like]: `%${searchText}%` } },
            { contractValue: { [Op.like]: `%${searchText}%` } },
        ];
    }

    if (from && to) {
        const tomorrow = new Date(to);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        whereClause.createdAt = { [Op.between]: [from, tomorrow] };
    }

    // Base where for status counts (without status filter so all tabs always show correct totals)
    const countWhere = {};
    if (userId) countWhere.corporateUserId = userId;
    if (subCorporateUserId) countWhere.subCorporateUserId = subCorporateUserId;

    const [agreementData, total, draft, pending, sent, signed] = await Promise.all([
        agreement.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: InvoiceCustomerV2,
                    attributes: ["id", "name", "email", "phoneNumber"],
                },
                {
                    model: invoicingV2,
                    as: "quotation",
                    attributes: ["id", "invoiceNumber", "prefix"],
                    required: false,
                },
                {
                    model: SubCorporateUser,
                    attributes: ["id", "name"],
                    required: false,
                },
            ],
            order: [[sortField || "id", sort === "ASC" ? "ASC" : "DESC"]],
            limit,
            offset,
            raw: true,
            nest: true,
        }),
        agreement.count({ where: countWhere }),
        agreement.count({ where: { ...countWhere, status: "DRAFT" } }),
        agreement.count({ where: { ...countWhere, status: "PENDING" } }),
        agreement.count({ where: { ...countWhere, status: "SENT" } }),
        agreement.count({ where: { ...countWhere, status: "SIGNED" } }),
    ]);

    return {
        rows: agreementData.rows,
        recordsTotal: agreementData.count,
        statusCounts: { total, draft, pending, sent, signed },
    };
});

exports.updateAgreement = asyncHandler(async (where, data) => {
    const doc = await agreement.findOne({ where });
    if (!doc) return null;
    return await doc.update(data);
});

exports.pushAgreementTimeline = asyncHandler(async (id, eventName) => {
    const doc = await agreement.findOne({ where: { id } });
    if (!doc) return null;
    const existing = Array.isArray(doc.timeline) ? doc.timeline : [];
    const updated = [...existing, { eventName, createdAt: new Date() }];
    return await doc.update({ timeline: updated });
});

exports.findAgreement = asyncHandler(async (params) => {
    return await agreement.findOne({
        where: params,
        include: [
            {
                model: corporateUser,
                attributes: ["name", "email", "mobileNo", "gstNumber", "logo"],
            },
        ],
        raw: true,
        nest: true,
    });
});

exports.deleteAgreement = asyncHandler(async (id, corporateUserId) => {
    const doc = await agreement.findOne({ where: { id, corporateUserId } });
    if (!doc) return null;

    if (doc.eSignId) {
        await eSign.update(
            { sourceType: null, sourceId: null },
            { where: { id: doc.eSignId } }
        );
    }

    await doc.destroy();
    return true;
});

exports.findAgreementById = asyncHandler(async (id, corporateUserId) => {
    return await agreement.findOne({
        where: { id, corporateUserId },
        include: [
            {
                model: corporateUser,
                attributes: ["name", "email", "mobileNo", "gstNumber", "logo"],
            },
            {
                model: InvoiceCustomerV2,
                attributes: ["id", "name", "email", "phoneNumber", "gstin", "primaryAddress", "primaryCity", "primaryState", "primaryPincode", "primaryCountry"],
            },
            {
                model: invoicingV2,
                as: "quotation",
                attributes: ["id", "invoiceNumber", "prefix"],
                required: false,
            },
            {
                model: SubCorporateUser,
                attributes: ["id", "name"],
                required: false,
            },
            {
                model: eSign,
                as: "eSign",
                attributes: ["id", "docket_id", "docket_title", "status", "signers_info", "expiry_date", "sequentialSignature", "initiator_name", "initiator_email", "document_url", "audit_trail_url"],
                required: false,
            },
        ],
        raw: true,
        nest: true,
    });
});
