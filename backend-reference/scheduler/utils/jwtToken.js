const { getValue } = require('./cacheDataMethods')

exports.resolveSessionUser = async (req) => {
    const sessionKey = req.headers['x-user-key']
    if (sessionKey) {
        const cached = await getValue(`userData_${sessionKey}`)
        if (!cached) return null
        return typeof cached === 'string' ? JSON.parse(cached) : cached
    }
    const { userdata } = req.headers
    if (!userdata) return null
    return JSON.parse(decodeURI(userdata))
}

exports.verifyToken = async (req, res, next) => {
    try {
        req.user = await exports.resolveSessionUser(req)
        if (!req.user) {
            return res.status(401).json({
                status: false,
                message: 'Session expired or invalid',
                data: {},
                responseCode: '002'
            })
        }
        next()
    } catch (err) {
        return res.status( 401).json({
            status: false,
            message: err.message,
            data: {},
            responseCode: err.message == "jwt expired"? '002':'001'
         });
    }
}

/**
 * system_user routes only. Role comes from gateway Redis session (userdata header).
 * Path :userId must match the session user id.
 */
exports.requireSystemUser = async (req, res, next) => {
    try {
        if (!req.user) {
            req.user = await exports.resolveSessionUser(req);
        }
        if (req.user?.role !== "SYSTEM_USER") {
            return res.status(401).json({
                status: false,
                message: "Unauthorized access.",
                data: {},
                responseCode: "001",
            });
        }
        if (req.params.userId != null && String(req.params.userId) !== String(req.user.id)) {
            return res.status(401).json({
                status: false,
                message: "Unauthorized access.",
                data: {},
                responseCode: "001",
            });
        }
        return next();
    } catch (err) {
        return res.status(401).json({
            status: false,
            message: err.message || "Unauthorized access.",
            data: {},
            responseCode: "001",
        });
    }
};
