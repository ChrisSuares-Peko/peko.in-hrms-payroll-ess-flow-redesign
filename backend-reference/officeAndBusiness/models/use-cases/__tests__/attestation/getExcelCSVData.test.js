const { Op } = require('sequelize');

const Attestation = require('../../../entities/attestation');
const credential = require('../../../entities/credential');
const transaction = require('../../../entities/transaction');
const { getExcelCSVData } = require('../../../use-cases/attestation');
const { formattedDateTime, formatNumberWithLocalString } = require('../../../../utils/formatter');

jest.mock('../../../entities/attestation', () => ({
    findAndCountAll: jest.fn(),
}));

describe('Report Data Fetch', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });
  
    it('fetch, format and return attestation list', async () => {
        const params = {
            limit: 10,
            offset: 0,
            searchText: '',
            sort: "DESC",
            sortField: 'createdAt',
            credentialAttribute: ['createdAt', "updatedAt"],
            transactionAttribute: ['createdAt', "updatedAt"]
        }

        const expectedDBResponse= {
            count: 1,
            rows: [{
                id: 'attestationId',
                status: 'PICKUP',
                createdAt: new Date(),
                updatedAt: new Date(),
                amount: 300, 
                transactionId : 12384, 
                passportDoc : "https://example.com",
                documentType : 'Birth Certificate',
                issuedCountry : 'USA',
                submissionCountry : 'UAE',
                address : 'Address line 1',
                contactPersonPhone : '971222323434',
                credentialId : 916,
                credential: {
                    name: "Name", 
                    username: 916, 
                    registeredByCredential: {
                        name: "Peko"
                    }
                }
            }]
        };

        const attetstationDetails = expectedDBResponse.rows[0];
        const expectedResult = [{
            Date: formattedDateTime(new Date()),
            "Corporate Name": attetstationDetails.credential.name,
            "Corporate ID": attetstationDetails.credential.username,
            "Document": attetstationDetails.documentType,
            "Amount": `₹ ${formatNumberWithLocalString(attetstationDetails.amount)}`,
            "Status": attetstationDetails.status,
            "Document Url": attetstationDetails.passportDoc,
            "Partner Name": attetstationDetails.credential.registeredByCredential.name,
        }]
  
        Attestation.findAndCountAll.mockResolvedValue(expectedDBResponse);
    
        const result = await getExcelCSVData(params);

        expect(Attestation.findAndCountAll).toHaveBeenCalledWith({
            include: [
                { 
                    model: credential, 
                    attributes: params.credentialAttribute, 
                    include: [{
                        model: credential, 
                        as: 'registeredByCredential', 
                        attributes: ['name'], 
                    }], 
                },{ 
                    model: transaction, 
                    attributes: params.transactionAttribute
                }
            ],
            where: {
                [Op.or]: [
                    { id: { [Op.like]: `%${params.searchText}%` } },
                    { documentType: { [Op.like]: `%${params.searchText}%` } },
                    { issuedCountry: { [Op.like]: `%${params.searchText}%` } },
                    { submissionCountry: { [Op.like]: `%${params.searchText}%` } },
                    { address: { [Op.like]: `%${params.searchText}%` } },
                    { '$credential.username$': { [Op.like]: '%' + params.searchText + '%' } }, 
                    { '$credential.name$': { [Op.like]: '%' + params.searchText + '%'} }
                ],
            },
            order: [
                [params.sortField, params.sort]
            ],
            attributes: params.orderAttribute,
            raw: true,
            nest: true
        });
        expect(result).toEqual(expectedResult);
    });

    it('should put Not Availabe for the missing fields', async () => {
        const params = {
            limit: 10,
            offset: 0,
            searchText: '',
            sort: "DESC",
            sortField: 'createdAt',
            credentialAttribute: ['createdAt', "updatedAt"],
            transactionAttribute: ['createdAt', "updatedAt"]
        }

        const expectedDBResponse= {
            count: 1,
            rows: [{}]
        };

        const expectedResult = [{
            Date: 'Not Available',
            "Corporate Name": 'Not Available',
            "Corporate ID": 'Not Available',
            "Document": 'Not Available',
            "Amount": '₹ 0.00',
            "Status": 'Not Available',
            "Document Url": 'Not Available',
            "Partner Name": 'Not Available',
        }]
  
        Attestation.findAndCountAll.mockResolvedValue(expectedDBResponse);
    
        const result = await getExcelCSVData(params);
        expect(result).toEqual(expectedResult);
    });

    it('should throw an error if the find method throws an error', async () => {
        const params = {
            limit: 10,
            offset: 0,
            searchText: '',
            sort: "DESC",
            sortField: 'createdAt',
        }

        const expectedError = new Error('Error occured while fetching attestation.');
        Attestation.findAndCountAll.mockRejectedValue(expectedError);
    
        const result = getExcelCSVData(params);
        await expect(result).rejects.toThrow('Error occured while fetching attestation.');
        // expect(Attestation.update).toHaveBeenCalledWith(attestationDetails,{ 
        //     where: {
        //         id: params.id,
        //     }
        // });
    });
});