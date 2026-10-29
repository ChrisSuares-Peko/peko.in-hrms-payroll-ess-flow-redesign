import allProductIcon from '../assets/categories/all-product.svg';
import computerImg from '../assets/categories/computer-peripherals.png';
import electronicsImg from '../assets/categories/electronics.png';
import housekeepingImg from '../assets/categories/house-keeping.png';
import officeEquipImg from '../assets/categories/office-equipments.png';
import pantryImg from '../assets/categories/pantry.png';
import printersTonerImg from '../assets/categories/printers-toner.png';
import stationaryImg from '../assets/categories/stationary.png';

/** A subcategory item shown in the category mega-menu flyout. */
export type SubItem = { key: string; label: string; localCategory: string };
/** A titled column of subcategory items in the flyout. */
export type SubGroup = { heading: string; items: SubItem[] };

export type OfficeCategory = {
    key: string;
    label: string;
    image: string;
    /**
     * Exact `localCategory` value(s) this chip filters by — the product's
     * classified subcategory name stamped at ingestion. `null` = "All Product"
     * (show the curated carousels instead). Multiple values means "any of this
     * category's subcategories" — sent comma-joined, matched server-side via
     * `Op.in`.
     */
    localCategory: string[] | null;
    /** Subcategory groups for the mega-menu flyout. */
    subGroups?: SubGroup[];
};

/** Lean tree row from GET .../ecommerce/ondc/categories. */
export type StorefrontCategoryTreeRow = {
    id: number;
    name: string;
    displayOrder: number;
    iconUrl: string | null;
    subcategories: Array<{ id: number; name: string; displayOrder: number }>;
};

export const slugify = (value: string) =>
    value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

// Fallback for categories seeded before icons were uploaded in admin.
const CATEGORY_ICONS: Record<string, string> = {
    Stationery: stationaryImg,
    'Office Equipment': officeEquipImg,
    'Computer Peripherals': computerImg,
    'Printers & Toner': printersTonerImg,
    Electronics: electronicsImg,
    Housekeeping: housekeepingImg,
    Pantry: pantryImg,
};

/** Synthetic first chip — browse home with curated sections, no category filter. */
export const ALL_PRODUCTS_CATEGORY: OfficeCategory = {
    key: 'all',
    label: 'All Products',
    image: allProductIcon,
    localCategory: null,
};

/** Map the corporate categories API tree into CategoryBar / URL filter shape. */
export const mapStorefrontTreeToCategories = (
    tree: StorefrontCategoryTreeRow[]
): OfficeCategory[] => {
    const mapped = tree.map(parent => {
        const items: SubItem[] = parent.subcategories.map(sub => ({
            key: slugify(sub.name),
            label: sub.name,
            localCategory: sub.name,
        }));

        return {
            key: slugify(parent.name),
            label: parent.name,
            image: parent.iconUrl || CATEGORY_ICONS[parent.name] || allProductIcon,
            localCategory: items.map(item => item.localCategory),
            subGroups: items.length
                ? [{ heading: 'Subcategories', items }]
                : undefined,
        };
    });

    return [ALL_PRODUCTS_CATEGORY, ...mapped];
};
