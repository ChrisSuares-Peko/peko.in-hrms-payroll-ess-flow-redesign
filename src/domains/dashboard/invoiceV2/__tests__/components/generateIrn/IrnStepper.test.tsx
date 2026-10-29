import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import IrnStepper from '../../../components/generateIrn/IrnStepper';

describe('IrnStepper', () => {
    it('renders all 5 step titles', () => {
        render(<IrnStepper currentFormStep={0} />);
        ['Transaction', 'Seller', 'Buyer', 'Items', 'Review'].forEach(title => {
            expect(screen.getByText(title)).toBeInTheDocument();
        });
    });

    it('marks current step as active and earlier steps as completed', () => {
        const { container } = render(<IrnStepper currentFormStep={2} />);
        // Step 3 (Buyer) is active → red bg
        const stepsRow = container.firstChild as HTMLElement;
        const circles = stepsRow.querySelectorAll('.rounded-full');
        // index 0 (Transaction step 1) → completed
        expect(circles[0].className).toContain('#DCFCE7');
        // index 1 (Seller step 2) → completed
        expect(circles[1].className).toContain('#DCFCE7');
        // index 2 (Buyer step 3) → active (red)
        expect(circles[2].className).toContain('#FF4F4F');
        // index 3 (Items step 4) → upcoming
        expect(circles[3].className).toContain('border-[#E4E4E7]');
    });

    it('shows checkmark icons on completed steps', () => {
        const { container } = render(<IrnStepper currentFormStep={4} />);
        // 4 completed (steps 1-4) → 4 checkmark icons
        expect(container.querySelectorAll('.anticon-check').length).toBe(4);
    });
});
