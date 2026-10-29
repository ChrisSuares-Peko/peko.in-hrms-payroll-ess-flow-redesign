// middlewares/verify sub corporate User
// and verify corporate partner wise permission

const { customLog } = require("../utils/loggerHelper");
const { verifyUserPermission } = require("./verifyPartnerWisePermission");

const verifyUser = (serviceName) => {
    return (req, res, next) => {
        if (req.user && req.user.role === 'CORPORATE_SUB_USER' && req.user.subCorporateServices) {
            const hasAccess = req.user.subCorporateServices.some(service => service.label === serviceName && service.hasAccess);
            if (hasAccess) {
                next();
            } else {
                res.status(403).json({
                    status: false,
                    message: 'Forbidden',
                    data: {},
                    responseCode: '004'
                });
            }
        } else {
            if(req.user && req.user.role === 'CORPORATE' && req.user.registeredBy){
                  let { partnerServices } = req.user
                  customLog(null, "info", {message: "payrollverifyuserdebuglog", partnerServices, regBy: req.user?.registeredBy})
                  if(partnerServices){
                    const hasAccess = verifyUserPermission(partnerServices, serviceName)
                    if (hasAccess) {
                        next();
                    } else {
                        res.status(403).json({
                            status: false,
                            message: 'Forbidden',
                            data: {},
                            responseCode: '004'
                        });
                    }
                  }else{
                    res.status(403).json({
                        status: false,
                        message: 'Partner permission not provided',
                        data: {},
                        responseCode: '004'
                    });
                  }
            }else if (req.user && req.user.role === 'USER') {
                // F-PRL-05: an ESS employee session has no corporate-level permissions to
                // check against — previously fell through to next() unguarded here, reaching
                // every corporate-only handler mounted after this middleware in routes/index.js.
                res.status(403).json({
                    status: false,
                    message: 'Forbidden',
                    data: {},
                    responseCode: '004'
                });
            }else{
                next();
            }

        }
    };
};

module.exports = { verifyUser };
