const { createReconciliation } = require('../../../use-cases/taxImsReconciliation')
const TaxImsReconciliation = require('../../../entities/taxImsReconciliation')

jest.mock('../../../entities/taxImsReconciliation', () => ({
  create: jest.fn(),
}))

describe('createReconciliation', () => {
  beforeEach(() => jest.clearAllMocks())

  it('should create a reconciliation record with pending status', async () => {
    const mockData = {
      corporateUserId: 1, gstin: '29AFSPB9500E1ZY',
      financialYear: '2024-25', month: 11,
      reconciliationCriteria: 'strict', status: 'pending',
    }
    TaxImsReconciliation.create.mockResolvedValue({ id: 5, ...mockData })

    const result = await createReconciliation(mockData)

    expect(TaxImsReconciliation.create).toHaveBeenCalledWith(mockData)
    expect(result.id).toBe(5)
    expect(result.status).toBe('pending')
  })

  it('should return false when create returns null', async () => {
    TaxImsReconciliation.create.mockResolvedValue(null)

    const result = await createReconciliation({})

    expect(result).toBe(false)
  })

  it('should propagate database errors', async () => {
    TaxImsReconciliation.create.mockRejectedValue(new Error('Connection lost'))

    await expect(createReconciliation({})).rejects.toThrow('Connection lost')
  })
})
