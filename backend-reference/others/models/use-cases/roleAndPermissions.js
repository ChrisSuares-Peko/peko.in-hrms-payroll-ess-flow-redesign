const { Op } = require("sequelize");
const asyncHandler = require("../../middlewares/async");
const roleAndPermissions = require("../entities/roleAndPermissions");
const { formattedDateTime } = require("../../utils/formatter");
const { handleSortFields } = require("../../utils/sortHandle");
const systemUser = require('./../entities/systemUser')


//fetching single role
exports.findRole = asyncHandler(async (credentialId) => {
  return await systemUser.findOne({
      where: {
          credentialId
      },
      include: [{
          model: roleAndPermissions,
          attributes: ['roleName']
      }]
  })
})

//create role
exports.createRole = asyncHandler(async (params) => {
  const role = await roleAndPermissions.create(params);
  if (!role) {
    return false;
  }
  return role;
});
exports.findAdminRoles = asyncHandler(async () => {
  return await roleAndPermissions.findAll({
    where: { isAdmin: true },
    attributes: ['id', 'roleName', 'permissions', 'status', 'isAdmin', 'userType'],
  });
});

exports.findAllRolesForSelection = asyncHandler(async (userType) => {
  return await roleAndPermissions.findAll({
    where: { isAdmin: false,userType:userType },
    attributes: [
      ["id", "value"], // Rename id to value
      ["roleName", "label"], // Rename roleName to label
    ],
  });
});

exports.findAllRolesAndCount = asyncHandler(async (params) => {
  let { limit, offset, searchText, sort, sortField } = params;

  const order = handleSortFields(sortField || "createdAt", sort || "DESC");

  const whereClause = {
    isAdmin: false,
  };

  if (searchText) {
    whereClause[Op.or] = [
      {
        roleName: {
          [Op.like]: `%${searchText}%`,
        },
      },
    ];
  }

  const queryOptions = {
    where: whereClause,
    order,
    raw: true,
    nest: true,
  };

  if (limit) queryOptions.limit = limit;
  if (offset !== undefined) queryOptions.offset = offset;

  return await roleAndPermissions.findAndCountAll(queryOptions);
});

exports.rolesAndPermissionsExports = asyncHandler(async (params) => {
  try {
    let { searchText, sort, sortField } = params;

    const order = handleSortFields(sortField || "createdAt", sort || "DESC");

    const whereClause = {
      isAdmin: false,
    };

    if (searchText) {
      whereClause[Op.or] = [
        {
          roleName: {
            [Op.like]: `%${searchText}%`,
          },
        },
      ];
    }

    const data = await roleAndPermissions.findAndCountAll({
      where: whereClause,
      order,
      raw: true,
      nest: true,
    });

    const finalData = data.rows.map(limitData => ({
      Date: limitData.createdAt
        ? formattedDateTime(limitData.createdAt)
        : "Not Available",
      "Role Name": limitData.roleName || "Not Available",
      Status: limitData.status > 0 ? "Active" : "In Active",
    }));

    return finalData;
  } catch (error) {
    console.log(error);
    throw { message: "Something went wrong" };
  }
});

exports.updateRole = asyncHandler(async (roleId, updatedRoleData) => {
  const role = await roleAndPermissions.findByPk(roleId);

  if (!role) {
    return null;
  }

  return await role.update(updatedRoleData);
});

exports.deleteRole = asyncHandler(async (roleId) => {
  const role = await roleAndPermissions.findByPk(roleId);

  if (!role) {
    return null;
  }

  return await role.destroy();
});
exports.findRoleById = asyncHandler(async (params) => {
     return await roleAndPermissions.findOne({
          where: {
               id: params,
          },
          attributes: ['id', 'roleName'],
     })
})
exports.findRoleByName = asyncHandler(async (params) => {
  return await roleAndPermissions.findOne({
    where: {
      roleName:params.userType
    },
    attributes:['id', 'roleName'],
    raw:true
  });
});