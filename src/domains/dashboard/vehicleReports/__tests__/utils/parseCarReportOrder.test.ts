import { describe, expect, it } from 'vitest';

import { parseCarReportOrderResponse } from '../../utils/parseCarReportOrder';

describe('parseCarReportOrderResponse', () => {
    it('reads the order the backend stored on the transaction', () => {
        expect(
            parseCarReportOrderResponse(
                JSON.stringify({
                    orderId: '1754000000000',
                    reportType: 'valuation',
                    reportName: 'Valuation Report',
                    vehicleNumber: 'JK01AV0507',
                    vehicleModel: 'Kia Seltos HTX',
                })
            )
        ).toEqual({
            orderId: '1754000000000',
            reportType: 'valuation',
            reportName: 'Valuation Report',
            vehicleNumber: 'JK01AV0507',
            vehicleModel: 'Kia Seltos HTX',
        });
    });

    // orderResponse is a free-form TEXT column written by whichever service settled the
    // payment. A parse failure must degrade to "go to the order list", never throw on
    // the success page the user just landed on.
    it('never throws on missing or malformed input', () => {
        expect(parseCarReportOrderResponse(undefined)).toEqual({});
        expect(parseCarReportOrderResponse(null)).toEqual({});
        expect(parseCarReportOrderResponse('')).toEqual({});
        expect(parseCarReportOrderResponse('not json')).toEqual({});
        expect(parseCarReportOrderResponse('null')).toEqual({});
        expect(parseCarReportOrderResponse('[1,2,3]').orderId).toBeUndefined();
    });

    it('unwraps a data or order envelope', () => {
        expect(parseCarReportOrderResponse(JSON.stringify({ data: { orderId: 'A1' } })).orderId).toBe(
            'A1'
        );
        expect(
            parseCarReportOrderResponse(JSON.stringify({ order: { order_id: 'B2' } })).orderId
        ).toBe('B2');
    });

    // The id is an epoch-ms number server-side but a string in the route query.
    it('coerces a numeric id to a string', () => {
        expect(parseCarReportOrderResponse(JSON.stringify({ id: 1754000000000 })).orderId).toBe(
            '1754000000000'
        );
    });

    it('drops a report type the app cannot render', () => {
        expect(
            parseCarReportOrderResponse(JSON.stringify({ orderId: 'A1', reportType: 'teleport' }))
                .reportType
        ).toBeUndefined();
    });

    it('treats an empty id as absent so the CTA falls back to the list', () => {
        expect(parseCarReportOrderResponse(JSON.stringify({ orderId: '' })).orderId).toBeUndefined();
    });
});
