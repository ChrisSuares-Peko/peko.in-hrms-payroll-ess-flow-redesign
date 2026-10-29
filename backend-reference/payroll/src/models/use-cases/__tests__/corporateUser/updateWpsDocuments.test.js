const { updateWpsDocuments } = require('../../../use-cases/corporateUser');
const CorporateUser = require('../../../entities/corporateUser');
const mongoose = require('mongoose');

jest.mock('../../../entities/corporateUser');

describe('updateWpsDocuments', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        console.log = jest.fn();
        console.error = jest.fn();
    });

    it('should update WPS documents successfully', async () => {
        const userId = new mongoose.Types.ObjectId().toString();
        const documents = [{ name: 'doc1' }, { name: 'doc2' }];

        const mockUpdatedUser = {
            wps: {
                registrationStatus: 'INPROGRESS',
                wpsDocuments: documents
            }
        };

        CorporateUser.findByIdAndUpdate.mockResolvedValue(mockUpdatedUser);

        const result = await updateWpsDocuments(userId, documents);

        expect(CorporateUser.findByIdAndUpdate).toHaveBeenCalledWith(userId, {
            $set: {
                'wps.registrationStatus': 'INPROGRESS',
                'wps.wpsDocuments': documents
            }
        }, { new: true });

        expect(result).toEqual(mockUpdatedUser.wps);
    });

    it('should throw an error if updating WPS documents fails', async () => {
        const userId = new mongoose.Types.ObjectId().toString();
        const documents = [{ name: 'doc1' }, { name: 'doc2' }];
        const mockError = new Error('Database error');

        CorporateUser.findByIdAndUpdate.mockRejectedValue(mockError);

        await expect(updateWpsDocuments(userId, documents)).rejects.toThrow('Failed to update wps documents Database error');

        expect(CorporateUser.findByIdAndUpdate).toHaveBeenCalledWith(userId, {
            $set: {
                'wps.registrationStatus': 'INPROGRESS',
                'wps.wpsDocuments': documents
            }
        }, { new: true });
    });
});
