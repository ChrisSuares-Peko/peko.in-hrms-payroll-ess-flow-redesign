const isBlank = (value) => value === undefined || value === null || value === '';

const resolvePartnerScope = (req) => {
    const sessionPartnerId = req?.user?.registeredBy;
    const subPartnerId = isBlank(req?.user?.subPartnerId) ? null : req.user.subPartnerId;

    if (!isBlank(sessionPartnerId)) {
        return { partnerId: sessionPartnerId, subPartnerId, locked: true };
    }

    const requested = req?.query?.partnerId;
    return {
        partnerId: isBlank(requested) ? undefined : requested,
        subPartnerId,
        locked: false,
    };
};

// The customers Peko signed up itself: none registered them, or not by a partner's numeric id.
const pekoDirectClause = (table = "credentials") =>
    `(${table}.registeredBy IS NULL OR ${table}.registeredBy NOT REGEXP '^[0-9]+$')`;

module.exports = { resolvePartnerScope, pekoDirectClause };
