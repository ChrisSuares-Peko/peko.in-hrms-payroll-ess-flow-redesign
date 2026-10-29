const { Op } = require('sequelize');
const cashback = require('./../entities/cashback');
const pkgModel = require('./../entities/package');
const serviceOperator = require('./../entities/serviceOperator');
const asyncHandler = require('./../../middlewares/async');
const sequelizeConfig = require('../../configs/database/index');

exports.findPartnerPackagesAndCashbacks = asyncHandler(async (partnerId) => {
    const isDefault = !partnerId || partnerId === 'default';

    const pkgWhere = isDefault ? { partnerId: null } : { partnerId };
    const packages = await pkgModel.findAll({
        where: pkgWhere,
        attributes: [
            'id',
            'packageName',
            'aliasName',
            'packageType',
            'accessCode',
            'partnerId',
            'type',
            'status',
            'packagePrices',
            'discount',
        ],
        raw: true,
    });

    const packageIds = packages.map(p => p.id);
    let cashbacks = [];
    if (packageIds.length) {
        cashbacks = await cashback.findAll({
            where: { packageId: { [Op.in]: packageIds } },
            include: [
                {
                    model: serviceOperator,
                    attributes: ['id', 'serviceProvider', 'serviceCategory', 'accessKey'],
                },
                { model: pkgModel, attributes: ['id', 'packageName', 'aliasName'] },
            ],
            raw: true,
            nest: true,
        });
    }

    return { packages, cashbacks };
});

exports.clonePackageToPartner = asyncHandler(async (params) => {
    const { fromPackageId, toPartnerId, overrides = {} } = params;
    if (!fromPackageId) throw new Error('fromPackageId is required');

    const toId = !toPartnerId || toPartnerId === 'default' ? null : toPartnerId;

    const source = await pkgModel.findOne({ where: { id: fromPackageId }, raw: true });
    if (!source) throw new Error(`Source package ${fromPackageId} not found`);

    const cloneData = { ...source };
    delete cloneData.id;
    delete cloneData.createdAt;
    delete cloneData.updatedAt;
    delete cloneData.externalId;
    delete cloneData.vendorPlanId;
    delete cloneData.isCommissionConfigured;
    cloneData.partnerId = toId;

    if (typeof overrides.packageName === 'string' && overrides.packageName.trim()) {
        cloneData.packageName = overrides.packageName.trim();
    }
    if (typeof overrides.aliasName === 'string') {
        cloneData.aliasName = overrides.aliasName.trim() || null;
    }
    if (overrides.packagePrices && typeof overrides.packagePrices === 'object') {
        cloneData.packagePrices = {
            ...(cloneData.packagePrices || {}),
            ...overrides.packagePrices,
        };
    }
    if (overrides.discount && typeof overrides.discount === 'object') {
        cloneData.discount = {
            ...(cloneData.discount || {}),
            ...overrides.discount,
        };
    }

    const duplicate = await pkgModel.findOne({
        where: {
            partnerId: toId,
            packageName: cloneData.packageName,
        },
        attributes: ['id'],
        raw: true,
    });
    if (duplicate) {
        throw new Error(
            `A package named "${cloneData.packageName}" already exists for this partner.`
        );
    }

    const created = await pkgModel.create(cloneData);
    return created.get({ plain: true });
});

exports.addCashbacksToTargetPackage = asyncHandler(async (params) => {
    const { toPackageId, sourceCashbackIds = [] } = params;

    if (!toPackageId) throw new Error('toPackageId is required');
    if (!Array.isArray(sourceCashbackIds) || sourceCashbackIds.length === 0) {
        throw new Error('sourceCashbackIds must be a non-empty array');
    }

    const transaction = await sequelizeConfig.transaction();
    let created = [];
    let skippedDuplicates = [];
    try {
        const targetPackage = await pkgModel.findOne({
            where: { id: toPackageId },
            raw: true,
            transaction,
        });
        if (!targetPackage) throw new Error(`Target package ${toPackageId} not found`);

        const sourceCashbacks = await cashback.findAll({
            where: { id: { [Op.in]: sourceCashbackIds } },
            raw: true,
            transaction,
        });

        const existingOnTarget = await cashback.findAll({
            where: { packageId: toPackageId },
            attributes: ['serviceOperatorId'],
            raw: true,
            transaction,
        });
        const existingOperatorIds = new Set(
            existingOnTarget.map(cb => String(cb.serviceOperatorId))
        );

        const toCreate = [];
        const seenOperators = new Set();
        for (const src of sourceCashbacks) {
            const opKey = String(src.serviceOperatorId);
            if (existingOperatorIds.has(opKey) || seenOperators.has(opKey)) {
                skippedDuplicates.push({
                    sourceCashbackId: src.id,
                    serviceOperatorId: src.serviceOperatorId,
                });
                continue;
            }
            const cloneData = { ...src };
            delete cloneData.id;
            delete cloneData.createdAt;
            delete cloneData.updatedAt;
            delete cloneData.isSurchargeConfigured;
            cloneData.packageId = toPackageId;
            toCreate.push(cloneData);
            seenOperators.add(opKey);
        }

        created = toCreate.length
            ? await cashback.bulkCreate(toCreate, { transaction, returning: true })
            : [];

        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        console.log(error);
        throw error;
    }

    const createdIds = created.map(row => row.id).filter(Boolean);
    let createdWithJoins = [];
    if (createdIds.length) {
        createdWithJoins = await cashback.findAll({
            where: { id: { [Op.in]: createdIds } },
            include: [
                {
                    model: serviceOperator,
                    attributes: ['id', 'serviceProvider', 'serviceCategory', 'accessKey'],
                },
                { model: pkgModel, attributes: ['id', 'packageName', 'aliasName'] },
            ],
            raw: true,
            nest: true,
        });
    }

    return {
        created: createdWithJoins,
        createdCount: createdWithJoins.length,
        skippedDuplicates,
    };
});
