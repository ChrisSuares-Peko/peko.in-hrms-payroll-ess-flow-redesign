"use strict";
const { Op } = require("sequelize");
const { handleSortFields } = require("../../../utils/sortHandle");
const GarageAssignment = require("../../entities/garage/garage_assignment");
const GarageDriver = require("../../entities/garage/garage_driver");
const GarageFleet = require("../../entities/garage/garage_fleet");
const { createLog } = require("./garage_logs");
const { customLog } = require("../../../utils/loggerHelper");

const reassignDriver = async (assignment, newVehicleId, credentialId) => {
  const oldVehicleId = assignment.vehicleId;
  await assignment.update({ vehicleId: newVehicleId, assignedAt: new Date() });

  try {
    const [driver, oldVehicle, newVehicle] = await Promise.all([
      GarageDriver.findByPk(assignment.driverId, { attributes: ["name"] }),
      GarageFleet.findByPk(oldVehicleId, { attributes: ["vehicleNumber"] }),
      GarageFleet.findByPk(newVehicleId, { attributes: ["vehicleNumber"] }),
    ]);

    await createLog({
      actionType: "REASSIGN_DRIVER",
      ...(newVehicle?.vehicleNumber && { meta: { vehicleNumber: newVehicle.vehicleNumber } }),
      referenceId: assignment.id.toString(),
      description: `Driver '${driver?.name || `ID: ${assignment.driverId}`}' reassigned from vehicle '${oldVehicle?.vehicleNumber || `ID: ${oldVehicleId}`}' to vehicle '${newVehicle?.vehicleNumber || `ID: ${newVehicleId}`}'`,
      credentialId,
    });
  } catch (logError) {
    console.error("Reassignment log error:", logError);
  }

  return { success: true, data: assignment };
};

exports.createAssignment = async (data, credentialId, logTraceId = null) => {
  try {
    const { vehicleId, driverId, reassign } = data;

    const driverExists = await GarageAssignment.findOne({
      where: {
        driverId,
        assignmentType: { [Op.in]: ["Assigned"] },
      },
    });

    if (driverExists && !reassign) {
      const assignedVehicle = await GarageFleet.findByPk(driverExists.vehicleId, { attributes: ["vehicleNumber"] });
      return {
        success: false,
        message: `This driver is already assigned to the vehicle ${assignedVehicle?.vehicleNumber || `(ID: ${driverExists.vehicleId})`}.`,
      };
    }

    // reassigning to the vehicle the driver is already on is a no-op
    if (driverExists && Number(driverExists.vehicleId) === Number(vehicleId)) {
      return { success: true, data: driverExists };
    }

    const vehicleExists = await GarageAssignment.findOne({
      where: {
        vehicleId,
        assignmentType: { [Op.in]: ["Assigned"] },
      },
    });

    if (vehicleExists) {
      return {
        success: false,
        message: `Vehicle ID ${vehicleId} is already assigned to a driver (ID: ${vehicleExists.driverId})`,
      };
    }

    if (driverExists) {
      return await reassignDriver(driverExists, vehicleId, credentialId);
    }

    const assignment = await GarageAssignment.create(data);

    try {
      const [driver, vehicle] = await Promise.all([
        GarageDriver.findByPk(driverId, { attributes: ["name"] }),
        GarageFleet.findByPk(vehicleId, { attributes: ["vehicleNumber"] }),
      ]);
      const driverLabel = driver?.name || `ID: ${driverId}`;
      const vehicleLabel = vehicle?.vehicleNumber || `ID: ${vehicleId}`;

      await createLog({
        actionType: "ASSIGN_DRIVER",
        ...(vehicle?.vehicleNumber && { meta: { vehicleNumber: vehicle.vehicleNumber } }),
        referenceId: assignment.id.toString(),
        description: `Driver '${driverLabel}' assigned to vehicle '${vehicleLabel}'`,
        credentialId,
      });
    } catch (logError) {
      console.error("Assignment log error:", logError);
    }

    return { success: true, data: assignment };

  } catch (error) {
    customLog(logTraceId, "error", { message: "createAssignment failed", error: error?.message ?? String(error), stack: error?.stack });
    return { success: false, message: "Unable to create assignment" };
  }
};

exports.getAllAssignments = async (page, itemsPerPage, sortField, sort, vehicleId, driverId, credentialId, subCorporateUserId) => {
  try {
    const offset = (page - 1) * itemsPerPage;
    const order = handleSortFields(sortField, sort);
    const whereClause = {};

    if (vehicleId) whereClause.vehicleId = vehicleId;
    if (driverId) whereClause.driverId = driverId;
    if (credentialId) whereClause.credentialId = credentialId;
    if (subCorporateUserId) whereClause.subCorporateUserId = subCorporateUserId;

    const assignments = await GarageAssignment.findAll({
      limit: itemsPerPage,
      offset,
      order,
      where: whereClause,
    });

    return { success: true, data: assignments };
  } catch (error) {
    console.error("Get All Assignments Error:", error);
    return { success: false, message: "Unable to fetch assignments", error };
  }
};

exports.getAssignmentById = async (id) => {
  try {
    const assignment = await GarageAssignment.findByPk(id);

    if (!assignment) {
      return { success: false, message: "Assignment not found" };
    }

    return { success: true, data: assignment };
  } catch (error) {
    console.error("Get Assignment By ID Error:", error);
    return { success: false, message: "Unable to fetch assignment", error };
  }
};

exports.updateAssignment = async (id, updatedData) => {
    try {
      const assignment = await GarageAssignment.findByPk(id);
      if (!assignment) {
        return { success: false, message: "Assignment not found" };
      }
  
      await assignment.update(updatedData);
  
      return { success: true, message: "Assignment updated", data: assignment };
    } catch (error) {
      console.error("Update Assignment Error:", error);
      return { success: false, message: "Unable to update assignment", error };
    }
  };

exports.unassignDriver = async (id, credentialId, logTraceId = null) => {
  try {
    const assignment = await GarageAssignment.findOne({
      where: { id, assignmentType: { [Op.in]: ["Assigned"] } },
    });

    if (!assignment) {
      return { success: false, message: "Assignment not found" };
    }

    const fleet = await GarageFleet.findOne({
      where: { id: assignment.vehicleId, credentialId },
      attributes: ["id", "vehicleNumber"],
    });

    if (!fleet) {
      return { success: false, message: "Assignment not found" };
    }

    await assignment.update({ assignmentType: "Unassigned" });

    try {
      const driver = await GarageDriver.findByPk(assignment.driverId, { attributes: ["name"] });
      await createLog({
        actionType: "UNASSIGN_DRIVER",
        meta: { vehicleNumber: fleet.vehicleNumber },
        referenceId: assignment.id.toString(),
        description: `Driver '${driver?.name || `ID: ${assignment.driverId}`}' unassigned from vehicle '${fleet.vehicleNumber}'`,
        credentialId,
      });
    } catch (logError) {
      console.error("Unassignment log error:", logError);
    }

    return { success: true, message: "Driver unassigned successfully" };
  } catch (error) {
    customLog(logTraceId, "error", { message: "unassignDriver failed", error: error?.message ?? String(error), stack: error?.stack });
    return { success: false, message: "Unable to unassign driver" };
  }
};

exports.deleteAssignment = async (id) => {
  try {
    const assignment = await GarageAssignment.findByPk(id);
    if (!assignment) {
      return { success: false, message: "Assignment not found" };
    }

    await assignment.destroy();
    return { success: true, message: "Assignment permanently deleted" };
  } catch (error) {
    console.error("Delete Assignment Error:", error);
    return { success: false, message: "Unable to delete assignment", error };
  }
};
