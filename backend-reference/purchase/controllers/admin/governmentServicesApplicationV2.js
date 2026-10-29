'use strict'

const asyncHandler = require('../../middlewares/async')
const ErrorResponse = require('../../utils/error-response')
const { findAllApplicationsAdmin, findByIdAdmin } = require('../../models/use-cases/governmentServicesApplication')
const { findByVendorKey } = require('../../models/use-cases/govtServicesCatalog')
const { customLog } = require('../../utils/loggerHelper')

// Admin "Govt Services Applications" report — Gov Services V2 (vendor
// catalog, e.g. Trademark Registration). Mirrors officeAndBusiness's
// businessRegistration.js admin report shape.
exports.getAllApplications = asyncHandler(async (req, res, next) => {
  try {
    const {
      page = 1,
      itemsPerPage = 20,
      status,
      paymentStatus,
      searchText,
      from,
      to,
      sort,
      sortField,
      corporateId
    } = req.query
    const parsedPage = parseInt(page, 10)
    const parsedLimit = parseInt(itemsPerPage, 10)

    const result = await findAllApplicationsAdmin({
      offset: (parsedPage - 1) * parsedLimit,
      limit: parsedLimit,
      status,
      paymentStatus,
      searchText,
      from,
      to,
      sort,
      sortField,
      corporateId
    })

    // Resolved here (one catalog lookup per distinct vendorCatalogId) rather
    // than joined into the list query, which stays summary-only.
    const catalogIds = [...new Set(result.rows.map(row => row.vendorCatalogId).filter(Boolean))]
    const catalogRows = await Promise.all(catalogIds.map(id => findByVendorKey(id)))
    const catalogByKey = new Map(catalogIds.map((id, i) => [id, catalogRows[i]]))

    const applications = result.rows.map(row => {
      const plain = row.toJSON()
      const catalogRow = catalogByKey.get(plain.vendorCatalogId)
      return {
        ...plain,
        serviceName: catalogRow?.serviceName ?? null,
        variantName: catalogRow?.variantName ?? null
      }
    })

    return res.status(200).json({
      status: true,
      message: 'Applications fetched successfully',
      data: {
        applications,
        total: result.count,
        page: parsedPage,
        limit: parsedLimit,
        totalPages: Math.ceil(result.count / parsedLimit)
      },
      responseCode: '000'
    })
  } catch (error) {
    customLog(req?.LogTraceId, 'error', { message: '[governmentServicesApplicationV2] Error fetching applications', error: error.message })
    return next(new ErrorResponse('Error fetching applications', 500))
  }
})

exports.getApplicationDetail = asyncHandler(async (req, res, next) => {
  try {
    const { id } = req.params
    const application = await findByIdAdmin(id)
    if (!application) return next(new ErrorResponse('Application not found', 404))

    const plain = application.toJSON()
    const catalogRow = plain.vendorCatalogId ? await findByVendorKey(plain.vendorCatalogId) : null

    return res.status(200).json({
      status: true,
      message: 'Application fetched successfully',
      data: {
        ...plain,
        serviceName: catalogRow?.serviceName ?? null,
        variantName: catalogRow?.variantName ?? null
      },
      responseCode: '000'
    })
  } catch (error) {
    customLog(req?.LogTraceId, 'error', { message: '[governmentServicesApplicationV2] Error fetching application', error: error.message })
    return next(new ErrorResponse('Error fetching application', 500))
  }
})
