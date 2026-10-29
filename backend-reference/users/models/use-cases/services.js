const systemUser = require("./../entities/systemUser");
const { Op } = require('sequelize');
const packageEntity = require("./../entities/package");
const cashback = require("./../entities/cashback");
const serviceOperators = require("./../entities/serviceOperator");
const roleAndPermissions = require("./../entities/roleAndPermissions");
const asyncHandler = require("../../middlewares/async");
const { findPartnerServiceAccess } = require("./partnerServiceAccess");

exports.findService = asyncHandler(async (id) => {
  try {
    const userWithPermissions = await systemUser.findOne({
      where: { credentialId:id },
      attributes: [],
      include: [
        {
          model: roleAndPermissions,
          attributes: ["permissions", "roleName", "isAdmin"],
          required: false,
        },
      ],
      raw: true,
      nest: true,
    });

    if (userWithPermissions?.roleAndPermission?.roleName === 'partner') {
      const partnerServiceAccess = await findPartnerServiceAccess(id);
      if (partnerServiceAccess) {
        userWithPermissions.roleAndPermission.permissions = partnerServiceAccess.permissions;
      }
    }

    return userWithPermissions;
  } catch (error) {
    console.error("Error fetching permissions:", error.message);
    throw error;
  }
});
exports.findCashBackService = asyncHandler(async (params) => {
  
    const { partnerId, serviceProviderIds,accessibleServicesIwthAccessKeys } = params;

    // Fetch the necessary package data
    const allPackageNames = await packageEntity.findAll({
      attributes:['id','packageName','packageType'],
      where: {
        partnerId,
        status: 1,
        type:'1'
      },
      raw: true,
      nest: true
    });

    if (allPackageNames.length === 0) {
      return{ error: "Packages not added" };
    }
    // Extract package names and package IDs
    const packageNames = allPackageNames.map(item => item.packageName);
    const allActivePackageIds = allPackageNames.map(item => item.id);

    // Fetch cashback data based on active packages and service providers
    const cashbackData = await cashback.findAll({
      attributes: ['serviceOperatorId'],
      include: [{
        model: serviceOperators,
        attributes: ['accessKey'],
        required: false
      }, {
        model: packageEntity,
        attributes: ['packageName','packageType'],
        required: false
      }],
      where: {
        packageId: {
          [Op.in]: allActivePackageIds,
        },
        serviceOperatorId: {
          [Op.in]: serviceProviderIds,
        },
        serviceStatus: true,
      },
      raw: true
    });

    if (!cashbackData || cashbackData.length === 0) {
      return { error: "Cashback not added" };
    }

    // Initialize the final result with headers
    let finalResult = [["spId", "serviceName", ...packageNames]];
    accessibleServicesIwthAccessKeys.forEach((item) => {
      const row = [
        item.serviceProviderId, 
        `${item.serviceName}(${item.accessKey})`,
        ...packageNames.map(packageName => {
          // Find the package from allPackageNames based on the packageName
          const packageObj = allPackageNames.find(pkg => pkg.packageName === packageName);
          
          // If packageType is 'INDIVIDUAL', set status as 'None', otherwise 'No'
          if (packageObj && packageObj.packageType === 'INDIVIDUAL') {
            return 'NONE'; // If packageType is 'INDIVIDUAL', set 'None'
          } else {
            return 'NO'; // Otherwise, set 'No'
          }
        })
      ];
      // const row = [item.serviceProviderId, `${item.serviceName}(${item.accessKey})`, ...new Array(packageNames.length).fill("No")];
      finalResult.push(row);
    });

    // Map cashback data to the final result
    const serviceOperatorIdToRow = {};
    finalResult.slice(1).forEach((row) => {
      serviceOperatorIdToRow[row[0]] = row;
    });

    cashbackData.forEach((item) => {
      const row = serviceOperatorIdToRow[item.serviceOperatorId];
      if (row) {
        const packageIndex = packageNames.indexOf(item['package.packageName']) + 2; // Start at index 2 for packages
        row[packageIndex] = "YES";
      }
    });

    // Use a helper function to get final access status
    const finalDataReturn = getServicesAccessStatus(finalResult);

    return finalDataReturn;

 
});

exports.findServiceOperatorsAccessKeys = asyncHandler(async (ids) => {
  
    const serviceOperatorAccessKeys = await serviceOperators.findAll({
        where: { id:{[Op.in]:ids }},
         attributes: ['id','accessKey'], 
         raw: true, 
    });
    return serviceOperatorAccessKeys;
  
});

const getServicesAccessStatus= (data)=>{
  const headers = data[0].slice(2); // From the third element onwards (package names)
  const result = [];
  
  // Iterate over the rows starting from the second one (i.e., skip the header row)
  data.slice(1).forEach(row => {
    const service = {
      serviceName: row[1],  // Extract serviceName
      packageStatus: []     // Initialize an empty array for package statuses
    };
  
    // Create an object for each package status and map each package name to its status
    const packageStatus = {};
    for (let i = 2; i < row.length; i++) {
      const capitalizedHeader = headers[i - 2].charAt(0).toUpperCase() + headers[i - 2].slice(1);
      packageStatus[capitalizedHeader] = row[i];
      // packageStatus[headers[i - 2]] = row[i]; // Map the package name to its status
    }
  
    // Add the packageStatus object to the packageStatus array
    service.packageStatus.push(packageStatus);
  
    // Push the service object to the result
    result.push(service);
  });
  return result
} 