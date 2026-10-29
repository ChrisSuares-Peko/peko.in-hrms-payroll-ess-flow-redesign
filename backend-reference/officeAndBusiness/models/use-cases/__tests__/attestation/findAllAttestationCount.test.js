const { Op } = require('sequelize');

const Attestation = require('../../../entities/attestation')
const { findAllAttestationCount } = require('../../../use-cases/attestation');
const transaction = require('../../../entities/transaction');
const credential = require('../../../entities/credential');
const SubCorporateUser = require('../../../entities/subCorporateUsers');
const orders = require('../../../entities/order');

jest.mock('../../../entities/attestation', () => ({
    findAndCountAll: jest.fn(),
}));

describe('find all attestation documents', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });
  
    it('should find and return all the attestaton docs', async () => {
        const params = {
            limit: 10,
            offset: 0,
            searchText: '',
            sort: "DESC",
            sortField: 'createdAt',
            credential: 123
        }

        const expectedAttestation = {
            count: 1,
            rows: [{
                id: 'attestationId',
                status: 'PICKUP',
                createdAt: new Date(),
                updatedAt: new Date(),
                amount: 300, 
                transactionId : 12384, 
                passportDoc : " ",
                documentType : 'Birth Certificate',
                issuedCountry : 'USA',
                submissionCountry : 'UAE',
                address : 'Address line 1',
                contactPersonPhone : '971222323434',
                credentialId : 916,
            }]
        };
  
        Attestation.findAndCountAll.mockResolvedValue(expectedAttestation);
  
        const result = await findAllAttestationCount(params);

        expect(Attestation.findAndCountAll).toHaveBeenCalledWith({
            attributes:['id','createdAt','documentType','amount','passportDoc','status','issuedCountry','submissionCountry','email','contactPersonPhone','address'],
            include: [
                { 
                    model: credential, 
                    attributes: ['id', 'name', 'username'], 
                    include: [{
                        model: credential, 
                        as: 'registeredByCredential', 
                        attributes: ['name'], 
                    }], 
                },{ 
                    model: transaction, 
                    attributes: ['corporateTxnId', 'status'], 
                    include: [{ 
                        model: orders, 
                        attributes: ['id', 'amountInINR'] 
                    }] 
                },
                { 
                    model: SubCorporateUser, 
                    attributes: ['id', 'name'], 
                    required: false 
                }
            ],
            where: {
                [Op.or]: [
                    { id: { [Op.like]: `%${params.searchText}%` } },
                    { documentType: { [Op.like]: `%${params.searchText}%` } },
                    { issuedCountry: { [Op.like]: `%${params.searchText}%` } },
                    { submissionCountry: { [Op.like]: `%${params.searchText}%` } },
                    { address: { [Op.like]: `%${params.searchText}%` } },
                    { '$credential.username$': { [Op.like]: `%${params.searchText}%` } },
                    { '$credential.name$': { [Op.like]: `%${params.searchText}%` } },
                    { status: params.searchText }
                ],
                credentialId: params.corporateId,
                // subCorporateUserId: params.subCorporateUserId
            },
            order: expect.anything(),
            limit: params.limit,
            offset: params.offset
        });
        expect(result).toEqual(expectedAttestation);
    });

    it('should throw an error if the find method throws an error', async () => {
        const params = {
            limit: 10,
            offset: 0,
            searchText: '',
            sort: "DESC",
            sortField: 'createdAt',
        }
        const expectedError = new Error('Error occured while fetching attestation. Please try again');
    
        Attestation.findAndCountAll.mockRejectedValue(expectedError);
        
        const result = findAllAttestationCount(params);
        await expect(result).rejects.toThrow('Error occured while fetching attestation. Please try again');
    
        // expect(Employee.find).toHaveBeenCalledWith(params);
      });

  });