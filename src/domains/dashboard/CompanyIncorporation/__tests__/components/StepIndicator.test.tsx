import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import StepIndicator from '../../components/StepIndicator';

describe('StepIndicator', () => {
    it('shows the current step counter and the active step name', () => {
        render(<StepIndicator currentStep={0} />);
        // Counter is rendered in multiple responsive blocks
        expect(screen.getAllByText('Step 1 of 7').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Basic Details').length).toBeGreaterThan(0);
    });

    it('uses MOA & AOA labelling for non-LLP entities', () => {
        render(<StepIndicator currentStep={4} entityType="private_limited" />);
        expect(screen.getAllByText('MOA & AOA').length).toBeGreaterThan(0);
        expect(screen.queryByText('LLP Agreement')).toBeNull();
    });

    it('switches to LLP-specific step labels for the llp entity type', () => {
        render(<StepIndicator currentStep={4} entityType="llp" />);
        expect(screen.getAllByText('LLP Agreement').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Designated Partners & DSC/DIN').length).toBeGreaterThan(0);
        expect(screen.queryByText('MOA & AOA')).toBeNull();
    });
});
