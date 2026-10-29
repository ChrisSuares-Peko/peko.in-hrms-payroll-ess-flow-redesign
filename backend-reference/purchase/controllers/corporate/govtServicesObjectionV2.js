'use strict'

const asyncHandler = require('../../middlewares/async')
const ErrorResponse = require('../../utils/error-response')
const gateway = require('../../utils/indiaFilingsGateway')
const withRetry = require('../../utils/withRetry')

// Trademark Objection — separate from govtServicesV2.js (Trademark Registration). Only the
// Application Details lookup (doc §5) exists so far, matching the FE's own scope right now
// (components/objection/, TrademarkObjectionForm.tsx — FE-only, no route wired yet either).
// Authorized Person/People API, Objection Section/Proof Available master data, the Service
// Document API, and application creation on Submit are all still pending — see the FE's own
// TODOs in utils/objectionForm.ts for what each one will eventually replace.

// GET /application-lookup?application_number= -> the application's own details (brand/class/
// dates/applicant) fetched by application number — the driver field for the whole Application
// Details screen (doc §5: "Brand/Class/Application Date/Notice Date/Applicant Name/Applicant
// Address ... must not be typed manually"). Same vendor /trademark/search endpoint the existing
// searchSimilarTrademarksV2 uses, but search_type=info against an application number instead of
// search_type=similar against a brand name.
//
// Confirmed vendor response shape: { tm_info: {...}, identical: [...], status, search_term }.
// Passed through to the FE exactly as the vendor sends it — no reshaping/field-picking — so
// nothing here needs updating if the FE later wants a field this endpoint doesn't currently map
// (tm_info also carries goods_service_details, trade_mark_type, state, filing_mode, etc.). There's
// still no notice-date concept anywhere in this response (it's a trademark-registry record, not an
// objection-notice one) — the FE leaves that field manually-enterable instead of disabled.
exports.lookupObjectionApplicationV2 = asyncHandler(async (req, res, next) => {
  const cfg = await gateway.getConfig()
  if (cfg.error) return next(new ErrorResponse(cfg.error, 503))

  const { application_number: applicationNumber } = req.query
  if (!applicationNumber) return next(new ErrorResponse('application_number is required', 400))

  const notFoundResponse = () => res.status(200).json({
    status: false,
    message: 'No application found for this application number',
    data: null,
    responseCode: '004'
  })

  try {
    const data = await withRetry(() => gateway.searchTrademarkApplicationInfo(cfg, applicationNumber))
    // The vendor answers with HTTP 200 either way — an unmatched application number comes back
    // as a 200 with no tm_info (or an empty one), not a 404, so that's checked explicitly rather
    // than relying on withRetry's error path below to catch a "not found" case.
    if (!data?.tm_info?.application_no) return notFoundResponse()

    return res.status(200).json({
      status: true,
      message: 'Application details fetched',
      data,
      responseCode: '000'
    })
  } catch (error) {
    // A genuine 404/error from the vendor is treated the same as an in-body "not found" above —
    // doc §5: "show an error message and keep the remaining fields disabled" either way.
    if (error?.response?.status === 404) return notFoundResponse()
    return next(new ErrorResponse('Unable to fetch application details', 502))
  }
})
