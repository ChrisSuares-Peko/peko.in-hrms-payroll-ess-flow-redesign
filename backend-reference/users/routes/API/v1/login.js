const router = (module.exports = require("express")());
const jwt = require('jsonwebtoken')
// const {
//     jwtSecret
// } = require('../../../configs/keys.json')
const passport = require('passport');
const axios = require('axios');
const signJwt = require('../../../utils/jwtToken');
const { verifyIdpToken } = require('../../../utils/idpToken');
const { findOneCredential, updateCredentials } = require("../../../models/use-cases/credential");
const {
    findOne: findOneCorporateUser,
    findOneUserWithCredentialId
} = require('../../../models/use-cases/corporateUser');
const { findOauthProviderDetails } = require("../../../models/use-cases/oauth_providers");
const ErrorResponse = require("../../../utils/error-response");
const {
    checkPartnerAccess,
    getAccessDetails,
    setSessionTokens,
    sendUnauthorized,
    logAndSendError
} = require("../../../services/authHelper");
const { validateLogin, validateRefreshTokenRequest } = require("../../../utils/apiValidation");
const { findOneSubCorporateByCredentialId, findOneSubCorporate } = require("../../../models/use-cases/subCorporateUser");
const { getValue, setValue, deleteKey } = require("../../../utils/cacheDataMethods");
const { v4 } = require("uuid");
const wallet = require("../../../models/entities/wallet");
const { customLog } = require("../../../utils/loggerHelper");
const fs = require('fs')
const path = require('path');
const { findPartnerPermissionsForSession } = require("../../../models/use-cases/partnerPermission");
const { gatedPartnerServices } = require("../../../models/use-cases/serviceApproval");
const { findByCorporateUserId } = require("../../../models/use-cases/access_codes");
const { findRole, fetchPartnerDetails } = require("../../../models/use-cases/systemUser");
const admin = require('../../../configs/firebaseAdmin');
const { checkAllPoliciesAccepted } = require("../../../models/use-cases/privacyPolicy");
const { findOneByCredentialId } = require("../../../models/use-cases/user");
const { actingCredentialId, getAvailableRoles } = require("../../../models/use-cases/actingIdentity");
const { listMemberships, roleInService } = require("../../../models/use-cases/serviceMembership");
const { EMPLOYEE_SERVICE, resolveServiceRole } = require("../../../constants/employeeServices");
const CARD_ADMIN_ROLE = resolveServiceRole(EMPLOYEE_SERVICE.CORPORATE_CARDS, "Admin");
const { findOrCreateOwnerProfile } = require("../../../models/use-cases/ownerCardholderProfile");
const { ownerProfileInput } = require("../../../controllers/switchRole");
const corporateUserEntity = require("../../../models/entities/corporateUser");

// The employee's identity and the services they hold, named after nothing in particular. A service reads its
// own entry out of serviceMemberships by its own label, so granting one tomorrow adds no field here.
const isCorporateOwnerCredential = (user) => user?.role === "CORPORATE";

const essEmployeeSession = (essProfile) => {
    if (!essProfile || essProfile.isDeleted === true) {
        return { employeeProfileId: null, employeeName: null, employeeEmail: null, employeeMobile: null, serviceMemberships: [] };
    }
    return {
        employeeProfileId: essProfile.id,
        // Every service that acts on behalf of an employee needs these: corporateCard builds its KYC
        // submission from them and signs every audit row with them.
        employeeName: essProfile.name || '',
        employeeEmail: essProfile.email || '',
        employeeMobile: essProfile.mobileNo || '',
        serviceMemberships: listMemberships(essProfile.userAccessService),
    };
};

router.post('/login', validateLogin, async (req, res, next) => {
    try {
        let corporateUserId, userProfileDetails, walletDetails;

        passport.authenticate('API_CORPORATE', {
            failureRedirect: '/loginFail',
            failureFlash: true
        },
            async (error, loginUserDetails, message) => {
                try {
                    let { partnerId } = req.body;
                    if (message?.maxPassWordAge) {
                        customLog(req?.LogTraceId, "info", { message })
                        return res.status(200).json({
                            status: true,
                            message: "maximum password age",
                            data: {
                                maxPasswordAge: true
                            },
                            responseCode: '001'
                        })
                    }
                    if (!loginUserDetails) {
                        return res.status(401).json({
                            status: false,
                            message: message?.errMsg,
                            data: {},
                            responseCode: '001'
                        })
                    }

                    //Giving access to corporates with in partner
                    let midPending = false;
                    let credentialPartnerId = loginUserDetails?.registeredBy;
                    if (credentialPartnerId || partnerId) {
                        if (partnerId != credentialPartnerId) {
                        return res.status(401).json({
                            status: false,
                            message: "Access denied.",
                            data: {},
                            responseCode: "001",
                        });
                        }
                        if (loginUserDetails?.role === 'CORPORATE') {
                        const details = await findOneCorporateUser({ id: loginUserDetails.id }, ['id'])

                        let accessCodeData = await findByCorporateUserId(details.id)
                        if (accessCodeData && accessCodeData?.partnerId !== partnerId) {
                            return res.status(401).json({
                            status: false,
                            message: "Access denied.",
                            data: {},
                            responseCode: "001",
                            });
                        }
                        if (!accessCodeData || accessCodeData === null) {
                            midPending = true
                        }
                        }
                    }

                    //fetch the partner permission
                    let permissionDetails;
                    if (credentialPartnerId) {
                        permissionDetails = await findPartnerPermissionsForSession({ registeredBy: credentialPartnerId });
                    }

                    let {
                        role,
                        id,
                        username,
                        email
                    } = loginUserDetails
                   
                    customLog(req?.LogTraceId, "info", { message: "------SESSION ID----------" })
                  
                    // console.log(loginUserDetails.role)

                    if (role === 'CORPORATE') {
                        userProfileDetails = await findOneCorporateUser({
                            id: loginUserDetails.id
                        })

                        if (!credentialPartnerId && userProfileDetails?.referralCode) {
                            permissionDetails = await findPartnerPermissionsForSession({
                                referralCode: userProfileDetails.referralCode
                            });
                        }

                        walletDetails = await wallet.findOne({
                            where: {
                                credentialId: loginUserDetails.id
                            },
                            attributes: ['balance']

                        })

                        corporateUserId = userProfileDetails?.id

                        if (userProfileDetails.isActive === 0) {
                            return res.status(401).json({
                                status: false,
                                message: 'Account Inactive - Contact administrator for assistance',
                                data: {},
                                responseCode: '001'
                            })
                        }
                    }

                    // ESS employee (payroll self-service) login
                    let essProfile;
                    if (role === 'USER') {
                        essProfile = await findOneByCredentialId(loginUserDetails.id);
                        if (!essProfile || essProfile.isActive === false) {
                            return res.status(401).json({
                                status: false,
                                message: 'Your account access has been revoked. Please contact your company administrator for further assistance.',
                                data: {},
                                responseCode: '001'
                            })
                        }
                        const parentCorporate = await corporateUserEntity.findOne({
                            where: { id: essProfile.corporateUserId },
                            attributes: ['essAccess']
                        });
                        corporateUserId = essProfile.corporateUserId;
                        if (parentCorporate && parentCorporate.essAccess === false) {
                            return res.status(401).json({
                                status: false,
                                message: "Your company's Employee Self-Service portal access has been disabled. Please contact your company administrator.",
                                data: {},
                                responseCode: '001'
                            })
                        }
                    }

                    // console.log(subCorporateData)
                    let roleName;
                    if (loginUserDetails.role === 'CORPORATE') {
                        roleName = 'corporate'
                    } else if (loginUserDetails.role === 'USER') {
                        roleName = 'employee'
                    } else if (loginUserDetails.role === "SYSTEM_USER") {
                        const roleData = await findRole(id);
                        if (roleData?.roleAndPermission?.dataValues?.status === 0 || roleData?.dataValues?.isActive === false) {
                            throw new Error("Your account is currently disabled. Please contact support for assistance.");
                          }
                        roleName = roleData?.roleAndPermission?.roleName;
                    }

                    let subCorporateData;
                    //subcorporate user condition
                    if (role === 'CORPORATE_SUB_USER') {
                        subCorporateData = await findOneSubCorporateByCredentialId({
                            id: loginUserDetails.id
                        })
                        if(subCorporateData.isDeleted) {
                            return res.status(401).json({
                                status: false,
                                message: 'Account Not Found - Contact administrator for assistance.',
                                data: {},
                                responseCode: '001'
                            })
                        }
                        if (subCorporateData.status === 'INACTIVE') {
                            return res.status(401).json({
                                status: false,
                                message: 'Account Inactive - Contact administrator for assistance.',
                                data: {},
                                responseCode: '001'
                            })
                        }
                        if (subCorporateData.services.length <=0) {
                            return res.status(401).json({
                                status: false,
                                message: 'No services are available for you - Contact administrator for assistance.',
                                data: {},
                                responseCode: '001'
                            })
                        }

                        userProfileDetails = await findOneCorporateUser({
                            id: subCorporateData.corporateCredentialID
                        })

                        loginUserDetails = await findOneCredential({ id: subCorporateData.corporateCredentialID })


                        role = 'CORPORATE'
                        roleName = 'corporate sub user'
                        let subCorporateId = id;
                        id = loginUserDetails.id
                        username = loginUserDetails.username
                        loginUserDetails.roleName = roleName
                        loginUserDetails.subCorporateId = subCorporateId;

                        corporateUserId = userProfileDetails?.corporateUserId
                        if (userProfileDetails.status === 0) {
                            return res.status(401).json({
                                status: false,
                                message: 'Account is currently inactive',
                                data: {},
                                responseCode: '001'
                            })
                        }
                    }

                    const token = await signJwt.signToken(loginUserDetails)
                    const refreshToken = await signJwt.signRefreshToken(loginUserDetails)

                    let userId = loginUserDetails.id
                    let userName = loginUserDetails.username
                    const firebaseToken = await admin.auth().createCustomToken(userId.toString(),{ username: userName}); 
                    let sessionId = v4();
                    customLog(req?.LogTraceId, "info", { message: "------SESSION ID----------", sessionId })
                  
                    console.log("------LOGIN TOKEN ID----------", `token_${userId}_${sessionId}`)
                    console.log("------REFRESH TOKEN ID----------", `refreshToken_${userId}_${sessionId}`)
                    console.log("------LOGIN USERDATA ID----------", `userData_${userId}_${sessionId}`)

                     const credentialIdToCheck = subCorporateData?.credentialId || loginUserDetails.id;
        const partnerCredentialId = loginUserDetails?.registeredBy || null;
        let shouldEnforcePrivacyPolicy = false;
        let policyAccepted = true;
        if (partnerCredentialId) {
          const partnerCredential = await findOneCredential(
            { id: partnerCredentialId },
            ["enforcePrivacyPolicy"]
          );
          
          shouldEnforcePrivacyPolicy = !!partnerCredential?.enforcePrivacyPolicy;
        } else {
          // direct (non-partner) users
          shouldEnforcePrivacyPolicy = process.env.ENFORCE_PRIVACY_POLICY?.toLowerCase() === "true";
        }
       
        

        if (shouldEnforcePrivacyPolicy) {
            policyAccepted = await checkAllPoliciesAccepted({ credentialId: credentialIdToCheck });
        }
      // const isPrivacyEnforcedUser = loginUserDetails.id === 1013; // hardcoded temporarily for testing, should be removed once all users are enforced with privacy policy acceptance


                    let userSessionData = await fetchUserData({userDetails:loginUserDetails, details:userProfileDetails, walletDetails,subCorporateData, permissionDetails,    privacyPolicyAccepted: !!policyAccepted, essProfile});

                    await setValue(`token_${userId}_${sessionId}`, expiryCalculationFn(process.env.ACCESS_TOKEN_EXPIRY), token);
                    await setValue(`refreshToken_${userId}_${sessionId}`, expiryCalculationFn(process.env.REFRESH_TOKEN_EXPIRY), refreshToken);
                    await setValue(`userData_${userId}_${sessionId}`, expiryCalculationFn(process.env.ACCESS_TOKEN_EXPIRY), JSON.stringify(userSessionData));

                    await updateCredentials(loginUserDetails.id, { lastLogin: Date.now() });

                    // to get partner details like branding etc..
                    const partnerDetails = await fetchPartnerDetails(loginUserDetails?.registeredBy);

                    return res.status(200).json({
                        status: true,
                        message: 'Login successful',
                        data: {
                            token,
                            refreshToken,
                            firebaseToken,
                            role: role.toLowerCase(),
                            roleName,
                            id,
                            username,
                            email,
                            emailVerified: true,
                            corporateId: corporateUserId,
                            sessionId,
                            packageName: userProfileDetails?.package?.packageName,
                            subCorporateId: subCorporateData ? subCorporateData.id : null,
                            subCorporateRole: subCorporateData ? subCorporateData.role : null,
                            midPending,
                            branding: partnerDetails?.branding || "Peko",
                            employeeId: essProfile ? essProfile.employeeId : undefined,
                            userAccessService: essProfile ? essProfile.userAccessService : undefined,
                            ...(essProfile ? essEmployeeSession(essProfile) : {})
                        },
                        responseCode: '000'
                    })
                } catch (err) {
                    customLog(req?.LogTraceId, "error", { message: err?.message, data: err?.response?.data })
                    return res.status(500).json({
                        status: false,
                        message: err.message,
                        data: {},
                        responseCode: '001'
                    })
                }
            })(req, res, next)
    } catch (err) {
        customLog(req?.LogTraceId, "error", { message: err?.message, data: err?.response?.data })
        return res.status(500).json({
            status: false,
            message: err.message,
            data: {},
            responseCode: '001'
        })
    }
});

router.post('/logout', async (req, res) => {
    try {
        const sessionId = req.headers.sessionid;

        if (!sessionId) {
            return res.status(400).json({
                status: false,
                message: 'Session ID is missing',
                data: {},
                responseCode: '001'
            });
        }

        const userData = await signJwt.resolveSessionUser(req);
        const userId = userData?.id;
        if (!userId) {
            return res.status(400).json({
                status: false,
                message: 'Invalid Session ID',
                data: {},
                responseCode: '001'
            });
        }

        // Clear session data from Redis
        await deleteKey(`token_${userId}_${sessionId}`);
        await deleteKey(`refreshToken_${userId}_${sessionId}`);
        await deleteKey(`userData_${userId}_${sessionId}`);

        return res.status(200).json({
            status: true,
            message: 'Logout successful',
            data: {},
            responseCode: '000'
        });
    } catch (err) {
        customLog(req?.LogTraceId, "error", { message: err?.message, data: err?.response?.data })
        return res.status(500).json({
            status: false,
            message: err.message,
            data: {},
            responseCode: '001'
        });
    }
});

// Route for refreshing tokens
router.post("/refresh-token", validateRefreshTokenRequest, async (req, res) => {
    try {
      const refreshToken = req.body.refreshToken;
      const oauth_refreshToken = req.body.oauth_refreshToken;
      const registeredBy = req.body.registeredBy;

      if (!refreshToken) {
        return res.status(401).json({
          status: false,
          message: "No refresh token provided",
          data: {},
          responseCode: "001",
        });
      }
  
      const publicKeyPath = path.join(__dirname, "..", "..", "..", "keys", "rsa.key.pub");
      const publicKey = fs.readFileSync(publicKeyPath, "utf8");

      let refreshVerify = jwt.verify(refreshToken, publicKey, {
        issuer: process.env.ISSUER,
        subject: process.env.SUBJECT,
        audience: process.env.AUDIENCE,
        algorithms: ["RS256"],
      });

      // Access tokens are signed with the same key and claims; only a refresh token may mint a new session.
      if (refreshVerify?.type !== "refreshToken") {
        return res.status(401).json({
          status: false,
          message: "Invalid refresh token",
          data: {},
          responseCode: "002",
        });
      }


      // eslint-disable-next-line no-prototype-builtins
      const user = {
        username: refreshVerify.username,
        role: refreshVerify.role,
        id: refreshVerify.userId,
        roleName: refreshVerify.roleName,
        subCorporateId: refreshVerify.subCorporateId,
        isMobile: refreshVerify?.isMobile
      };
      const newToken = await signJwt.signToken(user);
      const newRefreshToken = await signJwt.signRefreshToken(user);

      let loginUserDetails = await findOneCredential({ id: user.id });

      if (oauth_refreshToken) {
        const oauthPartnerId = loginUserDetails?.registeredBy || registeredBy || null;
        const providerDetails = await findOauthProviderDetails(oauthPartnerId);
        if (!providerDetails) {
          customLog(req?.LogTraceId, "error", { msg: "OAuth provider not configured for refresh", oauthPartnerId });
          return res.status(500).json({
            status: false,
            message: "OAuth provider not configured",
            data: {},
            responseCode: "001",
          });
        }
        const { issuer, client_id, client_secret } = providerDetails;
        const configUrl = `${issuer}/.well-known/openid-configuration`;
        let tokenEndpoint = `${issuer}/oauth/token`;
        try {
          const { data } = await axios.get(configUrl);
          tokenEndpoint = data.token_endpoint;
        } catch (err) {
          customLog(req?.LogTraceId, "error", { msg: "Error from fetching OPENID Config", err });
          return res.status(500).json({
            status: false,
            message: "Failed to fetch OpenID config",
            data: {},
            responseCode: "001",
          });
        }
        try {
          // Convert payload to x-www-form-urlencoded
          const params = new URLSearchParams();
          params.append('grant_type', 'refresh_token');
          params.append('client_id', client_id);
          params.append('client_secret', client_secret);
          params.append('refresh_token', oauth_refreshToken);

          customLog(req?.LogTraceId, "info", { tokenEndpoint, msg: "REFRESH TOKEN API CONFIG" });
          const tokenRes = await axios.post(
            tokenEndpoint,
            params,
            {
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            }
          );

          const idToken = tokenRes.data.id_token;
          const decoded = jwt.decode(idToken);
          let { exp: tokenExpiry } = decoded || {};

          refreshVerify = {
            ...refreshVerify,
            decoded,
            idToken,
            accessToken: tokenRes.data.access_token,
            refreshToken: tokenRes.data.refresh_token,
            tokenExpiry,
          };
          customLog(req?.LogTraceId, 'info', { message: 'Refresh token verified for OAuth' });
        } catch (err) {
          customLog(req?.LogTraceId, 'error', { message: err?.message, data: err?.response?.data });
          return res.status(500).json({
            status: false,
            message: "Failed to fetch token details",
            data: {},
            responseCode: "001",
          });
        }
      }

      let userProfileDetails = await findOneCorporateUser({
        id: user?.id,
      });
  
      const walletDetails = await wallet.findOne({
        where: {
          credentialId: loginUserDetails.id,
        },
        attributes: ["balance"],
      });
  
      let userId = refreshVerify.userId;
      let sessionId = v4();
  
      let subCorporateData;
      //subcorporate user condition
      customLog(req?.LogTraceId, "info", { role: user?.roleName })
      if (user?.roleName === "corporate sub user") {
        // By PRIMARY KEY, which is what the refresh token carries. findOneSubCorporateByCredentialId was
        // handed `subCorporateId` — the member ROW id, a different number in the same range — so the
        // refresh either found nobody and threw on the next line, or found whichever member happened to own
        // a credential with that id and rebuilt the session as THEM.
        subCorporateData = await findOneSubCorporate({
          id: user?.subCorporateId,
        });
        if (!subCorporateData) {
          return res.status(401).json({
            status: false,
            message: "Invalid session",
            data: {},
            responseCode: "002",
          });
        }
  
        userProfileDetails = await findOneCorporateUser({
          id: subCorporateData.corporateCredentialID,
        });
  
        loginUserDetails = await findOneCredential({ id: subCorporateData.corporateCredentialID });
  
      }
  
      let essProfile;
      if (user?.role === "USER") {
        essProfile = await findOneByCredentialId(user.id);
      }

      const permissionDetails = await findPartnerPermissionsForSession({
        registeredBy: loginUserDetails?.registeredBy,
        referralCode: userProfileDetails?.referralCode
      });

          let policyAccepted = true;
    const partnerCredentialId = loginUserDetails?.registeredBy || null;
    let shouldEnforcePrivacyPolicy = false;
    let credentialIdtoCheck=subCorporateData?.credentialId||loginUserDetails.id

if (partnerCredentialId) {
  const partnerCredential = await findOneCredential(
    { id: partnerCredentialId },
    ["enforcePrivacyPolicy"]
  );
  
  shouldEnforcePrivacyPolicy = !!partnerCredential?.enforcePrivacyPolicy;
} else {
  // direct (non-partner) users
  shouldEnforcePrivacyPolicy = true
}


if (shouldEnforcePrivacyPolicy) {
    policyAccepted = await checkAllPoliciesAccepted({ credentialId: credentialIdtoCheck });
}

let privacyPolicyAccepted =!!policyAccepted;
  
  
      let userSessionData = await fetchUserData({ userDetails: loginUserDetails, details: userProfileDetails, walletDetails, subCorporateData, permissionDetails,privacyPolicyAccepted, essProfile });

      // Carry the Admin/Employee mode across the rotation. This is the same logical session — only the token
      // is being replaced — but fetchUserData rebuilds the blob from the DB and knows nothing about the mode,
      // so without this an employee who deliberately switched down to Employee silently regains Admin
      // authority at the first access-token expiry, while the UI still shows Employee.
      //
      // Only an EMPLOYEE has a mode, and only one whose freshly-read assigned role is still Admin: re-reading
      // it here means a demotion in the DB wins over whatever the old blob carried. Best-effort — a missing
      // sessionid header or an unreadable blob just resets the mode to the assigned role, which never grants
      // more than it should.
      const previousSessionId = req.headers.sessionid;
      if (previousSessionId && user?.role === "USER" && essProfile) {
        try {
          const assigned = resolveServiceRole(
            EMPLOYEE_SERVICE.CORPORATE_CARDS,
            roleInService(essProfile.userAccessService, EMPLOYEE_SERVICE.CORPORATE_CARDS)
          );
          if (assigned === CARD_ADMIN_ROLE) {
            const previousBlob = await getValue(`userData_${userId}_${previousSessionId}`);
            const previousActive = previousBlob ? JSON.parse(previousBlob)?.activeSubRole : null;
            if (previousActive) {
              userSessionData.activeSubRole = resolveServiceRole(
                EMPLOYEE_SERVICE.CORPORATE_CARDS,
                previousActive
              );
            }
          }
        } catch (err) {
          customLog(req?.LogTraceId, "error", { message: "Could not carry activeSubRole across refresh", error: err?.message });
        }
      }

      let refreshTokenExpiry, accessTokenExpiry;

      if (oauth_refreshToken) {
        let tokenExpiry = 30 * 60; // 30 minute for redirection (default)
        if (refreshVerify?.tokenExpiry) {
          const now = Math.floor(Date.now() / 1000);
          tokenExpiry = Number(refreshVerify?.tokenExpiry) - now;
        }
        customLog(req?.LogTraceId, 'info', { tokenExpiry, message: 'Token expiry for oauth' });
        accessTokenExpiry = tokenExpiry - (5 * 60); // 5 minute less
        refreshTokenExpiry = tokenExpiry;
      } else if (loginUserDetails?.isAutoLogin) {
        accessTokenExpiry = process.env.AUTO_LOGIN_ACCESS_TOKEN_EXPIRY;
        refreshTokenExpiry = process.env.AUTO_LOGIN_REFRESH_TOKEN_EXPIRY;

      }else if(user?.isMobile){
        accessTokenExpiry = process.env.MOBILE_ACCESS_TOKEN_EXPIRY;
        refreshTokenExpiry = process.env.MOBILE_REFRESH_TOKEN_EXPIRY;


      } else {
        accessTokenExpiry = process.env.ACCESS_TOKEN_EXPIRY;
        refreshTokenExpiry = process.env.REFRESH_TOKEN_EXPIRY;
      }

      let redisUniqueKey = `${userId}_${sessionId}`;
      if (oauth_refreshToken) {
        redisUniqueKey = `${userProfileDetails?.uuid}`;
      }

      await setValue(`token_${redisUniqueKey}`, oauth_refreshToken ? accessTokenExpiry : expiryCalculationFn(accessTokenExpiry), newToken);
      if (oauth_refreshToken && refreshVerify.refreshToken) {
        await setValue(
          `oauth_refreshToken_${redisUniqueKey}`,
          refreshTokenExpiry,
          refreshVerify.refreshToken
        );
      }
      await setValue(`refreshToken_${redisUniqueKey}`, oauth_refreshToken ? refreshTokenExpiry : expiryCalculationFn(refreshTokenExpiry), newRefreshToken);
      await setValue(`userData_${redisUniqueKey}`, oauth_refreshToken ? accessTokenExpiry : expiryCalculationFn(accessTokenExpiry), JSON.stringify(userSessionData));

      return res.status(200).json({
        status: true,
        message: "Refresh token generated successfully.",
        data: {
          token: newToken,
          refreshToken: newRefreshToken,
          oauth_refreshToken: oauth_refreshToken ? (refreshVerify?.refreshToken || null) : undefined,
          sessionId,
          sessionUUID: oauth_refreshToken ? (userProfileDetails?.uuid || null) : undefined,
          // The rotation already rebuilt the session blob from a freshly read employee row, so a service
          // granted since login is live on the server from here on. Returning the same fields login and
          // /switch-role return lets the client stop acting on the membership list it started with.
          ...(essProfile ? essEmployeeSession(essProfile) : {}),
        },
        responseCode: "000",
      });
    } catch (err) {
      return res.status(401).json({
        status: false,
        message: err?.message ? err?.message : "Something went wrong!",
        data: {},
        responseCode: "002",
      });
    }
  });

// The identities the currently authenticated credential can switch between.
router.get("/available-roles", signJwt.verifyToken, async (req, res) => {
    try {
        const roles = await getAvailableRoles(actingCredentialId(req.user));
        return res.status(200).json({
            status: true,
            message: "Available roles fetched successfully",
            data: { roles },
            responseCode: "000",
        });
    } catch (err) {
        customLog(req?.LogTraceId, "error", { message: err?.message });
        return res.status(500).json({
            status: false,
            message: err?.message || "Something went wrong",
            data: {},
            responseCode: "001",
        });
    }
});

// Switch the authenticated credential into another identity it owns, without re-entering a password.
// getAvailableRoles decides which those are and why; this only mints the session for one it named.
router.post("/switch-role", signJwt.verifyToken, async (req, res) => {
    try {
        const credentialId = actingCredentialId(req.user);
        const targetRole = req.body.role; // 'corporate' | 'user' | 'sub_corporate'

        const availableRoles = await getAvailableRoles(credentialId);
        const target = availableRoles.find((r) => r.role === targetRole);
        if (!target) {
            return res.status(403).json({
                status: false,
                message: "You do not have access to this identity",
                data: {},
                responseCode: "001",
            });
        }

        const baseCredential = await findOneCredential({ id: credentialId });
        const targetEnumRole = targetRole === "user" ? "USER" : "CORPORATE";
        let loginUserDetails = { ...baseCredential.get({ plain: true }), role: targetEnumRole };

        let userProfileDetails, essProfile, corporateUserId, subCorporateData;
        // A sub-corporate session is signed as the EMPLOYER's credential, carrying the member's own id
        // alongside — so the id this session is keyed by is not always the credential that owns it.
        let sessionCredentialId = credentialId;

        if (targetRole === "sub_corporate") {
            subCorporateData = await findOneSubCorporateByCredentialId({ id: credentialId });
            if (!subCorporateData || subCorporateData.isDeleted) {
                return res.status(401).json({
                    status: false,
                    message: "Account Not Found - Contact administrator for assistance.",
                    data: {},
                    responseCode: "001",
                });
            }
            if (subCorporateData.status === "INACTIVE") {
                return res.status(401).json({
                    status: false,
                    message: "Account Inactive - Contact administrator for assistance.",
                    data: {},
                    responseCode: "001",
                });
            }
            if (!subCorporateData.services || subCorporateData.services.length <= 0) {
                return res.status(401).json({
                    status: false,
                    message: "No services are available for you - Contact administrator for assistance.",
                    data: {},
                    responseCode: "001",
                });
            }

            userProfileDetails = await findOneCorporateUser({ id: subCorporateData.corporateCredentialID });
            if (!userProfileDetails || userProfileDetails.status === 0) {
                return res.status(401).json({
                    status: false,
                    message: "Account is currently inactive",
                    data: {},
                    responseCode: "001",
                });
            }

            const employerCredential = await findOneCredential({ id: subCorporateData.corporateCredentialID });
            if (!employerCredential) {
                return res.status(401).json({
                    status: false,
                    message: "Account Not Found - Contact administrator for assistance.",
                    data: {},
                    responseCode: "001",
                });
            }

            loginUserDetails = {
                ...employerCredential.get({ plain: true }),
                role: "CORPORATE",
                roleName: "corporate sub user",
                subCorporateId: subCorporateData.id,
            };
            sessionCredentialId = employerCredential.id;
            corporateUserId = userProfileDetails.corporateUserId;
        } else if (targetEnumRole === "CORPORATE") {
            userProfileDetails = await findOneCorporateUser({ id: credentialId });
            corporateUserId = userProfileDetails?.id;
            if (userProfileDetails?.isActive === 0) {
                return res.status(401).json({
                    status: false,
                    message: "Account Inactive - Contact administrator for assistance",
                    data: {},
                    responseCode: "001",
                });
            }
        } else {
            essProfile = await findOneByCredentialId(credentialId);

            // The account holder reaches their cardholder view by switching identity, so the row that view
            // needs is created at the moment of intent rather than assumed to exist. Idempotent, and refused
            // rather than half-applied: switching without an identity strands them where every route 403s.
            if (!essProfile && isCorporateOwnerCredential(req.user)) {
                const provisioned = await findOrCreateOwnerProfile(ownerProfileInput(req));
                if (!provisioned?.ok) {
                    return res.status(400).json({
                        status: false,
                        message: provisioned?.message || "Could not switch to your Employee account. Please try again.",
                        data: {},
                        responseCode: "001",
                    });
                }
                essProfile = provisioned.profile;
            }

            if (!essProfile || essProfile.isActive === false) {
                return res.status(401).json({
                    status: false,
                    message: "Your account access has been revoked. Please contact your company administrator for further assistance.",
                    data: {},
                    responseCode: "001",
                });
            }
            const parentCorporate = await corporateUserEntity.findOne({
                where: { id: essProfile.corporateUserId },
                attributes: ["essAccess"],
            });
            corporateUserId = essProfile.corporateUserId;
            if (parentCorporate && parentCorporate.essAccess === false) {
                return res.status(401).json({
                    status: false,
                    message: "Your company's Employee Self-Service portal access has been disabled. Please contact your company administrator.",
                    data: {},
                    responseCode: "001",
                });
            }
        }

        let roleName;
        if (targetRole === "sub_corporate") roleName = "corporate sub user";
        else roleName = targetEnumRole === "CORPORATE" ? "corporate" : "employee";

        const token = await signJwt.signToken(loginUserDetails);
        const refreshToken = await signJwt.signRefreshToken(loginUserDetails);
        const sessionId = v4();

        const permissionDetails = await findPartnerPermissionsForSession({
            registeredBy: loginUserDetails.registeredBy,
            referralCode: userProfileDetails?.referralCode
        });

        const userSessionData = await fetchUserData({
            userDetails: loginUserDetails,
            details: userProfileDetails,
            walletDetails: null,
            subCorporateData,
            permissionDetails,
            privacyPolicyAccepted: true, // already enforced on the credential's original login
            essProfile,
        });

        // Keyed by the credential the JWT was SIGNED with, which for a sub-corporate is the employer's —
        // the gateway looks the session up as `token_${jwt.userId}_${sessionid}`, so keying it by the
        // member's own credential would mint a session that no request could then resolve.
        await setValue(`token_${sessionCredentialId}_${sessionId}`, expiryCalculationFn(process.env.ACCESS_TOKEN_EXPIRY), token);
        await setValue(`refreshToken_${sessionCredentialId}_${sessionId}`, expiryCalculationFn(process.env.REFRESH_TOKEN_EXPIRY), refreshToken);
        await setValue(`userData_${sessionCredentialId}_${sessionId}`, expiryCalculationFn(process.env.ACCESS_TOKEN_EXPIRY), JSON.stringify(userSessionData));

        const partnerDetails = await fetchPartnerDetails(loginUserDetails?.registeredBy);

        return res.status(200).json({
            status: true,
            message: `Switched to ${roleName} successfully`,
            data: {
                token,
                refreshToken,
                role: targetEnumRole.toLowerCase(),
                roleName,
                id: sessionCredentialId,
                username: loginUserDetails.username,
                email: loginUserDetails.email,
                sessionId,
                corporateId: corporateUserId,
                packageName: userProfileDetails?.package?.packageName,
                subCorporateId: subCorporateData ? subCorporateData.id : null,
                subCorporateRole: subCorporateData ? subCorporateData.role : null,
                branding: partnerDetails?.branding || "Peko",
                employeeId: essProfile ? essProfile.employeeId : null,
                userAccessService: essProfile ? essProfile.userAccessService : null,
                ...(essProfile ? essEmployeeSession(essProfile) : {}),
            },
            responseCode: "000",
        });
    } catch (err) {
        customLog(req?.LogTraceId, "error", { message: err?.message });
        return res.status(500).json({
            status: false,
            message: err?.message || "Something went wrong",
            data: {},
            responseCode: "001",
        });
    }
});

router.post("/token-exchange", async (req, res, next) => {
    try {
        const auth = req.headers.authorization;
        let partnerId = null;
        let isMobile = false;
        if (!auth?.startsWith("Bearer ")) {
            return next(
                new ErrorResponse("Missing or malformed authorization header", 401)
            );
        }
        const authToken = auth.split(" ")[1];
        const decoded = verifyIdpToken(authToken);

        // rsa.key also signs first-party session tokens and the /authorize and /direct-active-session bridge
        // tokens; none of those may be exchanged here, only a token issued by the IdP /token endpoint.
        const isFirstPartyOrBridgeToken =
            decoded?.type !== undefined || decoded?.client_id !== undefined || decoded?.token !== undefined;
        if (!decoded?.sub || isFirstPartyOrBridgeToken) {
            return next(new ErrorResponse("Invalid token", 401));
        }

        let loginUserDetails = await findOneUserWithCredentialId(decoded.sub);
        if (!loginUserDetails || !loginUserDetails.dataValues) {
            return next(new ErrorResponse("User not found", 404));
        }

        const credentialPartnerId = loginUserDetails?.registeredBy;
        // Access checks
        const { midPending, isSuccess } = await checkPartnerAccess(partnerId, credentialPartnerId, loginUserDetails);
        if (!isSuccess) {
            return sendUnauthorized(res, "Access denied.");
        }
        const partnerDetails = await fetchPartnerDetails(credentialPartnerId);
        // User Profile Setup
        loginUserDetails.id = loginUserDetails.credentialId;
        loginUserDetails.role = loginUserDetails.dataValues.role;
        const {
            loginUserDetails: updatedLoginUserDetails,
            userProfileDetails,
            walletDetails,
            roleName,
            corporateUserId,
            subCorporateData,
            essProfile,
        } = await getAccessDetails(loginUserDetails, partnerId);
        loginUserDetails = updatedLoginUserDetails;

        //fetch the partner permission
        const permissionDetails = await findPartnerPermissionsForSession({
            registeredBy: credentialPartnerId,
            referralCode: userProfileDetails?.referralCode
        });

        // Generate Tokens
        loginUserDetails.isMobile = isMobile;
        loginUserDetails.id = loginUserDetails.credentialId;
        loginUserDetails.role = loginUserDetails.dataValues.role;
        loginUserDetails.username = loginUserDetails.dataValues.username;
        const token = await signJwt.signToken(loginUserDetails);
        const refreshToken = await signJwt.signRefreshToken(loginUserDetails);
        const sessionId = v4();

        const credentialIdToCheck = subCorporateData?.credentialId || loginUserDetails.id;
        const partnerCredentialId = loginUserDetails?.registeredBy || null;
        let shouldEnforcePrivacyPolicy = false;
        let policyAccepted = true;
        if (partnerCredentialId) {
            const partnerCredential = await findOneCredential(
                { id: partnerCredentialId },
                ["enforcePrivacyPolicy"]
            );

            shouldEnforcePrivacyPolicy = !!partnerCredential?.enforcePrivacyPolicy;
        } else {
            // direct (non-partner) users
            shouldEnforcePrivacyPolicy = process.env.ENFORCE_PRIVACY_POLICY?.toLowerCase() === "true";
        }

        if (shouldEnforcePrivacyPolicy) {
            policyAccepted = await checkAllPoliciesAccepted({
                credentialId: credentialIdToCheck,
            });
        }

        const userSessionData = await fetchUserData({
            userDetails: loginUserDetails,
            details: userProfileDetails,
            walletDetails,
            subCorporateData,
            permissionDetails,
            privacyPolicyAccepted: !!policyAccepted,
            essProfile,
        });

        const isAutoLogin = loginUserDetails?.isAutoLogin ?? loginUserDetails?.dataValues?.isAutoLogin;
        await setSessionTokens(loginUserDetails?.id, sessionId, token, refreshToken, userSessionData, isMobile, isAutoLogin);

        // Last login update
        await updateCredentials(loginUserDetails.id, { lastLogin: Date.now() });

        const firebaseToken = await admin.auth().createCustomToken(loginUserDetails.id.toString(), { username: loginUserDetails.username });

        const result = {
            token,
            refreshToken,
            firebaseToken,
            role: "corporate",
            roleName,
            id: loginUserDetails.id,
            email: loginUserDetails.email,
            corporateId: corporateUserId,
            username: loginUserDetails.username,
            sessionId,
            packageName: userProfileDetails?.package?.packageName,
            subCorporateId: subCorporateData?.id || null,
            midPending,
            branding: partnerDetails?.branding || "Peko",
        };
        return res.status(200).json({
            status: true,
            message: "Login successful",
            responseCode: "000",
            data: result,
        });
    } catch (err) {
        return logAndSendError(req, res, err);
    }
});

async function fetchUserData({ userDetails, details, walletDetails, subCorporateData, permissionDetails,privacyPolicyAccepted, essProfile }) {
    let data = {}

    data['id'] = userDetails ? userDetails['id'] : ''
    data['packageId'] = details ? details['packageId'] : 1
    data['tradeLicenseExpiry'] = details ? details['tradeLicenseExpiry'] : ''
    data['kycStatus'] = details && details['kycStatus'] ? details['kycStatus'] : 'Pending'
    data['logo'] = details && details['logo'] ? details['logo'].toString() : ''
    data['email'] = details && details['email'] ? details['email'] : ''
    data['corporateId'] = details && details['id'] ? details['id'] : ''
    data['productTour'] = details && details['productTour'] ? details['productTour'] : ''
    data['username'] = userDetails && userDetails['username'] ? userDetails['username'] : ''
    data['name'] = userDetails && userDetails['name'] ? userDetails['name'] : ''
    data['city'] = details && details['city'] ? details['city'] : ''
    data['state'] = details && details['state'] ? details['state'] : ''
    data['website'] = details && details['website'] ? details['website'] : ''
    data['country'] = details && details['country'] ? details['country'] : ''
    data['companyName'] = details && details['companyName'] ? details['companyName'] : ''
    data['mobileNo'] = details && details['mobileNo'] ? details['mobileNo'] : ''
    data['role'] = userDetails && userDetails['role'] ? userDetails['role'] : ''
    data['balance'] = walletDetails && walletDetails['balance'] ? walletDetails['balance'] : ''
    data['contactPersonName'] = details && details['contactPersonName'] ? details['contactPersonName'] : ''
    data["registeredBy"] = userDetails && userDetails["registeredBy"] ? userDetails["registeredBy"] : null;
    data["createdAt"] = userDetails ? userDetails["createdAt"] : null;
    data["accountType"] = userDetails && userDetails["accountType"] ? userDetails["accountType"] : 'corporate';
      data["hasAcceptedPrivacyPolicy"] = !!privacyPolicyAccepted;
    data['chatId'] = details && details['chatId'] ? details['chatId'] : ''
    if (essProfile) {
        data['employeeId'] = essProfile.employeeId || ''
        data['userAccessService'] = essProfile.userAccessService || null
        data['corporateId'] = essProfile.corporateUserId || ''
        const employee = essEmployeeSession(essProfile)
        data['employeeProfileId'] = employee.employeeProfileId
        data['employeeName'] = employee.employeeName
        data['employeeEmail'] = employee.employeeEmail
        data['employeeMobile'] = employee.employeeMobile
        data['serviceMemberships'] = employee.serviceMemberships
    }
    if (permissionDetails) data["partnerServices"] = await gatedPartnerServices(permissionDetails);
    if (subCorporateData) {
        const subCorporateUsername = await findOneCredential({ id: subCorporateData.credentialId }, ['username']);
        data['subCorporateId'] = subCorporateData && subCorporateData['id'] ? subCorporateData['id'] : ''
        // Stated, not read off the credential. `credentials.role` records what the credential was CREATED
        // as and never changes when a second identity is linked to it, so a member who was an employee
        // first carried role 'USER' into a sub-corporate session — and services.js, which branches on it,
        // served them the employee's own grant instead of the services User Management assigned.
        // Reaching this block at all means subCorporateData was resolved, which is what the session is.
        data['role'] = 'CORPORATE_SUB_USER'
        data['subCorporateUsername'] = subCorporateUsername && subCorporateUsername['username'] ? subCorporateUsername['username'] : ''
        data['subCorporateCredential'] = subCorporateData && subCorporateData['credentialId'] ? subCorporateData['credentialId'] : ''
        data['subCorporateServices'] = subCorporateData && subCorporateData['services'] ? subCorporateData['services'] :  [];
        data['subCorporateEmail'] = subCorporateData && subCorporateData['email'] ? subCorporateData['email'] : ''
        data['subCorporateMobile'] = subCorporateData && subCorporateData['mobileNo'] ? subCorporateData['mobileNo'] : ''
        data['subCorporateName'] = subCorporateData && subCorporateData['name'] ? subCorporateData['name'] : ''
        data['subCorporateRole'] = subCorporateData && subCorporateData['role'] ? subCorporateData['role'] : ''
    }

    return data;
}

const expiryCalculationFn = (expiry) => {
    const match = expiry.match(/^(\d+)([smhd])$/); // Regex to extract value and unit
    if (!match) {
      throw new Error(`Invalid expiry format: ${expiry}`);
    }
  
    const value = parseInt(match[1], 10); // Numeric part
    const unit = match[2]; // Unit part (s, m, h, d)
  
    // Convert to seconds
    switch (unit) {
      case 's': return value; // seconds
      case 'm': return value * 60; // minutes
      case 'h': return value * 60 * 60; // hours
      case 'd': return value * 60 * 60 * 24; // days
      default: throw new Error(`Unsupported time unit: ${unit}`);
    }
  };