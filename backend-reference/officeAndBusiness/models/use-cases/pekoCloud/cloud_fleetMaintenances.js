const asyncHandler = require("../../../middlewares/async");
const ErrorResponse = require("../../../utils/error-response");
const cloud_fleets = require("../../entities/pekoCloud/cloud_fleets");
const cloud_maintenances = require("../../entities/pekoCloud/cloud_maintenances");
const { Op } = require("sequelize");

let category = "FLEET";
exports.createFleetMaintenance = asyncHandler(async (data, owner = {}) => {
  try {
    if (data.cloudFleetId) {
      // F-OAB-07: only allow attaching a maintenance to a fleet the caller owns.
      const existFleet = await cloud_fleets.findOne({
        where: {
          id: data.cloudFleetId,
          ...owner,
        },
      });
      if (!existFleet) {
        return {
          success: false,
          error: "fleet is not existing with the given details",
        };
      }
    }

    // Setting up maintenance Category
    data.maintenanceCategory = category;

    const responseData = await cloud_maintenances.create(data);
    if (!responseData) {
      return { success: false, error: "Failed to create maintenance." };
    }
    return { success: true, data: responseData };
  } catch (error) {
    console.log(error);
    return new ErrorResponse(
      "Something went wrong, please try again later.",
      500
    );
  }
});

exports.findAllFleetMaintenances = async (
  page,
  itemsPerPage,
  sortField,
  sort,
  searchText,
  fleetId,
  owner = {}
) => {
  try {
    const offset = (page - 1) * itemsPerPage;
  
    let whereClause = {};
    if (searchText) {
      whereClause = {
        [Op.or]: [
          { repairCategory: { [Op.like]: `%${searchText}%` } },
          { serviceType: { [Op.like]: `%${searchText}%` } },
          { amount: { [Op.like]: `%${searchText}%` } },
        ],
      };
    }
    if (category) {
      whereClause.maintenanceCategory = category;
    }
    // F-OAB-07: maintenances have no owner column, so scope by the parent fleet — a supplied
    // fleetId must be owned; without one, limit to every fleet the caller owns.
    if (fleetId) {
      const ownedFleet = await cloud_fleets.findOne({ where: { id: fleetId, ...owner } });
      if (!ownedFleet) {
        return { success: true, data: { count: 0, rows: [] } };
      }
      whereClause.cloudFleetId = fleetId;
    } else {
      const ownedFleets = await cloud_fleets.findAll({ where: { ...owner }, attributes: ["id"] });
      whereClause.cloudFleetId = { [Op.in]: ownedFleets.map((fleet) => fleet.id) };
    }

    const maintenancesData = await cloud_maintenances.findAndCountAll({
      limit: itemsPerPage,
      offset: offset,
      order: [[sortField, sort]],
      where: whereClause,
    });
  
    return { success: true, data: maintenancesData };
  } catch (error) {
    console.log(error);
    return new ErrorResponse("Something went wrong, please try again later.", 500);
  }
};

exports.updateFleetMaintenance = async (id, newData, owner = {}) => {
  try {
    const isMaintenanceExist = await cloud_maintenances.findOne({
      where: { id: id, maintenanceCategory: category },
    });
  
    if (!isMaintenanceExist) {
      return {
        success: false,
        error: "maintenance is not existing with the given details",
      };
    }

    // F-OAB-07: the maintenance has no owner column — verify its parent fleet is the caller's.
    const ownedFleet = await cloud_fleets.findOne({
      where: { id: isMaintenanceExist.cloudFleetId, ...owner },
    });
    if (!ownedFleet) {
      return {
        success: false,
        error: "maintenance is not existing with the given details",
      };
    }
  
    if (newData.cloudFleetId) {
      const existFleet = await cloud_fleets.findOne({
        where: {
          id: newData.cloudFleetId,
          ...owner,
        },
      });
      if (!existFleet) {
        return {
          success: false,
          error: "fleet is not existing with the given details",
        };
      }
    }
  
    const updateMaintenance = await cloud_maintenances.update(newData, {
      where: { id: id, maintenanceCategory: category },
    });
  
    if (updateMaintenance[0] === 0) {
      return {
        success: false,
        error: "something went wrong while updating the maintenance",
      };
    }
  
    return { success: true, data: {} };
  } catch (error) {
    console.log(error);
    return new ErrorResponse("Something went wrong, please try again later.", 500);
  }
};

exports.deleteFleetMaintenance = async (id, owner = {}) => {
  try {
    const isMaintenanceExist = await cloud_maintenances.findOne({
      where: { id: id, maintenanceCategory: category },
    });
  
    if (!isMaintenanceExist) {
      return {
        success: false,
        error: "maintenance is not existing with the given details",
      };
    }

    // F-OAB-07: verify the parent fleet belongs to the caller before deleting.
    const ownedFleet = await cloud_fleets.findOne({
      where: { id: isMaintenanceExist.cloudFleetId, ...owner },
    });
    if (!ownedFleet) {
      return {
        success: false,
        error: "maintenance is not existing with the given details",
      };
    }
  
    const deletedRowsCount = await cloud_maintenances.destroy({
      where: { id: id, maintenanceCategory: category },
    });
  
    if (deletedRowsCount > 0) {
      return { success: true, data: {} };
    }else{
      return {
        success: false,
        error: "something went wrong while deleting the maintenance",
      };
    }
  } catch (error) {
    console.log(error);
    return new ErrorResponse("Something went wrong, please try again later.", 500);
  }
};
