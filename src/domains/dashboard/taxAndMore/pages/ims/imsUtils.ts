import {
    ImsInvoice,
    ImsInvoiceStatus,
    ImsSupplier,
    ImsSupplierFlag,
    ImsSupplierGroup,
} from '../../types';

export const fmt = (n: number) =>
    n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const mapImsAction = (action: string): ImsInvoiceStatus => {
    if (action === 'noaction') return 'to-review';
    return action as ImsInvoiceStatus;
};

export const mapApiSuppliers = (groups: ImsSupplierGroup[]): ImsSupplier[] =>
    groups.map((group, idx) => {
        const invoices: ImsInvoice[] = group.invoices.map(inv => ({
            id: String(inv.id),
            type: inv.invoiceType,
            invoiceNo: inv.invoiceNo,
            date: inv.invoiceDate ?? '',
            taxable: parseFloat(inv.taxableAmount),
            tax: parseFloat(inv.totalTax),
            status: mapImsAction(inv.imsAction),
        }));
        const flags: ImsSupplierFlag[] = [];
        if (group.gstr1NotFiled) flags.push('GSTR-1 not filed');
        if (group.isItcBlocked) flags.push('ITC Blocked');
        const total = group.invoices.reduce((s, i) => s + parseFloat(i.totalTax), 0);
        return {
            id: String(idx),
            name: group.supplierName ?? group.supplierGstin,
            gstin: group.supplierGstin,
            flags,
            accepted: group.accepted,
            pending: group.pending,
            rejected: group.rejected,
            total,
            invoices,
        };
    });

export const STATUS_LABELS: Record<ImsInvoiceStatus, string> = {
    accepted: 'Accepted',
    pending: 'Pending',
    rejected: 'Rejected',
    'to-review': 'To Review',
};

export const getStatusBg = (s: ImsInvoiceStatus) => {
    if (s === 'accepted') return '#ecfdf5';
    if (s === 'pending') return '#fffbeb';
    if (s === 'rejected') return '#fef2f2';
    return '#f8fafc';
};

export const getStatusColor = (s: ImsInvoiceStatus) => {
    if (s === 'accepted') return '#43b75d';
    if (s === 'pending') return '#f59e0b';
    if (s === 'rejected') return '#ef4444';
    return '#475569';
};

export const getFlagBg = (f: ImsSupplierFlag) => (f === 'ITC Blocked' ? '#fef2f2' : '#fffbeb');
export const getFlagColor = (f: ImsSupplierFlag) => (f === 'ITC Blocked' ? '#ef4444' : '#f59e0b');

export type TypeTab = 'all' | 'b2b' | 'amendments' | 'notes' | 'ecommerce';
export const TYPE_TABS: { key: TypeTab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'b2b', label: 'B2B' },
    { key: 'amendments', label: 'Amendments' },
    { key: 'notes', label: 'Notes' },
    { key: 'ecommerce', label: 'E-Commerce' },
];

export type StatusFilter = 'all' | 'to-review' | 'accepted' | 'rejected' | 'pending';
export const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'to-review', label: 'To Review' },
    { key: 'accepted', label: 'Accepted' },
    { key: 'rejected', label: 'Rejected' },
    { key: 'pending', label: 'Pending' },
];

export const MONTH_NAMES = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
];

export const getMonthOptions = (fyStart?: number) => [
    { value: 4, label: fyStart ? `April ${fyStart}` : 'April' },
    { value: 5, label: fyStart ? `May ${fyStart}` : 'May' },
    { value: 6, label: fyStart ? `June ${fyStart}` : 'June' },
    { value: 7, label: fyStart ? `July ${fyStart}` : 'July' },
    { value: 8, label: fyStart ? `August ${fyStart}` : 'August' },
    { value: 9, label: fyStart ? `September ${fyStart}` : 'September' },
    { value: 10, label: fyStart ? `October ${fyStart}` : 'October' },
    { value: 11, label: fyStart ? `November ${fyStart}` : 'November' },
    { value: 12, label: fyStart ? `December ${fyStart}` : 'December' },
    { value: 1, label: fyStart ? `January ${fyStart + 1}` : 'January' },
    { value: 2, label: fyStart ? `February ${fyStart + 1}` : 'February' },
    { value: 3, label: fyStart ? `March ${fyStart + 1}` : 'March' },
];

export const SELECT_STYLE = {
    height: 32,
    fontSize: 12,
    fontWeight: 500,
    color: '#475569',
};
