const { getItcEstimate } = require('../../../use-cases/taxImsInvoice')
const TaxImsInvoice = require('../../../entities/taxImsInvoice')

jest.mock('../../../entities/taxImsInvoice', () => ({
  findAll: jest.fn(),
}))

describe('getItcEstimate', () => {
  beforeEach(() => jest.clearAllMocks())

  it('should calculate ITC correctly across accepted, rejected, and pending invoices', async () => {
    TaxImsInvoice.findAll.mockResolvedValue([
      { imsAction: 'accepted', totalTax: '1800' },
      { imsAction: 'accepted', totalTax: '900' },
      { imsAction: 'rejected', totalTax: '500' },
      { imsAction: 'pending',  totalTax: '300' },
      { imsAction: 'pending',  totalTax: '200' },
    ])

    const result = await getItcEstimate(5, 1)

    expect(result.accepted).toBe(2700)
    expect(result.rejected).toBe(500)
    expect(result.pending).toBe(500)
    expect(result.netClaimable).toBe(2700)
    expect(result.pendingCount).toBe(2)
  })

  it('should return zeros when there are no invoices', async () => {
    TaxImsInvoice.findAll.mockResolvedValue([])

    const result = await getItcEstimate(5, 1)

    expect(result.accepted).toBe(0)
    expect(result.rejected).toBe(0)
    expect(result.pending).toBe(0)
    expect(result.netClaimable).toBe(0)
    expect(result.pendingCount).toBe(0)
  })

  it('should propagate database errors', async () => {
    TaxImsInvoice.findAll.mockRejectedValue(new Error('DB error'))

    await expect(getItcEstimate(5, 1)).rejects.toThrow('DB error')
  })
})
