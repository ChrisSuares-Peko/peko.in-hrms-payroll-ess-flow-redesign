import { Scope } from '@src/enums/enums';

import { CountryCode, PhoneCode } from './airlineTypes';

export type APIPayload = {
    userType: string;
    userId: number;
};

export type SearchAirportPayload = APIPayload & {
    loc: string;
};
export type GetBookingsListPayload = APIPayload & {
    page: number;
    availability: string;
};
export type DownloadTicketPayload = APIPayload & {
    orderId: number | string;
};

export type FetchCancelationCharge = APIPayload & {
    bookingId: number | string;
};

export type IAncSearchPostData = {
    offerId: string;
    conversationId: string;
    supplierLocator: string | null;
    isLcc: boolean;
};

export type IAncSearchPayload = APIPayload & {
    postData: {
        offerId: string;
        conversationId: string;
        supplierLocator: string | null;
        isLcc: boolean;
    };
};

export type IAncProvBookPayload = {
    userId: number;
    userType: string;
    postData: {
        selectedAncillaries: Array<{
            ancType?: string;
            ancillaryOfferId: string;
            passengerKey: string;
            segmentKey: string;
        }>;
        conversationId: string;
        isLcc: boolean;
        offerId: string;
    };
};

export type IAncCancellationPostData = {
    flightBookingId: number;
    reasonForCancellation: string;
    otp: string;
    scope: Scope.EMAIL;
};

export type IAncCancellationPayload = APIPayload & {
    postData: IAncCancellationPostData;
};

export type FareRulePayload = APIPayload & {
    TraceId: string;
    ResultIndex: string;
    InbountResultIndex?: string;
};

export type GetBookingDetailsPayload = APIPayload & {
    id: number | string;
};

export type BookingDetailsRes = {
    id: number;
    corporateTxnId: string;
    operatorId: string;
    providerId: string;
    transactionDate: string;
    accountNo: string | null;
    amountInINR: string;
    baseAmount: string;
    paymentMode: string;
    orderResponse: any; // Typing as any for flexibility
    paymentModeResponse: any | null;
    surcharge: string;
    baseCurrency: string;
    exchangeRate: string;
    status: string;
    message: string;
    ecomOrderStatus: string;
    workspaceOrderStatus: string;
    shipmentStatus: string[];
    createdAt: string;
    updatedAt: string;
    serviceOperatorId: number;
    credentialId: number;
};

export type otpPayload = {
    userId: number;
    userType: string;
    scope: string;
    id: number;
};

export type CountryList = {
    countryCodes: CountryCode[];
};

export type PhoneCodeList = {
    phoneCodes: PhoneCode[];
};
