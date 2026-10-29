const corporateUser = require('../../../entities/corporateUser');
const sequelizeConfig = require('../../../../configs/database/index');
const { getMonthlySpendingAlert } = require('../../dashboard');

// ---- MOCK ALL DEPENDENCIES USED BY dashboard.js ----
jest.mock('../../../entities/corporateUser', () => ({
  findOne: jest.fn(),
}));

jest.mock('../../../entities/serviceOperator', () => ({
  belongsTo: jest.fn(),
}));

jest.mock('../../../entities/transaction', () => ({
  belongsTo: jest.fn(),
}));

jest.mock('../../../entities/order', () => ({
  belongsTo: jest.fn(),
}));

jest.mock('../../../../configs/database/index', () => ({
  query: jest.fn(),
  QueryTypes: { SELECT: 'select' },
  define: jest.fn(),
}));

// -----------------------------------------------------

describe('getMonthlySpendingAlert', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers().setSystemTime(new Date('2024-03-15').getTime());
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  // ----------------------------------------------------
  // 1️⃣ Positive Increase (> 25%)
  // ----------------------------------------------------
  it('should return positive percentage when spending increases more than 25%', async () => {
    corporateUser.findOne.mockResolvedValue({
      createdAt: '2022-01-10'
    });

    sequelizeConfig.query
      // Historical spending
      .mockResolvedValueOnce([
        { revenue: 1000, Date: '2023-10-01' },
        { revenue: 1000, Date: '2023-11-01' },
      ])
      // Current month spending
      .mockResolvedValueOnce([
        { revenue: 2000 }
      ]);

    const result = await getMonthlySpendingAlert(10);

    expect(typeof result).toBe('number');
    expect(result).toBeGreaterThan(25);
  });

  // ----------------------------------------------------
  // 2️⃣ Negative Decrease (< -25%)
  // ----------------------------------------------------
  it('should return negative percentage when spending decreases more than 25%', async () => {
    corporateUser.findOne.mockResolvedValue({
      createdAt: '2023-01-01'
    });

    sequelizeConfig.query
      // Historical data
      .mockResolvedValueOnce([
        { revenue: 2000, Date: '2024-01-01' },
        { revenue: 2000, Date: '2024-02-01' },
      ])
      // Current month very low
      .mockResolvedValueOnce([
        { revenue: 500 }
      ]);

    const result = await getMonthlySpendingAlert(20);

    expect(result).toBeLessThan(-25);
  });

  // ----------------------------------------------------
  // 3️⃣ Minor Change (<= ±25%) → return false
  // ----------------------------------------------------
  it('should return false if change is <= 25%', async () => {
    corporateUser.findOne.mockResolvedValue({ createdAt: '2022-01-01' });

    sequelizeConfig.query
      // Historical
      .mockResolvedValueOnce([
        { revenue: 1000, Date: '2023-10-01' }
      ])
      // Current month slightly above historical
      .mockResolvedValueOnce([
        { revenue: 1100 } // 10% increase
      ]);

    const result = await getMonthlySpendingAlert(1);

    expect(result).toBe(false);
  });

  // ----------------------------------------------------
  // 4️⃣ User joined recently (<12 months)
  // ----------------------------------------------------
  it('should adjust start date if user joined less than 12 months ago', async () => {
    corporateUser.findOne.mockResolvedValue({
      createdAt: new Date('2024-03-01').toISOString() // joined this month
    });

    sequelizeConfig.query
      // No historical spend since user is new
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        { revenue: 500 }
      ]);

    const result = await getMonthlySpendingAlert(30);

    // Not enough historical data → false
    expect(result).toBe(false);
  });

  // ----------------------------------------------------
  // 5️⃣ No historical spending at all
  // ----------------------------------------------------
  it('should return false when no historical spending exists', async () => {
    corporateUser.findOne.mockResolvedValue({ createdAt: '2023-01-01' });

    sequelizeConfig.query
      .mockResolvedValueOnce([])       // no history
      .mockResolvedValueOnce([
        { revenue: 100 }
      ]);

    const result = await getMonthlySpendingAlert(40);

    expect(result).toBe(false);
  });
});
