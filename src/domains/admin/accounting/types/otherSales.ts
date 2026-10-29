import { Posting } from './posting';
import { AccountScope } from '../utils/accountScope';

export interface OtherSaleEntry {
    id: number;
    corporateTxnId: string;
    transactionDate: string;
    service: string | null;
    vendorId: number | null;
    vendorName: string | null;
    partnerName: string | null;
    totalAmount: number | null;
    platformFee: number | null;
    markup: number | null;
    couponDiscount: number | null;
    status: string | null;
    posting: Posting;
}

export interface OtherSalesTotals {
    totalAmount: number;
    platformFee: number;
    markup: number;
    couponDiscount: number;
}

export interface OtherSalesResponse {
    entries: OtherSaleEntry[];
    recordsTotal: number;
    totals: OtherSalesTotals;
    page: number;
    itemsPerPage: number;
}

export interface OtherSalesFilters {
    page: number;
    itemsPerPage: number;
    searchText: string;
    from: string;
    to: string;
    vendorId?: number | string;
    partnerId?: number | string;
    accounts?: AccountScope;
    sort?: 'ASC' | 'DESC';
    sortField?: string;
}
