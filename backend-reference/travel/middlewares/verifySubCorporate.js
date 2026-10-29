// middlewares/verify sub corporate User
// and verify corporate partner wise permission

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
            }else{
                next();
            }
           
        }
    };
};

module.exports = { verifyUser };
