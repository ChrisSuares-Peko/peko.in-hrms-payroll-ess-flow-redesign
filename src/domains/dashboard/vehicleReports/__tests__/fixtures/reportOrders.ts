import { ReportOrderDetail } from '../../types/index';

// A trimmed copy of what officeAndBusiness's /garage/car-report/orders endpoint returns.
// Lives here rather than in utils/data.ts so production code carries no mock orders.
export const reportOrderFixtures: ReportOrderDetail[] = [
    {
        orderId: 'CR-1050',
        reportType: 'valuation',
        reportName: 'Valuation Report',
        vehicleNumber: 'JK01AV0507',
        vehicleModel: 'Kia Seltos',
        orderDate: '2026-07-20',
        amount: 199,
        status: 'Building',
        paymentMode: 'Wallet',
        bodyType: 'SEDAN',
        // Still building: the vendor PDF has not arrived, so the backend omits
        // `valuation` entirely and the page shows the progress tracker.
        steps: [
            { label: 'Order Placed', state: 'done' },
            { label: 'Building Report', state: 'active' },
            { label: 'Report Ready', state: 'pending' },
        ],
    },
    {
        orderId: 'CR-1054',
        reportType: 'valuation',
        reportName: 'Valuation Report',
        vehicleNumber: 'JK01AV0507',
        vehicleModel: 'Kia Seltos',
        orderDate: '2026-07-24',
        amount: 199,
        status: 'Ready',
        paymentMode: 'Wallet',
        steps: [
            { label: 'Order Placed', state: 'done' },
            { label: 'Building Report', state: 'done' },
            { label: 'Report Ready', state: 'done' },
        ],
        valuation: {
            modelName: 'Kia Seltos HTX',
            year: '2021',
            kilometres: '48,000 km',
            city: 'Srinagar',
            reportUrl: 'https://img1.orangebookvalue.com/photos/premium_reports/sample.pdf',
            bands: [
                { grade: 'Excellent', min: 1120000, max: 1185000 },
                { grade: 'Very good', min: 1050000, max: 1120000 },
                { grade: 'Good', min: 965000, max: 1050000 },
                { grade: 'Fair', min: 880000, max: 965000 },
            ],
        },
    },
    // A cancelled order carries no result — the detail page must still render.
    {
        orderId: 'CR-1059',
        reportType: 'valuation',
        reportName: 'Valuation Report',
        vehicleNumber: 'JK01AV0507',
        vehicleModel: 'Kia Seltos',
        orderDate: '2026-07-28',
        amount: 199,
        status: 'Cancelled',
        paymentMode: 'Wallet',
        steps: [
            { label: 'Order Placed', state: 'done' },
            { label: 'Building Report', state: 'pending' },
            { label: 'Report Ready', state: 'pending' },
        ],
    },
    // A materialised history order — the backend has already normalised Droom's RC
    // payload into these display strings, so the card renders them verbatim.
    {
        orderId: 'CR-1061',
        reportType: 'history',
        reportName: 'Vehicle History Report',
        vehicleNumber: 'HR26DD9739',
        vehicleModel: 'HYUNDAI MOTOR INDIA LTD CRETA VTVT 1.6 SX PLUS AUTO',
        orderDate: '2026-08-01',
        amount: 129,
        status: 'Ready',
        paymentMode: 'Wallet',
        bodyType: 'S.U.V.',
        reportUrl:
            'https://cdn1.acedms.com/vehicle_history/platinum/HR26DD9739_platinum_history_report.pdf',
        steps: [
            { label: 'Order Placed', state: 'done' },
            { label: 'Building Report', state: 'done' },
            { label: 'Report Ready', state: 'done' },
        ],
        history: {
            modelName: 'HYUNDAI MOTOR INDIA LTD CRETA VTVT 1.6 SX PLUS AUTO',
            registrationNumber: 'HR26DD9739',
            ownership: 'KHUSHBU KUMARI (Owner 1)',
            registration: '21 Apr 2017 · SDM GURUGRAM, HARYANA',
            insurance: 'HDFC ERGO GENERAL INSURANCE COMPANY LTD · valid to 27 Mar 2027',
            puc: 'Valid to 06 Jun 2026',
            blacklist: 'Not blacklisted',
            hypothecation: 'Yes — loan on record',
            bodyType: 'S.U.V.',
            fuelType: 'PETROL',
        },
    },
    // A booked inspection. Unlike the other two, the result is the customer's own request
    // captured at purchase — Droom returns no booking body.
    {
        orderId: 'CR-1065',
        reportType: 'inspection',
        reportName: 'Self Inspection',
        vehicleNumber: 'KA01AB1234',
        vehicleModel: 'Kia Seltos HTX',
        orderDate: '2026-08-03',
        amount: 599,
        status: 'Booked',
        paymentMode: 'Wallet',
        bodyType: 'SUV',
        steps: [
            { label: 'Booked', state: 'done' },
            { label: 'Technician Assigned', state: 'active' },
            { label: 'Inspection Completed', state: 'pending' },
            { label: 'Quality Check', state: 'pending' },
            { label: 'Report Ready', state: 'pending' },
        ],
        inspection: {
            slot1: '2026-08-05 14:00:00',
            slot2: '2026-08-06 10:00:00',
            address: '221B Residency Road, Bengaluru, Karnataka — 560001',
        },
    },
    // A history order still being built — no result yet, and the page must not blank out.
    {
        orderId: 'CR-1063',
        reportType: 'history',
        reportName: 'Vehicle History Report',
        vehicleNumber: 'KA01AB1234',
        vehicleModel: 'KA01AB1234',
        orderDate: '2026-08-02',
        amount: 129,
        status: 'Building',
        paymentMode: 'Wallet',
        steps: [
            { label: 'Order Placed', state: 'done' },
            { label: 'Building Report', state: 'active' },
            { label: 'Report Ready', state: 'pending' },
        ],
    },
];
