const { findPartnerInitialAccessesibleServices } = require('../../../use-cases/partnerPermission');
const { sidebarData: INITIAL_SIDEBAR_DATA } = require('../../../../utils/sidebar');

describe('findPartnerInitialAccessesibleServices', () => {
    it('returns the sidebar constant wrapped in { details }', async () => {
        const result = await findPartnerInitialAccessesibleServices();
        expect(result).toEqual({ details: INITIAL_SIDEBAR_DATA });
    });
});
