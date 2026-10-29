const { Op } = require("sequelize")
const corporateDocuments = require("../../../entities/corporateDocuments")
const { updateAllCorporateDocuments } = require("../../corporateDocuments")

jest.mock('../../../entities/corporateDocuments')
describe("updateAllCorporateDocuments", () => {
    const params = { 
        documentNames: ["Test Name"],
        corporateUserId: 123, 
        documentStatus: "PENDING"
    }
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it("should update corporate documents and return number of rows affected", async () => {
        const mockDbResponse = [1, {
            documentName: "Test Name",
            document: "https://example.url",
            documentType: "png", 
            corporateUserId: 123,   
            status: 'PENDING'
        }]
        corporateDocuments.update.mockResolvedValue(mockDbResponse)

        const result = await updateAllCorporateDocuments(params)
        expect(result).toEqual({updatedCount: mockDbResponse[0]});
        expect(corporateDocuments.update).toHaveBeenCalledWith(
            { 
                status: params.documentStatus 
            }, {
                where: {
                    corporateUserId: params.corporateUserId,
                    documentName: {
                        [Op.in]: params.documentNames
                    }
                }
            })
    })

    it("should throw error if update fails", async () => {
        const mockError = new Error("Database Error")
        corporateDocuments.update.mockRejectedValue(mockError)

        const result = updateAllCorporateDocuments(params)
        await expect(result).rejects.toThrow(mockError)
        expect(corporateDocuments.update).toHaveBeenCalledWith(
            { 
                status: params.documentStatus 
            }, {
                where: {
                    corporateUserId: params.corporateUserId,
                    documentName: {
                        [Op.in]: params.documentNames
                    }
                }
            })
    })
})