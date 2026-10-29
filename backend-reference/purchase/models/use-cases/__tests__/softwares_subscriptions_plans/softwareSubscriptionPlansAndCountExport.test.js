const { softwareSubscriptionPlansAndCountExport } = require('../../../use-cases/softwares_subscriptions_plans');
const softwares_subscriptions_plans = require('../../../entities/softwares_subscriptions_plans');
const softwares_subscriptions = require('../../../entities/softwares_subscriptions');
const { handleSortFields } = require('../../../../utils/sortHandle');
const { formattedDateTime, formatNumberWithLocalString } = require('../../../../utils/formatter');
const { Op } = require('sequelize');

jest.mock('../../../entities/softwares_subscriptions_plans');
jest.mock('../../../../utils/sortHandle');
jest.mock('../../../../utils/formatter');
jest.mock('../../../entities/subCorporateUsers', () => ({
  belongsTo: jest.fn(),
}));
describe('softwareSubscriptionPlansAndCountExport', () => {
  const mockParams = { searchText: 'Basic', sort: 'ASC', sortField: 'name' };
  const mockOrder = [['name', 'ASC']];
  const mockData = {
    rows: [
      {
        id: 1,
        name: 'Basic Plan',
        monthlyPrice: 10,
        yearlyPrice: 100,
        descriptions: 'Basic subscription plan',
        features: 'Basic features',
        image_url: 'https://example.com/image.png',
        status: 1,
        createdAt: new Date('2023-09-01T10:00:00Z'),
        softwares_subscription: {
          name: 'Software A',
        },
      },
    ],
    count: 1,
  };

  beforeEach(() => {
    jest.clearAllMocks(); 
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('should return formatted export data for software subscription plans', async () => {
    handleSortFields.mockReturnValue(mockOrder);
    softwares_subscriptions_plans.findAndCountAll.mockResolvedValue(mockData);
    formattedDateTime.mockReturnValue('01-09-2023');
    formatNumberWithLocalString.mockReturnValue('10.00');

    const result = await softwareSubscriptionPlansAndCountExport(mockParams);

    expect(handleSortFields).toHaveBeenCalledWith('name', 'ASC');
    expect(softwares_subscriptions_plans.findAndCountAll).toHaveBeenCalledWith({
      include: [
        {
          model: softwares_subscriptions,
          attributes: ['name'],
        },
      ],
      where: {
        [Op.or]: [
          { id: { [Op.like]: '%Basic%' } },
          { name: { [Op.like]: '%Basic%' } },
          { monthlyPrice: { [Op.like]: '%Basic%' } },
          { yearlyPrice: { [Op.like]: '%Basic%' } },
          { descriptions: { [Op.like]: '%Basic%' } },
          { features: { [Op.like]: '%Basic%' } },
          { '$softwares_subscription.name$': { [Op.like]: '%Basic%' } },
        ],
      },
      order: mockOrder,
      raw: true,
      nest: true,
    });

    expect(formattedDateTime).toHaveBeenCalledWith(mockData.rows[0].createdAt);
    expect(formatNumberWithLocalString).toHaveBeenCalledWith(10);
    expect(formatNumberWithLocalString).toHaveBeenCalledWith(100);

    expect(result).toEqual([
      {
        Date: '01-09-2023',
        'Plan Name': 'Basic Plan',
        'Product name': 'Software A',
        'Monthly Price': '₹ 10.00',
        'Yearly Price': '₹ 10.00',
        // Descriptions: 'Basic subscription plan',
        Image: 'https://example.com/image.png',
        Status: 'Active',
      },
    ]);
  });

  it('should handle no plans found and return an empty array', async () => {
    softwares_subscriptions_plans.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });

    const result = await softwareSubscriptionPlansAndCountExport(mockParams);

    expect(softwares_subscriptions_plans.findAndCountAll).toHaveBeenCalled();
    expect(result).toEqual([]);  
  });

  it('should throw an error when something goes wrong', async () => {
    const mockError = new Error('Database error');
    softwares_subscriptions_plans.findAndCountAll.mockRejectedValue(mockError);

    await expect(softwareSubscriptionPlansAndCountExport(mockParams)).rejects.toEqual({
      message: 'Something went wrong'
    }); 

    expect(softwares_subscriptions_plans.findAndCountAll).toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith(mockError);
  });
});
