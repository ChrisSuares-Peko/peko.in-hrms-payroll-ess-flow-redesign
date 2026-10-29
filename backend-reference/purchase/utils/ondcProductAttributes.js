'use strict'

const COUNTRY_NAMES = {
  IND: 'India',
  IN: 'India',
  USA: 'United States',
  US: 'United States',
  CHN: 'China',
  CN: 'China',
}

/** Look up a value inside the ONDC `tags` array by group code + item code. */
const readTag = (tags, groupCode, itemCode) => {
  if (!Array.isArray(tags)) return ''
  const group = tags.find((t) => t?.code === groupCode)
  const value = group?.list?.find((i) => i?.code === itemCode)?.value
  return value != null ? String(value).trim() : ''
}

/** Format an ONDC ISO-8601 duration (e.g. "P2D", "PT4H") as human text. */
const formatIsoDuration = (duration) => {
  if (!duration) return ''
  const match = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?)?$/i.exec(String(duration).trim())
  if (!match) return ''
  const [, days, hours, minutes] = match
  const parts = []
  const push = (count, unit) => {
    const n = parseInt(count || '', 10)
    if (n > 0) parts.push(`${n} ${unit}${n === 1 ? '' : 's'}`)
  }
  push(days, 'day')
  push(hours, 'hour')
  push(minutes, 'minute')
  return parts.join(' ')
}

const formatShippingLabel = (timeToShip) => {
  const human = formatIsoDuration(timeToShip)
  return human ? `Ships in ${human}` : ''
}

const getBrand = (tags) => readTag(tags, 'attribute', 'brand')

const getCountryOfOrigin = (tags) => {
  const code = readTag(tags, 'origin', 'country')
  if (!code) return ''
  return COUNTRY_NAMES[code.toUpperCase()] || code
}

const getHsn = (tags) =>
  readTag(tags, 'attribute', 'hsn_code') || readTag(tags, 'attribute', 'hsn')

const getGstRate = (tags) => {
  const raw =
    readTag(tags, 'attribute', 'gst_rate') ||
    readTag(tags, 'tax', 'gst') ||
    readTag(tags, 'attribute', 'gst')
  if (!raw) return ''
  const normalized = raw.includes('%') ? raw : `${raw}%`
  return `${normalized} (included in price)`
}

const getManufacturer = (statutory) =>
  statutory?.packagedCommodities?.manufacturer_or_packer_name?.trim() || ''

const getPackSize = (tags, measureValue, uom) => {
  const fromTags = readTag(tags, 'pack_config', 'set')
  if (fromTags) return fromTags
  return `${measureValue || ''} ${uom || ''}`.trim()
}

const getReturnsLabel = (returnable) => {
  if (returnable === true) return 'Returnable'
  if (returnable === false) return 'Non-returnable'
  return ''
}

/**
 * Derive admin-facing display attributes from a raw ondcProducts row.
 * Empty strings mean the UI should show "-".
 */
exports.mapAdminProductAttributes = (row) => {
  const tags = row?.tags
  const statutory = row?.statutory

  return {
    brand: getBrand(tags),
    packSize: getPackSize(tags, row?.measureValue, row?.uom),
    hsn: getHsn(tags),
    gstRate: getGstRate(tags),
    returnsLabel: getReturnsLabel(row?.returnable),
    manufacturer: getManufacturer(statutory),
    countryOfOrigin: getCountryOfOrigin(tags),
    shippingLabel: formatShippingLabel(row?.timeToShip),
  }
}

exports.formatIsoDuration = formatIsoDuration
