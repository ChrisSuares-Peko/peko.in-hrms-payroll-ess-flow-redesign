const { findActiveSetup } = require('../../../use-cases/taxGstSetup')
const TaxGstSetup = require('../../../entities/taxGstSetup')

jest.mock('../../../entities/taxGstSetup', () => ({
  findOne: jest.fn(),
}))

describe('findActiveSetup', () => {
  beforeEach(() => jest.clearAllMocks())

  it('should return the active setup record when it exists', async () => {
    const mockRecord = { id: 1, corporateUserId: 1, gstin: '29AFSPB9500E1ZY', financialYear: '2024-25', isActive: true }
    TaxGstSetup.findOne.mockResolvedValue(mockRecord)

    const result = await findActiveSetup(1, '29AFSPB9500E1ZY', '2024-25')

    expect(TaxGstSetup.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ where: { corporateUserId: 1, gstin: '29AFSPB9500E1ZY', financialYear: '2024-25', isActive: true } })
    )
    expect(result).toEqual(mockRecord)
  })

  it('should return null when no setup exists', async () => {
    TaxGstSetup.findOne.mockResolvedValue(null)

    const result = await findActiveSetup(99, 'INVALID', '2024-25')

    expect(result).toBeNull()
  })
})
