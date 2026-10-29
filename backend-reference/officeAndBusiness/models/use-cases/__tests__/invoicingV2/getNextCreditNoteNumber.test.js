const { getNextCreditNoteNumber } = require('../../invoicingV2');
const invoicingV2 = require('../../../entities/invoicingV2');

jest.mock('../../../entities/invoicingV2');

describe('getNextCreditNoteNumber', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return maxNumber + 1 when a credit note exists', async () => {
    invoicingV2.findOne.mockResolvedValue({ maxNumber: '5' });

    const result = await getNextCreditNoteNumber('corp1');

    expect(result).toBe(6);
  });

  it('should return 1 when no credit notes exist (maxNumber is null)', async () => {
    invoicingV2.findOne.mockResolvedValue({ maxNumber: null });

    const result = await getNextCreditNoteNumber('corp1');

    expect(result).toBe(1);
  });

  it('should call findOne with correct where clause for the given corporateUserId', async () => {
    invoicingV2.findOne.mockResolvedValue({ maxNumber: '3' });

    await getNextCreditNoteNumber('corp1');

    expect(invoicingV2.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { corporateUserId: 'corp1', documentType: 'CREDIT_NOTE' },
        attributes: expect.anything(),
        raw: true,
      })
    );
  });

  it('should throw when findOne rejects with a DB error', async () => {
    const dbError = new Error('Database query failed');
    invoicingV2.findOne.mockRejectedValue(dbError);

    await expect(getNextCreditNoteNumber('corp1')).rejects.toThrow('Database query failed');
  });
});
