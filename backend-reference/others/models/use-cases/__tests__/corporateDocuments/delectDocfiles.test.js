
const corporateDocuments = require('../../../entities/corporateDocuments');
const { delectDocfiles } = require('../../corporateDocuments');

jest.mock('../../../entities/corporateDocuments', () => ({
  destroy: jest.fn(),
}));

describe('delectDocfiles', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should delete documents and return true when deletedCount > 0', async () => {
    const params = {
      docNamelist: ['PAN', 'GST'],
      corporateUserId: 22,
    };

    corporateDocuments.destroy.mockResolvedValue(2); // two rows deleted

    const result = await delectDocfiles(params);

    expect(corporateDocuments.destroy).toHaveBeenCalledWith({
      where: {
        documentName: params.docNamelist,
        corporateUserId: params.corporateUserId,
      },
    });

    expect(result).toBe(true);
  });

  it('should return false when deletedCount is 0', async () => {
    const params = {
      docNamelist: ['DOC1'],
      corporateUserId: 10,
    };

    corporateDocuments.destroy.mockResolvedValue(0);

    const result = await delectDocfiles(params);

    expect(result).toBe(false);
  });

  it('should return false when an error occurs', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => { });
    const params = { docNamelist: ['PAN'], corporateUserId: 5 };

    const error = new Error('DB error');
    corporateDocuments.destroy.mockRejectedValue(error);

    const result = await delectDocfiles(params);

    expect(consoleSpy).toHaveBeenCalledWith(error);
    expect(result).toBe(false);

    consoleSpy.mockRestore();
  });


  it('should use default empty array when docNamelist is not passed', async () => {
    const params = { corporateUserId: 33 };

    corporateDocuments.destroy.mockResolvedValue(1);

    const result = await delectDocfiles(params);

    expect(corporateDocuments.destroy).toHaveBeenCalledWith({
      where: {
        documentName: [],
        corporateUserId: params.corporateUserId,
      },
    });

    expect(result).toBe(true);
  });

  it('should return false if docNamelist is empty and nothing is deleted', async () => {
    const params = { docNamelist: [], corporateUserId: 90 };

    corporateDocuments.destroy.mockResolvedValue(0);

    const result = await delectDocfiles(params);

    expect(result).toBe(false);
  });

});
