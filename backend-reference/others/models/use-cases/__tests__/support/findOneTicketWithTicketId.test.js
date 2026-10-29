const messages = require('../../../entities/support');
const { findOneTicketWithTicketId } = require('../../support');

jest.mock('../../../entities/support', () => ({
    findOne: jest.fn(),
}));

describe("findOneTicketWithTicketId", () => {

    beforeEach(() => {
        jest.resetAllMocks();
    });

    it("should return ticket details when ticket exists", async () => {
        const mockTicket = { ticketId: 123, message: "Hello" };

        messages.findOne.mockResolvedValue(mockTicket);

        const result = await findOneTicketWithTicketId(123);

        expect(messages.findOne).toHaveBeenCalledWith({
            where: { ticketId: 123 },
            raw: true
        });

        expect(result).toEqual(mockTicket);
    });

    it("should return null when the ticket does not exist", async () => {
        messages.findOne.mockResolvedValue(null);

        const result = await findOneTicketWithTicketId(999);

        expect(result).toBeNull();
    });

    it("should call with ticketId = undefined when id is missing", async () => {
        messages.findOne.mockResolvedValue(null);

        const result = await findOneTicketWithTicketId(undefined);

        expect(messages.findOne).toHaveBeenCalledWith({
            where: { ticketId: undefined },
            raw: true
        });

        expect(result).toBeNull();
    });

    it("should throw an error when database query fails", async () => {
        const error = new Error("DB failure");

        messages.findOne.mockRejectedValue(error);

        await expect(findOneTicketWithTicketId(10))
            .rejects
            .toThrow("DB failure");
    });

});
