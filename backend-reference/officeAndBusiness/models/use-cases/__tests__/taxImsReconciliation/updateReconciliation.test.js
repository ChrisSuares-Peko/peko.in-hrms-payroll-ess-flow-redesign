const { updateReconciliation } = require('../../../use-cases/taxImsReconciliation')
const TaxImsReconciliation = require('../../../entities/taxImsReconciliation')

jest.mock('../../../entities/taxImsReconciliation', () => ({
  update: jest.fn(),
}))

describe('updateReconciliation', () => {
  beforeEach(() => jest.clearAllMocks())

  it('should update sandboxJobId and status after Sandbox job creation', async () => {
    TaxImsReconciliation.update.mockResolvedValue([1])

    const result = await updateReconciliation(5, 1, {
      sandboxJobId: 'job-abc-123',
      status: 'created',
      gstr2aUploadUrl: 'https://s3.example.com/gstr2a',
    })

    expect(TaxImsReconciliation.update).toHaveBeenCalledWith(
      expect.objectContaining({ sandboxJobId: 'job-abc-123', status: 'created' }),
      { where: { id: 5, corporateUserId: 1 } }
    )
    expect(result).toEqual([1])
  })

  it('should update to succeeded with report URL', async () => {
    TaxImsReconciliation.update.mockResolvedValue([1])

    await updateReconciliation(5, 1, { status: 'succeeded', reconciliationReportUrl: 'https://s3.example.com/report' })

    expect(TaxImsReconciliation.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'succeeded' }),
      { where: { id: 5, corporateUserId: 1 } }
    )
  })

  it('should propagate errors', async () => {
    TaxImsReconciliation.update.mockRejectedValue(new Error('DB error'))

    await expect(updateReconciliation(1, 1, {})).rejects.toThrow('DB error')
  })
})
