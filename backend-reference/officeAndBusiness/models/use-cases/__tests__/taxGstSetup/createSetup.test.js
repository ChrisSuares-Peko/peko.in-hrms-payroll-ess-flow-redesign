const { createSetup } = require('../../../use-cases/taxGstSetup')
const TaxGstSetup = require('../../../entities/taxGstSetup')

jest.mock('../../../entities/taxGstSetup', () => ({
  create: jest.fn(),
}))

describe('createSetup', () => {
  beforeEach(() => jest.clearAllMocks())

  it('should create and return a new GST setup record', async () => {
    const mockData = { corporateUserId: 1, gstin: '29AFSPB9500E1ZY', financialYear: '2024-25', legalName: 'Test Co' }
    TaxGstSetup.create.mockResolvedValue(mockData)

    const result = await createSetup(mockData)

    expect(TaxGstSetup.create).toHaveBeenCalledWith(mockData)
    expect(result).toEqual(mockData)
  })

  it('should return false when create returns null', async () => {
    TaxGstSetup.create.mockResolvedValue(null)

    const result = await createSetup({ corporateUserId: 1 })

    expect(result).toBe(false)
  })

  it('should propagate database errors', async () => {
    TaxGstSetup.create.mockRejectedValue(new Error('DB error'))

    await expect(createSetup({})).rejects.toThrow('DB error')
  })
})
