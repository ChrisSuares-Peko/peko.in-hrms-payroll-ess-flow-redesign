const { Op } = require("sequelize");
const ip_whitelist = require("../entities/ip_whitelist")
const { handleSortFields } = require("../../utils/sortHandle");
const asyncHandler = require("../../middlewares/async");
const { formattedDateTime } = require("../../utils/formatter");
const { customLog } = require("../../utils/loggerHelper");
const credential = require("../entities/credential");
exports.findAllIps= asyncHandler(async (params) => {
  let {
    page = 1,
    itemsPerPage = 10,
    searchText,
    sort,
    sortField,
    to,
    from,
    partnerId
  } = params;

  let order = handleSortFields(sortField, sort);

  const searchPattern = `%${searchText}%`;
  let partnerIDs = [];
  if (searchText) {
    const partnerResults = await credential.findAll({
      where: {
        [Op.or]: [
          { id: { [Op.like]: searchPattern } },
          { name: { [Op.like]: searchPattern } },
        ],
      },
      attributes: ["id"], // Only fetch the IDs
      raw: true,
    });

    partnerIDs = partnerResults.map((partner) => partner.id);
  }

  // Build the where clause
  let whereClause = {
    [Op.or]: [
      { ip: { [Op.like]: searchPattern } },
      { partnerId: { [Op.like]: searchPattern } },
    ],
  };
  if (partnerId === 'default') {
    whereClause.partnerId = null;
} else if (partnerId) {
    whereClause.partnerId = partnerId;
} 

  if (from && to) {
    whereClause.createdAt = {
      [Op.between]: [
        new Date(from),
        new Date(new Date(to).setHours(23, 59, 59, 999)),
      ],
    };
  }
  if (partnerIDs.length > 0) {
    whereClause[Op.or].push({ partnerId: { [Op.in]: partnerIDs } });
  }
  const data= await ip_whitelist.findAndCountAll({
    where: whereClause,
    order: order,
    limit: itemsPerPage,
    offset: (page - 1) * itemsPerPage,
    raw: true,
    nest: true,
  });
  const partnerIDsForNames = data.rows
    .filter((row) => row.partnerId != null)
    .map((row) => row.partnerId);

    let partnerNameMap = {};
    if (partnerIDsForNames.length > 0) {
      const partnerData = await credential.findAll({
        where: { id: { [Op.in]: partnerIDsForNames } },
        attributes: ["id", "name"],
        raw: true,
      });

     partnerNameMap = partnerData.reduce((acc, partner) => {
      acc[partner.id] = partner.name;
      return acc;
    }, {});
  }

  data.rows.forEach((row) => {
    row.partnerName = partnerNameMap[row.partnerId] || null;
  });

  return data;
});


exports.update = asyncHandler(async (params, data) => {
  try {
  return await ip_whitelist.update(data, {
    where: {
      id: params.id,
    },
  });
}catch (error) {
  customLog(null,'error',{error:error.message})
    console.log(error.message);
}
});

exports.findOne = asyncHandler(async (params) => {
    try {
        let {
            ip
        } = params
        return await ip_whitelist.findOne({
            where: {
                ip,
            },
            raw: true
        })
    } catch (error) {
        console.log(error)
    } finally {
        console.log("IP FIND ONE ROUTE CALLED")
    }
})



exports.create = async (params) => {
    try {
        return await ip_whitelist.create(params);
    } catch (error) {
      customLog(null,'error',{error:error.message})
        console.log(error.message);
    }
};
exports.deleteIP = asyncHandler(async (params) => {
  const ipExists = await ip_whitelist.findOne({where: {id: params.id}});
  if (!ipExists) {
    throw new Error('Invoice customer not found');
  }
  await ip_whitelist.destroy({
    where: {
        id: params.id
    }
})
  return true;
});
exports.ipWhitelistAndCountExport = asyncHandler(async (params) => {
  try{
    let {
      page = 1,
      itemsPerPage = 10,
      searchText,
      sort,
      sortField,
      to,
      from,
      partnerId,
    } = params;
    // Generate sort order
    let order = handleSortFields(sortField, sort);
  
  
    // Build the where clause
    let whereClause = {
      [Op.or]: [
        { ip: { [Op.like]: `%${searchText}%` } },
        { partnerId: { [Op.like]: `%${searchText}%` } },
      ],
    };
  
    if (partnerId === 'default') {
      whereClause.partnerId = null;
  } else if (partnerId) {
      whereClause.partnerId = partnerId;
  } 
  
    // Date range filtering
    if (from && to) {
      whereClause.createdAt = {
        [Op.between]: [
          new Date(from),
          new Date(new Date(to).setHours(23, 59, 59, 999)),
        ],
      };
    }
  
    // Execute the query
    const data= await ip_whitelist.findAndCountAll({
      where: whereClause,
      order: order,
      limit: itemsPerPage,
      offset: (page - 1) * itemsPerPage,
      raw: true,
      nest: true,
    });    
    let partnerID = []
    for (let i = 0; i < data.rows.length; i++) {
      if (data.rows[i].partnerId != null)
        partnerID.push(data.rows[i].partnerId)
  
    }
    let partnerData = await credential.findAll({
        where: {
          id: {
            [Op.in]: partnerID,
          },
        },
        raw: true,
      });
  
      for (let i = 0; i < data.rows.length; i++) {
        if (data.rows[i].partnerId != null) {
          let matchingCredential = partnerData.find(cred => cred.id == data.rows[i].partnerId);
          if(matchingCredential)
            data.rows[i].partnerName = matchingCredential.name;
        }
      }
      let finalData = []
      data.rows.forEach(function (limitData) {
          finalData.push({
              Date: limitData.createdAt ? formattedDateTime(limitData.createdAt) : 'Not Available',
              "IP": limitData.ip ? limitData.ip : 'Not Available',
              "Partner Id":limitData.partnerId?limitData.partnerId:'Not Available',
              "Partner Name":limitData.partnerName?limitData.partnerName:'Not Available',
              "Status": limitData.status>0 ? "Active"  : "In Active",         
          })
      })
      
      return finalData
  } catch (error) {
    customLog(null,'error',{error:error.message})
      console.log(error.message);
  }
})
