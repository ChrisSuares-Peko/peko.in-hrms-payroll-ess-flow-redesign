// Mock responses for IndiaFilings endpoints that are BROKEN or missing on the
// vendor's sandbox (INDIA_FILINGS_MOCK=true). Only functions defined here are
// intercepted — every other gateway call always hits the real vendor.
//
// Currently mocked: NONE — all endpoints verified live on UAT.
//   Retired 20-07: generateDocDraft (MOA + AOA generate with working signed
//                  S3 download URLs, ~1h expiry).
//   Retired 21-07: fileSmartForm / getSmartForm (POST/GET /v3/smartservices
//                  now DEPLOYED — 422 validation errors are vendor-side data
//                  linkage questions, not availability gaps).
//
// To mock an endpoint again, export a function matching its gateway name.
