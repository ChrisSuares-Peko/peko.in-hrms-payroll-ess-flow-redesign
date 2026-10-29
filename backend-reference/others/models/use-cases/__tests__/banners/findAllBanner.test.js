const { findAllBanner } = require('../../../use-cases/banners');
const banner = require('../../../entities/banners');

jest.mock('../../../entities/banners', () => ({
    findAll: jest.fn(),
}));

describe('findAllBanner', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return banners matching the deviceType with default filters', async () => {
        const mockDeviceType = 'mobile';
        const mockBanners = [
            { id: 1, title: 'Banner 1', deviceType: 'mobile', status: true },
            { id: 2, title: 'Banner 2', deviceType: 'mobile', status: true },
        ];

        banner.findAll.mockResolvedValue(mockBanners);

        const result = await findAllBanner(mockDeviceType);

        expect(banner.findAll).toHaveBeenCalledWith({
            where: { status: true, deviceType: mockDeviceType },
            attributes: { exclude: undefined },
            nest: true,
            raw: true,
        });
        expect(result).toEqual(mockBanners);
    });

    it('should include position in the whereClause if provided', async () => {
        const mockDeviceType = 'mobile';
        const mockPosition = 'top';
        const mockBanners = [
            { id: 1, title: 'Top Banner', deviceType: 'mobile', position: 'top', status: true },
        ];

        banner.findAll.mockResolvedValue(mockBanners);

        const result = await findAllBanner(mockDeviceType, mockPosition);

        expect(banner.findAll).toHaveBeenCalledWith({
            where: { status: true, deviceType: mockDeviceType, position: mockPosition },
            attributes: { exclude: undefined },
            nest: true,
            raw: true,
        });
        expect(result).toEqual(mockBanners);
    });

    it('should include partnerId in the whereClause if provided', async () => {
        const mockDeviceType = 'desktop';
        const mockPartnerId = 123;
        const mockBanners = [
            { id: 1, title: 'Partner Banner', deviceType: 'desktop', partnerId: 123, status: true },
        ];

        banner.findAll.mockResolvedValue(mockBanners);

        const result = await findAllBanner(mockDeviceType, null, mockPartnerId);

        expect(banner.findAll).toHaveBeenCalledWith({
            where: { status: true, deviceType: mockDeviceType, partnerId: mockPartnerId },
            attributes: { exclude: undefined },
            nest: true,
            raw: true,
        });
        expect(result).toEqual(mockBanners);
    });

    it('should scope a null partnerId to Peko-owned banners rather than dropping the filter', async () => {
        banner.findAll.mockResolvedValue([]);

        await findAllBanner('WEB', 'TOP', null, undefined);

        expect(banner.findAll).toHaveBeenCalledWith({
            where: { status: true, deviceType: 'WEB', position: 'TOP', partnerId: null },
            attributes: { exclude: undefined },
            nest: true,
            raw: true,
        });
    });

    it('should scope a zero and an empty-string partnerId instead of dropping the filter', async () => {
        banner.findAll.mockResolvedValue([]);

        await findAllBanner('WEB', undefined, 0, undefined);
        expect(banner.findAll).toHaveBeenLastCalledWith(
            expect.objectContaining({ where: { status: true, deviceType: 'WEB', partnerId: 0 } })
        );

        await findAllBanner('WEB', undefined, '', undefined);
        expect(banner.findAll).toHaveBeenLastCalledWith(
            expect.objectContaining({ where: { status: true, deviceType: 'WEB', partnerId: null } })
        );
    });

    it('should throw an error if findAll fails', async () => {
        const mockDeviceType = 'mobile';
        const mockError = new Error('Database error');

        banner.findAll.mockRejectedValue(mockError);

        await expect(findAllBanner(mockDeviceType)).rejects.toThrow('Database error');
    });
});
