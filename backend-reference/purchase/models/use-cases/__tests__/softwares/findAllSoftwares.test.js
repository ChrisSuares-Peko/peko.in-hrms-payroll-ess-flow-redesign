const { findAllSoftwares } = require('../../softwares'); 
const Softwares = require('../../../entities/softwares');
const Vendors = require('../../../entities/vendor');
const { handleSortFields } = require('../../../../utils/sortHandle'); 
const { Op } = require('sequelize');

jest.mock('../../../entities/softwares', () => ({
  belongsTo: jest.fn(),
  findAndCountAll:jest.fn()
}));
jest.mock('../../../entities/vendor', () => ({
  belongsTo: jest.fn(),
}));
jest.mock('../../../entities/categories', () => ({
  belongsTo: jest.fn(),
}));
jest.mock('../../../entities/serviceOperator', () => ({
  belongsTo: jest.fn(),
}));
jest.mock('../../../entities/order', () => ({
  belongsTo: jest.fn(),
}));
jest.mock('../../../entities/transaction', () => ({
  belongsTo: jest.fn(),
}));
jest.mock('../../../../utils/sortHandle');

describe('findAllSoftwares Use-Case', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should find and return all softwares with correct parameters', async () => {
    const params = {
      limit: 10,
      offset: 0,
      searchText: 'example',
      sort: 'DESC',
      sortField: 'id'
    };

    const order = [['name', 'DESC']]; 
    const expectedResult = {
      count: 2,
      rows: [
        {
          id: 3,
          productId: 'ACR',
          name: 'Example',
          description: 'Be protected from the unexpected. The complete cybersecurity protection you need with an easy-to-use and reliable solution against data loss, cyberattacks, and identity Theft.',
          discount: '40% off',
          features: '* Anti-malware\n* Anti-ransomware\n* Antivirus\n* Antivirus for Mac\n* Antivirus for Windows\n* Firewall\n* Parental Control\n* Safe Browsing',
          image: 'https://peko-storage.s3.me-central-1.amazonaws.com/staging/softwares/Security/b44eaccd-42be-4b0b-bcc5-1471aeb22a93.png',
          pekoEmail: ['example@example.com'], 
          sendMail: 0,
          typeOfOrder: 'MANUAL',
          status: 1,
          sold_quantity: 65,
          sendVendorMail: 0,
          createdAt: new Date('2024-04-18T06:39:10.000Z'),
          updatedAt: new Date('2024-08-07T04:43:14.000Z'),
          vendorId: 13,
          categoryId: 18,
          vendor: {
            vendorName: 'Vendor 1', 
            optional1: 'Optional Info 1' 
          }
        }, {
          id: 6,
          productId: "IDM",
          name: "Internet Download Manager",
          description: "Install Internet Download Manager (IDM) to stop waiting for your downloads. You will be truly amazed at how fast IDM downloads your files. IDM will also repair broken and resume interrupted downloads due to lost connections, network problems, computer shutdowns, or unexpected power outages.\n",
          discount: "35% Off",
          features: "\"Download Speed Acceleration\nDownload files from your favorite websites.\nAll popular browsers are supported.\nEasy downloading with one click\nDynamic segmentation\"\n",
          image: "https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/profile%2Fimages%2F1713428742375.png?alt=media&token=bf1d24f5-896d-4bb2-9a0f-c718f97af88a",
          pekoEmail: [
              "example@peko.one"
          ],
          sendMail: 1,
          typeOfOrder: "MANUAL",
          status: 1,
          sold_quantity: 17,
          sendVendorMail: 0,
          createdAt: "2024-04-18T06:53:31.000Z",
          updatedAt: "2024-08-07T04:32:45.000Z",
          vendorId: 13,
          categoryId: 53,
          vendor: {
              vendorName: "Subscriptions",
              optional1: "vendormail.com"
          }
      },
      ]
    };

    handleSortFields.mockReturnValue(order);
    Softwares.findAndCountAll.mockResolvedValue(expectedResult);

    const result = await findAllSoftwares(params);

   expect(Softwares.findAndCountAll).toHaveBeenCalledWith({
  include: [
    {
      model: Vendors,
      attributes: ["vendorName", "optional1"]
    }
  ],
  where: {
    [Op.or]: [
      { id: { [Op.like]: `%${params.searchText}%` } },
      { productId: { [Op.like]: `%${params.searchText}%` } },
      { name: { [Op.like]: `%${params.searchText}%` } },
      { description: { [Op.like]: `%${params.searchText}%` } },
      { features: { [Op.like]: `%${params.searchText}%` } },
      { pekoEmail: { [Op.like]: `%${params.searchText}%` } },
      { typeOfOrder: { [Op.like]: `%${params.searchText}%` } }  // ✅ Added
    ]
  },
  order,
  limit: params.limit,
  offset: params.offset,
  raw: true,
  nest: true
});


    expect(result).toEqual(expectedResult);
  });

   it('should handle errors and throw a custom error message', async () => {
    const params = { limit: 10, offset: 0, searchText: 'example', sort: 'DESC', sortField: 'name' };
    const error = new Error('Database error');
    
    handleSortFields.mockReturnValue([['name', 'DESC']]);
    Softwares.findAndCountAll.mockRejectedValue(error);

    await expect(findAllSoftwares(params)).rejects.toThrow('Database error');

    expect(Softwares.findAndCountAll).toHaveBeenCalledWith({
      include: [
        {
          model: Vendors,
          attributes: ["vendorName", "optional1"]
        }
      ],
      where: {
        [Op.or]: [
          { id: { [Op.like]: `%${params.searchText}%` } },
          { productId: { [Op.like]: `%${params.searchText}%` } },
          { name: { [Op.like]: `%${params.searchText}%` } },
          { description: { [Op.like]: `%${params.searchText}%` } },
          { features: { [Op.like]: `%${params.searchText}%` } },
          { pekoEmail: { [Op.like]: `%${params.searchText}%` } },
          { typeOfOrder: { [Op.like]: `%${params.searchText}%` } }, // ✅ Added
        ]
      },
      order: [['name', 'DESC']],
      limit: params.limit,
      offset: params.offset,
      raw: true,
      nest: true
    });
  });

  it('should return empty result if no softwares match', async () => {
    const params = { limit: 10, offset: 0, searchText: 'none', sort: 'ASC', sortField: 'id' };

    const expectedResult = { count: 0, rows: [] };
    handleSortFields.mockReturnValue([['id', 'ASC']]);
    Softwares.findAndCountAll.mockResolvedValue(expectedResult);

    const result = await findAllSoftwares(params);

    expect(Softwares.findAndCountAll).toHaveBeenCalledWith({
      include: [
        {
          model: Vendors,
          attributes: ["vendorName", "optional1"]
        }
      ],
      where: {
        [Op.or]: [
          { id: { [Op.like]: `%${params.searchText}%` } },
          { productId: { [Op.like]: `%${params.searchText}%` } },
          { name: { [Op.like]: `%${params.searchText}%` } },
          { description: { [Op.like]: `%${params.searchText}%` } },
          { features: { [Op.like]: `%${params.searchText}%` } },
          { pekoEmail: { [Op.like]: `%${params.searchText}%` } },
          { typeOfOrder: { [Op.like]: `%${params.searchText}%` } }, // ✅ Added
        ]
      },
      order: [['id', 'ASC']],
      limit: params.limit,
      offset: params.offset,
      raw: true,
      nest: true
    });

    expect(result).toEqual(expectedResult);
  });
});
