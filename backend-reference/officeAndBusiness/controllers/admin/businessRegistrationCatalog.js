const asyncHandler = require('../../middlewares/async');
const ErrorResponse = require('../../utils/error-response');
const withRetry = require('../../utils/withRetry');
const gateway = require('../../utils/indiaFilingsGateway');
const catalogUseCase = require('../../models/use-cases/businessRegistrationCatalog');
const { customLog } = require('../../utils/loggerHelper');

// Surface the vendor's structured error (errorCode/errorMessage) over axios's
// generic "Request failed with status code N".
const errorDetail = err => {
    const data = err?.response?.data;
    if (data && typeof data === 'object') {
        const msg = data.errorMessage || data.message || JSON.stringify(data);
        return data.errorCode ? `${data.errorCode}: ${msg}` : msg;
    }
    return err?.message || 'Unknown error';
};

// Admin management of the Business Registration catalog. Vendor rows are imported
// from IndiaFilings and stored; admins layer amount/status/sortOrder on top. Only
// those 3 fields are editable — vendor fields are read-only and refreshed on sync.

// Map a raw vendor catalog row to our vendor-owned columns (excludes admin fields).
// Field names differ between the Postman sample (id/price/service_name) and the
// v1.1 doc example (catalog_id/amount/catalog_name) — accept both.
const mapVendorRow = row => ({
    vendorCatalogId: String(row.id ?? row.catalog_id ?? ''),
    serviceId: Number(row.service_id) || null,
    serviceName: row.service_name ?? row.catalog_name ?? row.service ?? null,
    variantName: row.variant_name || null,
    description: row.description || null,
    // The vendor sends a single `price` — that is the price we display/charge.
    vendorPrice: Number(row.price ?? row.amount) || 0,
    governmentFeeAmount: Number(row.government_fee_amount) || 0,
    unit: row.unit || null,
    currency: row.currency || 'INR',
    about: row.about || null,
    vendorData: row,
});

// A catalog offering's natural identity — the vendor id is volatile (a re-sync can
// hand the same service a new id), so we key on service + variant name instead.
const nameKey = row => `${row.serviceName ?? ''}||${row.variantName ?? ''}`;

// When two rows share a name key (a duplicate left by an earlier sync), keep the
// one that preserves the admin's pricing: a custom amount first, then the most
// recently added (higher id). Status isn't a factor — the upsert marks the survivor
// active anyway — and its vendor data is then refreshed to the latest, so this
// choice only decides whose custom amount / sortOrder live on.
const preferKeep = (a, b) => {
    const aCustom = a.amount !== null && a.amount !== undefined;
    const bCustom = b.amount !== null && b.amount !== undefined;
    if (aCustom !== bCustom) return aCustom ? a : b;
    return Number(a.id) >= Number(b.id) ? a : b;
};

// The vendor catalog can carry several rows for one offering (mid-migration: one
// row has the price but a null service_id, another has the service_id but ₹0).
// Collapse them per name key into a single row that takes the best of each — a
// non-null service_id and a non-zero price — so each offering resolves to one
// usable entry. The row that carries a service_id is the canonical base.
const mergeVendorRowsByName = rawRows => {
    const byKey = new Map();
    for (const raw of rawRows) {
        const mapped = mapVendorRow(raw);
        if (!mapped.vendorCatalogId || mapped.vendorCatalogId === 'undefined') continue;
        const key = nameKey(mapped);
        const prev = byKey.get(key);
        if (!prev) {
            byKey.set(key, mapped);
            continue;
        }
        const base =
            prev.serviceId != null ? prev : mapped.serviceId != null ? mapped : prev.vendorPrice ? prev : mapped;
        const other = base === prev ? mapped : prev;
        byKey.set(key, {
            ...base,
            serviceId: base.serviceId ?? other.serviceId,
            vendorPrice: base.vendorPrice || other.vendorPrice,
            description: base.description || other.description,
            about: base.about || other.about,
            unit: base.unit || other.unit,
            currency: base.currency || other.currency,
        });
    }
    return [...byKey.values()];
};

// POST /sync — pull the vendor catalog and upsert. Identity is (serviceName +
// variantName): a changed vendor id updates the existing row instead of adding a
// duplicate. The vendor's catalog drives ACTIVE status — returned offerings are
// activated (one per name), and offerings it no longer returns are deactivated;
// admin custom amount/sortOrder are preserved and status is re-toggleable manually.
exports.syncFromVendor = asyncHandler(async (req, res, next) => {
    const traceId = req?.LogTraceId;
    const cfg = await gateway.getConfig();
    if (cfg.error) {
        customLog(traceId, 'error', {
            message: '[brCatalogSync] vendor config unavailable',
            error: cfg.error,
        });
        return next(new ErrorResponse(cfg.error, 503));
    }
    customLog(traceId, 'info', {
        message: '[brCatalogSync] config resolved',
        baseGeneral: cfg.baseGeneral,
        baseLocation: cfg.baseLocation,
        hasApiKey: Boolean(cfg.apiKey),
        hasLogin: Boolean(cfg.loginEmail && cfg.loginPassword),
    });

    let vendorResp;
    try {
        // Full catalog fetch (doc §5): getAllCatalogBIDbyData needs no id;
        // getServiceIDbyData/getCatalogIDbyData REQUIRE service_id/catalog_id (422 otherwise).
        vendorResp = await withRetry(() =>
            gateway.getCatalog(cfg, { operation_type: 'getAllCatalogBIDbyData', status: '1' })
        );
    } catch (error) {
        const detail = errorDetail(error);
        customLog(traceId, 'error', {
            message: '[brCatalogSync] vendor catalog call failed',
            httpStatus: error?.response?.status,
            responseData: error?.response?.data,
            error: error?.message,
        });
        return next(new ErrorResponse(`Unable to fetch catalog from vendor — ${detail}`, 502));
    }

    customLog(traceId, 'info', {
        message: '[brCatalogSync] vendor response received',
        vendorStatus: vendorResp?.status,
        total: vendorResp?.total,
        rowCount: Array.isArray(vendorResp?.data) ? vendorResp.data.length : null,
        sampleKeys: Array.isArray(vendorResp?.data) && vendorResp.data[0] ? Object.keys(vendorResp.data[0]) : vendorResp,
    });

    const rows = Array.isArray(vendorResp?.data) ? vendorResp.data : [];
    if (!rows.length) {
        return next(
            new ErrorResponse(
                `Vendor catalog returned no items (vendor said: ${JSON.stringify(vendorResp)?.slice(0, 300)})`,
                502
            )
        );
    }

    // 1) Collapse pre-existing duplicates (same service+variant, left when the
    // vendor changed a row's id on an earlier sync). Keep the admin's chosen row.
    let removedDuplicates = 0;
    try {
        const groups = new Map();
        for (const row of await catalogUseCase.findAllRaw()) {
            const key = nameKey(row);
            groups.set(key, groups.has(key) ? [...groups.get(key), row] : [row]);
        }
        for (const group of groups.values()) {
            if (group.length < 2) continue;
            const keep = group.reduce(preferKeep);
            for (const row of group) {
                if (row.id !== keep.id) {
                    await catalogUseCase.destroyById(row.id);
                    removedDuplicates += 1;
                }
            }
        }
    } catch (error) {
        customLog(traceId, 'error', { message: '[brCatalogSync] dedup failed', error: error?.message });
    }

    // 2) Upsert by name key and mark ACTIVE — the vendor's current catalog is the
    // source of truth for what's live. A row keeps its admin custom amount/sortOrder;
    // its vendor id is refreshed. Each row is isolated so one bad row can't abort the
    // whole sync. seenKeys tracks which offerings the vendor returned this run.
    const mergedRows = mergeVendorRowsByName(rows);
    const seenKeys = new Set();
    let created = 0;
    let updated = 0;
    for (let i = 0; i < mergedRows.length; i += 1) {
        const vendorFields = mergedRows[i];
        seenKeys.add(nameKey(vendorFields));
        try {
            const byName = await catalogUseCase.findByNameKey(
                vendorFields.serviceName,
                vendorFields.variantName
            );
            if (byName) {
                // Free the incoming id if a different row still holds it, so updating
                // the survivor won't collide with the unique vendorCatalogId.
                const idHolder = await catalogUseCase.findByVendorKey(vendorFields.vendorCatalogId);
                if (idHolder && idHolder.id !== byName.id) {
                    await catalogUseCase.destroyById(idHolder.id);
                    removedDuplicates += 1;
                }
                await catalogUseCase.update(byName.id, { ...vendorFields, status: true });
                updated += 1;
            } else {
                // No name match: the vendor may have renamed a service (same id) —
                // update in place; otherwise it's genuinely new. Either way, active.
                const byId = await catalogUseCase.findByVendorKey(vendorFields.vendorCatalogId);
                if (byId) {
                    await catalogUseCase.update(byId.id, { ...vendorFields, status: true });
                    updated += 1;
                } else {
                    await catalogUseCase.create({ ...vendorFields, sortOrder: i, status: true });
                    created += 1;
                }
            }
        } catch (error) {
            customLog(traceId, 'error', {
                message: '[brCatalogSync] row upsert failed',
                vendorCatalogId: vendorFields.vendorCatalogId,
                error: error?.message,
                sql: error?.sql,
            });
        }
    }

    // Nothing changed on a non-empty vendor response signals a systemic DB problem
    // (e.g. missing table / column mismatch), not just a stray row.
    if (created === 0 && updated === 0 && rows.length > 0) {
        return next(new ErrorResponse('Catalog sync failed — no rows could be saved', 500));
    }

    // 3) Deactivate offerings the vendor no longer returns, so only vendor-current
    // services stay active (admin can re-activate manually until the next sync). Safe
    // because the earlier empty-response guard blocks a blank vendor reply from
    // blanking the catalog — a partial response would still only hide the missing rows.
    let deactivated = 0;
    try {
        for (const row of await catalogUseCase.findAllRaw()) {
            if (row.status && !seenKeys.has(nameKey(row))) {
                await catalogUseCase.update(row.id, { status: false });
                deactivated += 1;
            }
        }
    } catch (error) {
        customLog(traceId, 'error', {
            message: '[brCatalogSync] deactivate-vanished failed',
            error: error?.message,
        });
    }

    customLog(traceId, 'info', {
        message: '[brCatalogSync] done',
        created,
        updated,
        removedDuplicates,
        deactivated,
        total: rows.length,
    });

    return res.status(200).json({
        status: true,
        message: `Catalog synced: ${created} added, ${updated} updated, ${removedDuplicates} duplicates removed, ${deactivated} deactivated`,
        data: { created, updated, removedDuplicates, deactivated, total: rows.length },
        responseCode: '000',
    });
});

// GET / — admin list (ordered by sortOrder), with search + pagination.
exports.getCatalog = asyncHandler(async (req, res, next) => {
    let { searchText, page, itemsPerPage } = req.query;
    const sort = req.query.sort === 'DESC' ? 'DESC' : 'ASC';
    const sortField = req.query.sortField || 'sortOrder';

    page = page ? parseInt(page, 10) : 1;
    itemsPerPage = itemsPerPage ? parseInt(itemsPerPage, 10) : null;
    const limit = itemsPerPage || null;
    const offset = page && itemsPerPage ? (page - 1) * itemsPerPage : undefined;

    const result = await catalogUseCase.findAllAndCount({ limit, offset, searchText, sort, sortField, isAdmin: true });
    if (!result) return next(new ErrorResponse('Unable to fetch catalog', 500));

    return res.status(200).json({
        status: true,
        data: { recordsTotal: result.count, recordsFiltered: result.count, data: result.rows },
        message: 'Records fetched successfully',
        responseCode: '000',
    });
});

// PUT /:id — edit the admin fields: amount/status/sortOrder plus the plan-level
// commission fields (commissionMode/commissionType/commission/
// fixedCommissionPerTransaction/isCommissionInclGST), matching eSIM Plans / Gift
// Cards / Work Plans etc.
exports.updateCatalogItem = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const {
        amount, status, sortOrder,
        commissionMode, commissionType, commission, fixedCommissionPerTransaction, isCommissionInclGST,
    } = req.body;

    const data = {};
    if (amount !== undefined) data.amount = amount === null || amount === '' ? null : Number(amount);
    if (status !== undefined) data.status = Boolean(status);
    if (sortOrder !== undefined) data.sortOrder = Number(sortOrder) || 0;
    if (commissionMode !== undefined) data.commissionMode = commissionMode;
    if (commissionType !== undefined) data.commissionType = commissionType;
    if (commission !== undefined) data.commission = Number(commission) || 0;
    if (fixedCommissionPerTransaction !== undefined) data.fixedCommissionPerTransaction = Number(fixedCommissionPerTransaction) || 0;
    if (isCommissionInclGST !== undefined) data.isCommissionInclGST = Boolean(isCommissionInclGST);

    if (!Object.keys(data).length) {
        return next(new ErrorResponse('Nothing to update', 400));
    }

    const result = await catalogUseCase.update(id, data);
    if (!result) return next(new ErrorResponse('Unable to update catalog item', 400));

    return res.status(200).json({
        status: true,
        message: 'Catalog item updated successfully',
        data: {},
        responseCode: '000',
    });
});

// PUT /status/:id — quick active toggle.
exports.updateStatus = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const { status } = req.body;
    if (typeof status !== 'boolean') return next(new ErrorResponse('status must be a boolean', 400));

    const result = await catalogUseCase.update(id, { status });
    if (!result) return next(new ErrorResponse('Unable to update status', 400));

    return res.status(200).json({
        status: true,
        message: 'Status updated successfully',
        data: {},
        responseCode: '000',
    });
});
