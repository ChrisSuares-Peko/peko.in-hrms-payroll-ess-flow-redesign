const { resolvePartnerScope, pekoDirectClause } = require('../partnerScope');

describe('pekoDirectClause', () => {
    it('picks out the customers no partner registered, or none by a numeric partner id', () => {
        expect(pekoDirectClause()).toBe(
            "(credentials.registeredBy IS NULL OR credentials.registeredBy NOT REGEXP '^[0-9]+$')"
        );
    });

    it('reads the table by the name the query gave it', () => {
        expect(pekoDirectClause('credential')).toContain('credential.registeredBy IS NULL');
        expect(pekoDirectClause('credential')).not.toContain('credentials.');
    });
});

const build = ({ user = {}, query = {} } = {}) => ({ user, query });

describe('resolvePartnerScope', () => {
    describe('when the session belongs to a partner', () => {
        it('pins the scope to the session partner', () => {
            const scope = resolvePartnerScope(build({ user: { registeredBy: 1830 } }));

            expect(scope).toEqual({ partnerId: 1830, subPartnerId: null, locked: true });
        });

        it('ignores a partnerId the client supplied', () => {
            const scope = resolvePartnerScope(
                build({ user: { registeredBy: 1830 }, query: { partnerId: 9999 } })
            );

            expect(scope.partnerId).toBe(1830);
            expect(scope.locked).toBe(true);
        });

        it('ignores a client request for the default tenant', () => {
            const scope = resolvePartnerScope(
                build({ user: { registeredBy: 1830 }, query: { partnerId: 'default' } })
            );

            expect(scope.partnerId).toBe(1830);
        });

        it('carries the sub-partner through', () => {
            const scope = resolvePartnerScope(
                build({ user: { registeredBy: 1830, subPartnerId: 77 } })
            );

            expect(scope.subPartnerId).toBe(77);
        });

        it('treats an empty-string sub-partner as absent', () => {
            const scope = resolvePartnerScope(
                build({ user: { registeredBy: 1830, subPartnerId: '' } })
            );

            expect(scope.subPartnerId).toBeNull();
        });
    });

    describe('when the session is a super admin', () => {
        it('honours a partnerId chosen by the client', () => {
            const scope = resolvePartnerScope(build({ query: { partnerId: 1842 } }));

            expect(scope).toEqual({ partnerId: 1842, subPartnerId: null, locked: false });
        });

        it('honours an explicit request for the default tenant', () => {
            const scope = resolvePartnerScope(build({ query: { partnerId: 'default' } }));

            expect(scope.partnerId).toBe('default');
        });

        it('returns undefined when no partner was chosen, meaning every tenant', () => {
            const scope = resolvePartnerScope(build({ query: {} }));

            expect(scope.partnerId).toBeUndefined();
            expect(scope.locked).toBe(false);
        });

        it('treats an empty-string partnerId as no choice', () => {
            const scope = resolvePartnerScope(build({ query: { partnerId: '' } }));

            expect(scope.partnerId).toBeUndefined();
        });
    });

    describe('edge cases', () => {
        it('does not throw on a request with no user or query', () => {
            expect(resolvePartnerScope({})).toEqual({
                partnerId: undefined,
                subPartnerId: null,
                locked: false,
            });
        });

        it('does not treat a zero registeredBy as a partner session', () => {
            const scope = resolvePartnerScope(build({ user: { registeredBy: 0 } }));

            expect(scope.locked).toBe(true);
            expect(scope.partnerId).toBe(0);
        });

        it('treats an empty-string registeredBy as a super admin', () => {
            const scope = resolvePartnerScope(
                build({ user: { registeredBy: '' }, query: { partnerId: 1842 } })
            );

            expect(scope.locked).toBe(false);
            expect(scope.partnerId).toBe(1842);
        });
    });
});
