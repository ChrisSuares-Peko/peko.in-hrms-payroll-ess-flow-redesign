const { Op } = require("sequelize");
const hike = require("../entities/hike");
const asyncHandler = require("../../middlewares/async");
const credential = require("../entities/credential");
const { handleSortFields } = require("../../utils/sortHandle");
const { customLog } = require("../../utils/loggerHelper");
const { PLAN_COMMISSION, reviewedChange } = require("../../utils/configuredFlag");
const { formattedDateTime, capitalizeFirstLetter } = require("../../utils/formatter");
const { applyCommissionMarkup } = require("../../utils/applyCommissionMarkup");

exports.findHikesByIds = asyncHandler(async (ids, credentialId) => {
  const hikes = await hike.findAll({
    where: { id: { [Op.in]: ids } },
    attributes: ["id", "name", "amount", "commissionMode", "commissionType", "commission", "fixedCommissionPerTransaction", "isCommissionInclGST"],
  });
  await applyCommissionMarkup(hikes, "amount", credentialId);
  return hikes;
});

exports.createHike = asyncHandler(async (data) => {
  try {
    const requiredFields = [
      "name",
      "salaryAmount",
      "salaryValidation",
      "features",
      "planType",
      "partners",
      "logo",
      "amount",
    ];
    if (requiredFields.some((field) => !data[field])) {
      console.log({
        success: false,
        message: "Missing required fields",
        missingFields: requiredFields.filter((field) => !data[field]),
      });
      return {
        success: false,
        message: "Missing required fields",
      };
    }
    if (data.credentialId === "default") {
      data.credentialId = null;
    }
    const newHike = await hike.create(data);
    if (!newHike) {
      console.log({ success: false, message: "Failed to create hike" });
      return {
        success: false,
        message: "Failed to create hike",
      };
    }
    return {
      success: true,
      message: "Hike created successfully",
      data: newHike,
    };
  } catch (error) {
    console.error("Error creating hike:", error);
    return {
      success: false,
      message: "An error occurred while creating the hike",
    };
  }
});

exports.findAllHikesAndCount = asyncHandler(
  async ({ sortField, sort, itemsPerPage, page, searchText, isActive ,partnerId, isAdmin = false}) => {
    try {
      const offset = (page - 1) * itemsPerPage;
      const limit = itemsPerPage;
      let order = handleSortFields(sortField,sort)
      let where = {};
      if (searchText) {
        where = {
          [Op.or]: [
            { name: { [Op.like]: `%${searchText}%` } },
            { amount: { [Op.like]: `%${searchText}%` } },
            { salaryAmount: { [Op.like]: `%${searchText}%` } },
            { salaryValidation: { [Op.like]: `%${searchText}%` } },
            { features: { [Op.like]: `%${searchText}%` } },
            { planType: { [Op.like]: `%${searchText}%` } },
            { partners: { [Op.like]: `%${searchText}%` } },
          ],
        };
      }

      if (isActive) {
        where.status = true;
      }
      if(partnerId){
        if(partnerId === 'default') {
          where.credentialId = null;
        }else{
          where.credentialId = partnerId;
        }
      }

      const result = await hike.findAndCountAll({
        where,
        include: [
          {
            model: credential,
            as: 'credential',
            attributes: ['id', 'name'],
            include: [
              {
                model: credential,
                as: 'registeredByCredential',
                attributes: ['id', 'name'],
              },
            ],
            required: false,
          },
        ],
        order,
        offset,
        limit,
      });

      await applyCommissionMarkup(result.rows, "amount", null, isAdmin);

      return {
        success: true,
        message: "Hikes fetched successfully",
        data: result,
      };
    } catch (error) {
      console.error("Error finding hikes:", error);
      return {
        success: false,
        message: "An error occurred while fetching hikes",
      };
    }
  }
);

exports.findAllActiveHikes = asyncHandler(async (credentialId) => {
  try {
    const hikes = await hike.findAll({
      where: {
        status: true,
      },
      order: [['createdAt', 'DESC']]
    });

    if (!hikes) {
      return {
        success: false,
        message: "No active hikes found"
      };
    }

    await applyCommissionMarkup(hikes, "amount", credentialId);

    return {
      success: true,
      message: "Active hikes fetched successfully",
      data: hikes
    };
  } catch (error) {
    console.error("Error finding active hikes:", error);
    return {
      success: false,
      message: "An error occurred while fetching active hikes"
    };
  }
});

exports.updateHike = asyncHandler(async (id, updateData) => {
  try {
    const reviewed = await reviewedChange({
      load: () => hike.findOne({ where: { id }, attributes: PLAN_COMMISSION.fields, raw: true }),
      incoming: updateData,
      group: PLAN_COMMISSION,
      table: "hikes",
      id,
    });
    const [updatedRowsCount] = await hike.update(reviewed, {
      where: { id: id },
    });

    if (updatedRowsCount === 0) {
      return {
        success: false,
        message: "Hike not found or no changes were made",
      };
    }

    const updatedHike = await hike.findOne({ where: { id } });

    return {
      success: true,
      message: "Hike updated successfully",
      data: updatedHike,
    };
  } catch (error) {
    console.error("Error updating hike:", error);
    return {
      success: false,
      message: "An error occurred while updating the hike",
    };
  }
});

exports.findHikeByName = asyncHandler(async (name,credentialId) => {
  try {
    const result = await hike.findOne({
      where: {
        name: name,
        credentialId
      },
    });

    if (!result) {
      return {
        success: false,
        message: "Hike not found",
      };
    }

    return {
      success: true,
      message: "Hike fetched successfully",
      data: result,
    };
  } catch (error) {
    console.error("Error finding hike by name:", error);
    return {
      success: false,
      message: "An error occurred while fetching the hike",
    };
  }
});


exports.findOneHikeDetails = asyncHandler(async ({params, credentialId}) => {
  try {
    let { id } = params;
    const plan = await hike.findOne({
      where: { id },
    });
    await applyCommissionMarkup(plan, "amount", credentialId);
    return plan;
  } catch (error) {
    console.log("this is error", error);
    throw error;
  } finally {
    console.log("HIKE FIND ONE CALLED");
  }
});

exports.getExcelCSVData = asyncHandler(async (params) => {
  try {
     let { searchText, sort, sortField,partnerId,isActive,attributes=undefined} = params;

    //  async ({ sortField, sort, itemsPerPage, page, searchText, isActive ,partnerId,attributes=undefined}) => {
      // const offset = (page - 1) * itemsPerPage;
      // const limit = itemsPerPage;
      let order = handleSortFields(sortField,sort)
      let where = {};
      if (searchText) {
        where = {
          [Op.or]: [
            { name: { [Op.like]: `%${searchText}%` } },
            { amount: { [Op.like]: `%${searchText}%` } },
            { salaryAmount: { [Op.like]: `%${searchText}%` } },
            { salaryValidation: { [Op.like]: `%${searchText}%` } },
            { features: { [Op.like]: `%${searchText}%` } },
            { planType: { [Op.like]: `%${searchText}%` } },
            { partners: { [Op.like]: `%${searchText}%` } },
          ],
        };
      }

      if (isActive) {
        where.status = true;
      }
      if(partnerId){
        if(partnerId === 'default') {
          where.credentialId = null;
        }else{
          where.credentialId = partnerId;
        }
      }

      const data = await hike.findAndCountAll({
        where,
        include: [
          {
            model: credential,
            as: 'credential',
            attributes: ['id', 'name'],
            include: [
              {
                model: credential,
                as: 'registeredByCredential',
                attributes: ['id', 'name'],
              },
            ],
            required: false,
          },
        ],
        order,
        attributes,
        raw: true,
        nest: true
      });


   
const salaryValidationMap = {
      GREATER_THAN: 'Greater than',
      LESS_THAN: 'Less than',
    };
    let finalData = []
    data.rows.forEach(function (limitData) {
      finalData.push({
        "Date": limitData.createdAt ? formattedDateTime(limitData.createdAt) : 'Not Available',
        "Name": limitData.name || "Not Available",
        "Features": limitData.features || "Not Available",
        "Partner Name": limitData.credential?.name || "Default",
        "Plan Type": limitData.planType
          ? capitalizeFirstLetter(limitData.planType)
          : "Not Available",

        "Amount": limitData.amount ? `₹ ${limitData.amount}` : "Not Available",
        "Logo": limitData.logo || "Not Available",
        "Salary Condition": limitData.salaryValidation
          ? salaryValidationMap[limitData.salaryValidation] || limitData.salaryValidation
          : "Not Available",
        "Partner Logo": limitData.partners || "Not Available",
        "Status": limitData.status !== undefined && limitData.status !== null
          ? limitData.status === 1
            ? "Active"
            : "Inactive"
          : "Not Available",

        "Salary Amount": limitData.salaryAmount ? `₹ ${limitData.salaryAmount}` : "Not Available",
        "Partners": limitData.Partners || "Not Available",
        "Salary Validation": limitData.salaryValidation || "Not Available",        
        "status": limitData.status>0?  "Active"  : "Inactive",
      })
    })
    return finalData
  
  } catch (error) {
    customLog(null, "error", { message: "An error occurred", error: error });
    throw { message: "Something went wrong" };
  }
})