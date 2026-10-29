import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, beforeEach, afterEach, it, expect, Mock } from 'vitest';

import { useAppDispatch } from '@src/hooks/store';

import CancelAndBack from '../../components/CancelAndBack';
import { resetPaymentData } from '../../slices/payment';

vi.mock('@src/hooks/store', () => ({
    useAppDispatch: vi.fn(),
}));

vi.mock('../../slices/payment', () => ({
    resetPaymentData: vi.fn(),
}));

describe('CancelAndBack Component', () => {
    let mockDispatch: Mock;

    beforeEach(() => {
        mockDispatch = vi.fn();
        (useAppDispatch as Mock).mockReturnValue(mockDispatch);
        vi.spyOn(window.history, 'back').mockImplementation(() => {});
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.clearAllMocks();
        vi.useRealTimers();
    });

    it('should render the component with an image and text', () => {
        render(<CancelAndBack />);

        expect(screen.getByAltText('goback')).toBeInTheDocument();
        expect(screen.getByText('Cancel and Go Back')).toBeInTheDocument();
    });

    it('should call window.history.back when clicked', () => {
        render(<CancelAndBack />);

        const button = screen.getByText('Cancel and Go Back');
        fireEvent.click(button);

        expect(window.history.back).toHaveBeenCalled();
    });

    it('should dispatch resetPaymentData after a delay when clicked', () => {
        render(<CancelAndBack />);

        const button = screen.getByText('Cancel and Go Back');
        fireEvent.click(button);

        vi.runAllTimers(); // Fast-forward timers

        expect(mockDispatch).toHaveBeenCalledWith(resetPaymentData());
    });
});
