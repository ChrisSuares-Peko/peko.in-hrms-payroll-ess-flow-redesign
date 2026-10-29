import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { Mock, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAppSelector } from '@src/hooks/store';
import { quickActions } from '@utils/data';

import QuickActionsList from '../../components/QuickActionsList';

vi.mock('@src/hooks/store', () => ({
    useAppDispatch: vi.fn(),
    useAppSelector: vi.fn(),
}));

const LocationProbe = () => <span data-testid="location">{useLocation().pathname}</span>;

const renderList = () =>
    render(
        <MemoryRouter initialEntries={['/']}>
            <QuickActionsList />
            <LocationProbe />
        </MemoryRouter>
    );

beforeEach(() => {
    (useAppSelector as unknown as Mock).mockImplementation((selector: any) =>
        selector({ reducer: { subscriptions: { services: { userAccessibleServices: [] } } } })
    );
});

describe('QuickActionsList', () => {
    it('shows every quick action with its illustration at the configured size', () => {
        const { container } = renderList();
        const images = Array.from(container.querySelectorAll('img'));

        expect(images).toHaveLength(quickActions.length);
        quickActions.forEach((action, index) => {
            expect(screen.getByText(action.title)).toBeInTheDocument();
            expect(images[index]).toHaveAttribute('src', action.icon);
            expect(images[index]).toHaveAttribute('width', String(action.imageSize.width));
            expect(images[index]).toHaveAttribute('height', String(action.imageSize.height));
        });
    });

    it("navigates to the action's page when its tile is clicked", () => {
        const [firstAction] = quickActions;
        renderList();

        fireEvent.click(screen.getAllByRole('button')[0]);

        expect(screen.getByTestId('location')).toHaveTextContent(firstAction.url);
    });
});
