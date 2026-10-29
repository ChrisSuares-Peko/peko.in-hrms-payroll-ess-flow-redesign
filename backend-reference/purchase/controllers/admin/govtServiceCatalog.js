'use strict'

const asyncHandler = require('../../middlewares/async')
const ErrorResponse = require('../../utils/error-response')
const withRetry = require('../../utils/withRetry')
const gateway = require('../../utils/indiaFilingsGateway')
const govtServiceUseCase = require('../../models/use-cases/govtServicesCatalog')
const { customLog } = require('../../utils/loggerHelper')

// Surface the vendor's structured error (errorCode/errorMessage) over axios's
// generic "Request failed with status code N".
const errorDetail = err => {
  const data = err?.response?.data
  if (data && typeof data === 'object') {
    const msg = data.errorMessage || data.message || JSON.stringify(data)
    return data.errorCode ? `${data.errorCode}: ${msg}` : msg
  }
  return err?.message || 'Unknown error'
}

// Admin management of the Government Services catalog — same flow as
// officeAndBusiness's Business Registration Catalog. Vendor rows are imported
// from IndiaFilings; admins layer amount/status/sortOrder on top, the only
// editable fields — vendor fields are read-only and refreshed on sync.

// Maps a raw vendor catalog row to our vendor-owned columns (excludes admin
// fields).
const mapVendorRow = row => ({
  vendorCatalogId: String(row.id ?? ''),
  bid: row.bid != null ? String(row.bid) : null,
  serviceId: Number(row.service_id) || null,
  type: Number(row.type) || null,
  serviceName: row.service_name ?? null,
  variantName: row.variant_name || null,
  description: row.description || null,
  price: Number(row.price) || 0,
  currency: row.currency || 'INR',
  paymentType: row.payment_type || null,
  about: row.about || null
})


exports.syncFromVendor = asyncHandler(async (req, res, next) => {
  const traceId = req?.LogTraceId
  const cfg = await gateway.getConfig()
  if (cfg.error) {
    customLog(traceId, 'error', { message: '[govtServiceCatalogSync] vendor config unavailable', error: cfg.error })
    return next(new ErrorResponse(cfg.error, 503))
  }

  let vendorResp
  try {
    vendorResp = await withRetry(() =>
      gateway.getCatalog(cfg, { operation_type: 'getAllCatalogBIDbyData', status: '1' })
    )
  } catch (error) {
    const detail = errorDetail(error)
    customLog(traceId, 'error', {
      message: '[govtServiceCatalogSync] vendor catalog call failed',
      httpStatus: error?.response?.status,
      responseData: error?.response?.data,
      error: error?.message
    })
    return next(new ErrorResponse(`Unable to fetch catalog from vendor — ${detail}`, 502))
  }

  const rows = Array.isArray(vendorResp?.data) ? vendorResp.data : []
  if (!rows.length) {
    return next(
      new ErrorResponse(`Vendor catalog returned no items (vendor said: ${JSON.stringify(vendorResp)?.slice(0, 300)})`, 502)
    )
  }

  const existingRows = await govtServiceUseCase.findAll()
  const byVendorCatalogId = new Map(existingRows.map(r => [r.vendorCatalogId, r]))
  // Grouped (not last-write-wins) so every accumulated duplicate for a line item is visible,
  // not just whichever one happened to be last in the array.
  const groupsByServiceVariant = new Map()
  existingRows.forEach(r => {
    const key = `${r.serviceId}::${r.variantName}`
    const group = groupsByServiceVariant.get(key) || []
    group.push(r)
    groupsByServiceVariant.set(key, group)
  })
  const seenIds = new Set()

  let created = 0
  let updated = 0
  try {
    for (let i = 0; i < rows.length; i += 1) {
      const vendorFields = mapVendorRow(rows[i])
      if (!vendorFields.vendorCatalogId || vendorFields.vendorCatalogId === 'undefined') {
        customLog(traceId, 'error', {
          message: '[govtServiceCatalogSync] row skipped — no vendorCatalogId',
          rowKeys: Object.keys(rows[i] || {})
        })
        continue
      }

      const candidates = groupsByServiceVariant.get(`${vendorFields.serviceId}::${vendorFields.variantName}`) || []
     
      const existing = byVendorCatalogId.get(vendorFields.vendorCatalogId)
        || [...candidates].sort((a, b) => {
          if (a.status !== b.status) return a.status ? -1 : 1
          return new Date(b.updatedAt) - new Date(a.updatedAt)
        })[0]
      if (existing) {
        seenIds.add(existing.id)
      
        const staleDuplicates = candidates.filter(r => r.id !== existing.id && r.status)
        for (const duplicate of staleDuplicates) {
          customLog(traceId, 'info', {
            message: '[govtServiceCatalogSync] disabling stale duplicate row',
            duplicateId: duplicate.id,
            duplicateVendorCatalogId: duplicate.vendorCatalogId,
            keptId: existing.id,
            serviceId: vendorFields.serviceId,
            variantName: vendorFields.variantName
          })
          await govtServiceUseCase.updateStatus(duplicate.id, false)
        }
      
        await govtServiceUseCase.update(existing.id, { ...vendorFields, status: existing.adminLocked ? false : true })
        updated += 1
      } else {
        // Same reasoning — a brand new item the vendor sends arrives already enabled.
        const createdRow = await govtServiceUseCase.create({ ...vendorFields, sortOrder: i, status: true })
        if (createdRow) seenIds.add(createdRow.id)
        created += 1
      }
    }
  } catch (error) {
    customLog(traceId, 'error', { message: '[govtServiceCatalogSync] DB upsert failed', error: error?.message, sql: error?.sql })
    return next(new ErrorResponse(`Catalog sync DB error — ${error.message}`, 500))
  }

  // Anything active in our DB that this vendor response never mentioned is a
  // catalog item the vendor stopped offering (or renamed to a `bid`/id we
  // couldn't match at all) — disable it rather than leaving it stale and
  // still visible on the corporate side, same "disable what's missing"
  // convention giftCards' autoUpdateGiftCard applies to its own cards.
  const missingIds = existingRows.filter(r => !seenIds.has(r.id) && r.status).map(r => r.id)
  if (missingIds.length) {
    await govtServiceUseCase.disableByIds(missingIds)
    customLog(traceId, 'info', { message: '[govtServiceCatalogSync] disabled rows missing from vendor response', ids: missingIds })
  }

  customLog(traceId, 'info', { message: '[govtServiceCatalogSync] done', created, updated, disabled: missingIds.length, total: rows.length })

  return res.status(200).json({
    status: true,
    message: `Catalog synced: ${created} added, ${updated} updated${missingIds.length ? `, ${missingIds.length} disabled (no longer offered)` : ''}`,
    // rows is the exact, uncompressed vendor catalog payload (not reshaped) —
    // same "send the raw response" convention as the Objection lookup endpoint.
    data: { created, updated, disabled: missingIds.length, total: rows.length, vendorCatalog: rows },
    responseCode: '000'
  })
})

// GET / — admin list (ordered by sortOrder), with search + pagination.
exports.getCatalog = asyncHandler(async (req, res, next) => {
  let { searchText, page, itemsPerPage } = req.query
  const sort = req.query.sort === 'DESC' ? 'DESC' : 'ASC'
  const sortField = req.query.sortField || 'sortOrder'

  page = page ? parseInt(page, 10) : 1
  itemsPerPage = itemsPerPage ? parseInt(itemsPerPage, 10) : null
  const limit = itemsPerPage || null
  const offset = page && itemsPerPage ? (page - 1) * itemsPerPage : undefined

  const result = await govtServiceUseCase.findAllAndCount({ limit, offset, searchText, sort, sortField, isAdmin: true })
  if (!result) return next(new ErrorResponse('Unable to fetch catalog', 500))

  return res.status(200).json({
    status: true,
    data: { recordsTotal: result.count, recordsFiltered: result.count, data: result.rows },
    message: 'Records fetched successfully',
    responseCode: '000'
  })
})

// PUT /:id — edit the admin fields: amount/status/sortOrder plus the plan-level commission fields.
exports.updateCatalogItem = asyncHandler(async (req, res, next) => {
  const { id } = req.params
  const {
    amount, status, sortOrder,
    commissionMode, commissionType, commission, fixedCommissionPerTransaction, isCommissionInclGST,
  } = req.body

  const data = {}
  if (amount !== undefined) data.amount = amount === null || amount === '' ? null : Number(amount)
  // An explicit admin status change here pins it (or releases it) through future syncs — see
  // adminLocked on the entity and its own use in syncFromVendor.
  if (status !== undefined) {
    data.status = Boolean(status)
    data.adminLocked = !data.status
  }
  if (sortOrder !== undefined) data.sortOrder = Number(sortOrder) || 0
  if (commissionMode !== undefined) data.commissionMode = commissionMode
  if (commissionType !== undefined) data.commissionType = commissionType
  if (commission !== undefined) data.commission = Number(commission) || 0
  if (fixedCommissionPerTransaction !== undefined) data.fixedCommissionPerTransaction = Number(fixedCommissionPerTransaction) || 0
  if (isCommissionInclGST !== undefined) data.isCommissionInclGST = Boolean(isCommissionInclGST)

  if (!Object.keys(data).length) {
    return next(new ErrorResponse('Nothing to update', 400))
  }

  const result = await govtServiceUseCase.update(id, data)
  if (!result) return next(new ErrorResponse('Unable to update catalog item', 400))

  return res.status(200).json({
    status: true,
    message: 'Catalog item updated successfully',
    data: {},
    responseCode: '000'
  })
})


exports.updateStatus = asyncHandler(async (req, res, next) => {
  const { id } = req.params
  const { status } = req.body
  if (typeof status !== 'boolean') return next(new ErrorResponse('status must be a boolean', 400))

  const result = await govtServiceUseCase.update(id, { status, adminLocked: !status })
  if (!result) return next(new ErrorResponse('Unable to update status', 400))

  return res.status(200).json({
    status: true,
    message: 'Status updated successfully',
    data: {},
    responseCode: '000'
  })
})
