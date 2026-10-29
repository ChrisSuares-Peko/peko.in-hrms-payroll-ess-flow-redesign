const { findQuotationByToken } = require('../../invoicingV2');
const invoicingV2 = require('../../../entities/invoicingV2');

jest.mock('../../../entities/invoicingV2');

describe('findQuotationByToken', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return the quotation when a matching token exists', async () => {
    const mockQuotation = { id: 1, quotationToken: 'abc123', documentType: 'QUOTATION' };

    invoicingV2.findOne.mockResolvedValue(mockQuotation);

    const result = await findQuotationByToken('abc123');

    expect(invoicingV2.findOne).toHaveBeenCalledWith({
      where: { quotationToken: 'abc123', documentType: 'QUOTATION' },
      raw: true,
    });
    expect(result).toEqual(mockQuotation);
  });

  it('should return null when no quotation matches the token', async () => {
    invoicingV2.findOne.mockResolvedValue(null);

    const result = await findQuotationByToken('nonexistent-token');

    expect(invoicingV2.findOne).toHaveBeenCalledWith({
      where: { quotationToken: 'nonexistent-token', documentType: 'QUOTATION' },
      raw: true,
    });
    expect(result).toBeNull();
  });

  it('should throw an error if database query fails', async () => {
    const expectedError = new Error('Database error');

    invoicingV2.findOne.mockRejectedValue(expectedError);

    await expect(findQuotationByToken('abc123')).rejects.toThrow('Database error');
  });
});
