const withRetry = async (fn, maxAttempts = 3, baseDelayMs = 2000) => {
    let lastError;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await fn();
        } catch (err) {
            lastError = err;
            if (attempt < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, baseDelayMs * Math.pow(2, attempt - 1)));
            }
        }
    }
    throw lastError;
};

module.exports = withRetry;
