import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import FormComponent from '../../components/FormComponent';

const mockHandleSubmission = vi.fn();
vi.mock('../../hooks/useForm', () => ({
    default: () => ({
        handleSubmission: mockHandleSubmission,
    }),
}));

describe('FormComponent', () => {
    const mockProps = {
        planId: '123',
        workId: 1,
        price: '999',
        planName: 'Pro Plan',
        workName: 'Work A',
    };
    beforeEach(() => {
        cleanup();
        vi.clearAllMocks();
        // (useForm as Mock).mockReturnValue({
        //   handleSubmission: mockHandleSubmission,
        // });
    });
    it('should render all input fields correctly', () => {
        render(<FormComponent {...mockProps} />);
        expect(screen.getByPlaceholderText(/Enter POC Name/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/Enter Email ID/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/Enter requirement/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Submit/i })).toBeInTheDocument();
    });

    it('should show validation errors for required fields', async () => {
        render(<FormComponent {...mockProps} />);
        fireEvent.submit(screen.getByRole('button', { name: /Submit/i }));

        await waitFor(() => {
            expect(screen.getByText(/Please enter the POC name/i)).toBeInTheDocument();
            expect(screen.getByText(/Please enter the email ID/i)).toBeInTheDocument();
            expect(screen.getByText(/Please enter the requirements/i)).toBeInTheDocument();
        });
    });

    it('should allow valid inputs and trigger submission', async () => {
        render(<FormComponent {...mockProps} />);

        fireEvent.change(screen.getByPlaceholderText(/Enter POC Name/i), {
            target: { value: 'John Doe' },
        });
        fireEvent.change(screen.getByPlaceholderText(/Enter Email ID/i), {
            target: { value: 'john@example.com' },
        });
        fireEvent.change(screen.getByPlaceholderText(/Enter requirement/i), {
            target: { value: 'I need a detailed plan' },
        });

        fireEvent.submit(screen.getByRole('button', { name: /Submit/i }));

        await waitFor(() => {
            expect(mockHandleSubmission).toHaveBeenCalledWith({
                pocName: 'John Doe',
                email: 'john@example.com',
                requirement: 'I need a detailed plan',
                planId: '123',
                workId: 1,
                price: '999',
                planName: 'Pro Plan',
            });
        });
    });

    it('should clear validation errors when user provides valid input', async () => {
        render(<FormComponent {...mockProps} />);

        fireEvent.submit(screen.getByRole('button', { name: /Submit/i }));

        await waitFor(() => {
            expect(screen.getByPlaceholderText(/Enter POC Name/i)).toBeInTheDocument();
            expect(screen.getByPlaceholderText(/Enter Email ID/i)).toBeInTheDocument();
            expect(screen.getByPlaceholderText(/Enter requirement/i)).toBeInTheDocument();
        });

        fireEvent.change(screen.getByPlaceholderText(/Enter POC Name/i), {
            target: { value: 'John Doe' },
        });
        fireEvent.change(screen.getByPlaceholderText(/Enter Email ID/i), {
            target: { value: 'john@example.com' },
        });
        fireEvent.change(screen.getByPlaceholderText(/Enter requirement/i), {
            target: { value: 'I need a detailed plan.' },
        });

        await waitFor(() => {
            expect(screen.queryByText(/POC Name is required/i)).not.toBeInTheDocument();
            expect(screen.queryByText(/Email ID is required/i)).not.toBeInTheDocument();
            expect(screen.queryByText(/Requirement is required/i)).not.toBeInTheDocument();
        });
    });
});
