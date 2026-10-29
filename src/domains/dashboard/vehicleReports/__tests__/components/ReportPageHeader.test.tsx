import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import ReportPageHeader from '../../components/shared/ReportPageHeader';

// Deliberately NOT mocking Branding/DroomLogo. This suite exists to exercise the real
// import chain — ReportPageHeader → Branding → DroomLogo → the wordmark SVG — through
// Vite's resolver.
//
// The SVG imports were previously unresolvable (the component pair lived in
// components/atomic/branding/ but its assets/ folder did not exist), which broke every
// vehicleReports page at build time while tsc and the test suite both stayed green. This
// test is what would have caught it.
describe('ReportPageHeader', () => {
    it('renders the title and the Droom attribution row', () => {
        render(<ReportPageHeader title="Vehicle Reports" subtitle="Pick a report" />);

        expect(screen.getByText('Vehicle Reports')).toBeInTheDocument();
        expect(screen.getByText('Pick a report')).toBeInTheDocument();
        expect(screen.getByText('Partnered with')).toBeInTheDocument();
    });

    // One pre-composed wordmark (droom.svg) — the per-letter composition misaligned at
    // small sizes (bug 30118).
    it('resolves the wordmark asset', () => {
        const { container } = render(<ReportPageHeader title="Vehicle Reports" />);

        const glyphs = container.querySelectorAll('img');
        expect(glyphs).toHaveLength(1);
        const src = glyphs[0].getAttribute('src');
        // An unresolved import would surface as an empty/undefined src.
        expect(src).toBeTruthy();
        expect(src).not.toBe('undefined');
    });
});
