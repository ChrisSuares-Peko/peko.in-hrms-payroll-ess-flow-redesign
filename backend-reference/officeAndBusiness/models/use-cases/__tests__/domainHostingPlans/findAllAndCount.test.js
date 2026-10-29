'use strict';
const { findAllAndCount } = require('../../domainHostingPlans');
const DomainHostingPlans = require('../../../entities/domainHostingPlans');
const { handleSortFields } = require('../../../../utils/sortHandle');
const { Op } = require('sequelize');

jest.mock('../../../entities/domainHostingPlans', () => ({
    findAndCountAll: jest.fn(),
}));

jest.mock('../../../../utils/sortHandle', () => ({
    handleSortFields: jest.fn(),
}));

describe('findAllAndCount', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        handleSortFields.mockReturnValue([['createdAt', 'DESC']]);
    });

    it('should find all plans with default params and no filters', async () => {
        const mockResult = { count: 2, rows: [{ id: 1 }, { id: 2 }] };
        DomainHostingPlans.findAndCountAll.mockResolvedValue(mockResult);

        const result = await findAllAndCount({ limit: 10, offset: 0 });

        expect(DomainHostingPlans.findAndCountAll).toHaveBeenCalledWith({
            where: {},
            order: [['createdAt', 'DESC']],
            limit: 10,
            offset: 0,
            raw: true,
            nest: true,
        });
        expect(result).toEqual(mockResult);
    });

    it('should filter by planType when provided', async () => {
        const mockResult = { count: 1, rows: [{ id: 1, planType: 'hosting' }] };
        DomainHostingPlans.findAndCountAll.mockResolvedValue(mockResult);

        const result = await findAllAndCount({ limit: 10, offset: 0, planType: 'hosting' });

        const calledWith = DomainHostingPlans.findAndCountAll.mock.calls[0][0];
        expect(calledWith.where.planType).toBe('hosting');
        expect(result).toEqual(mockResult);
    });

    it('should apply searchText filter across planName, productId, planId, and description', async () => {
        DomainHostingPlans.findAndCountAll.mockResolvedValue({ count: 1, rows: [{ id: 1 }] });

        await findAllAndCount({ limit: 10, offset: 0, searchText: 'basic' });

        const calledWith = DomainHostingPlans.findAndCountAll.mock.calls[0][0];
        expect(calledWith.where[Op.or]).toEqual([
            { planName: { [Op.like]: '%basic%' } },
            { productId: { [Op.like]: '%basic%' } },
            { planId: { [Op.like]: '%basic%' } },
            { description: { [Op.like]: '%basic%' } },
        ]);
    });

    it('should apply both planType and searchText filters together', async () => {
        DomainHostingPlans.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

        await findAllAndCount({ limit: 10, offset: 0, planType: 'domain', searchText: 'test' });

        const calledWith = DomainHostingPlans.findAndCountAll.mock.calls[0][0];
        expect(calledWith.where.planType).toBe('domain');
        expect(calledWith.where[Op.or]).toBeDefined();
    });

    it('should pass sortField and sort to handleSortFields', async () => {
        handleSortFields.mockReturnValue([['planName', 'ASC']]);
        DomainHostingPlans.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

        await findAllAndCount({ limit: 10, offset: 0, sort: 'ASC', sortField: 'planName' });

        expect(handleSortFields).toHaveBeenCalledWith('planName', 'ASC');
        const calledWith = DomainHostingPlans.findAndCountAll.mock.calls[0][0];
        expect(calledWith.order).toEqual([['planName', 'ASC']]);
    });

    it('should pass limit and offset for pagination', async () => {
        DomainHostingPlans.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

        await findAllAndCount({ limit: 5, offset: 10 });

        const calledWith = DomainHostingPlans.findAndCountAll.mock.calls[0][0];
        expect(calledWith.limit).toBe(5);
        expect(calledWith.offset).toBe(10);
    });

    it('should return empty result when no plans found', async () => {
        DomainHostingPlans.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

        const result = await findAllAndCount({ limit: 10, offset: 0 });

        expect(result).toEqual({ count: 0, rows: [] });
    });

    it('should throw an error when findAndCountAll fails', async () => {
        DomainHostingPlans.findAndCountAll.mockRejectedValue(new Error('Database error'));

        await expect(findAllAndCount({ limit: 10, offset: 0 })).rejects.toThrow('Database error');
    });
});
