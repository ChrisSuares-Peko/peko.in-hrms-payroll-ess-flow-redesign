import type {
    Gstr2bB2baRow,
    Gstr2bCdnRow,
    Gstr2bImpgRow,
    Gstr2bIsdRow,
    Gstr2bRow,
    Gstr2bTcsRow,
    Gstr2bTdsRow,
} from './gstr2bTypes';
import type {
    Gstr2bB2baItem,
    Gstr2bB2bItem,
    Gstr2bCdnItem,
    Gstr2bImpgItem,
    Gstr2bIsdItem,
    Gstr2bTcsItem,
    Gstr2bTdsItem,
} from '../types';

const n = (v: number | null | undefined) => v ?? 0;

const mapStatus = (imsStatus: string | null | undefined): import('./gstr2bTypes').MatchStatus => {
    const s = imsStatus?.toLowerCase() ?? '';
    if (s === 'a' || s === 'matched') return 'Matched';
    if (s === 'amended') return 'Amended';
    return 'Unmatched';
};

export const mapB2bRows = (items: Gstr2bB2bItem[]): Gstr2bRow[] =>
    items.map((item, i) => ({
        id: `b2b-${i}`,
        supplierName: item.supplierName,
        gstin: item.supplierGstin,
        invoiceNo: item.invoiceNo,
        invoiceDate: item.date,
        date: item.date,
        taxable: n(item.taxableValue),
        itc: n(item.igst) + n(item.cgst) + n(item.sgst),
        status: mapStatus(item.imsStatus),
        itcAvailable: item.itcAvailable !== false,
        reverseCharge: item.reverseCharge,
        placeOfSupply: '',
        igst: n(item.igst),
        cgst: n(item.cgst),
        sgst: n(item.sgst),
        cess: n(item.cess),
        totalTax: n(item.igst) + n(item.cgst) + n(item.sgst) + n(item.cess),
        invoiceValue: n(item.value),
    }));

export const mapB2baRows = (items: Gstr2bB2baItem[]): Gstr2bB2baRow[] =>
    items.map((item, i) => ({
        id: `b2ba-${i}`,
        supplierName: item.supplierName,
        gstin: item.supplierGstin,
        amendedInvoiceNo: item.invoiceNo,
        amendedDate: item.date,
        originalInvoice: item.origInvoiceNo,
        itc: n(item.igst) + n(item.cgst) + n(item.sgst),
        status: mapStatus(item.imsStatus),
        origTaxable: 0,
        amendTaxable: n(item.taxableValue),
        origIgst: 0,
        amendIgst: n(item.igst),
        origCgst: 0,
        amendCgst: n(item.cgst),
        origSgst: 0,
        amendSgst: n(item.sgst),
    }));

export const mapCdnRows = (items: Gstr2bCdnItem[]): Gstr2bCdnRow[] =>
    items.map((item, i) => ({
        id: `cdn-${i}`,
        supplierName: item.supplierName,
        gstin: item.supplierGstin,
        noteNo: item.noteNo,
        noteDate: item.date,
        noteType: item.noteType === 'C' ? 'Credit' : 'Debit',
        taxableValue: n(item.taxableValue),
        igst: n(item.igst),
        cgst: n(item.cgst),
        sgst: n(item.sgst),
        itc: n(item.igst) + n(item.cgst) + n(item.sgst),
        status: mapStatus(item.imsStatus),
    }));

export const mapImpgRows = (items: Gstr2bImpgItem[]): Gstr2bImpgRow[] =>
    items.map((item, i) => ({
        id: `impg-${i}`,
        supplierName: item.supplierName ?? '',
        billNo: item.boeNumber,
        billDate: item.boeDate,
        portCode: item.portCode,
        taxable: n(item.taxableValue),
        igst: n(item.igst),
        cess: n(item.cess),
        status: 'Matched' as const,
    }));

export const mapIsdRows = (items: Gstr2bIsdItem[]): Gstr2bIsdRow[] =>
    items.map((item, i) => ({
        id: `isd-${i}`,
        isdName: item.supplierName,
        isdGstin: item.supplierGstin,
        docType: item.docType,
        docNo: item.docNo,
        docDate: item.date,
        igst: n(item.igst),
        cgst: n(item.cgst),
        sgst: n(item.sgst),
        cess: n(item.cess),
        status: 'Matched' as const,
    }));

export const mapTdsRows = (items: Gstr2bTdsItem[]): Gstr2bTdsRow[] =>
    items.map((item, i) => ({
        id: `tds-${i}`,
        deductorGstin: item.deducteeGstin,
        deductorName: item.deductorName ?? '',
        tdsAmount: n(item.cgst) + n(item.sgst) + n(item.igst),
        period: item.period ?? '',
        cashLedgerCredit: n(item.amountDeducted),
        status: 'Matched' as const,
    }));

const formatPeriod = (date: string): string => {
    if (!date) return '';
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return date;
    return d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
};

export const mapTcsRows = (items: Gstr2bTcsItem[]): Gstr2bTcsRow[] =>
    items.map((item, i) => ({
        id: `tcs-${i}`,
        operatorName: item.supplierName,
        ecoGstin: item.supplierGstin,
        suppliesValue: n(item.value),
        tcsCollected: n(item.igst) + n(item.cgst) + n(item.sgst),
        period: formatPeriod(item.date),
        status: 'Matched' as const,
    }));
