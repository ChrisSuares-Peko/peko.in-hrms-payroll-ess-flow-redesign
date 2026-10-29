import { paths } from '@src/routes/paths';

import { ReportType } from '../types/index';

interface ReportMeta {
    title: string;
    subtitle: string;
    price: number;
    // Heading of the right-rail summary card on the form screen.
    summaryTitle: string;
    // Route segment (relative to /turbo/vehicle-reports) the funnel continues to
    // once a vehicle has been picked.
    formPath: string;
    // Green-check rows in the right-rail summary card.
    features: string[];
}

// Copy + pricing for each report product, keyed by the `:reportType` route param.
// Drives the shared select-vehicle screen and every form's header and summary rail.
export const reportMeta: Record<ReportType, ReportMeta> = {
    valuation: {
        title: 'Valuation Report',
        subtitle: 'Fair market price range for any car across four condition grades.',
        price: 199,
        summaryTitle: 'Valuation Report',
        formPath: paths.turbo.valuationReport,
        // Figma copy (bug 30150). "Instant result" is generous — the vendor PDF takes a
        // few minutes — but the bands land on first open, and design owns this wording.
        features: ['Instant result', 'Four condition-based price bands', 'Downloadable PDF'],
    },
    history: {
        title: 'Vehicle History Report',
        subtitle: 'Full background of a vehicle pulled from official registries.',
        price: 129,
        summaryTitle: 'Vehicle History Report',
        formPath: paths.turbo.historyReport,
        // "Instant" holds: the report is built right after payment (or on first open),
        // so the user never waits. Challans come from Droom's separate challan endpoint,
        // merged in by the backend.
        features: [
            'Instant result',
            'Ownership and registration history',
            'Insurance and PUC status',
            'Blacklist, hypothecation and challan checks',
            'Downloadable PDF',
        ],
    },
    inspection: {
        title: 'Vehicle Inspection',
        subtitle: 'Get a doorstep inspection and detailed condition report from a certified Droom technician.',
        price: 599,
        summaryTitle: 'Vehicle Inspection',
        formPath: paths.turbo.inspection,
        features: [
            'Certified technician at your doorstep',
            'Condition scores and repair estimates',
            'Detailed PDF report',
        ],
    },
};

export const vehicleReportsRoot = `${paths.dashboard.turbo}/${paths.turbo.vehicleReports}`;
