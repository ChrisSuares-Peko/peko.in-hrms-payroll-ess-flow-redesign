import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import TemplateCard from '../../../components/landingPage/TemplateCard';

vi.mock('react-svg', () => ({
    ReactSVG: () => <span data-testid="rsvg" />,
}));

describe('TemplateCard', () => {
    const defaultProps = {
        title: 'NDA Template',
        description: 'Non-disclosure agreement template',
        timeEstimate: '30 mins',
        icon: <span data-testid="icon" />,
        onUse: vi.fn(),
    };

    it('should render title and description', () => {
        render(<TemplateCard {...defaultProps} />);

        expect(screen.getByText('NDA Template')).toBeInTheDocument();
        expect(screen.getByText('Non-disclosure agreement template')).toBeInTheDocument();
    });

    it('should render time estimate', () => {
        render(<TemplateCard {...defaultProps} />);

        expect(screen.getByText(/30/)).toBeInTheDocument();
    });

    it('should render category badge when category is provided', () => {
        render(<TemplateCard {...defaultProps} category="Legal" />);

        expect(screen.getByText('Legal')).toBeInTheDocument();
    });

    it('should not render category badge when category is not provided', () => {
        render(<TemplateCard {...defaultProps} />);

        expect(screen.queryByText('Legal')).not.toBeInTheDocument();
    });

    it('should call onUse when Use button is clicked', () => {
        const onUse = vi.fn();
        render(<TemplateCard {...defaultProps} onUse={onUse} />);

        fireEvent.click(screen.getByRole('button', { name: /use/i }));

        expect(onUse).toHaveBeenCalledTimes(1);
    });

    it('should apply featured styling when isFeatured is true', () => {
        const { container } = render(<TemplateCard {...defaultProps} isFeatured />);

        const card = container.firstChild as HTMLElement;
        expect(card.className).toContain('bg-pink-50');
    });

    it('should apply non-featured styling when isFeatured is false', () => {
        const { container } = render(<TemplateCard {...defaultProps} isFeatured={false} />);

        const card = container.firstChild as HTMLElement;
        expect(card.className).toContain('bg-white');
    });

    it('should render the icon', () => {
        render(<TemplateCard {...defaultProps} />);

        expect(screen.getByTestId('icon')).toBeInTheDocument();
    });
});
