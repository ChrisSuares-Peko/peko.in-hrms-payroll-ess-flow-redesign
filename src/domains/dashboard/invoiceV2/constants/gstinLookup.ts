import { GstinStatus } from '../types/gstinLookup';

export const GSTIN_STATUS_STYLES: Record<GstinStatus, string> = {
    Active: 'bg-[#ECFDF5] text-[#047857]',
    Inactive: 'bg-[#F4F4F5] text-[#475467]',
    Cancelled: 'bg-[#FEF2F2] text-[#DC2626]',
    Suspended: 'bg-[#FEF3C7] text-[#B45309]',
};

export const GSTIN_STATUS_TEXT_COLOR: Record<GstinStatus, string> = {
    Active: 'text-[#12B76A]',
    Inactive: 'text-[#475467]',
    Cancelled: 'text-[#DC2626]',
    Suspended: 'text-[#B45309]',
};

export const GSTIN_BREAKDOWN: { code: string; description: string }[] = [
    { code: '29', description: 'State code' },
    { code: 'AABCU', description: 'PAN letters 1-5' },
    { code: '9603R', description: 'PAN digits + last letter' },
    { code: '1', description: 'Entity number' },
    { code: 'Z', description: "Default 'Z'" },
    { code: 'X', description: 'Checksum digit' },
];
