import { ReportType, isReportType } from '../types/index';

// The slice of the car report order the backend stores on the transaction row's
// `orderResponse` when payment settles (see payment/controllers/corporate/carReport.js).
// Everything is optional: this is the only bridge between the shared payment flow and
// the order it created, and a missing field must degrade to "go to the order list"
// rather than a dead deep link.
export interface CarReportOrderStub {
    orderId?: string;
    reportType?: ReportType;
    reportName?: string;
    vehicleNumber?: string;
    vehicleModel?: string;
}

const unwrap = (parsed: unknown): Record<string, unknown> => {
    if (!parsed || typeof parsed !== 'object') return {};
    const root = parsed as Record<string, unknown>;
    // Tolerate the envelope shapes the backend could wrap this in.
    const inner = root.data ?? root.order;
    if (inner && typeof inner === 'object') return inner as Record<string, unknown>;
    return root;
};

const asString = (value: unknown): string | undefined => {
    if (value === null || value === undefined || value === '') return undefined;
    // The order id is an epoch-ms number server-side; the route param is a string.
    if (typeof value === 'number') return String(value);
    return typeof value === 'string' ? value : undefined;
};

// Never throws — `orderResponse` is a free-form TEXT column written by whichever service
// settled the payment, so it is parsed defensively rather than trusted.
export const parseCarReportOrderResponse = (raw?: string | null): CarReportOrderStub => {
    if (!raw) return {};

    let parsed: unknown;
    try {
        parsed = JSON.parse(raw);
    } catch (err) {
        return {};
    }

    const source = unwrap(parsed);
    const reportType = asString(source.reportType);

    return {
        orderId: asString(source.orderId ?? source.order_id ?? source.id),
        // Only surface a report type the app actually knows how to render.
        reportType: isReportType(reportType) ? reportType : undefined,
        reportName: asString(source.reportName),
        vehicleNumber: asString(source.vehicleNumber),
        vehicleModel: asString(source.vehicleModel),
    };
};
