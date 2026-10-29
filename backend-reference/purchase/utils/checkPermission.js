const systemUser = require('./../models/entities/systemUser');
const roleAndPermissions = require('./../models/entities/roleAndPermissions');
const asyncHandler = require("./../middlewares/async");
const ErrorResponse = require('./error-response');

exports.checkPermission = (serviceName, typeAccess, subCategory) => {
  return asyncHandler(async (req, res, next) => {
    const userId = req.user.id
    try {
      const userWithPermissions = await systemUser.findOne({
        where: { credentialId: userId },
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

      const permissions = userWithPermissions?.roleAndPermission?.permissions;
      if (!Array.isArray(permissions)) {
        return next(new ErrorResponse('Permission denied', 403));
      }

      const serviceAccess = await findRolesService(permissions, serviceName, subCategory)
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
        return next(new ErrorResponse('Permission denied', 403))
      }
      else {
        return next(new ErrorResponse('Permission denied', 403))
      }
    } catch (error) {
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
                foundService = service;
                return foundService;
              }
            }
          }
        }
      }
    }
  }
  return foundService;
};
