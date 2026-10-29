import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import Calling from '../../pages/Calling';

describe('Calling Component', () => {
    it('should render correctly', () => {
        render(<Calling hangUp={vi.fn()} />);
        expect(screen.getByText('Joining...')).toBeInTheDocument();
    });

    it('should display "Connecting..." when mode is "create"', () => {
        render(<Calling mode="create" hangUp={vi.fn()} />);
        expect(screen.getByText('Connecting...')).toBeInTheDocument();
    });

    it('should display "Joining..." when mode is not "create"', () => {
        render(<Calling mode="join" hangUp={vi.fn()} />);
        expect(screen.getByText('Joining...')).toBeInTheDocument();
    });

    it('should show the "End Call" button only when mode is "create"', () => {
        render(<Calling mode="create" hangUp={vi.fn()} />);
        expect(screen.getByRole('button', { name: /end call/i })).toBeInTheDocument();
    });

    it('should not show the "End Call" button when mode is not "create"', () => {
        render(<Calling mode="join" hangUp={vi.fn()} />);
        expect(screen.queryByRole('button', { name: /end call/i })).not.toBeInTheDocument();
    });

    it('should call hangUp function when "End Call" button is clicked', () => {
        const mockHangUp = vi.fn();
        render(<Calling mode="create" hangUp={mockHangUp} />);
        fireEvent.click(screen.getByRole('button', { name: /end call/i }));
        expect(mockHangUp).toHaveBeenCalledTimes(1);
    });
});
