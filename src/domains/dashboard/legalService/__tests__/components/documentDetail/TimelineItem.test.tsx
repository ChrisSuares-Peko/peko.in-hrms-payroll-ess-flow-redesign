import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import TimelineItem from '../../../components/documentDetail/TimelineItem';

vi.mock('react-svg', () => ({
    ReactSVG: ({ src }: { src: string }) => <span data-testid="rsvg" data-src={src} />,
}));

describe('TimelineItem', () => {
    const defaultProps = {
        iconSrc: '/icons/step.svg',
        title: 'Document Created',
        description: 'Document was created successfully',
        date: '15 Jan 2024',
        active: false,
    };

    it('should render title, description and date', () => {
        render(<TimelineItem {...defaultProps} />);

        expect(screen.getByText('Document Created')).toBeInTheDocument();
        expect(screen.getByText('Document was created successfully')).toBeInTheDocument();
        expect(screen.getByText('15 Jan 2024')).toBeInTheDocument();
    });

    it('should render SVG icon when not active signed step', () => {
        render(<TimelineItem {...defaultProps} />);

        expect(screen.getByTestId('rsvg')).toBeInTheDocument();
    });

    it('should show green check icon when active and isSignedStep', () => {
        const { container } = render(
            <TimelineItem {...defaultProps} active isSignedStep />
        );

        expect(container.querySelector('.anticon-check-circle')).toBeInTheDocument();
    });

    it('should not show check icon when active but not isSignedStep', () => {
        const { container } = render(<TimelineItem {...defaultProps} active />);

        expect(container.querySelector('.anticon-check-circle')).not.toBeInTheDocument();
        expect(screen.getByTestId('rsvg')).toBeInTheDocument();
    });

    it('should show connector line when not the last item', () => {
        const { container } = render(<TimelineItem {...defaultProps} isLast={false} />);

        const connector = container.querySelector('.w-px');
        expect(connector).toBeInTheDocument();
    });

    it('should hide connector line when isLast is true', () => {
        const { container } = render(<TimelineItem {...defaultProps} isLast />);

        const connector = container.querySelector('.w-px');
        expect(connector).not.toBeInTheDocument();
    });

    it('should use green background when active', () => {
        render(<TimelineItem {...defaultProps} active />);

        const contentBox = screen.getByText('Document Created').closest('.rounded-xl');
        expect(contentBox).toHaveClass('bg-teal-50');
    });

    it('should use stone background when inactive', () => {
        render(<TimelineItem {...defaultProps} active={false} />);

        const contentBox = screen.getByText('Document Created').closest('.rounded-xl');
        expect(contentBox).toHaveClass('bg-stone-50');
    });
});
