import React from 'react';

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import StepIndicator from '../../../components/createAgreement/StepIndicator';

describe('StepIndicator', () => {
    it('renders 5 steps with the active step number visible and earlier steps marked done', () => {
        render(<StepIndicator current={3} />);

        // Steps not yet reached show their step number; active shows its own number; done shows tick image.
        // current=3 → step 1 + 2 are "done" (image), step 3 active (shows "3"), 4 + 5 pending (show "4" and "5").
        expect(screen.getByText('3')).toBeInTheDocument();
        expect(screen.getByText('4')).toBeInTheDocument();
        expect(screen.getByText('5')).toBeInTheDocument();
        // 1 and 2 are done — they should NOT show numbers.
        expect(screen.queryByText('1')).not.toBeInTheDocument();
        expect(screen.queryByText('2')).not.toBeInTheDocument();
    });

    it('renders all numbers when current is 1', () => {
        render(<StepIndicator current={1} />);

        ['1', '2', '3', '4', '5'].forEach(n => {
            expect(screen.getByText(n)).toBeInTheDocument();
        });
    });
});
