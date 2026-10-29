const { findAllPendingSignUps } = require('../../signUpActivityLog');
const sequelizeConfig = require('../../../../configs/database/index');

// No local jest.mock for configs/database/index - use global mock from setup.js
// which already provides both define() and query().
// The use-case fires two queries via Promise.all: the data query first, then
// the count query. Mock them in that order with mockResolvedValueOnce.

describe('findAllPendingSignUps', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return an empty result if no matching records are found', async () => {
    const mockParams = {
      limit: 10,
      offset: 0,
      searchText: 'nonexistent',
      sort: 'ASC',
      sortField: 'createdAt',
      status: 'PENDING',
    };

    sequelizeConfig.query
      .mockResolvedValueOnce([]) // data query
      .mockResolvedValueOnce([{ totalCount: 0 }]); // count query

    const result = await findAllPendingSignUps(mockParams);

    expect(result).toEqual({ rows: [], count: 0 });
  });

  it('should return correct data when records are found', async () => {
    const mockParams = {
      limit: 10,
      offset: 0,
      searchText: 'existing',
      sort: 'ASC',
      sortField: 'createdAt',
      status: 'PENDING',
    };

    const mockRows = [{ id: 1, companyName: 'Test' }];

    sequelizeConfig.query
      .mockResolvedValueOnce(mockRows) // data query
      .mockResolvedValueOnce([{ totalCount: 5 }]); // count query

    const result = await findAllPendingSignUps(mockParams);

    expect(result).toEqual({ rows: mockRows, count: 5 });
  });

  it('should take recordsTotal from the filtered count query, not the page of rows', async () => {
    // A single page of 2 rows, but 25 match the filter overall — recordsTotal
    // must be 25 (the count query), never 2 (rows.length) or a per-row field.
    const mockParams = {
      limit: 2,
      offset: 0,
      searchText: '',
      sort: 'DESC',
      sortField: 'createdAt',
      from: '2026-06-23',
      to: '2026-07-23',
      status: 'PENDING',
    };

    sequelizeConfig.query
      .mockResolvedValueOnce([{ id: 1 }, { id: 2 }]) // data query — one page
      .mockResolvedValueOnce([{ totalCount: 25 }]); // count query — full filtered total

    const result = await findAllPendingSignUps(mockParams);

    expect(result.rows).toHaveLength(2);
    expect(result.count).toBe(25);

    // Data and count queries must share the same date replacements.
    const [, dataOpts] = sequelizeConfig.query.mock.calls[0];
    const [, countOpts] = sequelizeConfig.query.mock.calls[1];
    expect(countOpts.replacements.from).toBe(dataOpts.replacements.from);
    expect(countOpts.replacements.to).toBe(dataOpts.replacements.to);
    expect(countOpts.replacements.status).toBe('PENDING');
  });

  it('should handle errors and throw a custom error message', async () => {
    const mockParams = {
      limit: 10,
      offset: 0,
      searchText: 'test',
      sort: 'ASC',
      sortField: 'createdAt',
      status: 'PENDING',
    };

    sequelizeConfig.query.mockRejectedValueOnce(new Error('Database error'));

    await expect(findAllPendingSignUps(mockParams)).rejects.toEqual({ message: 'Something went wrong' });
  });

  it('should pass the requested status through to the query replacements', async () => {
    const mockParams = {
      limit: 10,
      offset: 0,
      searchText: '',
      sort: 'DESC',
      sortField: 'createdAt',
      status: 'CLOSED',
    };

    sequelizeConfig.query
      .mockResolvedValueOnce([{ id: 1 }])
      .mockResolvedValueOnce([{ totalCount: 1 }]);

    await findAllPendingSignUps(mockParams);

    expect(sequelizeConfig.query).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        replacements: expect.objectContaining({ status: 'CLOSED' }),
      })
    );
  });

  it('should default the status filter to PENDING when none is provided', async () => {
    const mockParams = {
      limit: 10,
      offset: 0,
      searchText: '',
      sort: 'DESC',
      sortField: 'createdAt',
    };

    sequelizeConfig.query
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ totalCount: 0 }]);

    await findAllPendingSignUps(mockParams);

    expect(sequelizeConfig.query).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        replacements: expect.objectContaining({ status: 'PENDING' }),
      })
    );
  });
});
