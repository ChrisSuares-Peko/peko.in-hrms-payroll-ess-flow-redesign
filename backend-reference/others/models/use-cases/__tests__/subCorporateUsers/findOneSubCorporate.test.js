const SubCorporateUser = require('../../../entities/subCorporateUsers');
const credential = require('../../../entities/credential');
const { findOneSubCorporate } = require('../../subCorporateUsers');

jest.mock('../../../entities/subCorporateUsers', () => ({
    findOne: jest.fn(),
}));

jest.mock('../../../entities/credential', () => ({}));

describe("findOneSubCorporate", () => {

    beforeEach(() => {
        jest.resetAllMocks();
    });

    it("should retrieve a sub-corporate user using params.id with default attributes", async () => {
        const params = { id: 10 };
        const mockData = { id: 10, name: "John", credential: { username: "john01" } };

        SubCorporateUser.findOne.mockResolvedValue(mockData);

        const result = await findOneSubCorporate(params);

        expect(SubCorporateUser.findOne).toHaveBeenCalledWith({
            include: [{
                model: credential,
                attributes: ['role', 'username']
            }],
            where: { id: params.id },
            attributes: undefined,
            nest: true,
            raw: true
        });

        expect(result).toEqual(mockData);
    });

    it("should retrieve sub-corporate user with specific attributes", async () => {
        const params = { id: 5 };
        const attributes = ["id", "name"];
        const mockData = { id: 5, name: "Peter" };

        SubCorporateUser.findOne.mockResolvedValue(mockData);

        const result = await findOneSubCorporate(params, attributes);

        expect(SubCorporateUser.findOne).toHaveBeenCalledWith({
            include: [{
                model: credential,
                attributes: ['role', 'username']
            }],
            where: { id: params.id },
            attributes,
            nest: true,
            raw: true
        });

        expect(result).toEqual(mockData);
    });

    it("should return null when sub-corporate user is not found", async () => {
        const params = { id: 99 };
        SubCorporateUser.findOne.mockResolvedValue(null);

        const result = await findOneSubCorporate(params);

        expect(result).toBeNull();
    });

    it("should throw an error when DB query fails", async () => {
        const params = { id: 1 };
        const error = new Error("DB error");

        SubCorporateUser.findOne.mockRejectedValue(error);

        await expect(findOneSubCorporate(params)).rejects.toThrow("DB error");
    });

    it("should handle attributes explicitly passed as undefined", async () => {
        const params = { id: 7 };
        const mockData = { id: 7, name: "Alice" };

        SubCorporateUser.findOne.mockResolvedValue(mockData);

        const result = await findOneSubCorporate(params, undefined);

        expect(SubCorporateUser.findOne).toHaveBeenCalledWith({
            include: [{
                model: credential,
                attributes: ['role', 'username']
            }],
            where: { id: params.id },
            attributes: undefined,
            nest: true,
            raw: true
        });

        expect(result).toEqual(mockData);
    });

    it("should use id = undefined when params.id is missing", async () => {
        const params = {}; // no id
        SubCorporateUser.findOne.mockResolvedValue(null);

        const result = await findOneSubCorporate(params);

        expect(SubCorporateUser.findOne).toHaveBeenCalledWith({
            include: [{
                model: credential,
                attributes: ['role', 'username']
            }],
            where: { id: undefined },
            attributes: undefined,
            nest: true,
            raw: true
        });

        expect(result).toBeNull();
    });

});
