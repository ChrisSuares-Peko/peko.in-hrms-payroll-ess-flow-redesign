const CorporateUser = require("../models/entities/corporateUser");
const { runWithContext } = require('../utils/requestContext');
const { client } = require('../utils/redis');
// const ErrorResponse = require('../utils/error-response');

const resolveSessionUser = async (req) => {
  const sessionKey = req.headers['x-user-key'];
  if (sessionKey) {
    const cached = await client.get(`userData_${sessionKey}`);
    if (!cached) return null;
    return typeof cached === 'string' ? JSON.parse(cached) : cached;
  }
  // Only the gateway-issued x-user-key identifies a session. A raw userdata header is
  // never trusted: a request that bypassed the gateway could assert any identity with it.
  return null;
};

const sessionHeaders = (req) => ({
  sessionid: req.headers.sessionid,
  'x-user-key': req.headers['x-user-key'],
});

exports.verifyToken = async (req, res, next) => {
  try {
    const userDetails = await resolveSessionUser(req);
    if (!userDetails) {
      return res.status(401).json({
        status: false,
        responseCode: "002",
        message: "Session expired or invalid",
        data: {},
      });
    }

    if (userDetails?.role === 'USER') {
      // ESS employee: identified by the payroll employeeId carried in the session, not a CorporateUser row.
      req.user = {
        _id: userDetails.employeeId,
        // The session's own id — service-to-service calls use it as the path id the gateway checks.
        credentialId: userDetails?.id,
        role: 'USER',
        username: userDetails?.username,
        userAccessService: userDetails?.userAccessService,
        registeredBy: userDetails?.registeredBy,
      };
      return runWithContext(sessionHeaders(req), next);
    }

    const { id, name, email, logo, country, city, mobileNo, website } = userDetails;
    await CorporateUser.findOneAndUpdate(
      { _id: id }, // Find user by userId
      {
        email,
        companyName: name,
        logo,
        country,
        city,
        mobileNo,
        website,
      },
      { upsert: true, new: true }
    );
    let updatedUser1 = await CorporateUser.findOne({ _id: id }).lean();

    req.user = updatedUser1
    req.user.role = userDetails?.role;
    req.user.username = userDetails?.username;
    req.user.subCorporateId = userDetails?.subCorporateId;
    req.user.subCorporateUsername = userDetails?.subCorporateUsername;
    req.user.subCorporateServices = userDetails?.subCorporateServices;
    req.user.registeredBy = userDetails?.registeredBy;
    req.user.partnerServices = userDetails?.partnerServices;
    runWithContext(sessionHeaders(req), next);
  } catch (error) {
    console.log("PAYROLL FAILURE ERROR--..", { error });
    // next(new ErrorResponse('Payroll service not available at this moment', 404));
    return res.status(404).json({
      status: false,
      responseCode: "001",
      message: "Payroll service not available at this moment",
      data: { error: error.message },
    });
  }
};
