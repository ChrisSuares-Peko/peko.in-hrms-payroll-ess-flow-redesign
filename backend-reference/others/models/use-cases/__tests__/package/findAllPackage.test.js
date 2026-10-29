const { findAllPackages } = require('../../package');
const pkgModel = require('../../../entities/package');

jest.mock('../../../entities/package', () => ({
  findAll: jest.fn(),
}));

describe('find all package', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return a list of all packages when data retrieval is successful', async () => {
    const mockResult = [
      { id: 1, name: 'Package 1' },
      { id: 2, name: 'Package 2' },
    ];

    pkgModel.findAll.mockResolvedValue(mockResult);

    const result = await findAllPackages();

    expect(pkgModel.findAll).toHaveBeenCalledWith({
      raw: true,
    });
    expect(result).toEqual(mockResult);
  });

  it('should return an empty list if no packages are found', async () => {
    const mockResult = [];

    pkgModel.findAll.mockResolvedValue(mockResult);

    const result = await findAllPackages();

    expect(pkgModel.findAll).toHaveBeenCalledWith({
      raw: true,
    });
    expect(result).toEqual(mockResult);
  });

  it('should handle failure when no data is found (null value)', async () => {
    const mockResult = null;

    pkgModel.findAll.mockResolvedValue(mockResult);

    const result = await findAllPackages();

    expect(pkgModel.findAll).toHaveBeenCalledWith({
      raw: true,
    });
    expect(result).toBeNull(); // Ensure it returns null instead of an empty list
  });

  it('should return a list of packages with filter conditions applied', async () => {
     const mockResult = [
       { id: 1, name: 'Package 1' },
       { id: 2, name: 'Package 2' },
     ];
     const conditions = { where: { name: 'Package 1' } };
   
     pkgModel.findAll.mockResolvedValue(mockResult);
   
     const result = await findAllPackages(conditions);
   
     expect(pkgModel.findAll).toHaveBeenCalledWith(
       expect.objectContaining({
         raw: true,
         "where": {"where": {"name": "Package 1"}}
       })
     );
     expect(result).toEqual(mockResult);
   });
   

  it('should handle edge case where database is empty', async () => {
    const mockResult = [];

    pkgModel.findAll.mockResolvedValue(mockResult);

    const result = await findAllPackages();

    expect(pkgModel.findAll).toHaveBeenCalledWith({
      raw: true,
    });
    expect(result).toEqual(mockResult); // Should return an empty array
  });

  it('should verify that finally block is executed', async () => {
    const mockResult = [
      { id: 1, name: 'Package 1' },
    ];

    console.log = jest.fn();

    pkgModel.findAll.mockResolvedValue(mockResult);

    await findAllPackages();

    expect(console.log).toHaveBeenCalledWith('PACKAGE FIND All ROUTE CALLED'); // Ensure the finally block is hit
  });
});
