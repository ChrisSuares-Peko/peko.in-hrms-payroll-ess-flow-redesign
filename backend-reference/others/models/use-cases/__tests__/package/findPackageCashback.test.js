const { findPackageCashback } = require('../../package')
const cashback = require('../../../entities/cashback')

describe('find package cashback',()=>{
  beforeEach(() => {
    jest.clearAllMocks()
})

it('should return a list of cashbacks for a given valid package ID', async () => {
  const id = 1;
  const mockResult = [
      { id: 1, packageId: 1, amount: '10' },
      { id: 2, packageId: 1, amount: '20' }
  ];

  cashback.findAll.mockResolvedValue(mockResult);

  const result = await findPackageCashback(id);

  expect(cashback.findAll).toHaveBeenCalledWith({
      where: { packageId: id },
      raw: true
  });
  expect(result).toEqual(mockResult);
});

it('should return an empty list if no cashbacks are associated with the given package ID', async () => {
  const id = 2;
  const mockResult = [];

  cashback.findAll.mockResolvedValue(mockResult);

  const result = await findPackageCashback(id);

  expect(cashback.findAll).toHaveBeenCalledWith({
      where: { packageId: id },
      raw: true
  });
  expect(result).toEqual(mockResult);
});

it('should handle cases where the ID is missing or undefined', async () => {
  const id = undefined; // or pass an empty value if preferred
  const mockResult = [];

  cashback.findAll.mockResolvedValue(mockResult);

  const result = await findPackageCashback(id);

  expect(cashback.findAll).toHaveBeenCalledWith({
      where: { packageId: id },
      raw: true
  });
  expect(result).toEqual(mockResult);
});
it('should handle errors thrown during the database call', async () => {
  const id = 3;
  const mockError = new Error('Database error');
  cashback.findAll.mockRejectedValue(mockError);

  // Mock console.log to track its calls
  console.log = jest.fn();

  await findPackageCashback(id);

  // Ensure that console.log was called with the expected error message
  expect(console.log).toHaveBeenCalledWith(mockError);

  // Check if the function still logs the route call
  expect(console.log).toHaveBeenCalledWith("PACKAGE ASSOCIATED WITH CASHBACK ROUTE CALLED");
});

it('should log the function call even when no errors occur', async () => {
  const id = 1;
  const mockResult = [
      { id: 1, packageId: 1, amount: '10' },
      { id: 2, packageId: 1, amount: '20' }
  ];

  cashback.findAll.mockResolvedValue(mockResult);

  // Mock console.log to track its calls
  console.log = jest.fn();

  await findPackageCashback(id);

  // Check that the route call is logged
  expect(console.log).toHaveBeenCalledWith("PACKAGE ASSOCIATED WITH CASHBACK ROUTE CALLED");

  // Ensure the correct results are returned
  expect(console.log).not.toHaveBeenCalledWith(expect.any(Error));
});

it('should handle invalid ID types gracefully (e.g., string, boolean)', async () => {
  const id = "invalid"; // Passing a string instead of a valid ID
  const mockResult = [];

  cashback.findAll.mockResolvedValue(mockResult);

  const result = await findPackageCashback(id);

  expect(cashback.findAll).toHaveBeenCalledWith({
      where: { packageId: id },
      raw: true
  });
  expect(result).toEqual(mockResult);
});

it('should return an empty list for null or empty string package ID', async () => {
  const id = null; // or empty string ''
  const mockResult = [];

  cashback.findAll.mockResolvedValue(mockResult);

  const result = await findPackageCashback(id);

  expect(cashback.findAll).toHaveBeenCalledWith({
      where: { packageId: id },
      raw: true
  });
  expect(result).toEqual(mockResult);
});

it('should handle a situation where findAll returns null', async () => {
  const id = 4;
  const mockResult = null;

  cashback.findAll.mockResolvedValue(mockResult);

  const result = await findPackageCashback(id);

  expect(cashback.findAll).toHaveBeenCalledWith({
      where: { packageId: id },
      raw: true
  });
  expect(result).toBeNull();
});

})