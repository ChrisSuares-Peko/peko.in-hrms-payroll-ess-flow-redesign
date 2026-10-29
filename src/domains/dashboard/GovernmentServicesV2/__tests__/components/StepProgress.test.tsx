import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import StepProgress from '../../components/StepProgress';

const steps = ['Details', 'Payment', 'Tracking'];

const circle = (n: number) => screen.getByText(String(n));

describe('StepProgress', () => {
    it('renders a numbered circle and label per step', () => {
        render(<StepProgress steps={steps} currentStep={0} />);

        steps.forEach((label, i) => {
            expect(screen.getByText(label)).toBeInTheDocument();
            expect(circle(i + 1)).toBeInTheDocument();
        });
    });

    it('colours completed and active circles red, upcoming ones grey', () => {
        render(<StepProgress steps={steps} currentStep={1} />);

        expect(circle(1)).toHaveClass('bg-[#ff4f4f]');
        expect(circle(2)).toHaveClass('bg-[#ff4f4f]');
        expect(circle(3)).toHaveClass('bg-[#f5f5f5]');
    });

    it('highlights only the active label', () => {
        render(<StepProgress steps={steps} currentStep={1} />);

        expect(screen.getByText('Payment')).toHaveClass('text-[#0b0b0b]');
        expect(screen.getByText('Details')).toHaveClass('text-[#8d8d8d]');
        expect(screen.getByText('Tracking')).toHaveClass('text-[#8d8d8d]');
    });

    it('renders connectors between steps, red only before the current step', () => {
        const { container } = render(<StepProgress steps={steps} currentStep={1} />);

        const connectors = container.querySelectorAll('.h-px');
        expect(connectors).toHaveLength(2);
        expect(connectors[0]).toHaveClass('bg-[#ff4f4f]');
        expect(connectors[1]).toHaveClass('bg-[#e5e5e5]');
    });

    it('renders no connector for a single step', () => {
        const { container } = render(<StepProgress steps={['Only']} currentStep={0} />);

        expect(container.querySelectorAll('.h-px')).toHaveLength(0);
    });

    it('renders nothing but the wrapper for an empty step list', () => {
        const { container } = render(<StepProgress steps={[]} currentStep={0} />);

        expect(container.firstChild).toBeEmptyDOMElement();
    });
});
