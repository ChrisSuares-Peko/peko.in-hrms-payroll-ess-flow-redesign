const systemUser = require('../../models/entities/systemUser');
const { checkPermission } = require('../checkPermission');

jest.mock('../../models/entities/systemUser', () => ({ findOne: jest.fn() }));
jest.mock('../../models/entities/roleAndPermissions', () => ({}));

const permissionsGranting = (overrides = {}) => [
  {
    serviceCategory: 'Settings',
    services: [
      {
        category: 'Peko',
        services: [
          { service: 'Peko Credits', view: true, write: true, update: true, hasAccess: true, ...overrides },
        ],
      },
    ],
  },
];

const run = async (middleware, req = { user: { id: 7 } }) => {
  const next = jest.fn();
  const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  await middleware(req, res, next);
  return { next, res };
};

const DENIED = { status_code: 403, message: 'Permission denied' };

const errorPassedToNext = next => next.mock.calls[0]?.[0];

describe('checkPermission', () => {
  beforeEach(() => jest.clearAllMocks());

  it('allows a user whose role grants write on the service', async () => {
    systemUser.findOne.mockResolvedValue({ roleAndPermission: { permissions: permissionsGranting() } });

    const { next } = await run(checkPermission('Peko Credits', 'write'));

    expect(next).toHaveBeenCalledWith();
  });

  it('denies a user whose role does not grant write', async () => {
    systemUser.findOne.mockResolvedValue({
      roleAndPermission: { permissions: permissionsGranting({ write: false }) },
    });

    const { next } = await run(checkPermission('Peko Credits', 'write'));

    expect(errorPassedToNext(next)).toMatchObject(DENIED);
  });

  it('denies a user whose role does not grant update', async () => {
    systemUser.findOne.mockResolvedValue({
      roleAndPermission: { permissions: permissionsGranting({ update: false }) },
    });

    const { next } = await run(checkPermission('Peko Credits', 'update'));

    expect(errorPassedToNext(next)).toMatchObject(DENIED);
  });

  it('denies when the service is absent from the permission tree', async () => {
    systemUser.findOne.mockResolvedValue({ roleAndPermission: { permissions: permissionsGranting() } });

    const { next } = await run(checkPermission('Some Other Service', 'write'));

    expect(errorPassedToNext(next)).toMatchObject(DENIED);
  });

  it('denies a system user that has no role attached', async () => {
    systemUser.findOne.mockResolvedValue({ roleAndPermission: null });

    const { next } = await run(checkPermission('Peko Credits', 'write'));

    expect(errorPassedToNext(next)).toMatchObject(DENIED);
  });

  it('denies when no system user row is found', async () => {
    systemUser.findOne.mockResolvedValue(null);

    const { next } = await run(checkPermission('Peko Credits', 'write'));

    expect(errorPassedToNext(next)).toMatchObject(DENIED);
  });
});
