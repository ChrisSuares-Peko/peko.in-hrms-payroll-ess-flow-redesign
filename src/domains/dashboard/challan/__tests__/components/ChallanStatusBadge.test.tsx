import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import ChallanStatusBadge from '../../components/ChallanStatusBadge';
import { ChallanStatus } from '../../types/index';

describe('ChallanStatusBadge', () => {
    it.each<ChallanStatus>(['Pending', 'Paid', 'Disposed'])(
        'renders the %s status label',
        status => {
            render(<ChallanStatusBadge status={status} />);
            expect(screen.getByText(status)).toBeInTheDocument();
        }
    );

    it('falls back to the Pending style for an unknown status', () => {
        // Unknown status still renders its own text (style falls back internally).
        render(<ChallanStatusBadge status={'Unknown' as ChallanStatus} />);
        expect(screen.getByText('Unknown')).toBeInTheDocument();
    });
});
