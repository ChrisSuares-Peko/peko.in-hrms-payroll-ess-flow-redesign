const asyncHandler = require("../../../middlewares/async");
const cloud_employees = require("../../entities/pekoCloud/cloud_employees");
const { Op } = require("sequelize");
const cloud_assets = require("../../entities/pekoCloud/cloud_assets");
const cloud_fleets = require("../../entities/pekoCloud/cloud_fleets");
const cloud_subscriptions = require("../../entities/pekoCloud/cloud_subscriptions");
const { findMaximumUsageLimit } = require("../subscription");
const ErrorResponse = require("../../../utils/error-response");
const cloud_usageHistories = require("../../entities/pekoCloud/cloud_usageHistories");
const { uploadFile, deleteFile } = require("../../../utils/commonUploadFile");
const accessKey = 'pekoCloud'

exports.createEmployee = asyncHandler(async (data, user) => {
  try {
    //checking email already exist
    const existingEmployee = await cloud_employees.findOne({
      where: {
        [Op.or]: [
          { employeeEmail: data.employeeEmail, credentialId: data.credentialId, },
          { employeeID: data.employeeID, credentialId: data.credentialId, },
        ],
      },
    });

  if (existingEmployee) {
    return {
      success: false,
      data:existingEmployee,
      error: "Employee with this email id or employee id already exists",
    };
  }
  let filePath;
  if (user?.role === 'CORPORATE_SUB_USER' && user?.subCorporateId) {
    filePath = `corporate/${user?.username ? user?.username : "unknown-user"}/peko-cloud/sub-user/${user?.subCorporateUsername ? user?.subCorporateUsername : "unknown-user"}`
    data.subCorporateUserId = user?.subCorporateId
  } else {
    filePath = `${user?.role ? user?.role.toLowerCase() : "unknown-role"}/${user?.username ? user?.username : "unknown-user"}/peko-cloud`
  }
  if (
    Object.prototype.hasOwnProperty.call(data, "profileImageBase") &&
    data.profileImageFormat
  ) {
    const maximumStorageAccess = await findMaximumUsageLimit({ corporateId: user.corporateId, accessKey: accessKey })
    const publicUrl = await uploadFile(
      data.profileImageBase,
      filePath,
      data.profileImageFormat,
      maximumStorageAccess
    );
    data.profilePicture = publicUrl;
  }

    const responseData = await cloud_employees.create(data);
    if (!responseData) {
      return { success: false, error: "Failed to create employee." };
    }
    return { success: true, data: responseData };
  } catch (error) {
    console.log(error);
    return new ErrorResponse("Something went wrong, please try again later.", 500);
  }
});

exports.findAllEmployees = async (
  page,
  itemsPerPage,
  sortField,
  sort,
  searchText,
  credentialId,
  subCorporateUserId
) => {
  try {
    const offset = (page - 1) * itemsPerPage;

    let whereClause = {};
    if (searchText) {
      whereClause = {
        [Op.or]: [
          { employeeName: { [Op.like]: `%${searchText}%` } },
          { employeeID: { [Op.like]: `%${searchText}%` } },
          { employeeEmail: { [Op.like]: `%${searchText}%` } },
        ],
      };
    }
    if (credentialId) {
      whereClause.credentialId = credentialId;
    }

    if (subCorporateUserId) {
      whereClause.subCorporateUserId = subCorporateUserId;
      delete whereClause.credentialId;
    }

    const employeesData = await cloud_employees.findAll({
      limit: itemsPerPage,
      offset: offset,
      order: [[sortField, sort]],
      where: whereClause,
    });
    const assetsData = await cloud_assets.findAll({
      where: { credentialId },
      attributes: [
        "id",
        "assetName",
        "assetCategory",
        "serialNumber",
        "purchasedDate",
        "assetType",
        "amount",
        "amountRecurring",
        "cloudEmployeeId",
      ],
    });
    const fleetData = await cloud_fleets.findAll({
      where: { credentialId },
      attributes: [
        "id",
        "vehicleName",
        "vehicleType",
        "vehicleNumber",
        "purchasedDate",
        "dateOfRenewal",
        "amount",
        "amountRecurring",
        "cloudEmployeeId",
      ],
    });
    const subscriptionsData = await cloud_subscriptions.findAll({
      where: { credentialId },
    });

    let employeesList = [];

    employeesData.forEach((employee) => {
      const employeeAssets = assetsData.filter(
        (asset) => asset.cloudEmployeeId === employee.id
      );
      const employeeFleet = fleetData.filter(
        (fleet) => fleet.cloudEmployeeId === employee.id
      );

      let employeeSubscriptions = [];
      let employeeSpent = 0;
      subscriptionsData.forEach((subscription) => {
        const isAssigned = subscription.assignTo.find(
          (assign) => assign.id == employee.id
        );
        if (isAssigned) {
          employeeSubscriptions.push(subscription);
          if (subscription.currency == "USD") {
            employeeSpent +=
              Number(
                Number(subscription.amount) *
                Number(process.env.USD_TO_INR ?? "1")
              );
          } else {
            employeeSpent +=
              Number(subscription.amount);
          }
        }
      });

      employeeAssets.forEach((asset) => {
        employeeSpent += Number(asset.amount);
      });
      employeeFleet.forEach((fleet) => {
        employeeSpent += Number(fleet.amount);
      });

      let assetsAndFleet = [...employeeAssets, ...employeeFleet];

      employeesList.push({
        ...employee.dataValues,
        assetsAndFleet: assetsAndFleet,
        subscriptions: employeeSubscriptions,
        totalSpent: employeeSpent,
      });
    });
    return {
      success: true,
      data: { result: employeesList, totalData: employeesList.length },
    };
  } catch (error) {
    console.log(error);
    return new ErrorResponse("Something went wrong, please try again later.", 500);
  }
};

exports.findAllEmployeesList = async (credentialId, subCorporateUserId) => {
  try {
    let whereClause = {};
    if (credentialId) {
      whereClause.credentialId = credentialId;
    }
    if (subCorporateUserId) {
      whereClause.subCorporateUserId = subCorporateUserId;
      delete whereClause.credentialId;
    }
    const employeesData = await cloud_employees.findAll({
      where: whereClause,
    });
    const assetsData = await cloud_assets.findAll({
      where: { credentialId },
      attributes: [
        "id",
        "assetName",
        "assetCategory",
        "serialNumber",
        "purchasedDate",
        "assetType",
        "amount",
        "amountRecurring",
        "cloudEmployeeId",
      ],
    });
    const fleetData = await cloud_fleets.findAll({
      where: { credentialId },
      attributes: [
        "id",
        "vehicleName",
        "vehicleType",
        "vehicleNumber",
        "purchasedDate",
        "dateOfRenewal",
        "amount",
        "amountRecurring",
        "cloudEmployeeId",
      ],
    });
    const subscriptionsData = await cloud_subscriptions.findAll({
      where: { credentialId },
    });

    let employeesList = [];

    employeesData.forEach((employee) => {
      const employeeAssets = assetsData.filter(
        (asset) => asset.cloudEmployeeId === employee.id
      );
      const employeeFleet = fleetData.filter(
        (fleet) => fleet.cloudEmployeeId === employee.id
      );

      let employeeSubscriptions = [];
      let employeeSpent = 0;
      subscriptionsData.forEach((subscription) => {
        const isAssigned = subscription.assignTo.find(
          (assign) => assign.id == employee.id
        );
        if (isAssigned) {
          employeeSubscriptions.push(subscription);
          if (subscription.currency == "USD") {
            employeeSpent +=
              Number(
                Number(subscription.amount) *
                Number(process.env.USD_TO_INR ?? "1")
              );
          } else {
            employeeSpent +=
              Number(subscription.amount);
          }
        }
      });

      employeeAssets.forEach((asset) => {
        employeeSpent += Number(asset.amount);
      });
      employeeFleet.forEach((fleet) => {
        employeeSpent += Number(fleet.amount);
      });

      let assetsAndFleet = [...employeeAssets, ...employeeFleet];

      employeesList.push({
        ...employee.dataValues,
        assetsAndFleet: assetsAndFleet,
        subscriptions: employeeSubscriptions,
        totalSpent: employeeSpent,
      });
    });
    return {
      success: true,
      data: { result: employeesList, totalData: employeesList.length },
    };
  } catch (error) {
    console.log(error);
    return new ErrorResponse("Something went wrong, please try again later.", 500);
  }
};

exports.updateEmployee = async (id, newData, user, owner = {}) => {
  try {
    const isEmployeeExist = await cloud_employees.findOne({
      where: { id, ...owner },
    });

  if (!isEmployeeExist) {
    return {
      success: false,
      error: "employee is not existing with the given details",
    };
  }

  const existingEmployee = await cloud_employees.findOne({
    where: {
      [Op.or]: [
        { employeeEmail: newData.employeeEmail, credentialId: newData.credentialId, },
        { employeeID: newData.employeeID, credentialId: newData.credentialId, },
      ],
      id: { [Op.ne]: id },
    },
  });

  if (existingEmployee) {
    return {
      success: false,
      error: "Employee with this email id or employee id already exists",
    };
  }

  let filePath;
  if (user?.role === 'CORPORATE_SUB_USER' && user?.subCorporateId) {
    filePath = `corporate/${user?.username ? user?.username : "unknown-user"}/peko-cloud/sub-user/${user?.subCorporateUsername ? user?.subCorporateUsername : "unknown-user"}`
    newData.subCorporateUserId = user?.subCorporateId
  } else {
    filePath = `${user?.role ? user?.role.toLowerCase() : "unknown-role"}/${user?.username ? user?.username : "unknown-user"}/peko-cloud`
  }
  if (
    Object.prototype.hasOwnProperty.call(newData, "profileImageBase") &&
    newData.profileImageFormat
  ) {
    if (isEmployeeExist.profilePicture) {
      await deleteFile(isEmployeeExist.profilePicture);
    }
    const maximumStorageAccess = await findMaximumUsageLimit({ corporateId: user.corporateId, accessKey: accessKey })
    const publicUrl = await uploadFile(
      newData.profileImageBase,
      filePath,
      newData.profileImageFormat,
      maximumStorageAccess
    );
    newData.profilePicture = publicUrl;
  }

  const updateEmployee = await cloud_employees.update(newData, {
    where: { id: id, ...owner },
  });

    if (updateEmployee[0] === 0) {
      return {
        success: false,
        error: "something went wrong while updating the employee",
      };
    }

    return { success: true, data: {} };
  } catch (error) {
    console.log(error);
    return new ErrorResponse("Something went wrong, please try again later.", 500);
  }
};

exports.deleteEmployee = async (id, owner = {}) => {
  try {
    const isEmployeeExist = await cloud_employees.findOne({
      where: { id, ...owner },
    });

    if (!isEmployeeExist) {
      return {
        success: false,
        error: "employee is not existing with the given details",
      };
    }

    // check whether employee is assigned
    const assignedAssets = await cloud_assets.findAll({
      where: { cloudEmployeeId: id },
    });

    const assignedFleet = await cloud_fleets.findAll({
      where: { cloudEmployeeId: id },
    });

    const subscriptionsList = await cloud_subscriptions.findAll({
      where: { credentialId: isEmployeeExist.credentialId },
    });
    const assignedSubscriptions = [];
    subscriptionsList.forEach((subscription) => {
      const isAssigned = subscription.assignTo.find((emp)=>emp.id == id)
      if(isAssigned){
        assignedSubscriptions.push(subscription)
      }
    })

    if (assignedAssets.length > 0 || assignedFleet.length > 0 || assignedSubscriptions.length > 0) {
      return {
        success: false,
        error: "employee is assigned with assets, fleet or subscriptions in peko cloud",
      };
    }

    // remove from usage histories
    await cloud_usageHistories.destroy({ where:{ cloudEmployeeId:id } });

    if (isEmployeeExist.profilePicture) {
      await deleteFile(isEmployeeExist.profilePicture);
    }

    const deletedRowsCount = await cloud_employees.destroy({
      where: { id: id, ...owner },
    });

    if (deletedRowsCount > 0) {
      return { success: true, data: {} };
    } else {
      return {
        success: false,
        error: "employee is not existing with the given details",
      };
    }
  } catch (error) {
    console.log(error);
    return new ErrorResponse("Something went wrong, please try again later.", 500);
  }
};


exports.GetAllEmployees = async (
  searchText,
  credentialId
) => {
  try {
    let whereClause = {};
    if (searchText) {
      whereClause = {
        [Op.or]: [
          { employeeName: { [Op.like]: `%${searchText}%` } },
          { employeeID: { [Op.like]: `%${searchText}%` } },
          { employeeEmail: { [Op.like]: `%${searchText}%` } },
        ],
      };
    }
    if (credentialId) {
      whereClause.credentialId = credentialId;
    }

    const employeesData = await cloud_employees.findAll({
      where: whereClause,
      attributes: [
        "id",
        "employeeName",
        "employeeID",
        "employeeEmail",
        "department",
      ],
    });
    return {
      success: true,
      data: { employeesData },
    };
  } catch (error) {
    console.log(error);
    return new ErrorResponse("Something went wrong, please try again later.", 500);
  }
};
