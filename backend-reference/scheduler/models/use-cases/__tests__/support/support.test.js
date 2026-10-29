const { findAllTickets, updateTicketStatus } = require('../../support');
const support = require('../../../entities/support');

beforeEach(() => {
    jest.clearAllMocks();
});

describe('findAllTickets', () => {
    it('should find all tickets matching where clause', async () => {
        const mockResult = [{ id: 1, status: 'OPEN' }, { id: 2, status: 'OPEN' }];
        support.findAll.mockResolvedValue(mockResult);

        const result = await findAllTickets({ status: 'OPEN' });
        expect(result).toEqual(mockResult);
        expect(support.findAll).toHaveBeenCalledWith({ where: { status: 'OPEN' } });
    });

    it('should return empty array when no tickets found', async () => {
        support.findAll.mockResolvedValue([]);

        const result = await findAllTickets({ status: 'CLOSED' });
        expect(result).toEqual([]);
    });
});

describe('updateTicketStatus', () => {
    it('should update ticket status and isClosed flag', async () => {
        support.update.mockResolvedValue([1]);

        const result = await updateTicketStatus(1, 'CLOSED', true);
        expect(result).toEqual([1]);
        expect(support.update).toHaveBeenCalledWith(
            { status: 'CLOSED', isClosed: true },
            { where: { id: 1 } }
        );
    });

    it('should return [0] when ticket not found', async () => {
        support.update.mockResolvedValue([0]);

        const result = await updateTicketStatus(999, 'CLOSED', true);
        expect(result).toEqual([0]);
    });
});
