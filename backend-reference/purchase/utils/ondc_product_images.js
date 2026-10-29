/**
 * Product image URLs we will persist and show. Matches storefront rules:
 * non-empty http(s), not a seller placeholder / "no image" asset.
 *
 * HAS_USABLE_PRODUCT_IMAGE_SQL hides already-saved bad rows from top-deals;
 * hasUsableProductImage gates on_search ingest so those rows are not inserted.
 */

const PLACEHOLDER_RE = /placeholder|no[_-]?image|image[_-]?not[_-]?available/i

const imageUrlFrom = (value) => {
    if (value && typeof value === 'object' && value.url != null) return value.url
    return value
}

exports.isUsableImageUrl = (value) => {
    const url = String(imageUrlFrom(value) || '').trim()
    if (!url) return false
    if (!/^https?:\/\//i.test(url)) return false
    const lower = url.toLowerCase()
    if (lower === 'http://' || lower === 'https://') return false
    if (lower === 'null' || lower === 'undefined') return false
    if (PLACEHOLDER_RE.test(url)) return false
    return true
}

/** Usable http(s) URLs from a descriptor.images array (strings or {url}). */
exports.usableImageUrls = (images) => {
    if (!Array.isArray(images)) return []
    return images
        .map((entry) => String(imageUrlFrom(entry) || '').trim())
        .filter((url) => exports.isUsableImageUrl(url))
}

/**
 * True when the catalog item has at least one usable images[] URL or a usable
 * descriptor.symbol (treated as a fallback image, same as listing SQL).
 */
exports.hasUsableProductImage = (product) => {
    if (exports.usableImageUrls(product?.images).length) return true
    return exports.isUsableImageUrl(product?.symbol)
}

exports.HAS_USABLE_PRODUCT_IMAGE_SQL = `(
  (
    images IS NOT NULL
    AND JSON_TYPE(images) = 'ARRAY'
    AND JSON_LENGTH(images) > 0
    AND NULLIF(TRIM(JSON_UNQUOTE(JSON_EXTRACT(images, '$[0]'))), '') IS NOT NULL
    AND LOWER(JSON_UNQUOTE(JSON_EXTRACT(images, '$[0]'))) NOT IN ('null', 'undefined')
    AND (
      JSON_UNQUOTE(JSON_EXTRACT(images, '$[0]')) LIKE 'http://%'
      OR JSON_UNQUOTE(JSON_EXTRACT(images, '$[0]')) LIKE 'https://%'
    )
  )
  OR (
    symbol IS NOT NULL
    AND TRIM(symbol) <> ''
    AND LOWER(TRIM(symbol)) NOT IN ('null', 'undefined')
    AND (symbol LIKE 'http://%' OR symbol LIKE 'https://%')
  )
)`
