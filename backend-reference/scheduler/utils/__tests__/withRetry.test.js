const withRetry = require('../withRetry');

const noResponse = () => Object.assign(new Error('socket hang up'), { code: 'ECONNRESET' });
const httpError = (status) => Object.assign(new Error(`Request failed with status code ${status}`), { response: { status } });

describe('withRetry', () => {
  it('retries a failure that got no response and returns the later success', async () => {
    const fn = jest.fn().mockRejectedValueOnce(noResponse()).mockResolvedValueOnce('ok');

    await expect(withRetry(fn, 3, 0)).resolves.toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it.each([429, 500, 503])('retries a %s response', async (status) => {
    const fn = jest.fn().mockRejectedValueOnce(httpError(status)).mockResolvedValueOnce('ok');

    await expect(withRetry(fn, 3, 0)).resolves.toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it.each([400, 401, 403, 404])('does not retry a %s response', async (status) => {
    const error = httpError(status);
    const fn = jest.fn().mockRejectedValue(error);

    await expect(withRetry(fn, 3, 0)).rejects.toBe(error);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('gives up after the last attempt and rethrows its error', async () => {
    const last = noResponse();
    const fn = jest.fn().mockRejectedValueOnce(noResponse()).mockRejectedValueOnce(noResponse()).mockRejectedValueOnce(last);

    await expect(withRetry(fn, 3, 0)).rejects.toBe(last);
    expect(fn).toHaveBeenCalledTimes(3);
  });
});
