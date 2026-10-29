// The service gate on every card route: the caller's session must carry this service, either as the
// corporate's partner permission or as the employee's own membership.

const { verifyUserPermission } = require("./verifyPartnerWisePermission");

const forbidden = (res) => res.status(403).json({
    status: false,
    message: 'Forbidden',
    data: {},
    responseCode: '004'
});

const verifyUser = (serviceName) => {
    return (req, res, next) => {
        const role = req.user && req.user.role
        // A sub-corporate session carries CORPORATE_SUB_USER, not CORPORATE — its credential is the parent
        // corporate's but its role is its own. It was refused here before any permission was looked at.
        if (role !== 'CORPORATE' && role !== 'CORPORATE_SUB_USER' && role !== 'USER') {
            return forbidden(res);
        }
        if (role === 'USER') {
            // An employee reaches this service's routes only through a live membership in it, checked before
            // any controller sees the request. One granted only other services is refused here.
            const memberships = Array.isArray(req.user.serviceMemberships) ? req.user.serviceMemberships : [];
            const hasAccess = memberships.some(membership => membership.label === serviceName
                && membership.hasAccess !== false
                && membership.status !== 'INACTIVE');
            return hasAccess ? next() : forbidden(res);
        }
        {
            // A sub-corporate reaches this service on the parent corporate's credential, so the partner
            // check below answers for the COMPANY, not for them. What User Management granted this member
            // lives on their own services list, and without this it gated nothing but the sidebar.
            if (req.user && req.user.subCorporateId) {
                const granted = Array.isArray(req.user.subCorporateServices)
                    ? req.user.subCorporateServices
                    : [];
                if (!verifyUserPermission(granted, serviceName)) {
                    return forbidden(res);
                }
            }
            if(req.user && req.user.registeredBy){
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
