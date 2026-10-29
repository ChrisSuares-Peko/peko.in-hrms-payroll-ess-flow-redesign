const asyncHandler = require("../../middlewares/async")
const partnerPermission = require("../entities/partnerPermission")
const { Op } = require("sequelize");
const { handleSortFields } = require("../../utils/sortHandle");
const { formattedDateTime } = require("../../utils/formatter");
const ErrorResponse = require("../../utils/error-response");
const credential = require("../entities/credential");
const { customLog } = require("../../utils/loggerHelper");

exports.create = asyncHandler(async (params) => {
    try
    {
    const result = await partnerPermission.create(params)
    if (!result) {
        return false;
    }
    return result
    }
    catch (error) {
        console.error("Transaction failed and rolled back: ", error);
        return new ErrorResponse("Something went wrong, please try again later.", 500);
      }
})

exports.findOneDuplicate = asyncHandler(async (registeredBy, id = undefined) => {
    let whereClause = { registeredBy };

    if (id !== undefined) {
        whereClause.id = { [Op.ne]: id };
    }

    return await partnerPermission.findOne({
        where: whereClause,
        nest: true,
        raw: true
    });
});

exports.updatePartnerPermissionById = asyncHandler(async (id, updatedData) => {
    try
    {
   let updatedResult =  await partnerPermission.update(updatedData, {
        where: {
            id
        }})
    if (!updatedResult) {
        return false;
    }
    return updatedResult;
}
catch (error) {
    return new ErrorResponse("Something went wrong, please try again later.", 500);
  }
});
exports.findPartnerPermissionById = asyncHandler(async (id, attributes = undefined) => {
    try {
        const permission = await partnerPermission.findOne({
            where: { id },
            attributes,
            raw: true,
            nest: true
        });

        if (!permission) {
            return null;
        }

        // Mirrors the partnerName enrichment done in fetchAllPartnerPermissions/
        // partnerPermissionExports, so a single-record fetch matches the list shape.
        if (permission.registeredBy) {
            const partner = await credential.findOne({
                where: { id: permission.registeredBy },
                attributes: ["id", "name"],
                raw: true
            });
            permission.partnerName = partner ? partner.name : null;
        }

        return permission;
    } catch (error) {
        console.log(error);
        customLog(null, "error", {
            message: "findPartnerPermissionById failed",
            errName: error?.name,
            errMessage: error?.message,
            stack: error?.stack,
            id
        });
        throw new ErrorResponse("Something went wrong", 500);
    }
});




exports.fetchAllPartnerPermissions = asyncHandler(async (params) => {
  try {
    let {
      from,
      to,
      searchText = "",
      sort,
      limit,
      offset,
      sortField
    } = params;

    let order = handleSortFields(sortField, sort);

    let whereClause = {};

    if (searchText) {
      const referencedPartners = await partnerPermission.findAll({
        where: {
          registeredBy: {
            [Op.ne]: null,
          },
        },
        attributes: ["registeredBy"],
        group: ["registeredBy"],
        raw: true,
      });

      const candidateIDs = referencedPartners.map((r) => r.registeredBy);

      const matchingPartners = candidateIDs.length
        ? await credential.findAll({
            where: {
              id: {
                [Op.in]: candidateIDs,
              },
              name: {
                [Op.like]: `%${searchText}%`,
              },
            },
            attributes: ["id"],
            raw: true,
          })
        : [];

      whereClause[Op.or] = [
        {
          registeredBy: {
            [Op.like]: `%${searchText}%`,
          },
        },
        {
          registeredBy: {
            [Op.is]: null,
          },
        },
      ];

      if (matchingPartners.length) {
        whereClause[Op.or].push({
          registeredBy: {
            [Op.in]: matchingPartners.map((p) => p.id),
          },
        });
      }
    }

    if (from && to) {
      const tomorrow = new Date(to);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      whereClause.createdAt = {
        [Op.between]: [from, tomorrow],
      };
    }

    const data = await partnerPermission.findAndCountAll({
      where: whereClause,
      attributes: { exclude: ["permissions"] },
      order,
      limit,
      offset,
      raw: true,
      nest: true,
    });

    const partnerIDs = [
      ...new Set(data.rows.map((r) => r.registeredBy).filter(Boolean)),
    ];

    const partnerData = partnerIDs.length
      ? await credential.findAll({
          where: {
            id: {
              [Op.in]: partnerIDs,
            },
          },
          attributes: ["id", "name"],
          raw: true,
        })
      : [];

    const partnerNameById = new Map(
      partnerData.map((c) => [Number(c.id), c.name])
    );

    data.rows.forEach((row) => {
      if (row.registeredBy) {
        row.partnerName = partnerNameById.get(Number(row.registeredBy)) ?? null;
      }
    });

    return data;
  } catch (error) {
    console.log(error);
    customLog(null, "error", {
      message: "fetchAllPartnerPermissions failed",
      errName: error?.name,
      errMessage: error?.message,
      stack: error?.stack,
      params
    });
    throw { message: "Something went wrong" };
  }

})
 

exports.partnerPermissionExports = asyncHandler(async (params) => {
  try {
    let {
      from,
      to,
      searchText = "",
      sort,
      sortField
    } = params;

    let order = handleSortFields(sortField, sort);

    let whereClause = {};

    if (searchText) {
      whereClause[Op.or] = [
        {
          registeredBy: {
            [Op.like]: `%${searchText}%`,
          },
        },
      ];
    }

    if (from && to) {
      const tomorrow = new Date(to);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      whereClause.createdAt = {
        [Op.between]: [from, tomorrow],
      };
    }

    const data = await partnerPermission.findAndCountAll({
      where: whereClause,
      order,
      raw: true,
      nest: true,
    });

    const partnerIDs = data.rows
      .map((r) => r.registeredBy)
      .filter(Boolean);

    const partnerData = await credential.findAll({
      where: {
        id: {
          [Op.in]: partnerIDs,
        },
      },
      raw: true,
    });

    data.rows.forEach((row) => {
      if (row.registeredBy) {
        const cred = partnerData.find(
          (c) => c.id == row.registeredBy
        );
        row.partnerName = cred ? cred.name : null;
      }
    });

    let finalData = data.rows.map((limitData) => ({
      Date: limitData.createdAt
        ? formattedDateTime(limitData.createdAt)
        : "Not Available",
      "Partner Name": limitData.partnerName || "Not Available",
      "Partner ID": limitData.registeredBy || "Not Available",
      Status: limitData.status > 0 ? "Active" : "In Active",
    }));

    return finalData;
  } catch (error) {
    console.log(error);
    throw { message: "Something went wrong" };
  }

})

exports.findOnePartnerPermissionData = async (registeredBy = null, attributes = undefined) => {
  try {
      return await partnerPermission.findOne({
          where: {
              registeredBy
          },
          attributes
      })
  } catch (error) {
      console.log(error)
  } finally {
      console.log("PARTNER PERMISSION FIND ONE ROUTE CALLED")
  }
}