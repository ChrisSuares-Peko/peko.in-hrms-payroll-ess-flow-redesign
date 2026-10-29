import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import CardRowsSkeleton from '../../../components/shared/CardRowsSkeleton';

describe('CardRowsSkeleton', () => {
    it('renders 5 rows by default', () => {
        const { container } = render(<CardRowsSkeleton />);
        expect(container.querySelectorAll('.ant-skeleton').length).toBeGreaterThanOrEqual(5);
    });

    it('renders the requested number of rows', () => {
        const { container } = render(<CardRowsSkeleton count={2} />);
        const rows = container.querySelectorAll('[class*="bg-white"]');
        expect(rows.length).toBe(2);
    });
});
