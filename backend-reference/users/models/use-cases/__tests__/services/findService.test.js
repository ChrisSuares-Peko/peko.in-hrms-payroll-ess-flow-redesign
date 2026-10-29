const systemUser = require('../../../entities/systemUser');
const { findPartnerServiceAccess } = require('../../../use-cases/partnerServiceAccess');
const { findService } = require('../../../use-cases/services');

jest.mock('../../../entities/systemUser', () => ({
    findOne: jest.fn(),
}));

jest.mock('../../../entities/roleAndPermissions', () => ({}));
jest.mock('../../../entities/cashback', () => ({}));
jest.mock('../../../entities/package', () => ({}));
jest.mock('../../../entities/serviceOperator', () => ({}));

jest.mock('../../../use-cases/partnerServiceAccess', () => ({
    findPartnerServiceAccess: jest.fn(),
}));

describe('findService', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('uses the partnerServiceAccess override for partner system users', async () => {
        const rolePermissions = [{ service: 'Dashboard', hasAccess: true }];
        const partnerPermissions = [{ service: 'Reports', hasAccess: true }];

        systemUser.findOne.mockResolvedValue({
            roleAndPermission: {
                roleName: 'partner',
                permissions: rolePermissions,
            },
        });
        findPartnerServiceAccess.mockResolvedValue({
            partnerId: 123,
            permissions: partnerPermissions,
            status: true,
        });

        const result = await findService(123);

        expect(findPartnerServiceAccess).toHaveBeenCalledWith(123);
        expect(result.roleAndPermission.permissions).toEqual(partnerPermissions);
    });

    it('keeps the role permissions when the partner has no override row', async () => {
        const rolePermissions = [{ service: 'Dashboard', hasAccess: true }];

        systemUser.findOne.mockResolvedValue({
            roleAndPermission: {
                roleName: 'partner',
                permissions: rolePermissions,
            },
        });
        findPartnerServiceAccess.mockResolvedValue(null);

        const result = await findService(123);

        expect(result.roleAndPermission.permissions).toEqual(rolePermissions);
    });

    it('does not look up an override for non-partner system users', async () => {
        systemUser.findOne.mockResolvedValue({
            roleAndPermission: {
                roleName: 'admin',
                permissions: [{ service: 'Users', hasAccess: true }],
            },
        });

        await findService(999);

        expect(findPartnerServiceAccess).not.toHaveBeenCalled();
    });

    it('does not look up an override when the system user has no role row', async () => {
        systemUser.findOne.mockResolvedValue(null);

        const result = await findService(999);

        expect(findPartnerServiceAccess).not.toHaveBeenCalled();
        expect(result).toBeNull();
    });
});
