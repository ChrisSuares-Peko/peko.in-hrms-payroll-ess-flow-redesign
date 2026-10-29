const { getCreditNoteStats } = require('../../invoicingV2');
const invoicingV2 = require('../../../entities/invoicingV2');

jest.mock('../../../entities/invoicingV2');

describe('getCreditNoteStats', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return correct totalCreditNotes and totalValue when data exists', async () => {
    invoicingV2.count.mockResolvedValue(3);
    invoicingV2.sum.mockResolvedValue(1500.5);

    const result = await getCreditNoteStats('corp1');

    expect(result).toEqual({
      totalCreditNotes: 3,
      totalValue: '1500.50',
    });
  });

  it('should return zeros when no credit notes exist', async () => {
    invoicingV2.count.mockResolvedValue(0);
    invoicingV2.sum.mockResolvedValue(null);

    const result = await getCreditNoteStats('corp1');

    expect(result).toEqual({
      totalCreditNotes: 0,
      totalValue: '0.00',
    });
  });

  it('should call count and sum both with correct where clause', async () => {
    invoicingV2.count.mockResolvedValue(2);
    invoicingV2.sum.mockResolvedValue(500);

    await getCreditNoteStats('corp1');

    expect(invoicingV2.count).toHaveBeenCalledWith({
      where: { corporateUserId: 'corp1', documentType: 'CREDIT_NOTE' },
    });
    expect(invoicingV2.sum).toHaveBeenCalledWith('totalAmount', {
      where: { corporateUserId: 'corp1', documentType: 'CREDIT_NOTE' },
    });
  });

  it('should throw when count rejects with a DB error', async () => {
    const dbError = new Error('Database count failed');
    invoicingV2.count.mockRejectedValue(dbError);
    invoicingV2.sum.mockResolvedValue(0);

    await expect(getCreditNoteStats('corp1')).rejects.toThrow('Database count failed');
  });
});
