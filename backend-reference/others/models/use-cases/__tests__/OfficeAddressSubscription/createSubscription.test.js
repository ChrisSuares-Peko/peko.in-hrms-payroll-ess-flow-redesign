const { createSubscription } = require('../../../use-cases/officeAddressSubscriptions');
const OfficeAddressSubscription = require('../../../entities/officeAddressSubscription');

jest.mock('../../../entities/officeAddressSubscription', () => ({
  findOne: jest.fn(),
  create: jest.fn(),
}));

describe('createSubscription', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return false if subscription already exists', async () => {
    const mockParams = { paymentRefId: '12345' };

    OfficeAddressSubscription.findOne.mockResolvedValue(true);

    const result = await createSubscription(mockParams);

    expect(OfficeAddressSubscription.findOne).toHaveBeenCalledWith({
      where: { paymentRefId: mockParams.paymentRefId },
    });
    expect(OfficeAddressSubscription.create).not.toHaveBeenCalled();
    expect(result).toBe(false);
  });

  it('should create a new subscription if it does not already exist', async () => {
    const mockParams = { paymentRefId: '12345', workspaceId: 1 };
    const mockCreatedSubscription = { id: 1, ...mockParams };

    OfficeAddressSubscription.findOne.mockResolvedValue(null);
    OfficeAddressSubscription.create.mockResolvedValue(mockCreatedSubscription);

    const result = await createSubscription(mockParams);

    expect(OfficeAddressSubscription.findOne).toHaveBeenCalledWith({
      where: { paymentRefId: mockParams.paymentRefId },
    });
    expect(OfficeAddressSubscription.create).toHaveBeenCalledWith(mockParams);
    expect(result).toEqual(mockCreatedSubscription);
  });

  it('should log an error and return undefined if an exception occurs', async () => {
    const mockParams = { paymentRefId: '12345' };
    const mockError = new Error('Database error');
    jest.spyOn(console, 'log').mockImplementation(() => {});

    OfficeAddressSubscription.findOne.mockRejectedValue(mockError);

    const result = await createSubscription(mockParams);

    expect(OfficeAddressSubscription.findOne).toHaveBeenCalledWith({
      where: { paymentRefId: mockParams.paymentRefId },
    });
    expect(console.log).toHaveBeenCalledWith(mockError.message);
    expect(result).toBeUndefined();

    console.log.mockRestore();
  });

  it('should log a message in the finally block', async () => {
    const mockParams = { paymentRefId: '12345' };

    OfficeAddressSubscription.findOne.mockResolvedValue(null);
    jest.spyOn(console, 'log').mockImplementation(() => {});

    await createSubscription(mockParams);

    expect(console.log).toHaveBeenCalledWith('SUBSCRIPTION CREATE ROUTE CALLED');

    console.log.mockRestore();
  });
});
