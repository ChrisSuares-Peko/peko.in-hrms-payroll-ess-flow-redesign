const { findPackagesCashback } = require('../../package')
const cashback = require('../../../entities/cashback')
const pkgModel = require('../../../entities/package');
const serviceOperator = require('../../../entities/serviceOperator');
const { Op } = require('sequelize');

jest.mock('../../../entities/package', () => ({
  findAll: jest.fn(),
}));

jest.mock('../../../entities/cashback', () => ({
  findAll: jest.fn(),
}));

jest.mock('../../../entities/serviceOperator', () => ({}));

describe('findPackagesCashback', () => {
  beforeEach(() => jest.clearAllMocks());

  // ------------------------------------------
  // 1️⃣ Should return merged packages correctly
  // ------------------------------------------
  it('should fetch packageIds, fetch cashback records, and merge into final structure', async () => {
    pkgModel.findAll.mockResolvedValue([
      { id: 1 },
      { id: 2 }
    ]);

    cashback.findAll.mockResolvedValue([
      {
        packageId: 1,
        id: 101,
        "package.id": 1,
        "package.packageName": "Starter Pack",
        "serviceOperator.serviceProvider": "Airtel",
        "serviceOperator.accessKey": "AIRTEL_KEY"
      },
      {
        packageId: 1,
        id: 102,
        "package.id": 1,
        "package.packageName": "Starter Pack",
        "serviceOperator.serviceProvider": "Jio",
        "serviceOperator.accessKey": "JIO_KEY"
      },
      {
        packageId: 2,
        id: 201,
        "package.id": 2,
        "package.packageName": "Premium Pack",
        "serviceOperator.serviceProvider": "Vi",
        "serviceOperator.accessKey": "VI_KEY"
      }
    ]);

    const result = await findPackagesCashback(50);

    expect(pkgModel.findAll).toHaveBeenCalledWith({
      where: { partnerId: 50, type: 1 },
      attributes: ['id'],
      raw: true
    });

    expect(cashback.findAll).toHaveBeenCalledWith({
      where: { packageId: { [Op.in]: [1, 2] } },
      attributes: ['packageId', 'id'],
      include: [
        { model: pkgModel, attributes: ['id', 'packageName'] },
        { model: serviceOperator, attributes: ['serviceProvider', 'accessKey'] }
      ],
      raw: true
    });

    expect(result).toEqual([
      {
        packageId: 1,
        package: { id: 1, packageName: "Starter Pack" },
        serviceOperators: [
          {
            id: 101,
            serviceProvider: "Airtel",
            accessKey: "AIRTEL_KEY"
          },
          {
            id: 102,
            serviceProvider: "Jio",
            accessKey: "JIO_KEY"
          }
        ]
      },
      {
        packageId: 2,
        package: { id: 2, packageName: "Premium Pack" },
        serviceOperators: [
          {
            id: 201,
            serviceProvider: "Vi",
            accessKey: "VI_KEY"
          }
        ]
      }
    ]);
  });

  // --------------------------------------------------------
  // 2️⃣ Should return empty array if no packages found
  // --------------------------------------------------------
  it('should return empty array when no packages exist', async () => {
    pkgModel.findAll.mockResolvedValue([]);

    const result = await findPackagesCashback(99);

    expect(result).toEqual([]);
    expect(cashback.findAll).not.toHaveBeenCalled();
  });

  // --------------------------------------------------------
  // 3️⃣ Should return empty when cashback records are empty
  // --------------------------------------------------------
  it('should return empty array when cashback list is empty', async () => {
    pkgModel.findAll.mockResolvedValue([{ id: 5 }]);
    cashback.findAll.mockResolvedValue([]);

    const result = await findPackagesCashback(100);
    expect(result).toEqual([]);
  });

  // --------------------------------------------------------
  // 4️⃣ Should handle missing nested data gracefully
  // --------------------------------------------------------
  it('should handle missing nested fields safely', async () => {
    pkgModel.findAll.mockResolvedValue([{ id: 3 }]);

    cashback.findAll.mockResolvedValue([
      {
        packageId: 3,
        id: 301,
        "package.id": null,
        "package.packageName": null,
        "serviceOperator.serviceProvider": null,
        "serviceOperator.accessKey": null
      }
    ]);

    const result = await findPackagesCashback(3);

    expect(result).toEqual([
      {
        packageId: 3,
        package: {
          id: null,
          packageName: null
        },
        serviceOperators: [
          {
            id: 301,
            serviceProvider: null,
            accessKey: null
          }
        ]
      }
    ]);
  });

  // --------------------------------------------------------
  // 5️⃣ Should throw and be caught by asyncHandler when DB fails
  // --------------------------------------------------------
  it('should throw error when DB operations fail', async () => {
    pkgModel.findAll.mockRejectedValue(new Error("DB error"));

    await expect(findPackagesCashback(10)).rejects.toThrow("DB error");
  });
});
