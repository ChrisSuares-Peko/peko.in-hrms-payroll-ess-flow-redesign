const systemUser = require('./../models/entities/systemUser');
const roleAndPermissions = require('./../models/entities/roleAndPermissions');
const asyncHandler = require("./../middlewares/async");
const ErrorResponse = require('./error-response');
const { resolveSessionUser } = require('./jwtToken');

exports.checkPermission = (serviceName, typeAccess, subCategory) => {
  return asyncHandler(async (req, res, next) => {
    const arrwithoutuserid=['Corporate Users'];
 
    if (arrwithoutuserid.includes(serviceName))
    {
      req.user = await resolveSessionUser(req)
      if (!req.user) {
        return res.status(401).json({
          status: false,
          message: 'Session expired or invalid',
          data: {},
          responseCode: '002'
        })
      }
    }
     
    const userId = req.user.id
    try {
      const userWithPermissions = await systemUser.findOne({
        where: { credentialId: userId }, // Consider making credentialId dynamic
        attributes: [],
        include: [
          {
            model: roleAndPermissions,
            attributes: ['permissions'],
            required: false,
          },
        ],
        raw: true,
        nest: true,
      });
      const serviceAccess = await findRolesService(userWithPermissions['roleAndPermission']['permissions'], serviceName, subCategory)
      if (serviceAccess?.service === serviceName) {
        let serviceAccessFound = false;
        if (typeAccess === 'hasAccess') {
          if (serviceAccess?.hasAccess === true) {
            serviceAccessFound = true;
          }
        }
        else if (typeAccess === 'update') {
          if (serviceAccess?.update === true) {
            serviceAccessFound = true;
          }
        }
        else if (typeAccess === 'write') {
          if (serviceAccess?.write === true) {
            serviceAccessFound = true;
          }
        }
        if (serviceAccessFound) {
          return next();
        }
        return next(new ErrorResponse('Permission denied',403))
       // return res.status(403).json({ message: 'Permission denied' });
        // Proceed to the next middleware or route handler if permission is granted          
      }
      else {
        // Deny access or handle the error if permission is not granted
       // return res.status(403).json({ message: 'Permission denied' });
       return next(new ErrorResponse('Permission denied',403))
      }
    } catch (error) {
      // Handle potential errors during database query
      console.error("Error checking permissions:", error);
      return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
  });
};

const findRolesService = async (data, serviceName, subCategory) => {
  let foundService = null;
  for (let i = 0; i < data.length; i++) {
    if (data[i].services && Array.isArray(data[i].services)) {
      const serviceCategoryName = data[i].serviceCategory;
      for (let j = 0; j < data[i].services.length; j++) {
        const serviceCategory = data[i].services[j];
        if (serviceCategory.services && Array.isArray(serviceCategory.services)) {
          for (let k = 0; k < serviceCategory.services.length; k++) {
            const service = serviceCategory.services[k];
            if (service.service === serviceName) {
              if (!subCategory || subCategory === serviceCategoryName) {
                foundService = service; // Save the service instead of directly calling setAccessPermission
                return foundService; // Return the found service
              }
            }
          }
        }
      }
    }
  }
  return foundService; // Return null if not found
};