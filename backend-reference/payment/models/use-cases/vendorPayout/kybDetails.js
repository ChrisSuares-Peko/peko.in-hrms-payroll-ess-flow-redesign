const asyncHandler = require("../../../middlewares/async");
// const { NODE_ENV } = process.env;
const kybDetails = require("../../entities/vendorPayout/kybDetails");
 const { Op } = require("sequelize");
 const { handleSortFields } = require('../../../utils/sortHandle');
 const credential = require("../../entities/credential");
 const { formattedDateTime } = require('../../../utils/formatter');

exports.createKYBDetails = asyncHandler(async (data, ) => {
  const responseData = await kybDetails.create(data);
  if (!responseData) {
    return { success: false, message: "Failed to create kyb details." };
  }
  return { success: true, data: responseData };
});


exports.findAllKYBDetails = async (params, userId = false) => {
  try {
    let { page, itemsPerPage, searchText, sort, sortField,from,to } = params;

    const order = handleSortFields(sortField || "createdAt", sort || "DESC");

    let whereClause = {};
    const tomorrow = new Date(to);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    if (searchText) {
      const searchPattern = `%${searchText}%`;
      // Prepare the where clause
       whereClause = {
        createdAt: {
          [Op.between]: [from, tomorrow]
   },
          [Op.or]: [{
              companyName: {
                  [Op.like]: searchPattern
              }
          }, {
            contactPersonName: {
                  [Op.like]: searchPattern
              }
          }, {
            offEmail: {
                  [Op.like]: searchPattern
              }
          },
          {
            status: {
                  [Op.like]: searchPattern
              }
          },
        //   {
        //     '$credential.name$': {
        //         [Op.like]: searchPattern
        //     }
        // }, 
        {
              '$credential.username$': {
                  [Op.like]: searchPattern
              }
          }]
      };
      // If userId is available, add it to the where clause
      if (userId) {
          whereClause.credentialId = userId;
      }
      return await kybDetails.findAndCountAll({
          include: [{
              model: credential,
              attributes: ['id', 'name', 'username']
          }],
          where: whereClause,
          order: order,
          limit: itemsPerPage,
          offset: (page - 1) * itemsPerPage,
          raw: true,
          nest: true,
      })
    }
      // If userId is available, add it to the where clause
      if (userId) {
          whereClause.credentialId = userId;
      }
      return await kybDetails.findAndCountAll({
          include: [{
              model: credential,
              attributes: ['id', 'name', 'username']
          }],
          where: whereClause,
          order: order,
          limit: itemsPerPage,
          offset: (page - 1) * itemsPerPage,
          raw: true,
          nest: true,
      })
  } catch (error) {
    console.error("Error fetching KYB details:", error);
    return { success: false, message: error.message };
  }
};

exports.KYBDetailsExport = async (params, userId = false) => {
  try {
    let { searchText, sort, sortField, from, to } = params;
    const tomorrow = new Date(to);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const order = handleSortFields(sortField || "createdAt", sort || "DESC");

    const whereClause = {
      createdAt: {
        [Op.between]: [from, tomorrow]
      },
    };

    if (searchText) {
      const searchPattern = `%${searchText}%`;

      whereClause[Op.or] = [
        { companyName: { [Op.like]: searchPattern } },
        { contactPersonName: { [Op.like]: searchPattern } },
        { offEmail: { [Op.like]: searchPattern } },
        { status: { [Op.like]: searchPattern } },
        { "$credential.name$": { [Op.like]: searchPattern } },
        { "$credential.username$": { [Op.like]: searchPattern } },
      ];
    }

    if (userId) {
      whereClause.credentialId = userId;
    }

    const data = await kybDetails.findAndCountAll({
      include: [
        {
          model: credential,
          attributes: ["id", "name", "username"],
        },
      ],
      where: whereClause,
      order,
      raw: true,
      nest: true,
    });

    const finalData = data.rows.map(limitData => ({
      Date: limitData.createdAt
        ? formattedDateTime(limitData.createdAt)
        : "Not Available",
      "Company Name": limitData.companyName || "Not Available",
      "Contact Person Name":
        limitData.contactPersonName || "Not Available",
      "Corporate ID":
        limitData.contactPersonName || "Not Available",
      "Email ID": limitData.offEmail || "Not Available",
      Status: limitData.status || "Not Available",
    }));

    return finalData;
  } catch (error) {
    console.log({ error });
    return false;
  }
};

exports.findOneKYBDetails = async (credentialId) => {
  let whereClause = {};
  if (credentialId) {
    whereClause.credentialId = credentialId;
  }

  try {
    const kybDetailsList = await kybDetails.findAndCountAll({
      where: whereClause,
    });
    return { success: true, data: kybDetailsList };
  } catch (error) {
    console.error("Error fetching KYB details:", error);
    return { success: false, message: error.message };
  }
};
exports.updateKYBDetails = async (id, newData) => {
    const kybDetailsExist = await kybDetails.findOne({
      where: { id: id, },
    });
    if (!kybDetailsExist) {
      return {
        success: false,
        message: "KYB details is not existing with the given details",
      };
    }
  
    const updateKybDetails = await kybDetails.update(newData, {
      where: { id: id },
    });
  
    if (updateKybDetails[0] === 0) {
      return {
        success: false,
        message: "Something went wrong while updating kyb details",
      };
    }
  
    return { success: true, data: {} };
  };
  

