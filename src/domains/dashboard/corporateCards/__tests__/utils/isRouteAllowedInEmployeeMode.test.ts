import { describe, expect, it } from 'vitest';

import { serviceCategoryFromPath } from '@utils/serviceRoute';

import { isRouteAllowedInEmployeeMode } from '../../utils/activeRole';

describe('isRouteAllowedInEmployeeMode', () => {
    it('allows Corporate Cards, the one product module Employee mode may open', () => {
        expect(isRouteAllowedInEmployeeMode('Corporate Cards')).toBe(true);
    });

    it.each(['Payroll', 'Invoicing', 'Corporate Travel', 'Payouts', 'Procure', 'Plans'])(
        'refuses %s',
        label => {
            expect(isRouteAllowedInEmployeeMode(label)).toBe(false);
        }
    );

    it.each(['Profile', 'Notifications', 'Need Help', 'Payments'])(
        'keeps the %s utility route open so the session is never stranded',
        label => {
            expect(isRouteAllowedInEmployeeMode(label)).toBe(true);
        }
    );

    it('matches regardless of casing or padding', () => {
        expect(isRouteAllowedInEmployeeMode('  corporate CARDS ')).toBe(true);
    });

    it('refuses an empty or missing category', () => {
        expect(isRouteAllowedInEmployeeMode('')).toBe(false);
        expect(isRouteAllowedInEmployeeMode(null)).toBe(false);
        expect(isRouteAllowedInEmployeeMode(undefined)).toBe(false);
    });

    it('agrees with the label the guard derives from a real module URL', () => {
        expect(isRouteAllowedInEmployeeMode(serviceCategoryFromPath('/payroll/salary'))).toBe(
            false
        );
        expect(isRouteAllowedInEmployeeMode(serviceCategoryFromPath('/corporate-cards'))).toBe(
            true
        );
    });
});

describe('serviceCategoryFromPath', () => {
    it('turns a route back into the label the access guards compare against', () => {
        expect(serviceCategoryFromPath('/corporate-cards')).toBe('Corporate Cards');
        expect(serviceCategoryFromPath('/payroll')).toBe('Payroll');
        expect(serviceCategoryFromPath('/need-help')).toBe('Need Help');
    });

    it('reads only the leading segment, ignoring deeper path', () => {
        expect(serviceCategoryFromPath('/payroll/employees/42')).toBe('Payroll');
    });

    it('is case-insensitive about the incoming path', () => {
        expect(serviceCategoryFromPath('/Corporate-Cards')).toBe('Corporate Cards');
    });

    it('returns an empty label for the root path', () => {
        expect(serviceCategoryFromPath('/')).toBe('');
    });
});
