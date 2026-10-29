import React from 'react';

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, beforeEach, it, expect, vi, Mock } from 'vitest';

import BuyCreditModal from '../../../components/ProjectTable/ByCreditModal';
import useWccPayment from '../../../hooks/useWccPayment';
import { Project } from '../../../types/types';

// Mock the custom hook
vi.mock('../../../hooks/useWccPayment', () => ({
    __esModule: true,
    default: vi.fn(() => ({ handleSubmission: vi.fn() })),
}));

describe('BuyCreditModal Component', () => {
    const mockHandleCancel = vi.fn();
    const mockHandleSubmission = vi.fn();
    const mockProject: Project = {
        id: '123',
        name: 'Test Project',
        type: 'project',
        business_id: '',
        partner_id: '',
        plan_activated_on: null,
        status: '',
        sandbox: false,
        credit: 0,
        active_plan: '',
        created_at: 0,
        updated_at: 0,
        plan_renewal_on: null,
        scheduled_subscription_changes: '',
        wa_number: '',
        wa_messaging_tier: '',
        billing_currency: '',
        timezone: '',
        subscription_started_on: null,
        is_whatsapp_verified: false,
        subscription_status: '',
        daily_template_limit: 0,
        remainingQuota: 0,
    };

    beforeEach(() => {
        (useWccPayment as Mock).mockReturnValue({ handleSubmission: mockHandleSubmission });
    });

    it('renders the modal when visible', () => {
        render(<BuyCreditModal isVisible project={mockProject} handleCancel={mockHandleCancel} />);

        expect(screen.getByText(/Buy WCC Credit for Test Project/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/Enter amount/i)).toBeInTheDocument();
    });

    it('does not render the modal when not visible', () => {
        render(
            <BuyCreditModal
                isVisible={false}
                project={mockProject}
                handleCancel={mockHandleCancel}
            />
        );
        expect(screen.queryByText(/Buy WCC Credit for Test Project/i)).not.toBeInTheDocument();
    });

    it('calls handleCancel when modal is closed', () => {
        render(<BuyCreditModal isVisible project={mockProject} handleCancel={mockHandleCancel} />);

        const closeButton = screen.getByText('Cancel');
        fireEvent.click(closeButton);

        expect(mockHandleCancel).toHaveBeenCalledTimes(1);
    });

    it('validates that the amount field is required', async () => {
        render(<BuyCreditModal isVisible project={mockProject} handleCancel={mockHandleCancel} />);

        const submitButton = screen.getByRole('button', { name: /submit/i });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText(/Amount is required/i)).toBeInTheDocument();
        });
    });

    it('validates that the amount must be at least 1', async () => {
        render(<BuyCreditModal isVisible project={mockProject} handleCancel={mockHandleCancel} />);

        const input = screen.getByPlaceholderText(/Enter amount/i);
        fireEvent.change(input, { target: { value: '0' } });

        const submitButton = screen.getByRole('button', { name: /submit/i });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText(/Amount must be at least 1/i)).toBeInTheDocument();
        });
    });

    it('submits the form with valid input and calls handleSubmission', async () => {
        render(<BuyCreditModal isVisible project={mockProject} handleCancel={mockHandleCancel} />);

        const input = screen.getByPlaceholderText(/Enter amount/i);
        fireEvent.change(input, { target: { value: '100' } });

        const submitButton = screen.getByRole('button', { name: /submit/i });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(mockHandleSubmission).toHaveBeenCalledWith('100', '123');
        });
    });
});
