const { createSalesInvoice } = require('../../../use-cases/taxSalesInvoice')
const TaxSalesInvoice = require('../../../entities/taxSalesInvoice')

jest.mock('../../../entities/taxSalesInvoice', () => ({
  create: jest.fn(),
}))

describe('createSalesInvoice', () => {
  beforeEach(() => jest.clearAllMocks())

  it('should create and return a new sales invoice', async () => {
    const mockData = {
      corporateUserId: 1, gstin: '29AFSPB9500E1ZY', financialYear: '2024-25',
      month: 11, invoiceType: 'B2B', invoiceNo: 'INV-001', invoiceDate: '2024-11-01',
      taxableAmount: 10000, igst: 1800, cgst: 0, sgst: 0, totalTax: 1800, status: 'uploaded',
    }
    TaxSalesInvoice.create.mockResolvedValue(mockData)

    const result = await createSalesInvoice(mockData)

    expect(TaxSalesInvoice.create).toHaveBeenCalledWith(mockData)
    expect(result).toEqual(mockData)
  })

  it('should return false when create returns null', async () => {
    TaxSalesInvoice.create.mockResolvedValue(null)

    const result = await createSalesInvoice({})

    expect(result).toBe(false)
  })

  it('should propagate database errors', async () => {
    TaxSalesInvoice.create.mockRejectedValue(new Error('Duplicate entry'))

    await expect(createSalesInvoice({})).rejects.toThrow('Duplicate entry')
  })
})
