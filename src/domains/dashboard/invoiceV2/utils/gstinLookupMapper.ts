import { GstinApiResponse, GstinDetails, GstinIrnFields, GstinStatus } from '../types/gstinLookup';

const STATUS_MAP: Record<string, GstinStatus> = {
    ACT: 'Active',
    INA: 'Inactive',
    CNL: 'Cancelled',
    SUO: 'Suspended',
};

const TXP_TYPE_MAP: Record<string, string> = {
    REG: 'Regular',
    CMP: 'Composition',
    URP: 'Unregistered',
};

const buildAddress = (data: GstinApiResponse): string => {
    const parts = [
        data.AddrBnm,
        data.AddrBno,
        data.AddrFlno,
        data.AddrSt,
        data.AddrLoc,
        data.StateName,
        data.AddrPncd ? String(data.AddrPncd) : null,
    ].filter(p => p && p.trim());
    return parts.join(', ') || '—';
};

const buildStreetAddress = (data: GstinApiResponse): string => {
    const parts = [data.AddrBnm, data.AddrBno, data.AddrFlno, data.AddrSt].filter(
        p => p && p.trim()
    );
    return parts.join(', ');
};

export const mapGstinToIrnFields = (data: GstinApiResponse): GstinIrnFields => ({
    legalName: (data.LegalName || '').trim(),
    tradeName: (data.TradeName || '').trim(),
    address1: buildStreetAddress(data).trim(),
    location: (data.AddrLoc || '').trim(),
    pinCode: data.AddrPncd ? String(data.AddrPncd).trim() : '',
    state: (data.StateName || '').trim(),
});

export const mapGstinApiToDetails = (data: GstinApiResponse): GstinDetails => ({
    gstin: data.Gstin,
    legalName: data.LegalName || 'N/A',
    tradeName: data.TradeName || 'N/A',
    stateName: data.StateName || 'N/A',
    registrationType: TXP_TYPE_MAP[data.TxpType] ?? data.TxpType,
    status: STATUS_MAP[data.Status] ?? 'Inactive',
    registrationDate: data.DtReg || 'N/A',
    registeredAddress: buildAddress(data),
});
