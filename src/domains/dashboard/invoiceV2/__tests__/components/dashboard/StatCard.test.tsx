import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import StatCard from '../../../components/dashboard/StatCard';

vi.mock('react-svg', () => ({
    ReactSVG: ({ src }: { src: string }) => <span data-testid="react-svg" data-src={src} />,
}));

describe('StatCard (dashboard)', () => {
    it('renders label, value and icon', () => {
        render(<StatCard label="Revenue" value="₹100" bgColor="#fff" icon="/i.svg" />);
        expect(screen.getByText('Revenue')).toBeInTheDocument();
        expect(screen.getByText('₹100')).toBeInTheDocument();
        expect(screen.getByTestId('react-svg')).toBeInTheDocument();
    });

    it('renders positive growth with up arrow', () => {
        const { container } = render(
            <StatCard
                label="Revenue"
                value="₹100"
                bgColor="#fff"
                icon="/i.svg"
                growthPercent={12}
            />
        );
        expect(screen.getByText('+12%')).toBeInTheDocument();
        expect(container.querySelector('.anticon-arrow-up')).toBeTruthy();
    });

    it('renders negative growth with down arrow', () => {
        const { container } = render(
            <StatCard label="R" value="v" bgColor="#fff" icon="/i.svg" growthPercent={-5} />
        );
        expect(screen.getByText('-5%')).toBeInTheDocument();
        expect(container.querySelector('.anticon-arrow-down')).toBeTruthy();
    });

    it('hides growth block when growthPercent is undefined', () => {
        render(<StatCard label="R" value="v" bgColor="#fff" icon="/i.svg" />);
        expect(screen.queryByText('vs last month')).not.toBeInTheDocument();
    });
});
