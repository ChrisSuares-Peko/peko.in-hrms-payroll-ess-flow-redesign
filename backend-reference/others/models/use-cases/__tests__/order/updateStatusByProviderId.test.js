const { updateStatusByProviderId } = require('../../order');
const order = require('../../../entities/order');

jest.mock('../../../entities/order');

describe('updateStatusByProviderId', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should update shipment status and return updated order', async () => {
        const mockParams = {
            Key: 'PROV001',
            Value: { UpdateCode: 'UC1', UpdateDateTime: '2023-10-01', Comments: 'Shipped' }
        };
        const mockOrder = {
            getDataValue: jest.fn().mockReturnValue([]),
            setDataValue: jest.fn(),
            save: jest.fn().mockResolvedValue(true),
        };
        order.findOne.mockResolvedValue(mockOrder);

        const result = await updateStatusByProviderId(mockParams);
        expect(order.findOne).toHaveBeenCalled();
        expect(mockOrder.setDataValue).toHaveBeenCalledWith('shipmentStatus', expect.any(Array));
        expect(mockOrder.save).toHaveBeenCalled();
        expect(result).toEqual(mockOrder);
    });

    it('should return null if order not found', async () => {
        order.findOne.mockResolvedValue(null);

        const result = await updateStatusByProviderId({ Key: 'NON_EXISTENT', Value: {} });
        expect(result).toBeNull();
    });

    it('should return null on error', async () => {
        order.findOne.mockRejectedValue(new Error('DB error'));

        const result = await updateStatusByProviderId({ Key: 'PROV001', Value: {} });
        expect(result).toBeNull();
    });
});
