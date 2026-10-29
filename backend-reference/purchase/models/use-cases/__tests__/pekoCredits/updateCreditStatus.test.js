const { updateCreditStatus } = require('../../pekoCredits'); 
const PekoCredits = require('../../../entities/pekoCredits');
const sequelizeConfig = require('../../../../configs/database/index'); 
const moment = require('moment');
const { customLog } = require('../../../../utils/loggerHelper');

jest.mock('../../../entities/pekoCredits', () => ({
  findOne: jest.fn(),
}));

jest.mock('../../../../configs/database/index', () => ({
  transaction: jest.fn(),
   define: jest.fn(),
}));

jest.mock('../../../../utils/loggerHelper', () => ({
  customLog: jest.fn(),
}));
jest.mock('../../../entities/corporateUser', () => ({}));


jest.mock('../../../entities/userCoupons', () => ({ belongsTo: jest.fn() }));
jest.mock('../../../entities/serviceOperator', () => ({ belongsTo: jest.fn() }));


describe('updateCreditStatus', () => {
  let mockTransaction;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock transaction object
    mockTransaction = {
      commit: jest.fn(),
      rollback: jest.fn(),
      finished: false,
    };
    sequelizeConfig.transaction.mockResolvedValue(mockTransaction);
  });

  it('should update coupon status successfully', async () => {
    const coupon = {
      id: 1,
      validUntil: moment().add(1, 'day').toDate(), // not expired
      update: jest.fn().mockResolvedValue({ id: 1, status: 'ACTIVE' }),
    };
    PekoCredits.findOne.mockResolvedValue(coupon);

    const updates = { status: 'ACTIVE' };
    const result = await updateCreditStatus(1, updates);

    expect(PekoCredits.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    expect(coupon.update).toHaveBeenCalledWith(updates, { transaction: mockTransaction });
    expect(mockTransaction.commit).toHaveBeenCalled();
    expect(result).toEqual({ id: 1, status: 'ACTIVE' });
  });

  it('should throw error and rollback if coupon not found', async () => {
    PekoCredits.findOne.mockResolvedValue(null);

    const updates = { status: 'ACTIVE' };
    const result = await updateCreditStatus(999, updates);

    expect(mockTransaction.rollback).toHaveBeenCalled();
    expect(customLog).toHaveBeenCalledWith(
      null,
      'error',
      expect.objectContaining({ message: 'update coupon code status error' })
    );
    expect(result).toBe(false);
  });

  it('should not allow enabling an expired coupon', async () => {
    const coupon = {
      id: 2,
      validUntil: moment().subtract(1, 'day').toDate(), // expired
      update: jest.fn(),
    };
    PekoCredits.findOne.mockResolvedValue(coupon);

    const updates = { status: 'ACTIVE' };
    const result = await updateCreditStatus(2, updates);

    expect(mockTransaction.rollback).toHaveBeenCalled();
    expect(coupon.update).not.toHaveBeenCalled();
    expect(customLog).toHaveBeenCalledWith(
      null,
      'error',
      expect.objectContaining({ message: 'update coupon code status error' })
    );
    expect(result).toBe(false);
  });

  it('should handle update errors and rollback', async () => {
    const coupon = {
      id: 3,
      validUntil: moment().add(1, 'day').toDate(),
      update: jest.fn().mockRejectedValue(new Error('DB Error')),
    };
    PekoCredits.findOne.mockResolvedValue(coupon);

    const updates = { status: 'DISABLED' };
    const result = await updateCreditStatus(3, updates);

    expect(mockTransaction.rollback).toHaveBeenCalled();
    expect(customLog).toHaveBeenCalledWith(
      null,
      'error',
      expect.objectContaining({ message: 'update coupon code status error' })
    );
    expect(result).toBe(false);
  });
});
