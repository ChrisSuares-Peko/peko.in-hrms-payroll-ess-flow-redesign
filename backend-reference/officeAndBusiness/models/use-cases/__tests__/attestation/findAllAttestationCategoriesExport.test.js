const { Op } = require("sequelize");
const attestationCategory = require("../../../entities/attestationCategory");
const { findAllAttestationCategoriesExport } = require("../../../use-cases/attestation");

jest.mock("../../../entities/attestationCategory", () => ({
    findAndCountAll: jest.fn(),
}));

jest.mock("../../../../utils/formatter", () => ({
    formattedDateTime: jest.fn((date) => date.toISOString()), // Mocking date formatting function
    formatNumberWithLocalString: jest.fn((num) => num.toString()),
}));

describe("findAllAttestationCategoriesExport", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should return formatted attestation categories data", async () => {
        const params = {
            searchText: "test",
            sort: "ASC",
            sortField: "label",
            from: "2024-01-01",
            to: "2024-02-01",
        };

        const mockResponse = {
            count: 2,
            rows: [
                {
                    id: "1",
                    countryCode: "US",
                    label: "Test Label",
                    value: "Test Value",
                    price: "100",
                    country: "USA",
                    createdAt: new Date("2024-01-10"),
                },
                {
                    id: "2",
                    countryCode: "AE",
                    label: "Another Label",
                    value: "Another Value",
                    price: "200",
                    country: "UAE",
                    createdAt: new Date("2024-01-15"),
                },
            ],
        };

        attestationCategory.findAndCountAll.mockResolvedValue(mockResponse);

        const expectedToDate = new Date(params.to);
        expectedToDate.setDate(expectedToDate.getDate() + 1);
        expectedToDate.setHours(0, 0, 0, 0);

        const result = await findAllAttestationCategoriesExport(params);

        expect(result).toEqual([
            {
                Date: mockResponse.rows[0].createdAt.toISOString(),
                Label: "Test Label",
                value: "Test Value",
                Price: "₹ 100",
                country: "USA",
                countryCode: "US",
            },
            {
                Date: mockResponse.rows[1].createdAt.toISOString(),
                Label: "Another Label",
                value: "Another Value",
                Price: "₹ 200",
                country: "UAE",
                countryCode: "AE",
            },
        ]);

        expect(attestationCategory.findAndCountAll).toHaveBeenCalledWith({
            attributes: ["id", "countryCode", "label", "value", "price", "country", "createdAt"],
            where: {
                [Op.or]: [
                    { id: { [Op.like]: "%test%" } },
                    { label: { [Op.like]: "%test%" } },
                    { value: { [Op.like]: "%test%" } },
                    { country: { [Op.like]: "%test%" } },
                    { price: { [Op.like]: "%test%" } },
                ],
                createdAt: {
                    [Op.between]: [params.from, expectedToDate],
                },
            },
            order: [["label", "ASC"]],
        });
    });

    it("should return 'Not Available' for missing fields", async () => {
        const params = { searchText: "", sort: "ASC", sortField: "label", from: null, to: null };

        const mockResponse = {
            count: 1,
            rows: [
                {
                    id: "1",
                    countryCode: null,
                    label: null,
                    value: null,
                    price: null,
                    country: null,
                    createdAt: null,
                },
            ],
        };

        attestationCategory.findAndCountAll.mockResolvedValue(mockResponse);

        const result = await findAllAttestationCategoriesExport(params);

        expect(result).toEqual([
            {
                Date: "Not Available",
                Label: "Not Available",
                value: "Not Available",
                Price: "₹ 0.00",
                country: "Not Available",
                countryCode: "Not Available",
            },
        ]);
    });
});
