const { findVendorPersonByRole } = require('../../../use-cases/businessRegistration');
const businessRegistration = require('../../../entities/businessRegistration');

jest.mock('../../../entities/businessRegistration', () => ({
    findAll: jest.fn(),
}));

describe('findVendorPersonByRole', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns the first vendorPeople entry matching the role with a truthy peopleId', async () => {
        businessRegistration.findAll.mockResolvedValue([
            { vendorPeople: [{ role: 'nominee', peopleId: 5 }] },
            { vendorPeople: [{ role: 'director', peopleId: 0 }, { role: 'director', peopleId: 42 }] },
        ]);

        const hit = await findVendorPersonByRole('director');

        // peopleId 0 is skipped (falsy); the next matching director wins.
        expect(hit).toEqual({ role: 'director', peopleId: 42 });
    });

    it('reads only the vendorPeople column of the latest 25 rows', async () => {
        businessRegistration.findAll.mockResolvedValue([]);

        await findVendorPersonByRole('director');

        const arg = businessRegistration.findAll.mock.calls[0][0];
        expect(arg.attributes).toEqual(['vendorPeople']);
        expect(arg.order).toEqual([['id', 'DESC']]);
        expect(arg.limit).toBe(25);
    });

    it('returns null when no row has a matching role', async () => {
        businessRegistration.findAll.mockResolvedValue([
            { vendorPeople: [{ role: 'nominee', peopleId: 1 }] },
        ]);
        expect(await findVendorPersonByRole('director')).toBeNull();
    });
});
