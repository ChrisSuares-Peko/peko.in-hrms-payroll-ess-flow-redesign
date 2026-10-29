import '@testing-library/jest-dom/vitest';

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Mock, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { getServicesTypeConfig } from '@src/domains/admin/accounting/api/services';
import { useAppSelector } from '@src/hooks/store';

import {
    classifyService,
    classifyServices,
    getClassificationOptions,
    getServiceClassification,
} from '../../../api/serviceClassification';
import { REMOVE_CLASSIFICATION_LABEL } from '../../../component/serviceClassification/ClassificationRowMenu';
import {
    CLASSIFY_DRAWER_TITLE,
    DRAWER_OPTIONS_HINT,
} from '../../../component/serviceClassification/ClassifyServiceDrawer';
import ServiceClassification from '../../../component/serviceClassification/ServiceClassification';
import {
    CLASSIFICATION_RULES,
    PAYMENT_ONLY_TEXT,
    PAYMENT_ONLY_TITLE,
    SERVICE_CLASSIFICATION_INTRO,
} from '../../../component/serviceClassification/ServiceClassificationHeader';
import {
    ClassificationOption,
    ClassifiedOperator,
    ServiceClassificationTab,
} from '../../../types/serviceClassification';

const { dispatch } = vi.hoisted(() => ({ dispatch: vi.fn() }));

vi.mock('@src/hooks/store', () => ({ useAppSelector: vi.fn(), useAppDispatch: () => dispatch }));

vi.mock('../../../api/serviceClassification', () => ({
    getServiceClassification: vi.fn(),
    classifyService: vi.fn(),
    getClassificationOptions: vi.fn(),
    classifyServices: vi.fn(),
}));

vi.mock('@src/domains/admin/accounting/api/services', () => ({ getServicesTypeConfig: vi.fn() }));

const blob = (update: boolean) => [
    {
        serviceCategory: 'Settings',
        hasAccess: true,
        services: [
            {
                category: 'Services',
                hasAccess: true,
                services: [
                    {
                        service: 'Service Classification',
                        hasAccess: true,
                        view: true,
                        write: update,
                        update,
                    },
                ],
            },
        ],
    },
];

const stateWith = (update = true) => ({
    reducer: {
        auth: { role: 'system_user', id: 7 },
        services: { services: { data: blob(update) }, isAdmin: false },
    },
});

const DEFAULT = { partnerPermissionId: 1, partnerName: null };
const GULF = { partnerPermissionId: 12, partnerName: 'Gulf Reach' };

const operator = (overrides: Partial<ClassifiedOperator>): ClassifiedOperator => ({
    id: 10,
    serviceProvider: 'Tunz eSIM',
    accessKey: 'esim_tunz',
    serviceCategory: 'Travel',
    serviceStatus: true,
    vendor: { id: 1, vendorName: 'Tunz' },
    planType: 'with_plans',
    commissionConfigured: true,
    liveFor: [DEFAULT],
    ...overrides,
});

const TUNZ = operator({});
const VISA = operator({
    id: 11,
    serviceProvider: 'Visa',
    accessKey: 'visa',
    serviceCategory: 'Travel',
    vendor: null,
    planType: 'without_plans',
    liveFor: [DEFAULT, GULF],
});

const COMMERCE = operator({
    id: 12,
    serviceProvider: 'Peko Commerce',
    accessKey: 'ecommerce_store',
    serviceCategory: 'Business',
    vendor: null,
    planType: 'peko_subscription',
    liveFor: [GULF],
});

const POS = operator({
    id: 15,
    serviceProvider: 'Peko POS',
    accessKey: 'peko_pos',
    serviceCategory: 'Business',
    vendor: { id: 4, vendorName: 'Restonik' },
    planType: 'peko_subscription_vendor',
    liveFor: [],
});

const SOUNDBOX: ClassificationOption = {
    id: 13,
    serviceProvider: 'Soundbox',
    accessKey: 'soundbox',
    serviceCategory: 'Payments',
    vendor: { id: 2, vendorName: 'Paytm' },
    liveFor: [DEFAULT, GULF],
};
const FOREX: ClassificationOption = {
    id: 14,
    serviceProvider: 'Forex',
    accessKey: 'forex_desk',
    serviceCategory: null,
    vendor: null,
    liveFor: [],
};

const renderPage = (path = '/system-user/settings/service-classification') =>
    render(
        <MemoryRouter initialEntries={[path]}>
            <ServiceClassification />
        </MemoryRouter>
    );

const pickOption = (label: string) =>
    fireEvent.click(screen.getByText(label, { selector: '.ant-select-item-option-content span' }));

const classifyCta = () => screen.getByRole('button', { name: new RegExp(CLASSIFY_DRAWER_TITLE) });

const openDrawer = async () => {
    fireEvent.click(classifyCta());
    expect(await screen.findByText(DRAWER_OPTIONS_HINT)).toBeInTheDocument();
};

const pickServices = (...labels: string[]) => {
    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Services to classify' }));
    labels.forEach(label => pickOption(label));
};

const classifyButton = () => screen.getByRole('button', { name: 'Classify' });

const confirmYes = () => fireEvent.click(screen.getByText('Yes', { selector: 'span' }));

const result = (accessKey: string, planType: ServiceClassificationTab, extra = {}) => ({
    accessKey,
    planType,
    previousPlanType: null,
    changed: true,
    autoApproved: [],
    skipped: [],
    ...extra,
});

const realGetComputedStyle = window.getComputedStyle.bind(window);

describe('ServiceClassification', () => {
    beforeAll(() => {
        Object.defineProperty(window, 'innerWidth', {
            value: 1600,
            writable: true,
            configurable: true,
        });
        window.getComputedStyle = ((element: Element) =>
            realGetComputedStyle(element)) as typeof window.getComputedStyle;
    });

    const selectFrom = (state: ReturnType<typeof stateWith>) =>
        (useAppSelector as unknown as Mock).mockImplementation((selector: any) => selector(state));

    beforeEach(() => {
        vi.clearAllMocks();
        selectFrom(stateWith());
        (getServiceClassification as Mock).mockImplementation(async ({ classification }) => ({
            services: {
                without_plans: [VISA],
                peko_subscription: [COMMERCE],
                peko_subscription_vendor: [POS],
            }[classification as string] ?? [TUNZ],
            recordsTotal: 1,
            page: 1,
            itemsPerPage: 10,
        }));
        (getClassificationOptions as Mock).mockResolvedValue({ services: [SOUNDBOX, FOREX] });
        (getServicesTypeConfig as Mock).mockResolvedValue({
            service_with_plans: ['esim_tunz'],
            service_without_plans: ['visa'],
        });
        (classifyServices as Mock).mockResolvedValue({
            config: {
                service_with_plans: ['esim_tunz'],
                service_without_plans: ['visa', 'forex_desk'],
                peko_service_subscriptions: [],
                peko_subscription_vendors: [],
            },
            results: [result('forex_desk', 'without_plans')],
        });
        (classifyService as Mock).mockResolvedValue(
            result('esim_tunz', 'without_plans', { previousPlanType: 'with_plans' })
        );
    });

    it('explains the two classifications and warns that only payment services belong here', async () => {
        renderPage();

        expect(await screen.findByText('Tunz eSIM')).toBeInTheDocument();
        expect(screen.getByText(SERVICE_CLASSIFICATION_INTRO)).toBeInTheDocument();
        CLASSIFICATION_RULES.forEach(rule => {
            expect(
                screen.getByText(
                    (_, element) =>
                        element?.tagName === 'LI' &&
                        element.textContent === `${rule.title} — ${rule.text}`
                )
            ).toBeInTheDocument();
        });
        expect(screen.getByText(PAYMENT_ONLY_TITLE)).toBeInTheDocument();
        expect(screen.getByText(PAYMENT_ONLY_TEXT)).toBeInTheDocument();
    });

    it('lists the services with plans first and the services without plans on the second tab', async () => {
        renderPage();

        expect(await screen.findByText('Tunz eSIM')).toBeInTheDocument();
        expect(getServiceClassification).toHaveBeenCalledWith(
            expect.objectContaining({
                userId: 7,
                userType: 'system_user',
                classification: 'with_plans',
                page: 1,
            })
        );
        expect(screen.getByText('Live for 1 partner')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('tab', { name: 'Vendor service without plans' }));

        expect(await screen.findByText('Visa')).toBeInTheDocument();
        expect(getServiceClassification).toHaveBeenCalledWith(
            expect.objectContaining({ classification: 'without_plans', page: 1 })
        );
        expect(screen.getByText('Live for 2 partners')).toBeInTheDocument();
    });

    it('classifies the picked services from the drawer and lands on their tab', async () => {
        renderPage();
        await screen.findByText('Tunz eSIM');
        const optionLoads = (getClassificationOptions as Mock).mock.calls.length;

        await openDrawer();
        expect(classifyButton()).toBeDisabled();
        pickServices('Forex');
        fireEvent.click(
            screen.getByLabelText(/Vendor service without plans/, { selector: 'input' })
        );
        expect(classifyButton()).toBeEnabled();

        fireEvent.click(classifyButton());

        await waitFor(() =>
            expect(classifyServices).toHaveBeenCalledWith({
                userId: 7,
                userType: 'system_user',
                accessKeys: ['forex_desk'],
                planType: 'without_plans',
            })
        );
        expect(dispatch).toHaveBeenCalledWith(
            expect.objectContaining({
                payload: expect.objectContaining({
                    description:
                        'Forex is now a vendor service without plans. Pending approval in the Accounting portal.',
                    variant: 'success',
                }),
            })
        );
        await waitFor(() =>
            expect(screen.queryByText(DRAWER_OPTIONS_HINT)).not.toBeInTheDocument()
        );
        expect(screen.getByRole('tab', { name: 'Vendor service without plans' })).toHaveAttribute(
            'aria-selected',
            'true'
        );
        await waitFor(() =>
            expect((getClassificationOptions as Mock).mock.calls.length).toBe(optionLoads + 1)
        );
    });

    it('asks first when a picked service is already live, then approves it for those partners', async () => {
        (classifyServices as Mock).mockResolvedValue({
            config: {
                service_with_plans: ['esim_tunz', 'soundbox'],
                service_without_plans: ['visa'],
                peko_service_subscriptions: [],
                peko_subscription_vendors: [],
            },
            results: [result('soundbox', 'with_plans', { autoApproved: [DEFAULT, GULF] })],
        });
        renderPage();
        await screen.findByText('Tunz eSIM');

        await openDrawer();
        pickServices('Soundbox');
        fireEvent.click(screen.getByLabelText(/Vendor service with plans/, { selector: 'input' }));
        expect(screen.getByText('Soundbox is already live for partners')).toBeInTheDocument();

        fireEvent.click(classifyButton());

        expect(
            await screen.findByText(
                /Soundbox is already live for partners \(Peko \(Default\) and Gulf Reach\)/
            )
        ).toBeInTheDocument();
        expect(classifyServices).not.toHaveBeenCalled();

        confirmYes();

        await waitFor(() =>
            expect(classifyServices).toHaveBeenCalledWith(
                expect.objectContaining({ accessKeys: ['soundbox'], planType: 'with_plans' })
            )
        );
        expect(dispatch).toHaveBeenCalledWith(
            expect.objectContaining({
                payload: expect.objectContaining({
                    description:
                        'Soundbox is now a vendor service with plans. Approved automatically for Peko (Default) and Gulf Reach so nothing goes offline.',
                }),
            })
        );
    });

    it('moves a service to the other tab from its row, after confirming', async () => {
        renderPage();
        await screen.findByText('Tunz eSIM');

        fireEvent.click(screen.getByRole('button', { name: 'Actions for Tunz eSIM' }));
        fireEvent.click(await screen.findByText('Move to Vendor service without plans'));

        expect(
            await screen.findByText(/Move Tunz eSIM to Vendor service without plans\?/)
        ).toBeInTheDocument();
        expect(classifyService).not.toHaveBeenCalled();

        confirmYes();

        await waitFor(() =>
            expect(classifyService).toHaveBeenCalledWith(
                expect.objectContaining({ accessKey: 'esim_tunz', planType: 'without_plans' })
            )
        );
        expect(dispatch).toHaveBeenCalledWith(
            expect.objectContaining({
                payload: expect.objectContaining({
                    description: 'Tunz eSIM is now a vendor service without plans.',
                }),
            })
        );
    });

    it('removes a classification from its row, after confirming', async () => {
        (classifyService as Mock).mockResolvedValue({
            accessKey: 'esim_tunz',
            planType: null,
            previousPlanType: 'with_plans',
            changed: true,
            autoApproved: [],
            skipped: [],
        });
        renderPage();
        await screen.findByText('Tunz eSIM');

        fireEvent.click(screen.getByRole('button', { name: 'Actions for Tunz eSIM' }));
        fireEvent.click(await screen.findByText(REMOVE_CLASSIFICATION_LABEL));
        expect(
            await screen.findByText(/Remove the classification of Tunz eSIM\?/)
        ).toBeInTheDocument();

        confirmYes();

        await waitFor(() =>
            expect(classifyService).toHaveBeenCalledWith(
                expect.objectContaining({ accessKey: 'esim_tunz', planType: null })
            )
        );
    });

    it('keeps everything read-only without the update permission', async () => {
        selectFrom(stateWith(false));

        renderPage();
        await screen.findByText('Tunz eSIM');

        expect(classifyCta()).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Actions for Tunz eSIM' })).toBeDisabled();
    });

    it('opens the drawer with the service already picked when the fix link names an unclassified one', async () => {
        renderPage('/system-user/settings/service-classification?search=forex_desk');

        expect(await screen.findByText(DRAWER_OPTIONS_HINT)).toBeInTheDocument();
        expect(
            screen.getByText('Forex', { selector: '.ant-select-selection-item-content' })
        ).toBeInTheDocument();
        expect(getServicesTypeConfig).not.toHaveBeenCalled();
    });

    it('lands on the right tab with the search seeded when the fix link names a classified one', async () => {
        renderPage('/system-user/settings/service-classification?search=visa');

        await waitFor(() =>
            expect(
                screen.getByRole('tab', { name: 'Vendor service without plans' })
            ).toHaveAttribute('aria-selected', 'true')
        );
        await waitFor(() =>
            expect(getServiceClassification).toHaveBeenCalledWith(
                expect.objectContaining({ classification: 'without_plans', searchText: 'visa' })
            )
        );
        expect(screen.getByDisplayValue('visa')).toBeInTheDocument();
        expect(screen.queryByText(DRAWER_OPTIONS_HINT)).not.toBeInTheDocument();
    });
    it('lists Peko’s own service subscriptions on a third tab', async () => {
        renderPage();
        await screen.findByText('Tunz eSIM');

        fireEvent.click(screen.getByRole('tab', { name: 'Peko’s own service subscription' }));

        expect(await screen.findByText('Peko Commerce')).toBeInTheDocument();
        expect(getServiceClassification).toHaveBeenCalledWith(
            expect.objectContaining({ classification: 'peko_subscription', page: 1 })
        );
    });

    it('classifies a live service as Peko’s own without asking about approvals', async () => {
        (classifyServices as Mock).mockResolvedValue({
            config: {
                service_with_plans: ['esim_tunz'],
                service_without_plans: ['visa'],
                peko_service_subscriptions: ['soundbox'],
                peko_subscription_vendors: [],
            },
            results: [result('soundbox', 'peko_subscription')],
        });
        renderPage();
        await screen.findByText('Tunz eSIM');

        await openDrawer();
        pickServices('Soundbox');
        expect(screen.getByText('Soundbox is already live for partners')).toBeInTheDocument();
        fireEvent.click(
            screen.getByLabelText(/Peko’s own service subscription/, { selector: 'input' })
        );
        expect(screen.queryByText('Soundbox is already live for partners')).not.toBeInTheDocument();

        fireEvent.click(classifyButton());

        await waitFor(() =>
            expect(classifyServices).toHaveBeenCalledWith(
                expect.objectContaining({ accessKeys: ['soundbox'], planType: 'peko_subscription' })
            )
        );
        expect(dispatch).toHaveBeenCalledWith(
            expect.objectContaining({
                payload: expect.objectContaining({
                    description:
                        'Soundbox is now one of Peko’s own service subscriptions. Its packages are priced under Peko Subscriptions in the Accounting portal, and it needs no accounting approval.',
                }),
            })
        );
    });

    it('offers a move to each of the other three classifications from a row', async () => {
        renderPage();
        await screen.findByText('Tunz eSIM');

        fireEvent.click(screen.getByRole('button', { name: 'Actions for Tunz eSIM' }));

        expect(await screen.findByText('Move to Vendor service without plans')).toBeInTheDocument();
        expect(screen.getByText('Move to Peko’s own service subscription')).toBeInTheDocument();
        expect(screen.getByText('Move to Peko Subscription Providing Vendors')).toBeInTheDocument();
    });

    it('lists the vendors providing a Peko subscription on a fourth tab and classifies one without asking about approvals', async () => {
        (classifyServices as Mock).mockResolvedValue({
            config: {
                service_with_plans: ['esim_tunz'],
                service_without_plans: ['visa'],
                peko_service_subscriptions: [],
                peko_subscription_vendors: ['soundbox'],
            },
            results: [result('soundbox', 'peko_subscription_vendor')],
        });
        renderPage();
        await screen.findByText('Tunz eSIM');

        fireEvent.click(screen.getByRole('tab', { name: 'Peko Subscription Providing Vendors' }));

        expect(await screen.findByText('Peko POS')).toBeInTheDocument();
        expect(screen.getByText('Restonik')).toBeInTheDocument();
        expect(getServiceClassification).toHaveBeenLastCalledWith(
            expect.objectContaining({ classification: 'peko_subscription_vendor', page: 1 })
        );

        await openDrawer();
        pickServices('Soundbox');
        fireEvent.click(
            screen.getByLabelText(/Peko Subscription Providing Vendors/, { selector: 'input' })
        );
        fireEvent.click(classifyButton());

        await waitFor(() =>
            expect(classifyServices).toHaveBeenCalledWith(
                expect.objectContaining({
                    accessKeys: ['soundbox'],
                    planType: 'peko_subscription_vendor',
                })
            )
        );
        await waitFor(() =>
            expect(dispatch).toHaveBeenCalledWith(
                expect.objectContaining({
                    payload: expect.objectContaining({
                        description:
                            'Soundbox is now a vendor providing a Peko subscription. Its vendor is listed under Vendors in the Accounting portal for deposits and the other entries recorded by hand; its orders stay off the vendor ledger, and it needs no accounting approval.',
                        variant: 'success',
                    }),
                })
            )
        );
    });

    it('opens the Peko’s own tab when the fix link names one of those services', async () => {
        (getServicesTypeConfig as Mock).mockResolvedValue({
            service_with_plans: ['esim_tunz'],
            service_without_plans: ['visa'],
            peko_service_subscriptions: ['ecommerce_store'],
            peko_subscription_vendors: [],
        });
        renderPage('/system-user/settings/service-classification?search=ecommerce_store');

        await waitFor(() =>
            expect(
                screen.getByRole('tab', { name: 'Peko’s own service subscription' })
            ).toHaveAttribute('aria-selected', 'true')
        );
    });
});
