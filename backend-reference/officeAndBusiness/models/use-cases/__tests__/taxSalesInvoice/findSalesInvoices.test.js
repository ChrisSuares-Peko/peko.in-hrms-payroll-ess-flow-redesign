const { findSalesInvoices } = require('../../../use-cases/taxSalesInvoice')
const TaxSalesInvoice = require('../../../entities/taxSalesInvoice')

jest.mock('../../../entities/taxSalesInvoice', () => ({
  findAndCountAll: jest.fn(),
}))

describe('findSalesInvoices', () => {
  beforeEach(() => jest.clearAllMocks())

  it('should return invoices for a given month', async () => {
    const mockResult = { count: 2, rows: [{ id: 1 }, { id: 2 }] }
    TaxSalesInvoice.findAndCountAll.mockResolvedValue(mockResult)

    const result = await findSalesInvoices(1, '29AFSPB9500E1ZY', '2024-25', 11)

    expect(TaxSalesInvoice.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({ where: { corporateUserId: 1, gstin: '29AFSPB9500E1ZY', financialYear: '2024-25', month: 11 } })
    )
    expect(result.count).toBe(2)
  })

  it('should return all months data when no month filter provided', async () => {
    TaxSalesInvoice.findAndCountAll.mockResolvedValue({ count: 10, rows: [] })

    await findSalesInvoices(1, '29AFSPB9500E1ZY', '2024-25', null)

    expect(TaxSalesInvoice.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({ where: { corporateUserId: 1, gstin: '29AFSPB9500E1ZY', financialYear: '2024-25' } })
    )
  })

  it('should propagate database errors', async () => {
    TaxSalesInvoice.findAndCountAll.mockRejectedValue(new Error('Query timeout'))

    await expect(findSalesInvoices(1, 'X', '2024-25', null)).rejects.toThrow('Query timeout')
  })
})
