export type Fare = {
    buyingCurrency: string;
    buyingAmount: number;
    sellingCurrency: string;
    sellingAmount: number;
};

export type AncillaryOffer = {
    ancillaryOfferId: string;
    fare: Fare;
    success: boolean;
    priceChanged: boolean;
};

export type Meta = {
    success: boolean;
    statusCode: number;
    statusMessage: string;
    actionType: string;
    conversationId: string;
};

export type CommonData = {
    searchKey: string;
    productCode: string;
};

export type AncProvBookSuccessResponse = {
    conversationId: string;
    meta: Meta;
    commonData: CommonData;
    data: AncillaryOffer[];
    version: string;
};
