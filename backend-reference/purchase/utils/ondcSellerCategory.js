/**
 * The seller category of one on_search item: its `category_id` (the key the
 * Review queue groups by — also stored on the product as categoryId) and a
 * readable label, taken from the catalog's category descriptor for that id
 * when the seller sends one (provider `categories`, catalog `categories` or
 * `bpp/categories`), else the id itself.
 *
 * @returns {{ categoryKey: string|null, label: string|null }}
 */
const sellerCategoryOf = (item = {}, vendor = {}, catalog = {}) => {
    const rawId = item?.category_id ?? (Array.isArray(item?.category_ids) ? item.category_ids[0] : null);
    const categoryKey = rawId == null || String(rawId).trim() === "" ? null : String(rawId).trim();
    if (!categoryKey) return { categoryKey: null, label: null };

    const blocks = [
        ...(Array.isArray(vendor?.categories) ? vendor.categories : []),
        ...(Array.isArray(catalog?.categories) ? catalog.categories : []),
        ...(Array.isArray(catalog?.["bpp/categories"]) ? catalog["bpp/categories"] : []),
    ];
    const match = blocks.find((c) => c?.id != null && String(c.id) === categoryKey);
    const name = match?.descriptor?.name;
    return { categoryKey, label: name && String(name).trim() ? String(name).trim() : categoryKey };
};

module.exports = { sellerCategoryOf };
