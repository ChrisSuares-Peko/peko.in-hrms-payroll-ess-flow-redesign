const { updateImsInvoiceAction } = require('../../../use-cases/taxImsInvoice')
const TaxImsInvoice = require('../../../entities/taxImsInvoice')

jest.mock('../../../entities/taxImsInvoice', () => ({
  update: jest.fn(),
}))

describe('updateImsInvoiceAction', () => {
  beforeEach(() => jest.clearAllMocks())

  it('should update imsAction to accepted', async () => {
    TaxImsInvoice.update.mockResolvedValue([1])

    const result = await updateImsInvoiceAction(10, 1, 'accepted')

    expect(TaxImsInvoice.update).toHaveBeenCalledWith(
      { imsAction: 'accepted' },
      { where: { id: 10, corporateUserId: 1 } }
    )
    expect(result).toEqual([1])
  })

  it('should update imsAction to rejected', async () => {
    TaxImsInvoice.update.mockResolvedValue([1])

    await updateImsInvoiceAction(10, 1, 'rejected')

    expect(TaxImsInvoice.update).toHaveBeenCalledWith(
      { imsAction: 'rejected' },
      { where: { id: 10, corporateUserId: 1 } }
    )
  })

  it('should propagate errors', async () => {
    TaxImsInvoice.update.mockRejectedValue(new Error('DB error'))

    await expect(updateImsInvoiceAction(10, 1, 'accepted')).rejects.toThrow('DB error')
  })
})
