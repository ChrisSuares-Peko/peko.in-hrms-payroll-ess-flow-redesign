/* eslint-disable react/button-has-type */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import CorporateList from '@src/domains/dashboard/pekoConnect/components/CorporateList';

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(() => ({
        user: { email: 'test@example.com' },
    })),
}));

vi.mock('@src/hooks/useScreenSize', () => ({
    default: vi.fn(() => ({
        md: true,
        xxl: false,
    })),
}));

vi.mock('@src/domains/dashboard/pekoConnect/components/Chat', () => ({
    default: vi.fn(() => <div data-testid="chat-component">Chat Component</div>),
}));

vi.mock('@src/domains/dashboard/pekoConnect/components/ChatList', () => ({
    default: vi.fn(() => <div data-testid="chat-list">Chat List</div>),
}));

vi.mock('@src/domains/dashboard/pekoConnect/components/ConnectionRequest', () => ({
    default: vi.fn(({ onClose }) => (
        <div data-testid="connection-request">
            Connection Request
            <button onClick={onClose}>Close</button>
        </div>
    )),
}));

describe('CorporateList Component', () => {
    let mockRefresh: any;
    let mockHandleConnection: any;

    beforeEach(() => {
        vi.clearAllMocks();
        mockRefresh = vi.fn();
        mockHandleConnection = vi.fn();
    });

    const defaultProps = {
        refresh: mockRefresh,
        requests: [],
        isLoading: false,
        handleConnection: mockHandleConnection,
    };

    it('renders component correctly', () => {
        render(<CorporateList {...defaultProps} />);
        expect(screen.getByText('Connect')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Search for a Connection')).toBeInTheDocument();
    });

    it('displays ChatList when activeTab is "1"', () => {
        render(<CorporateList {...defaultProps} />);
        expect(screen.getByTestId('chat-list')).toBeInTheDocument();
    });

    it('displays "Call history" when activeTab is "2"', () => {
        render(<CorporateList {...defaultProps} />);
        fireEvent.change(screen.getByPlaceholderText('Search for a Connection'), {
            target: { value: 'test' },
        });
        expect(screen.getByPlaceholderText('Search for a Connection')).toHaveValue('test');
    });
});
