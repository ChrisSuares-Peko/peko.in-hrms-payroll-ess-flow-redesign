const corporateUser = require('../../../entities/corporateUser')
const packAge = require('../../../entities/package')
const credential = require('../../../entities/credential')
const { findOneDetails } = require('../../corporateUser')

jest.mock('@logtail/node', () => {
     return {
         Logtail: jest.fn().mockImplementation(() => {
             return {
                 // Mock methods of Logtail if needed
                 info: jest.fn(),
                 error: jest.fn(),
             };
         }),
     };
 });

describe('findOneDetails', () => {
     beforeEach(() => {
          jest.clearAllMocks()
     })

     it('should retrieve data with basic attributes', async () => {
          const params = { corporateId: 1, type: 'basic' }
          const attributes = {
               corporateAttr: [
                    'name',
                    'mobileNo',
                    'city',
                    'designation',
                    'email',
                    'country',
                    'companyName',
                    'companySize',
                    'landlineNo',
                    'logo',
                    'contactPersonName',
               ],
               packageAttr: ['packageName'],
               credentialsAttr: ['username'],
          }

          const mockCorporateUser = {
               name: 'Test Corp',
               mobileNo: '1234567890',
               city: 'Test City',
               designation: 'Manager',
               email: 'test@example.com',
               country: 'Test Country',
               companyName: 'Test Company',
               companySize: '50-100',
               landlineNo: '0987654321',
               logo: 'logo_url',
               contactPersonName: 'John Doe',
               package: { packageName: 'Gold' },
               credential: { username: 'testuser' },
          }

          jest.spyOn(corporateUser, 'findOne').mockResolvedValue(mockCorporateUser)

          const result = await findOneDetails(params, attributes)

          expect(result).toEqual(mockCorporateUser)
          expect(corporateUser.findOne).toHaveBeenCalledWith({
               include: [
                    { model: packAge, attributes: ['packageName'] },
                    { model: credential, attributes: ['username'] },
               ],
               where: { credentialId: params.corporateId },
               attributes: attributes.corporateAttr,
               nest: true,
               raw: true,
          })
     })

     it('should retrieve data with company attributes', async () => {
          const params = { corporateId: 1, type: 'company' }
          const attributes = {
               corporateAttr: [
                    'activity',
                    'trnExpiry',
                    'trnNo',
                    'tradeLicenseExpiry',
                    'tradeLicenseNo',
                    'tradeLicenseDoc',
                    'trnCertificate',
                    'eidDoc',
               ],
               packageAttr: [],
               credentialsAttr: [],
          }

          const mockCorporateUser = {
               name: 'Test Corp',
               mobileNo: '1234567890',
               city: 'Test City',
               designation: 'Manager',
               email: 'test@example.com',
               country: 'Test Country',
               companyName: 'Test Company',
               companySize: '50-100',
               landlineNo: '0987654321',
               logo: 'logo_url',
               contactPersonName: 'John Doe',
               package: { packageName: 'Gold' },
               credential: { username: 'testuser' },
          }

          corporateUser.findOne = jest.fn().mockResolvedValue(mockCorporateUser)

          const result = await findOneDetails(params, attributes)

          expect(corporateUser.findOne).toHaveBeenCalledWith({
               include: [
                    {
                         model: packAge,
                         attributes: attributes.packageAttr,
                    },
                    {
                         model: credential,
                         attributes: attributes.credentialsAttr,
                    },
               ],
               where: { credentialId: params.corporateId },
               attributes: attributes.corporateAttr,
               nest: true,
               raw: true,
          })

          expect(result).toEqual(mockCorporateUser)
     })

     it('should retrieve data with security attributes', async () => {
          const params = { corporateId: 1, type: 'security' }
          const attributes = {
               corporateAttr: ['sendMfaCodeToEmail', 'sendMfaCodeToPhone', 'sendMfaCodeToAuthApp'],
               packageAttr: [],
               credentialsAttr: [],
          }

          const mockCorporateUser = {
               name: 'Test Corp',
               mobileNo: '1234567890',
               city: 'Test City',
               designation: 'Manager',
               email: 'test@example.com',
               country: 'Test Country',
               companyName: 'Test Company',
               companySize: '50-100',
               landlineNo: '0987654321',
               logo: 'logo_url',
               contactPersonName: 'John Doe',
               package: { packageName: 'Gold' },
               credential: { username: 'testuser' },
          }

          corporateUser.findOne = jest.fn().mockResolvedValue(mockCorporateUser)

          const result = await findOneDetails(params, attributes)

          expect(corporateUser.findOne).toHaveBeenCalledWith({
               include: [
                    {
                         model: packAge,
                         attributes: attributes.packageAttr,
                    },
                    {
                         model: credential,
                         attributes: attributes.credentialsAttr,
                    },
               ],
               where: { credentialId: params.corporateId },
               attributes: attributes.corporateAttr,
               nest: true,
               raw: true,
          })

          expect(result).toEqual(mockCorporateUser)
     })

     it('should handle errors from findOne', async () => {
          const params = { corporateId: 1, type: 'basic' }
          const attributes = {
               corporateAttr: [
                    'name',
                    'mobileNo',
                    'city',
                    'designation',
                    'email',
                    'country',
                    'companyName',
                    'companySize',
                    'landlineNo',
                    'logo',
                    'contactPersonName',
               ],
               packageAttr: ['packageName'],
               credentialsAttr: ['username'],
          }

          jest.spyOn(corporateUser, 'findOne').mockRejectedValue(new Error('Database error'))

          await expect(findOneDetails(params, attributes)).rejects.toThrow('Database error')
     })
})
