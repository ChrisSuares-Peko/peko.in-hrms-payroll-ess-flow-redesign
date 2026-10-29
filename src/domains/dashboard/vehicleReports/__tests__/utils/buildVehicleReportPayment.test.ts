import { describe, expect, it } from 'vitest';

import { accessKeys } from '@utils/accessKeys';

import { HistoryFormValues, SelectedVehicle } from '../../types/index';
import { buildVehicleReportPayment } from '../../utils/buildVehicleReportPayment';

const vehicle: SelectedVehicle = {
    id: 7,
    vehicleNumber: 'KA01AB1234',
    manufacturer: 'Kia',
    model: 'Seltos',
    variant: 'HTX',
    bodyType: 'SEDAN',
};

const historyValues: HistoryFormValues = { registrationNumber: 'KA01AB1234' };

describe('buildVehicleReportPayment', () => {
    it('lists the report and the vehicle as separate bill rows', () => {
        const result = buildVehicleReportPayment({
            reportType: 'history',
            vehicle,
            reportPrice: 129,
            formValues: historyValues,
        });

        expect(result.billSummary).toEqual([
            { key: 'Vehicle History Report', value: '₹ 129' },
            { key: 'Vehicle Reg.No', value: 'KA01AB1234' },
        ]);
    });

    // A manually entered vehicle has no fleet registration number, and for history the
    // plate is the only input the backend has to work with — without the fallback the
    // purchase 400s on a missing reg_num.
    it('falls back to the form plate when the vehicle has no fleet reg number', () => {
        const result = buildVehicleReportPayment({
            reportType: 'history',
            vehicle: { isManual: true },
            reportPrice: 129,
            formValues: { registrationNumber: 'HR26DD9739' },
        });

        expect(result.payload.reg_num).toBe('HR26DD9739');
    });

    it('still prefers the fleet vehicle reg number when there is one', () => {
        const result = buildVehicleReportPayment({
            reportType: 'history',
            vehicle,
            reportPrice: 129,
            formValues: { registrationNumber: 'HR26DD9739' },
        });

        expect(result.payload.reg_num).toBe('KA01AB1234');
    });

    // The backend prices from the id. A copy edit to the display name must not be able to
    // change what the customer is charged.
    it('sends the package id alongside the display name for an inspection', () => {
        const result = buildVehicleReportPayment({
            reportType: 'inspection',
            vehicle,
            reportPrice: 699,
            packageName: 'Engine Diagnostic',
            packageId: 'engine-diagnostic',
            formValues: historyValues,
        });

        expect(result.payload.packageId).toBe('engine-diagnostic');
        expect(result.payload.reportName).toBe('Engine Diagnostic');
    });

    it('omits packageId entirely for the non-package products', () => {
        const result = buildVehicleReportPayment({
            reportType: 'history',
            vehicle,
            reportPrice: 129,
            formValues: historyValues,
        });

        expect(result.payload).not.toHaveProperty('packageId');
    });

    it('prefers the inspection package name over the generic report title', () => {
        const result = buildVehicleReportPayment({
            reportType: 'inspection',
            vehicle,
            reportPrice: 699,
            packageName: 'Engine Diagnostic',
            formValues: historyValues,
        });

        expect(result.billSummary[0].key).toBe('Engine Diagnostic');
    });

    it('adds the convenience fee to the total', () => {
        const result = buildVehicleReportPayment(
            { reportType: 'valuation', vehicle, reportPrice: 199, formValues: historyValues },
            12
        );

        expect(result.totalAmount).toBe(211);
    });

    // <Summary/> auto-prefixes '₹ ' for the 'Convenience Fee' label, so a prefixed
    // value here would render as '₹ ₹ 12'.
    it('leaves the Convenience Fee value bare and prefixes Report Price', () => {
        const result = buildVehicleReportPayment(
            { reportType: 'valuation', vehicle, reportPrice: 199, formValues: historyValues },
            12
        );

        expect(result.paymentSummary).toEqual([
            { key: 'Report Price', value: '₹ 199' },
            { key: 'Convenience Fee', value: '12' },
        ]);
    });

    // "Enter details manually" goes straight to the form with an empty vehicle. The
    // valuation form collects no registration number either, so there is genuinely none
    // to send — unlike history, which falls back to the plate the form asked for.
    it('labels a manually entered vehicle without a registration number', () => {
        const result = buildVehicleReportPayment({
            reportType: 'valuation',
            vehicle: { isManual: true },
            reportPrice: 199,
            formValues: {
                purpose: 'sell',
                counterparty: '',
                vehicleCategory: 'car',
                make: 'Kia',
                model: 'Seltos',
                manufacturingYear: '2021',
                variant: 'HTX',
                kilometresDriven: '48000',
                city: 'Srinagar',
            },
        });

        // No plate exists, so the vehicle row falls back to the vehicle headline.
        expect(result.billSummary[1].value).toBe('New vehicle');
        expect(result.payload.reg_num).toBeUndefined();
        expect(result.payload.vehicle).toMatchObject({ isManual: true });
    });

    it('sends the vehicle-reports accessKey and the flattened form values', () => {
        const result = buildVehicleReportPayment({
            reportType: 'history',
            vehicle,
            reportPrice: 129,
            formValues: historyValues,
        });

        expect(result.payload).toMatchObject({
            accessKey: accessKeys.vehicleReports,
            reportType: 'history',
            reg_num: 'KA01AB1234',
            registrationNumber: 'KA01AB1234',
            vehicle: {
                make: 'Kia',
                model: 'Seltos',
                variant: 'HTX',
                bodyType: 'SEDAN',
                isManual: false,
            },
        });
    });
});
