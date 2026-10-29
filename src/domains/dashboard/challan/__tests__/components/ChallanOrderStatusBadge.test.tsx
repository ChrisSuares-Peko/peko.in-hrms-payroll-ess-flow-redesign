import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import ChallanOrderStatusBadge from '../../components/ChallanOrderStatusBadge';
import { ChallanOrderStatus } from '../../types/index';

describe('ChallanOrderStatusBadge', () => {
    it.each<ChallanOrderStatus>([
        'Assigned',
        'Processing',
        'Challan Partially Resolved',
        'Challan Completely Resolved',
        'Partially Refunded',
        'Completely Refunded',
        'Failed',
    ])('renders the %s order-status label', status => {
        render(<ChallanOrderStatusBadge status={status} />);
        expect(screen.getByText(status)).toBeInTheDocument();
    });
});
