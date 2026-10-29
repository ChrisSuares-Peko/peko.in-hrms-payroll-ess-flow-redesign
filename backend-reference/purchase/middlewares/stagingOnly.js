const ErrorResponse = require('../utils/error-response');

/**
 * Environments where test-only tooling is allowed to run. Fail-closed: anything
 * outside this list — production, or an unset/typo'd NODE_ENV — is rejected, so
 * a missing env var can never expose the route.
 */
const TEST_ENVIRONMENTS = ['staging', 'development'];

/**
 * Blocks a route outside the non-production environments above. Use it for
 * admin switches that exist purely to set up test data.
 */
exports.stagingOnly = (req, res, next) => {
    if (!TEST_ENVIRONMENTS.includes(process.env.NODE_ENV)) {
        return next(new ErrorResponse('This route is available on staging only', 403));
    }

    return next();
};
