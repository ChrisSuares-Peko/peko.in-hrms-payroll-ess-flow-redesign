const { findRequestByIdForCorporate } = require('../../documentRequest');
const DocumentRequest = require('../../../entities/documentRequest');

jest.mock('../../../entities/documentRequest', () => ({
  findOne: jest.fn(),
}));

describe('findRequestByIdForCorporate Use-Case', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should scope the lookup by both request id and corporateUser and populate employee fields', async () => {
    const corporateUser = 'corporateUserId';
    const requestId = 'requestId';
    const expectedRequest = { _id: requestId, corporateUser, documentType: 'Salary Certificate' };

    const populateMock = jest.fn().mockResolvedValue(expectedRequest);
    DocumentRequest.findOne.mockReturnValue({ populate: populateMock });

    const result = await findRequestByIdForCorporate(corporateUser, requestId);

    expect(DocumentRequest.findOne).toHaveBeenCalledWith({ _id: requestId, corporateUser });
    expect(populateMock).toHaveBeenCalledWith(
      'employee',
      'personalInformation.fullName personalInformation.email employeeInformation.workEmailId'
    );
    expect(result).toEqual(expectedRequest);
  });

  it('should return null when no request matches the id and corporateUser combination', async () => {
    const corporateUser = 'corporateUserId';
    const requestId = 'someOtherCorporatesRequestId';

    const populateMock = jest.fn().mockResolvedValue(null);
    DocumentRequest.findOne.mockReturnValue({ populate: populateMock });

    const result = await findRequestByIdForCorporate(corporateUser, requestId);

    expect(DocumentRequest.findOne).toHaveBeenCalledWith({ _id: requestId, corporateUser });
    expect(result).toBeNull();
  });

  it('should propagate an error if the findOne method throws an error', async () => {
    const corporateUser = 'corporateUserId';
    const requestId = 'requestId';
    const expectedError = new Error('DB failure');

    const populateMock = jest.fn().mockRejectedValue(expectedError);
    DocumentRequest.findOne.mockReturnValue({ populate: populateMock });

    await expect(findRequestByIdForCorporate(corporateUser, requestId)).rejects.toThrow('DB failure');
    expect(DocumentRequest.findOne).toHaveBeenCalledWith({ _id: requestId, corporateUser });
  });
});
