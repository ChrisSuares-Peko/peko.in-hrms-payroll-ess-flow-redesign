import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import LandingPage from '../../pages/LandingPage';

vi.mock('@src/hooks/store', () => ({
    useAppSelector: (selector: any) =>
        selector({
            reducer: {
                auth: { role: 'corporate', id: '123' },
                user: { user: { name: 'Test User', email: 'test@example.com' } },
                eSignDoc: { isDisabled: false },
            },
        }),
    useAppDispatch: () => vi.fn(),
}));

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual<any>('react-router-dom');
    return {
        ...actual,
        useNavigate: () => vi.fn(),
    };
});

vi.mock('../../../IndividualPlan/pages/SubscriptionPage', () => ({
    default: ({ children, ...props }: any) => (
        <div data-testid="subscription-page" data-props={JSON.stringify(props)}>
            {children}
        </div>
    ),
}));

vi.mock('../components/landingPage/ActionsHeader', () => ({
    default: () => <div data-testid="actions-header">ActionsHeader</div>,
}));

vi.mock('../components/SignDeskBranding', () => ({
    default: ({ position }: any) => <div data-testid="signdesk-branding">{position}</div>,
}));

vi.mock('../utils/features', () => ({
    eSignFeatures: ['f1', 'f2'],
    serviceDetails: ['d1'],
    subDescription: 'test-description',
}));

vi.mock('@utils/accessKeys', () => ({
    accessKeys: { eSign: 'ACCESS_KEY_ESIGN' },
}));

vi.mock('@utils/packageAccessKeys', () => ({
    packageAccessKeys: { eSign: 'PACKAGE_ESIGN' },
}));

describe('LandingPage Component', () => {
    it('renders without crashing', () => {
        render(<LandingPage />);

        expect(screen.getByTestId('subscription-page')).toBeInTheDocument();
    });

    it('passes correct props to SubscriptionPage', () => {
        render(<LandingPage />);

        const subscriptionPage = screen.getByTestId('subscription-page');
        const passedProps = JSON.parse(subscriptionPage.getAttribute('data-props') || '{}');

    expect(passedProps.serviceName).toBe('eSign');
    expect(passedProps.accessCode).toBe('PACKAGE_ESIGN');
    expect(passedProps.serviceAccessKey).toBe('ACCESS_KEY_ESIGN');
   
  });
});
