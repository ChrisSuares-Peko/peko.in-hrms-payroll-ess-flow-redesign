const { recalculateAndUpsertProgress } = require('../services/progressCalculator');

/**
 * Recalculates and upserts the corporate user's progress after a
 * successful response (2xx). Runs fire-and-forget so it adds zero
 * latency to the triggering API.
 */
exports.updateProgress = (req, res, next) => {
    res.on('finish', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
            const corporateUser = req.user?._id;
            if (corporateUser) {
                recalculateAndUpsertProgress(corporateUser).catch(err =>
                    console.error('[Progress] Failed to update progress:', err.message)
                );
            }
        }
    });
    next();
};
