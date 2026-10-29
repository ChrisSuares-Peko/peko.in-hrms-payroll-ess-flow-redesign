import { Mock, beforeEach, describe, expect, it, vi } from 'vitest';

import { store } from '@store/store';
import { checkServiceAccessAndSubServiceAdmin, checkSidebarkAccess } from '@utils/checkAccess';

vi.mock('@store/store', () => ({
    store: { getState: vi.fn() },
}));

const stateWith = (hasAccess: boolean, leafAccess: boolean) => ({
    reducer: {
        auth: { role: 'system_user' },
        services: {
            services: {
                data: [
                    {
                        serviceCategory: 'Accounting',
                        hasAccess,
                        services: [
                            {
                                category: 'Operations',
                                hasAccess: true,
                                services: [
                                    { service: 'Service without plans', hasAccess: leafAccess },
                                    { service: 'Order Journals', hasAccess: false },
                                ],
                            },
                        ],
                    },
                ],
            },
        },
    },
});

describe('checkAccess for the Accounting portal', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('grants the category route and main sidebar entry when Accounting is on', () => {
        (store.getState as Mock).mockReturnValue(stateWith(true, false));

        expect(checkSidebarkAccess('Accounting')).toBe(true);
        expect(checkServiceAccessAndSubServiceAdmin('Accounting')).toBe(true);
    });

    it('denies everything when Accounting is off', () => {
        (store.getState as Mock).mockReturnValue(stateWith(false, true));

        expect(checkSidebarkAccess('Accounting')).toBe(false);
        expect(checkServiceAccessAndSubServiceAdmin('Accounting')).toBe(false);
        expect(checkServiceAccessAndSubServiceAdmin('Accounting', 'Service Without Plans')).toBe(
            false
        );
    });

    it('gates a leaf route on that leaf only, using the title-cased slug RoleGuard produces', () => {
        (store.getState as Mock).mockReturnValue(stateWith(true, true));

        expect(checkServiceAccessAndSubServiceAdmin('Accounting', 'Service Without Plans')).toBe(
            true
        );
        expect(checkServiceAccessAndSubServiceAdmin('Accounting', 'Order Journals')).toBe(false);
        expect(checkServiceAccessAndSubServiceAdmin('Accounting', 'Unknown Page')).toBe(false);
    });
});
