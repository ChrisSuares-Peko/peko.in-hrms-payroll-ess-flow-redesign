export type GiftCardsBody = {
    id: number;
    product_id: string;
    brand_logo:
        | string
        | {
              imageBase: string;
              imageFormat: string;
          };
    // Xoxoday populates `image` instead of `brand_logo` on the raw gift card record.
    image?: string;
    brand_name: string;
    product_name: string;
    merchant_id: string;
    merchant_name: string;
    // mrp: string;
    // selling_price: string;
    min_price: string;
    max_price: string;
    expiry: string;
    is_open_denominnation: boolean;
    gv_type: string;
    denominations: [];
    // terms_and_condition: string;
    // how_to_redeem: string;
    status: boolean;
    createdAt: string;
    sold_quantity: number;
    serviceOperatorId: number | null;
    priceType: string;
    usageType: string;
    commissionMode?: 'MARGIN' | 'AGENT_MARKUP' | 'PRINCIPAL_MARKUP';
    commissionType?: 'PERCENTAGE' | 'FLAT';
    commission?: number;
    fixedCommissionPerTransaction?: number;
    isCommissionInclGST?: boolean;
};

export type GiftCardsFormValues = {
    id: number;
    product_id: string;
    product_name: string;
    // mrp: string | number;
    // selling_price: string | number;
    min_price: string | number;
    max_price: string | number;
    priceType: string;
    usageType: string;
    // Populated at submit time instead of usageType for Edenred records — see
    // deriveUsageField in Modal.tsx.
    gv_type?: string;
    denominations: [];
    // terms_and_condition: string;
    // how_to_redeem: string;
    commissionMode?: 'MARGIN' | 'AGENT_MARKUP' | 'PRINCIPAL_MARKUP';
    commissionType?: 'PERCENTAGE' | 'FLAT';
    commission?: string | number;
    fixedCommissionPerTransaction?: string | number;
    isCommissionInclGST?: boolean;
};

export type GiftCardsWithoutID = Omit<GiftCardsFormValues, 'id'>;

export type ApiResponseGiftCards = {
    draw: number;
    recordsTotal: number;
    recordsFiltered: number;
    data: GiftCardsBody[];
};

export type getGiftCards = {
    page: number;
    searchText: string;
    itemsPerPage: number;
    sort: 'ASC' | 'DESC';
    sortField?: string;
};

export type updateGiftCardsStatusPayload = {
    status: boolean;
    giftCardId: string | number;
};

export type GiftCardsID = Omit<updateGiftCardsStatusPayload, 'status'>;

export type IVendor = {
    id: number;
    accessKey: string;
    serviceProvider: string;
};

export type IVendorsListingResponse = {
    data: IVendor[];
};

export type autoUpdatePayload = {
    status: boolean;
    serviceOperatorId: string | number;
};

export type IAutoUpdateStatusResponse = {
    data: string[];
    message?: string;
};

export type IAutoUpdateResponse = {
    giftCards: GiftCardsBody[];
    message?: string;
};
export type RolePermissionAccessData = {
    view?: boolean;
    write?: boolean;
    update?: boolean;
};
