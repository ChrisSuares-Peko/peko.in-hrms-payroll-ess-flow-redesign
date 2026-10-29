import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import GstinFormatCard from '../../../components/gstinLookup/GstinFormatCard';
import { GSTIN_BREAKDOWN } from '../../../constants/gstinLookup';

describe('GstinFormatCard', () => {
    it('renders the GSTIN Format title and sample value', () => {
        render(<GstinFormatCard />);
        expect(screen.getByText('GSTIN Format')).toBeInTheDocument();
        expect(screen.getByText('29AABCU9603R1ZX')).toBeInTheDocument();
    });

    it('renders all breakdown rows from constants', () => {
        render(<GstinFormatCard />);
        GSTIN_BREAKDOWN.forEach(({ code }) => {
            expect(screen.getByText(code)).toBeInTheDocument();
        });
    });
});
