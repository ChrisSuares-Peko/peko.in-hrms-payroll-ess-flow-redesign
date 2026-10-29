const Attestation = require('../../../entities/attestation')
const { updateAttestation } = require('../../../use-cases/attestation')

jest.mock('../../../entities/attestation', () => ({
    update: jest.fn(),
}));

describe('create Use-Case', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });
  
    it('should create and return a new attestation', async () => {
        const attestationDetails = {
            amount: 300, 
            transactionId : 12384, 
            passportDoc : " ",
            documentType : 'Birth Certificate',
            issuedCountry : 'USA',
            submissionCountry : 'UAE',
            address : 'Address line 1',
            contactPersonPhone : '971222323434',
            credentialId : 916,
            status: 'PICKUP',
        }

        const params = {
            id: 'attestationId'
        }

        const expectedAttestation = {
            id: params.id,
            updatedAt: new Date(),
            ...attestationDetails
        };
  
        Attestation.update.mockResolvedValue(expectedAttestation);
    
        const result = await updateAttestation(params, attestationDetails);
  
        expect(Attestation.update).toHaveBeenCalledWith(attestationDetails,{ 
            where: {
                id: params.id,
            }
        });
        expect(result).toEqual(expectedAttestation);
    });

    it('should handle dabase error gracefully', async () => {
        const attestationDetails = {
            amount: 300, 
            transactionId : 12384, 
            passportDoc : " ",
            documentType : 'Birth Certificate',
            issuedCountry : 'USA',
            submissionCountry : 'UAE',
            address : 'Address line 1',
            contactPersonPhone : '971222323434',
            credentialId : 916,
            status: 'PICKUP',
        }

        const params = {
            id: 'attestationId'
        }

        const expectedError = new Error('Error occured while updating attestation.')
  
        Attestation.update.mockRejectedValue(expectedError);
    
        const result = updateAttestation(params, attestationDetails);
  
        expect(Attestation.update).toHaveBeenCalledWith(attestationDetails,{ 
            where: {
                id: params.id,
            }
        });
        await expect(result).rejects.toThrow('Error occured while updating attestation.');
    })
});
  