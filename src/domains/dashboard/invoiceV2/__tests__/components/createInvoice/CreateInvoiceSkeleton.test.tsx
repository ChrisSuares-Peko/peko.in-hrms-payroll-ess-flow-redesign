import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import CreateInvoiceSkeleton from '../../../components/createInvoice/CreateInvoiceSkeleton';

describe('CreateInvoiceSkeleton', () => {
    it('renders multiple skeleton placeholders', () => {
        const { container } = render(<CreateInvoiceSkeleton />);
        expect(container.querySelectorAll('.ant-skeleton').length).toBeGreaterThan(3);
    });
});
