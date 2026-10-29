import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import ServiceSearch from '../ServiceSearch';

vi.mock('react-svg', () => ({
    ReactSVG: ({ src }: any) => <span data-testid="svg" data-src={src} />,
}));

vi.mock('@src/hooks/useServiceSearch', () => ({
    default: () => ({ histories: [], services: [], getHistories: vi.fn(), saveSearch: vi.fn() }),
}));

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
    return {
        ...actual,
        useNavigate: () => vi.fn(),
        useLocation: () => ({ pathname: '/dashboard' }),
    };
});

const affixWrapperOf = (container: HTMLElement) =>
    container.querySelector('.ant-input-affix-wrapper') as HTMLElement;

describe('ServiceSearch', () => {
    it('renders the search input', () => {
        render(<ServiceSearch variant="borderless" />);
        expect(screen.getByPlaceholderText('Search for services and features')).toBeInTheDocument();
    });

    it('starts the borderless header search flush with its container so it lines up with page content', () => {
        const { container } = render(<ServiceSearch variant="borderless" />);
        expect(affixWrapperOf(container).style.paddingLeft).toBe('0px');
    });

    it('keeps the default inset for the filled and outlined variants', () => {
        (['filled', 'outlined'] as const).forEach(variant => {
            const { container, unmount } = render(<ServiceSearch variant={variant} />);
            expect(affixWrapperOf(container).style.paddingLeft).toBe('');
            unmount();
        });
    });
});
