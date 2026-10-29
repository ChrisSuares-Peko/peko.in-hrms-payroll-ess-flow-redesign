import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import ListTagsAndEmailInput from '../../components/ListTagsAndEmailInput';

describe('ListTagsAndEmailInput Component', () => {
    let mockHandleTagClose: any;
    let mockHandleInputChange: any;
    let mockValidateAddEmail: any;
    let mockSetError: any;

    beforeEach(() => {
        mockHandleTagClose = vi.fn();
        mockHandleInputChange = vi.fn();
        mockValidateAddEmail = vi.fn();
        mockSetError = vi.fn();
    });

    const defaultProps = {
        error: '',
        setError: mockSetError,
        values: ['test1@example.com', 'test2@example.com', 'test3@example.com'],
        email: ['test1@example.com', 'test2@example.com'],
        handleTagClose: mockHandleTagClose,
        isValidEmail: true,
        handleInputChange: mockHandleInputChange,
        validateAddEmail: mockValidateAddEmail,
        inputValue: '',
    };

    it('renders without crashing', () => {
        render(<ListTagsAndEmailInput {...defaultProps} />);
        expect(screen.getByText('Email IDs')).toBeInTheDocument();
    });

    it('displays tags for email IDs', () => {
        render(<ListTagsAndEmailInput {...defaultProps} />);
        expect(screen.getByText('test1@example.com')).toBeInTheDocument();
        expect(screen.getByText('test2@example.com')).toBeInTheDocument();
    });

    it('shows an error message when an invalid email is entered', async () => {
        const props = {
            ...defaultProps,
            error: 'Invalid email address',
        };
        render(<ListTagsAndEmailInput {...props} />);
        expect(screen.getByText(/Invalid email address/i)).toBeInTheDocument();
    });

    it('shows a message if email already exists', () => {
        const props = {
            ...defaultProps,
            isValidEmail: false,
        };
        render(<ListTagsAndEmailInput {...props} />);
        expect(screen.getByText(/Email address already exists/i)).toBeInTheDocument();
    });
});
