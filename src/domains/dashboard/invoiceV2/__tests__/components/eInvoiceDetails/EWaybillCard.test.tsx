import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import EWaybillCard from '../../../components/eInvoiceDetails/EWaybillCard';
import { EWaybillData } from '../../../types/eInvoiceDetails';

const data = {
    id: 'ewb-1',
    status: 'ACTIVE',
    ewbNumber: '321001234567',
    generatedOn: '2026-05-12 10:00 AM',
    transportMode: 'Road',
    vehicleNo: 'KA01AB1234',
    transDocNo: '',
    distance: '120',
    transporter: 'ACME Logistics',
} as EWaybillData;

describe('EWaybillCard', () => {
    it('renders the section title and status tag', () => {
        render(<EWaybillCard data={data} />);
        expect(screen.getByText('E-Waybill')).toBeInTheDocument();
        expect(screen.getByText('ACTIVE')).toBeInTheDocument();
    });

    it('renders all e-waybill fields', () => {
        render(<EWaybillCard data={data} />);
        expect(screen.getByText('321001234567')).toBeInTheDocument();
        expect(screen.getByText('2026-05-12 10:00 AM')).toBeInTheDocument();
        expect(screen.getByText('Road')).toBeInTheDocument();
        expect(screen.getByText('KA01AB1234')).toBeInTheDocument();
        expect(screen.getByText('120')).toBeInTheDocument();
        expect(screen.getByText('ACME Logistics')).toBeInTheDocument();
    });
});
