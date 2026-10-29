const asyncHandler = require("../middlewares/async");
const { findService,findCashBackService,findServiceOperatorsAccessKeys } = require("../models/use-cases/services");
const { findOneSubCorporate } = require("../models/use-cases/subCorporateUser");
const { findOneByCredentialId } = require("../models/use-cases/user")
const { activeServiceLabels, listMemberships } = require("../models/use-cases/serviceMembership");
const { findOneCorporate } = require("../models/use-cases/corporateUser");

const { findOnePartnerPermissionData, findPartnerInitialAccessesibleServices, resolveServicePermissionsForSession, updatePartnerInitialAccessesibleServices,findSearchServices, updateSearchServices } = require("../models/use-cases/partnerPermission");
const {
  findExistingGroupPackage,
} = require("../models/use-cases/subscription");
const {
  findAllUserAccessibleAccessKeys,
} = require("../models/use-cases/cashback");
const { findDisableService } = require("../models/use-cases/disableService");
const { loadApprovalGate } = require("../models/use-cases/serviceApproval");
const { applyApprovalGate, filterAccessibleServices } = require("../utils/approvalGate");
const { subscriptionStatusUpdateForCorporate } = require("../utils/subscriptionStatusUpdates");
const { updateInitialServicePermission } = require("../models/use-cases/setting");
const { customLog } = require("../utils/loggerHelper");


exports.accessibleServices = asyncHandler(async (req, res) => {
  try {
    let isMobile = false
    const platform = req.headers["platform"];
    if (req.headers["platform"] && platform === "mobile") {
      isMobile = true;
    }

    const role = req.user.role;
    const userId = req.user.id;

    if (role === 'CORPORATE') {
      const corporateId = req.user.corporateId
      await subscriptionStatusUpdateForCorporate(corporateId)
      const currentSubscription = await findExistingGroupPackage(corporateId)
      const currentPackageId = currentSubscription?.package?.id
      let userAccessibleServices = await findAllUserAccessibleAccessKeys({ userId, corporateId, currentPackageId })

      if (!userAccessibleServices) {
        return res.status(500).json({
          status: false,
          message: 'Failed to fetch services details',
          data: {},
          responseCode: '001'
        });
      }

      let accessibleServices, response;

      // if (req.user.registeredBy) {
      //   response = await findOnePartnerPermissionData(req.user.registeredBy)

      // } else {
      //   // accessibleServices = MOCK_SERVICE
      //   response = await findOnePartnerPermissionData()
      // }
       response = await resolveServicePermissionsForSession(req.user, ["id", "registeredBy", "permissions", "status"]);

      if (!response || !response.status) {
        return res.status(400).json({
          status: false,
          message: 'Account Inactive - Contact administrator for assistance',
          data: {},
          responseCode: '001'
        })
      }

      accessibleServices = response.permissions;

      //fetch disable service

      const disableServices = await findDisableService({ credentialId: req.user.id });
      const disableServiceIds = disableServices.map(service => service.serviceOperatorId);
      // BBPS subservices (Utility/Telecom) identify themselves by accessKey only — no
      // serviceProviderId. Match on accessKey too so admin-driven disables propagate
      // to the sidebar hasAccess flag for those entries.
      const disableAccessKeys = new Set(
        disableServices
          .map(service => service.serviceOperator?.accessKey)
          .filter(Boolean)
      );

      const updateAccess = (services) => {
        services.forEach(service => {
          if (Array.isArray(service.serviceProviderId)) {
            if (service.serviceProviderId.some(id => disableServiceIds.includes(id))) {
              service.hasAccess = false;
            }
          } else if (service.serviceProviderId !== undefined && disableServiceIds.includes(service.serviceProviderId)) {
            service.hasAccess = false;
          }

          if (service.accessKey && disableAccessKeys.has(service.accessKey)) {
            service.hasAccess = false;
          }

          if (service.subServices && service.subServices.length > 0) {
            updateAccess(service.subServices);
          }
        });
      };

      updateAccess(accessibleServices);

      const blockedAccessKeys = await loadApprovalGate(response.id);
      if (blockedAccessKeys) {
        applyApprovalGate(accessibleServices, blockedAccessKeys);
        userAccessibleServices = filterAccessibleServices(userAccessibleServices, accessibleServices, blockedAccessKeys);
      }

      if (isMobile) {
        const flattenList = ["More Services", "Corporate Travel"];
    
        accessibleServices = accessibleServices.flatMap(service => 
            flattenList.includes(service.label) ? service?.subServices : service
        );
      }

      return res.status(200).json({
        status: true,
        message: 'Services Fetched successfully',
        data: { data: accessibleServices, userAccessibleServices, packageName: currentSubscription?.package?.packageName },
        responseCode: '000'
      });

    } else if (role === 'CORPORATE_SUB_USER') {

      const corporateId = req.user.corporateId;
      const userId = req.user.id;

      await subscriptionStatusUpdateForCorporate(corporateId);

      // Enable whatever the sub-corporate has access to, compared against the
      // partner's permissions in DB (the same source used when the access was
      // assigned in userManagement) — never the static sidebar. Each granted service
      // keeps its flat shape (enableMoreService / icon / accessKey) and only its
      // accessible sub-services; the legacy "More Services" umbrella is dropped since
      // its items are now top-level entries carrying `enableMoreService`.
      // Session-aware resolver, matching the CORPORATE branch above and the write path in
      // userManagement: for a referral-linked corporate the raw `registeredBy` lookup
      // resolves a different tree and the intersection below yields an empty sidebar.
      const partnerPermissionData = await resolveServicePermissionsForSession(req.user, ['id', 'permissions']);

      if (!partnerPermissionData || !Array.isArray(partnerPermissionData.permissions) || partnerPermissionData.permissions.length === 0) {
        return res.status(400).json({
          status: false,
          message: 'Account Inactive - Contact administrator for assistance',
          data: {},
          responseCode: '001'
        })
      }

      const partnerPermissions = partnerPermissionData.permissions;
      const blockedAccessKeys = await loadApprovalGate(partnerPermissionData.id);
      if (blockedAccessKeys) applyApprovalGate(partnerPermissions, blockedAccessKeys);
      const subCorporateData = await findOneSubCorporate({ id: req.user.subCorporateId }, ['services', 'role'])
      const allowedServices = new Set(
        (subCorporateData?.services || [])
          .filter(service => service.hasAccess)
          .map(service => service.label)
      );

      let finalServices = partnerPermissions
        .filter(service => allowedServices.has(service.label))
        .map(service => ({
          ...service,
          subServices: service.subServices ? service.subServices.filter(sub => sub.hasAccess) : []
        }));

      // "Need Help" is always available to sub-corporate users regardless of the
      // access configured against their account.
      const NEED_HELP_LABEL = 'Need Help';
      if (!finalServices.some(service => service.label === NEED_HELP_LABEL)) {
        const needHelpService = partnerPermissions.find(service => service.label === NEED_HELP_LABEL);
        finalServices.push(
          needHelpService
            ? {
                ...needHelpService,
                hasAccess: true,
                subServices: needHelpService.subServices
                  ? needHelpService.subServices.filter(sub => sub.hasAccess)
                  : []
              }
            : { label: NEED_HELP_LABEL, hasAccess: true, subServices: [] }
        );
      }

      const isMobile = req.headers['platform'] === 'mobile';

      if (isMobile) {
        finalServices = finalServices.flatMap(service => {
          if (service.label === 'Corporate Travel') {
            return (service.subServices || [])
              .filter(sub => sub.hasAccess)
              .map(sub => ({
                label: sub.label,
                accessKey: sub.accessKey,
                hasAccess: sub.hasAccess,
                ...(sub.serviceProviderId && {
                  serviceProviderId: sub.serviceProviderId
                })
              }));
          }
          return [service];
        });
      }
      const currentSubscription = await findExistingGroupPackage(corporateId);
      const currentPackageId = currentSubscription?.package?.id;

      let userAccessibleServices = await findAllUserAccessibleAccessKeys({
        userId,
        corporateId,
        currentPackageId
      });
      if (userAccessibleServices && blockedAccessKeys) {
        userAccessibleServices = filterAccessibleServices(userAccessibleServices, partnerPermissions, blockedAccessKeys);
      }

      if (!userAccessibleServices) {
        return res.status(500).json({
          status: false,
          message: 'Failed to fetch services details',
          data: {},
          responseCode: '001'
        });
      }

      // Step 5: Return final response
      return res.status(200).json({
        status: true,
        message: 'Services fetched successfully',
        data: {
          data: finalServices,
          userAccessibleServices,
          packageName: currentSubscription?.package?.packageName,
          subCorporateRole: subCorporateData?.role ?? null
        },
        responseCode: '000'
      });
    } else if (role === 'USER') {

      const corporateId = req.user.corporateId
      if (!corporateId) {
        return res.status(400).json({
          status: false,
          message: 'Account Inactive - Contact administrator for assistance',
          data: {},
          responseCode: '001'
        })
      }

      // The partner tree belongs to the EMPLOYER, not the employee. resolveServicePermissionsForSession
      // falls back to a referral code looked up by credentialId, and an employee's own credential owns no
      // corporate row — so it has to be given the corporate's. Passing the employee's resolves an empty tree
      // for any referral-linked or directly-registered corporate, and the employee then sees no services at
      // all: an empty sidebar and an access-denied page on every route.
      const corporateProfile = await findOneCorporate({ id: corporateId }, ['credentialId'])
      const partnerPermissionData = await resolveServicePermissionsForSession(
        { registeredBy: req.user.registeredBy, id: corporateProfile?.credentialId },
        ['id', 'permissions']
      );

      if (!partnerPermissionData || !Array.isArray(partnerPermissionData.permissions) || partnerPermissionData.permissions.length === 0) {
        return res.status(400).json({
          status: false,
          message: 'Account Inactive - Contact administrator for assistance',
          data: {},
          responseCode: '001'
        })
      }

      const partnerPermissions = partnerPermissionData.permissions;
      const blockedAccessKeys = await loadApprovalGate(partnerPermissionData.id);
      if (blockedAccessKeys) applyApprovalGate(partnerPermissions, blockedAccessKeys);
      const essProfile = await findOneByCredentialId(userId, ['userAccessService'])

      if (!essProfile) {
        customLog(req?.LogTraceId, 'error', {
          message: 'Employee sidebar requested for a credential that owns no employee row',
          action: 'users:services:employeeRowMissing',
          credentialId: userId,
          corporateId,
        })
        return res.status(400).json({
          status: false,
          message: 'Account Inactive - Contact administrator for assistance',
          data: {},
          responseCode: '001'
        })
      }

      const allowedServices = new Set(activeServiceLabels(essProfile?.userAccessService));

      let updatedSidebarData = partnerPermissions
        .filter(service => allowedServices.has(service.label))
        .map(service => ({
          ...service,
          subServices: service.subServices ? service.subServices.filter(sub => sub.hasAccess) : []
        }));

      // An employee with no services reaches an access-denied page on every route, and until this log there
      // was nothing to say WHICH side was empty — their own grant, or the employer's partner tree. Both are
      // named here because the answer is always one of them, and they are read from different places.
      if (!updatedSidebarData.length) {
        customLog(req?.LogTraceId, 'error', {
          message: 'Employee resolved to no services — their grant and the partner tree do not intersect',
          action: 'users:services:employeeGrantEmpty',
          credentialId: userId,
          corporateId,
          grantedServices: listMemberships(essProfile?.userAccessService).map(service => `${service.label}=${service.hasAccess}/${service.status}`),
          partnerServices: partnerPermissions.map(service => `${service.label}=${service.hasAccess}`),
        })
      }


      // Subscriptions and disabled services belong to the employer too: the disabled-service lookup inside
      // findAllUserAccessibleAccessKeys keys on credentialId, so it gets the corporate's for the same reason.
      const currentSubscription = await findExistingGroupPackage(corporateId)
      const currentPackageId = currentSubscription?.package?.id
      let userAccessibleServices = await findAllUserAccessibleAccessKeys({
        userId: corporateProfile?.credentialId,
        corporateId,
        currentPackageId
      })
      if (userAccessibleServices && blockedAccessKeys) {
        userAccessibleServices = filterAccessibleServices(userAccessibleServices, partnerPermissions, blockedAccessKeys);
      }

      if (!userAccessibleServices) {
        return res.status(500).json({
          status: false,
          message: 'Failed to fetch services details',
          data: {},
          responseCode: '001'
        });
      }
      if (blockedAccessKeys) {
        userAccessibleServices = filterAccessibleServices(userAccessibleServices, partnerPermissions, blockedAccessKeys);
      }

      if (isMobile) {
        const flattenList = ["More Services", "Corporate Travel"];

        updatedSidebarData = updatedSidebarData.flatMap(service =>
            flattenList.includes(service.label) ? service?.subServices : service
        );
      }

      return res.status(200).json({
        status: true,
        message: 'Services Fetched successfully',
        data: { data: updatedSidebarData, userAccessibleServices, packageName: currentSubscription?.package?.packageName, serviceMemberships: listMemberships(essProfile?.userAccessService) },
        responseCode: '000'
      });
    } else if (role === 'SYSTEM_USER') {
      const userData = await findService(userId)
      return res.status(201).json({
        status: true,
        data: {
          data: userData?.roleAndPermission?.permissions ?? [],
          isAdmin: Boolean(userData?.roleAndPermission?.isAdmin),
        },
        message: 'Services fetched successfully',
        responseCode: '000'
      })
    } else {
      throw new Error("Something went wrong. Please try again")
    }
  } catch (error) {
    return res.status(500).json({
      status: false,
      data: {},
      message: error.message,
      responseCode: '001'
    })
  }
})


exports.fetchInitalCorporateUserConfiguartion = asyncHandler(async (req, res) => {

  const userAccessibleServices = await findPartnerInitialAccessesibleServices(['details'])

  if (!userAccessibleServices) {
    return res.status(500).json({
      status: false,
      message: 'Failed to fetch services details',
      data: {},
      responseCode: '001'
    });
  }

  const searchServicesSetting = await findSearchServices(['details']);
  const searchServices = searchServicesSetting?.details || [];

  const findSearchEntry = (label) => {
    const labelLC = label?.trim().toLowerCase();
    return searchServices.find(entry => entry.name?.trim().toLowerCase() === labelLC);
  };

  // Merge the { name, tags, pathKey } search index into the sidebar tree by matching
  // searchServices.name against each service/sub-service label.
  const sidebarData = (userAccessibleServices.details || []).map(service => {
    const serviceMatch = findSearchEntry(service.label);
    return {
      ...service,
      pathKey: serviceMatch?.pathKey || '',
      tags: serviceMatch?.tags || [],
      subServices: (service.subServices || []).map(sub => {
        const subMatch = findSearchEntry(sub.label);
        return {
          ...sub,
          pathKey: subMatch?.pathKey || '',
          tags: subMatch?.tags || [],
        };
      })
    };
  });

  return res.status(200).json({
    status: true,
    message: 'partner initial services fetched successfully',
    data: { sidebarData },
    responseCode: '000'
  })
})




exports.partnerInitialAccessesibleServices = asyncHandler(async (req, res) => {
  
  const userAccessibleServices = await findPartnerInitialAccessesibleServices()

      if (!userAccessibleServices) {
        return res.status(500).json({
          status: false,
          message: 'Failed to fetch services details',
          data: {},
          responseCode: '001'
        });
      }
      return res.status(200).json({
        status: true,
        message: 'partner initial services fetched successfully',
        data: { sidebarData: userAccessibleServices.details },
        responseCode: '000'
      })
})

// Admin save for the Corporate User Configuration page — persists the edited
// corporate service / sub-service tree into settings.partnerInitialAccessesibleServices.
exports.updatePartnerInitialAccessesibleServicesByApi = asyncHandler(async (req, res) => {
  try {
    const { sidebarData, searchServices = [] } = req.body;

    if (!Array.isArray(sidebarData)) {
      return res.status(400).json({
        status: false,
        message: 'sidebarData must be an array',
        data: {},
        responseCode: '001'
      });
    }
     if (!Array.isArray(searchServices)) {
      return res.status(400).json({
        status: false,
        message: 'searchServices must be an array',
        data: {},
        responseCode: '001'
      });
    }


    await updatePartnerInitialAccessesibleServices(sidebarData);
    await updateSearchServices(searchServices);

    return res.status(200).json({
      status: true,
      message: 'Corporate initial services updated successfully',
      data: { sidebarData, searchServices },
      responseCode: '000'
    });
  } catch (error) {
  
    return res.status(500).json({
      status: false,
      data: {},
      message: error.message,
      responseCode: '001'
    });
  }
})

// Admin save for the "Roles Initial Access" page — persists the edited service /
// sub-service tree into settings.initialServicePermissions.
exports.updateInitialServicePermissions = asyncHandler(async (req, res) => {
  try {
    const { permissions } = req.body;

    if (!Array.isArray(permissions)) {
      return res.status(400).json({
        status: false,
        message: "permissions must be an array",
        data: {},
        responseCode: "001",
      });
    }

    await updateInitialServicePermission(permissions);

    return res.status(200).json({
      status: true,
      message: "Initial service permissions updated successfully",
      data: { permissions },
      responseCode: "000",
    });
  } catch (error) {
    customLog(req.LogTraceId, "error", { ...error, message: error?.message });
    return res.status(500).json({
      status: false,
      data: {},
      message: error.message,
      responseCode: "001",
    });
  }
});


exports.partnerServicesCheckCashBack = asyncHandler(async (req, res) => {
  try {
    const partnerId = req.query.partnerId ==='' ? null: req.query.partnerId
    const response = await findOnePartnerPermissionData(partnerId)
    if (!response) {
      return res.status(500).json({
        status: false,
        message: 'Partner id not found',
        data: {},
        responseCode: '001'
      });
    }
    let accessibleServices = response.permissions;
    const allPartnerServicesAccess= getSerNameID(accessibleServices)
    const serviceProviderIds = getServiceProviderIds(accessibleServices);
    const serOprKeys = await findServiceOperatorsAccessKeys(serviceProviderIds);
    if (serOprKeys.length==0) {
      return res.status(500).json({
        status: false,
        message: "Service Operators not found",
        data: {},
        responseCode: '001'
      });
    }
    const accessibleServicesIwthAccessKeys = allPartnerServicesAccess.map(service => {
      // Find the corresponding item in x based on serviceProviderId and id
      const matchingItem = serOprKeys.find(item => item.id === service.serviceProviderId);
      if (matchingItem) {
        // Add the accessKey to the service object
        service.accessKey = matchingItem.accessKey;
      }
      return service;
    });
    // const cashBackService = await findCashBackService({partnerId,serviceProviderIds,allPartnerServicesAccess})
    const cashBackService = await findCashBackService({partnerId,serviceProviderIds,allPartnerServicesAccess,accessibleServicesIwthAccessKeys})
    if (Object.prototype.hasOwnProperty.call(cashBackService, "error")) {
      return res.status(500).json({
        status: false,
        message: cashBackService.error,
        data: {},
        responseCode: '001'
      });
    }
    return res.status(200).json({
      status: true,
      data: cashBackService ,
      message: 'Services fetched successfully',
      responseCode: '000'
    })

  } catch (error) {
    return res.status(500).json({
      status: false,
      data: {},
      message: error.message,
      responseCode: '001'
    })
  }
})

const getSerNameID = (data) => {
  if (!Array.isArray(data)) {
    return [];
  }
  const result = [];

  data.forEach((service) => {
    if (!service?.hasAccess) {
      return;
    }

    const hasSubServices = Array.isArray(service.services) && service.services.length > 0;

    if (hasSubServices) {
      service.services.forEach((subService) => {

        if (!subService?.hasAccess) {
          return;
        }

        if (!subService?.serviceProviderId) {
          return;
        }

        const ids = Array.isArray(subService.serviceProviderId)
          ? subService.serviceProviderId
          : [subService.serviceProviderId];

        if (ids.length === 0) {
          console.log('Empty serviceProviderId array');
        }

        ids.forEach((id) => {
          result.push({
            serviceProviderId: id,
            serviceName: subService.label,
          });
        });

      });
    }

    else {
      if (!service?.serviceProviderId) {
        return;
      }

      const ids = Array.isArray(service.serviceProviderId)
        ? service.serviceProviderId
        : [service.serviceProviderId];

      ids.forEach((id) => {
        result.push({
          serviceProviderId: id,
          serviceName: service.label,
        });
      });
    }
  });
  return result
}

function getServiceProviderIds(services) {
  let serviceProviderIds = [];

  services.forEach(service => {
      if (service.hasAccess) {
          // If serviceProviderId exists, handle both single values and arrays
          if (Array.isArray(service.serviceProviderId)) {
              serviceProviderIds = serviceProviderIds.concat(service.serviceProviderId);  // Flatten the array
          } else if (service.serviceProviderId) {
              serviceProviderIds.push(service.serviceProviderId);
          }
      }
      // If there are subServices, recursively process them
      if (service.services && service.services.length > 0) {
          serviceProviderIds = serviceProviderIds.concat(getServiceProviderIds(service.services));
      }
  });

  return serviceProviderIds;
}

// exports.partnerInitialAccessesibleServices = asyncHandler(async (req, res) => {
//   const MOCK_SERVICE = [
//     {
//       label: "Dashboard",
//       hasAccess: true,
//       services: [],
//     },
//     {
//       label: "Mobile Recharge",
//       hasAccess: false,
//       services: [
//         {
//           label: "Prepaid",
//           hasAccess: true,
//         },
//         {
//           label: "Postpaid",
//           hasAccess: true,
//         },
//       ],
//     },
//     {
//       label: "Bill Payments",
//       hasAccess: false,
//       services: [
//         {
//           label: "Electricity",
//           hasAccess: true,
//         },
//         {
//           label: "Broadband",
//           hasAccess: true,
//         },
//         {
//           label: "LPG Cylinder",
//           hasAccess: true,
//         },
//         {
//           label: "Water",
//           hasAccess: true,
//         },
//         {
//           label: "Landline Bill",
//           hasAccess: true,
//         },
//         {
//           label: "Piped Gas",
//           hasAccess: true,
//         },
//         {
//           label: "Education Fee",
//           hasAccess: true,
//         },
//       ],
//     },
//     {
//       label: "Corporate Travel",
//       hasAccess: false,
//       services: [
//         {
//           label: "Airline",
//           hasAccess: true,
//         },
//         {
//           label: "Hotels",
//           hasAccess: true,
//         },
//       ],
//     },
//     {
//       label: "Gift Cards",
//       hasAccess: false,
//       services: [],
//     },
//     {
//       label: "Office Supplies",
//       hasAccess: false,
//       services: [],
//     },
//     {
//       label: "More Services",
//       hasAccess: false,
//       services: [
//         {
//           label: "Document Attestation",
//           hasAccess: true,
//         },
//         {
//           label: "Business Docs",
//           hasAccess: true,
//         },
//         {
//           label: "Office Address",
//           hasAccess: true,
//         },
//         {
//           label: "Payment Links",
//           hasAccess: true,
//         },
//         {
//           label: "zero Carbon",
//           hasAccess: true,
//         },
//         {
//           label: "Soundbox",
//           hasAccess: true,
//         },
//         {
//           label: "Paytm BPOS",
//           hasAccess: true,
//         },
//         {
//           label: "Marketplace",
//           hasAccess: true,
//         },
//       ],
//     },
//     {
//       label: "Marketplace",
//       hasAccess: false,
//       services: [],
//     },
//     {
//       label: "Logistics",
//       hasAccess: false,
//       services: [],
//     },
//     {
//       label: "Subscriptions",
//       hasAccess: false,
//       services: [],
//     },
//     {
//       label: "Peko Cloud",
//       hasAccess: false,
//       services: [],
//     },
//     // {
//     //   label: "Payroll",
//     //   hasAccess: true,
//     //   services: [],
//     // },
//     // {
//     //   label: "Accounting & Tax",
//     //   hasAccess: true,
//     //   services: [],
//     // },
//     // {
//     //   label: "Works",
//     //   hasAccess: true,
//     //   services: [],
//     // },
//     {
//       label: "Invoicing",
//       hasAccess: false,
//       services: [],
//     },
//     {
//       label: "ZeroCarbon",
//       hasAccess: false,
//       services: [],
//     },
//     {
//       label: "Reports",
//       hasAccess: false,
//       services: [
//         {
//           label: "Transactions",
//           hasAccess: true,
//         },
//         {
//           label: "Cashbacks",
//           hasAccess: true,
//         },
//         {
//           label: "Report Scheduling",
//           hasAccess: true,
//         },
//       ],
//     },
//     {
//       label: "Need Help",
//       hasAccess: false,
//       services: [
//         {
//           label: "Contact Us",
//           hasAccess: true,
//         },
//         {
//           label: "Tickets",
//           hasAccess: true,
//         },
//       ],
//     },
//     {
//       label: "Settings",
//       hasAccess: false,
//       services: [
//         {
//           label: "User Management",
//           serviceType: "",
//           hasAccess: true,
//         },
//         {
//           label: "Billings & Saved Cards",
//           serviceType: "",
//           hasAccess: true,
//         },
//         {
//           label: "Subscription Plans",
//           serviceType: "",
//           hasAccess: true,
//         },
//          {
//           "label": "Security",
//           "serviceType": "",
//           "hasAccess": true
//         },
//         // {
//         //   "label": "Referrals",
//         //   "serviceType": "",
//         //   "hasAccess": false
//         // },
//         // {
//         //   "label": "Integrations",
//         //   "serviceType": "",
//         //   "hasAccess": false
//         // }
//       ],
//     },
//     // {
//     //   label: "Vendor Payouts",
//     //   hasAccess: true,
//     //   services: [],
//     // },
//     // {
//     //   label: "Insurance",
//     //   hasAccess: true,
//     //   services: [],
//     // },
//     // {
//     //   label: "Corporate Card",
//     //   hasAccess: true,
//     //   services: [],
//     // },
//   ];

//   return res.status(200).json({
//     status: true,
//     message: 'partner initial services fetched successfully',
//     data: {sidebarData:MOCK_SERVICE},
//     responseCode: '000'
//   })
// })

// exports.accessibleServices = asyncHandler(async (req, res) => {
//   try {
//     const role = req.user.role;
//     const userId = req.user.id;

//     if (role === 'CORPORATE') {
//       // const services = await findAllServiceOperator();

//       // if (!services) {
//       //   return next(new ErrorResponse(`Services not found`, 404));
//       // }


//       // const serviceCategories = [...new Set(services.map(service => service.serviceCategory))];

//       // const groupedServices = serviceCategories.map(category => {
//       //   const categoryServices = services.filter(service => service.serviceCategory === category);

//       //   const serviceProviderNames = categoryServices.map(service => ({
//       //     serviceProvider: service.serviceProvider,
//       //     serviceType: service.serviceType,
//       //     hasAccess: true
//       //   }));

//       //   return {
//       //     serviceCategory: category,
//       //     hasAccess: true,
//       //     services: serviceProviderNames
//       //   };
//       // });

//       const MOCK_SERVICE = [
//         {
//           label: "Dashboard",
//           hasAccess: true,
//           services: [],
//         },
//         {
//           label: "Mobile Recharge",
//           hasAccess: true,
//           services: [
//             {
//               label: "Prepaid",
//               hasAccess: true,
//             },
//             {
//               label: "Postpaid",
//               hasAccess: true,
//             },
//           ],
//         },
//         {
//           label: "Bill Payments",
//           hasAccess: true,
//           services: [
//             {
//               label: "Electricity",
//               hasAccess: true,
//             },
//             {
//               label: "Broadband",
//               hasAccess: true,
//             },
//             {
//               label: "LPG Cylinder",
//               hasAccess: true,
//             },
//             {
//               label: "Water",
//               hasAccess: true,
//             },
//             {
//               label: "Landline Bill",
//               hasAccess: true,
//             },
//             {
//               label: "Piped Gas",
//               hasAccess: true,
//             },
//             {
//               label: "Education Fee",
//               hasAccess: true,
//             },
//           ],
//         },
//         {
//           label: "Corporate Travel",
//           hasAccess: true,
//           services: [
//             {
//               label: "Airline",
//               hasAccess: true,
//             },
//             {
//               label: "Hotels",
//               hasAccess: true,
//             },
//           ],
//         },
//         {
//           label: "Gift Cards",
//           hasAccess: true,
//           services: [],
//         },
//         {
//           label: "Office Supplies",
//           hasAccess: true,
//           services: [],
//         },
//         {
//           label: "More Services",
//           hasAccess: true,
//           services: [
//             {
//               label: "Document Attestation",
//               hasAccess: true,
//             },
//             {
//               label: "Business Docs",
//               hasAccess: true,
//             },
//             {
//               label: "Office Address",
//               hasAccess: true,
//             },
//             {
//               label: "Payment Links",
//               hasAccess: true,
//             },
//             {
//               label: "zero Carbon",
//               hasAccess: true,
//             },
//             {
//               label: "Soundbox",
//               hasAccess: true,
//             },
//             {
//               label: "Paytm BPOS",
//               hasAccess: true,
//             },
//             {
//               label: "Marketplace",
//               hasAccess: true,
//             },
//           ],
//         },
//         {
//           label: "Marketplace",
//           hasAccess: true,
//           services: [],
//         },
//         {
//           label: "Logistics",
//           hasAccess: true,
//           services: [],
//         },
//         {
//           label: "Subscriptions",
//           hasAccess: true,
//           services: [],
//         },
//         {
//           label: "Peko Cloud",
//           hasAccess: true,
//           services: [],
//         },
//         // {
//         //   label: "Payroll",
//         //   hasAccess: true,
//         //   services: [],
//         // },
//         // {
//         //   label: "Accounting & Tax",
//         //   hasAccess: true,
//         //   services: [],
//         // },
//         // {
//         //   label: "Works",
//         //   hasAccess: true,
//         //   services: [],
//         // },
//         {
//           label: "Invoicing",
//           hasAccess: true,
//           services: [],
//         },
//         {
//           label: "ZeroCarbon",
//           hasAccess: true,
//           services: [],
//         },
//         {
//           label: "Reports",
//           hasAccess: true,
//           services: [
//             {
//               label: "Transactions",
//               hasAccess: true,
//             },
//             {
//               label: "Cashbacks",
//               hasAccess: true,
//             },
//             {
//               label: "Report Scheduling",
//               hasAccess: true,
//             },
//           ],
//         },
//         {
//           label: "Need Help",
//           hasAccess: true,
//           services: [
//             {
//               label: "Contact Us",
//               hasAccess: true,
//             },
//             {
//               label: "Tickets",
//               hasAccess: true,
//             },
//           ],
//         },
//         {
//           label: "Settings",
//           hasAccess: true,
//           services: [
//             {
//               label: "User Management",
//               serviceType: "",
//               hasAccess: true,
//             },
//             {
//               label: "Billings & Saved Cards",
//               serviceType: "",
//               hasAccess: true,
//             },
//             {
//               label: "Subscription Plans",
//               serviceType: "",
//               hasAccess: true,
//             },
//              {
//               "label": "Security",
//               "serviceType": "",
//               "hasAccess": true
//             },
//             // {
//             //   "label": "Referrals",
//             //   "serviceType": "",
//             //   "hasAccess": false
//             // },
//             // {
//             //   "label": "Integrations",
//             //   "serviceType": "",
//             //   "hasAccess": false
//             // }
//           ],
//         },
//         // {
//         //   label: "Vendor Payouts",
//         //   hasAccess: true,
//         //   services: [],
//         // },
//         // {
//         //   label: "Insurance",
//         //   hasAccess: true,
//         //   services: [],
//         // },
//         // {
//         //   label: "Corporate Card",
//         //   hasAccess: true,
//         //   services: [],
//         // },
//       ];


//       const corporateId = req.user.corporateId
//       const currentSubscription = await findExistingGroupPackage(corporateId)
//       const currentPackageId = currentSubscription?.package?.id
//       const userAccessibleServices = await findAllUserAccessibleAccessKeys({ userId, corporateId, currentPackageId })

//       if (!userAccessibleServices) {
//         return res.status(500).json({
//           status: false,
//           message: 'Failed to fetch services details',
//           data: {},
//           responseCode: '001'
//         });
//       }

//       let accessibleServices;

//       if (req.user.registeredBy) {
//         const response = await findOnePartnerPermissionData(req.user.registeredBy)
//         accessibleServices = response.permissions;

//         if (!response || !response.status) {
//           return res.status(400).json({
//             status: false,
//             message: 'Account Inactive - Contact administrator for assistance',
//             data: {},
//             responseCode: '001'
//           })
//         }
//       } else {
//         accessibleServices = MOCK_SERVICE
//       }



//       return res.status(200).json({
//         status: true,
//         message: 'Services Fetched successfully',
//         data: { data: accessibleServices, userAccessibleServices, packageName: currentSubscription?.package?.packageName },
//         responseCode: '000'
//       });

//     } else if (role === 'CORPORATE_SUB_USER') {

//       const subCorporateData = await findOneSubCorporate({ id: req.user.subCorporateId }, ['services', 'role'])
//       const accessMap = subCorporateData.services.reduce((acc, service) => {
//         acc[service.label] = service.hasAccess;
//         return acc;
//       }, {});

//       const updatedSidebarData = sidebarData.map(service => {
//         let parentAccess = accessMap[service.label] ?? service.hasAccess;
//         let updatedSubServices = service.subServices.map(subService => ({
//           ...subService,
//           hasAccess: parentAccess
//         }));

//         if (service.label === 'More Services') {
//           updatedSubServices = service.subServices.map(subService => ({
//             ...subService,
//             hasAccess: accessMap[subService.label] ?? subService.hasAccess
//           }));
//           parentAccess = updatedSubServices.some(subService => subService.hasAccess);
//         }

//         return {
//           ...service,
//           hasAccess: parentAccess,
//           subServices: updatedSubServices
//         };
//       });

//       const corporateId = req.user.corporateId
//       const currentSubscription = await findExistingGroupPackage(corporateId)
//       const currentPackageId = currentSubscription?.package?.id
//       const userAccessibleServices = await findAllUserAccessibleAccessKeys({ userId, corporateId, currentPackageId })

//       if (!userAccessibleServices) {
//         return res.status(500).json({
//           status: false,
//           message: 'Failed to fetch services details',
//           data: {},
//           responseCode: '001'
//         });
//       }

//       return res.status(200).json({
//         status: true,
//         message: 'Services Fetched successfully',
//         data: { data: updatedSidebarData, userAccessibleServices, packageName: currentSubscription?.package?.packageName, subCorporateRole: subCorporateData?.role ?? null },
//         responseCode: '000'
//       });
//     } else if (role === 'SYSTEM_USER') {
//       const services = await findService(userId);

//       return res.status(201).json({
//         status: true,
//         data: { data: services },
//         message: "Services fetched successfully",
//         responseCode: "000",
//       });
//     }
//   } catch (error) {
//     return res.status(500).json({
//       status: false,
//       data: {},
//       message: error.message,
//       responseCode: '001'
//     })
//   }
// })

//For Instant use
exports.accessibleMockService = asyncHandler(async (req, res) => {
  try {
    const role = req.user.role;
    const userId = req.user.id;

    if (role === "CORPORATE") {
      const MOCK_SERVICE = [
        {
          label: "Dashboard",
          hasAccess: true,
          services: [],
        },
        {
          label: "Mobile Recharges & Bills",
          hasAccess: true,
          services: [
            {
              label: "Prepaid",
              hasAccess: true,
            },
            {
              label: "Postpaid",
              hasAccess: true,
            },
          ],
        },
        {
          label: "Utility Payments",
          hasAccess: true,
          services: [
            {
              label: "Electricity",
              hasAccess: true,
            },
            {
              label: "Broadband",
              hasAccess: true,
            },
            {
              label: "LPG Cylinder",
              hasAccess: true,
            },
            {
              label: "Water",
              hasAccess: true,
            },
            {
              label: "Landline Bill",
              hasAccess: true,
            },
            {
              label: "Piped Gas",
              hasAccess: true,
            },
            {
              label: "Education Fee",
              hasAccess: true,
            },
          ],
        },
        {
          label: "Corporate Travel",
          hasAccess: true,
          services: [
            {
              label: "Airline",
              hasAccess: true,
            },
            {
              label: "Hotels",
              hasAccess: true,
            },
          ],
        },
        {
          label: "Gift Cards",
          hasAccess: true,
          services: [],
        },
        {
          label: "Office Supplies",
          hasAccess: true,
          services: [],
        },
        {
          label: "Works",
          hasAccess: true,
          services: [],
        },
        {
          label: "Invoicing",
          hasAccess: true,
          services: [],
        },
        {
          label: "Accounting & Tax",
          hasAccess: true,
          services: [],
        },
        {
          label: "More Services",
          hasAccess: true,
          services: [
            {
              label: "Document Attestation",
              hasAccess: true,
            },
            {
              label: "Business Docs",
              hasAccess: true,
            },
            {
              label: "Office Address",
              hasAccess: true,
            },
            {
              label: "Payment Links",
              hasAccess: true,
            },
            {
              label: "zero Carbon",
              hasAccess: true,
            },
            {
              label: "Soundbox",
              hasAccess: true,
            },
            {
              label: "Paytm BPOS",
              hasAccess: true,
            },
            {
              label: "Marketplace",
              hasAccess: true,
            },
          ],
        },
        {
          label: "Logistics",
          hasAccess: true,
          services: [],
        },
        {
          label: "Subscriptions",
          hasAccess: true,
          services: [],
        },
        {
          label: "Peko Cloud",
          hasAccess: true,
          services: [],
        },
        {
          label: "Payroll",
          hasAccess: true,
          services: [],
        },
        {
          label: "ZeroCarbon",
          hasAccess: true,
          services: [],
        },
        {
          label: "Reports",
          hasAccess: true,
          services: [
            {
              label: "Transactions",
              hasAccess: true,
            },
            {
              label: "Cashbacks",
              hasAccess: true,
            },
            {
              label: "Report Scheduling",
              hasAccess: true,
            },
          ],
        },
        {
          label: "Need Help",
          hasAccess: true,
          services: [
            {
              label: "Contact Us",
              hasAccess: true,
            },
            {
              label: "Tickets",
              hasAccess: true,
            },
          ],
        },
        {
          label: "Settings",
          hasAccess: true,
          services: [
            {
              label: "User Management",
              serviceType: "",
              hasAccess: false,
            },
            {
              label: "Billings & Saved Cards",
              serviceType: "",
              hasAccess: true,
            },
            {
              label: "Subscription Plans",
              serviceType: "",
              hasAccess: true,
            },
            {
              label: "Referrals",
              serviceType: "",
              hasAccess: false,
            },
            {
              label: "Integrations",
              serviceType: "",
              hasAccess: false,
            },
          ],
        },
        {
          label: "Vendor Payouts",
          hasAccess: true,
          services: [],
        },
        {
          label: "Insurance",
          hasAccess: true,
          services: [],
        },
        {
          label: "Corporate Card",
          hasAccess: true,
          services: [],
        },
      ];
      const corporateId = req.user.corporateId;
      const currentSubscription = await findExistingGroupPackage(corporateId);
      const currentPackageId = currentSubscription?.package?.id;
      const userAccessibleServices = await findAllUserAccessibleAccessKeys({
        userId,
        corporateId,
        currentPackageId,
      });

      if (!userAccessibleServices) {
        return res.status(400).json({
          status: false,
          message: "Failed to fetch services details",
          data: {},
          responseCode: "001",
        });
      }

      res.status(200).json({
        status: true,
        message: "Services Fetched successfully",
        data: {
          data: MOCK_SERVICE,
          userAccessibleServices,
          packageName: currentSubscription?.package?.packageName,
        },
        responseCode: "000",
      });
    } else if (role === "SYSTEM_USER") {
      const services = await findService(userId);

      return res.status(201).json({
        status: true,
        data: { data: services },
        message: "Services fetched successfully",
        responseCode: "000",
      });
    }
  } catch (error) {
    return res.status(500).json({
      status: false,
      data: {},
      message: error.message,
      responseCode: "001",
    });
  }
});

// const MOCK_SERVICE = [
//   {
//     label: "Dashboard",
//     hasAccess: true,
//     services: []
//   },
//   {
//     label: "Users",
//     hasAccess: true,
//     services: [
//       {
//         service: "Corporate Users",
//         hasAccess: true
//       },
//       {
//         service: "System Users",
//         hasAccess: true
//       },
//       {
//         service: "Roles",
//         hasAccess: true
//       },
//     ]
//   },
//   {
//     label: "Accounts",
//     hasAccess: true,
//     services: [
//       {
//         service: "Self Transfer",
//         hasAccess: true
//       },
//       {
//         service: "Transfer Funds",
//         hasAccess: true
//       },
//       {
//         service: "Create Transaction",
//         hasAccess: true
//       },
//       {
//         service: "Wallet Reports",
//         hasAccess: true
//       },
//     ]
//   },
//   {
//     label: "Need Help",
//     hasAccess: true,
//     services: []
//   },
//   {
//     label: "Reports",
//     hasAccess: true,
//     services: [
//       {
//         service: "Vendors",
//         hasAccess: true
//       },
//       {
//         service: "Corporate",
//         hasAccess: true
//       },
//       {
//         service: "Connection Requests",
//         hasAccess: true
//       },
//       {
//         service: "Invoices",
//         hasAccess: true
//       },
//       {
//         service: "Workspace Orders",
//         hasAccess: true
//       },
//       {
//         service: "Visa Applications",
//         hasAccess: true
//       },
//       {
//         service: "Attestations",
//         hasAccess: true
//       },
//       {
//         service: "Subscription Orders",
//         hasAccess: true
//       },
//       {
//         service: "Transactions",
//         hasAccess: true
//       },
//       {
//         service: "Orders",
//         hasAccess: true
//       },
//       {
//         service: "Esim",
//         hasAccess: true
//       },
//     ]
//   },
//   {
//     label: "Office Supplies",
//     hasAccess: true,
//     services: [
//       {
//         service: "Orders",
//         hasAccess: true
//       },
//       {
//         service: "Cancel & Refunds",
//         hasAccess: true
//       },
//       {
//         service: "Return Request",
//         hasAccess: true
//       },
//       {
//         service: "Categories",
//         hasAccess: true
//       },
//       {
//         service: "Products",
//         hasAccess: true
//       },
//       {
//         service: "Vendors",
//         hasAccess: true
//       },
//     ]
//   },
//   {
//     label: "Announcements",
//     hasAccess: true,
//     services: [
//       {
//         service: "Notifications",
//         hasAccess: true
//       }
//     ]
//   },
//   {
//     label: "Settings",
//     hasAccess: true,
//     services: [
//       {
//         service: "Access Code",
//         hasAccess: true
//       },
//       {
//         service: "Banners",
//         hasAccess: true
//       },
//       {
//         service: "Cashback",
//         hasAccess: true
//       },
//       {
//         service: "Categories",
//         hasAccess: true
//       },
//       {
//         service: "Voucher",
//         hasAccess: true
//       },
//       {
//         service: "Plans",
//         hasAccess: true
//       },
//       {
//         service: "Referral Code",
//         hasAccess: true
//       }

//     ],
//   },
//   {
//     label: "Manage",
//     hasAccess: true,
//     services: [
//       {
//         service: "Disable Service",
//         hasAccess: true
//       },
//       {
//         service: "E-Docs",
//         hasAccess: true
//       },
//       {
//         service: "Gift Cards",
//         hasAccess: true
//       },
//       {
//         service: "Packages",
//         hasAccess: true
//       },
//       {
//         service: "Peko Connect",
//         hasAccess: true
//       },
//       {
//         service: "Product",
//         hasAccess: true
//       },
//       {
//         service: "Service Operator",
//         hasAccess: true
//       },
//       {
//         service: "Vendors",
//         hasAccess: true
//       },
//       {
//         service: "Software Products",
//         hasAccess: true
//       },
//       {
//         service: "Workspace",
//         hasAccess: true
//       },
//       {
//         service: "Software Plans",
//         hasAccess: true
//       }
//     ]
//   },

//   {
//     label: "Profile",
//     hasAccess: true,
//     services: [],
//   },
// ]
