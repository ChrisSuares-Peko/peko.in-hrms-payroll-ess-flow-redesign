const { fetchReportData } = require('../../support'); // Adjust the path according to your project structure
const messages = require('../../../entities/support');


jest.mock('../../../entities/support', () => ({
  findAndCountAll: jest.fn(),
}));

jest.mock('../../../entities/corporateUser', () => ({
  findOne: jest.fn(),
  hasMany: jest.fn(),
}));

jest.mock('../../../entities/systemUser', () => ({
  findOne: jest.fn(),
}));

jest.mock('../../../entities/credential', () => ({
  findOne: jest.fn(),
  hasMany: jest.fn(),
}));

describe('fetchReportData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {}); // Mock console.log
  });


  it('should handle empty results', async () => {
    const params = {
      from: new Date('2024-08-01').toISOString(),
      to: new Date('2024-08-10').toISOString(),
      searchText: '',
      sort: 'ASC',
      sortField: 'createdAt',
      status: 'PENDING',
      registeredBy: '',
    };

    const mockResult = {
      rows: [],
      count: 0,
    };

    messages.findAndCountAll.mockResolvedValue(mockResult);

    const result = await fetchReportData(params);

    expect(result).toEqual([]);
  });

  it('should handle errors gracefully', async () => {
    const params = {
        from: new Date('2024-08-01'),
        to: new Date('2024-08-10'),
        searchText: 'test',
        sort: 'ASC',
        sortField: 'createdAt',
        status: 'open',
        registeredBy: 'user@example.com',
    };

    // Set up the mock to reject with an error
    const error = new Error('Database error');
    messages.findAndCountAll.mockRejectedValue(error);

    // Call the function and check console.log
    await fetchReportData(params);

    // Check if console.log was called with the error
    expect(console.log).toHaveBeenCalledWith(error);
});

});
