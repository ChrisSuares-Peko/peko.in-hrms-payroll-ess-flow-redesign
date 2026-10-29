const { updateInvoice } = require('../../invoices');
const Invoice = require('../../../entities/invoices');

jest.mock('../../../entities/invoices');

describe('updateInvoice', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update the invoice status and return an empty array', async () => {
    const params = {
      id: 462
    };
    
    const data = {
      status: "PAID"
    };

    // Mock the update method to return an empty array
    Invoice.update.mockResolvedValue([]);

    const result = await updateInvoice(params, data);

    expect(Invoice.update).toHaveBeenCalledWith(data, {
      where: {
        id: params.id
      }
    });
    expect(result).toEqual([]);
  });

  it('should throw an error if invoice update fails', async () => {
    const params = {
      id: 462
    };

    const data = {
      status: "PAID"
    };

    const expectedError = new Error('Database error');

    // Mock the update method to throw an error
    Invoice.update.mockRejectedValue(expectedError);

    await expect(updateInvoice(params, data)).rejects.toThrow('Database error');
    expect(Invoice.update).toHaveBeenCalledWith(data, {
      where: {
        id: params.id
      }
    });
  });
  it('should scope the update by credentialId when provided (owner check)', async () => {
    Invoice.update.mockResolvedValue([1]);
    await updateInvoice({ id: 462, credentialId: 160 }, { status: 'PAID' });
    expect(Invoice.update).toHaveBeenCalledWith({ status: 'PAID' }, {
      where: { id: 462, credentialId: 160 }
    });
  });
});
