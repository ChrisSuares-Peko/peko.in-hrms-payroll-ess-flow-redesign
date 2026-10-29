const asyncHandler = require("../../middlewares/async")
const banner = require("../entities/banners")
const { Op } = require("sequelize");
const { handleSortFields } = require("../../utils/sortHandle");
const { formattedDateTime } = require("../../utils/formatter");
const ErrorResponse = require("../../utils/error-response");
const { uploadFile, deleteFile } = require("../../utils/commonUploadFile");

exports.findAllBanner = asyncHandler(async (deviceType, position, partnerId, attributes) => {
    const whereClause = {
        status: true,
        deviceType
    };

    if (position) {
        whereClause.position = position;
    }

    if (partnerId !== undefined) {
        whereClause.partnerId = partnerId === '' ? null : partnerId;
    }

    return await banner.findAll({
        where: whereClause,
        attributes: { exclude: attributes },
        nest: true,
        raw: true,
    });
});

exports.create = asyncHandler(async (params) => {
    try {
        if (Object.prototype.hasOwnProperty.call(params, 'bannerImage') && params.bannerFormat) {
            const publicUrl = await uploadFile(params.bannerImage, 'banners', params.bannerFormat);
            params.bannerImage = publicUrl;
        }
        const banners = await banner.create(params)
        if (!banners) {
            return false;
        }
        return banners
    }
    catch (error) {
        console.error("Transaction failed and rolled back: ", error);
        return new ErrorResponse("Something went wrong, please try again later.", 500);
    }
})

exports.updateBannerById = asyncHandler(async (id, updatedData) => {
    try
    {
    if (Object.prototype.hasOwnProperty.call(updatedData, 'bannerImage') && updatedData.bannerFormat) {
        const publicUrl = await uploadFile(updatedData.bannerImage, 'banners', updatedData.bannerFormat);
        updatedData.bannerImage = publicUrl;
    }
   let updatedBanner =  await banner.update(updatedData, {
        where: {
            id
        }})
    if (!updatedBanner) {
        return false;
    }
    return updatedBanner;
}
catch (error) {
    console.error("Transaction failed and rolled back: ", error);
    return new ErrorResponse("Something went wrong, please try again later.", 500);
}
});


exports.deleteBanner = asyncHandler(async (params) => {
    const {bannerImage} = await banner.findOne({where:{id: params.id}})
    const result = await deleteFile(bannerImage);
    if(result.success){
        return await banner.destroy({
                where: {
                    id: params.id
                }
        })
    }
    return false;
})

exports.fetchAllBanners = asyncHandler(async (params) => {
    const {
        from,
        to,
        searchText,
        sort,
        limit,
        offset,
        deviceType,
        sortField,
    } = params;

    const order = handleSortFields(sortField, sort);

    let whereClause = {};

    if (searchText) {
        whereClause[Op.or] = [
            {
                bannerLink: {
                    [Op.like]: `%${searchText}%`,
                },
            },
            {
                deviceType: {
                    [Op.like]: `%${searchText}%`,
                },
            },
            {
                partnerId: {
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


    if (deviceType) {
        whereClause.deviceType = deviceType;
    }

    return await banner.findAndCountAll({
        where: whereClause,
        order,
        limit,
        offset,
        raw: true,
        nest: true,
    });
});
  

exports.bannersExports = asyncHandler(async (params) => {
     try {
          let { from, to, searchText, sort, deviceType, sortField } = params
          let order = handleSortFields(sortField, sort)

          let whereClause = {
              [Op.or]: [{
                  bannerLink: {
                      [Op.like]: '%' + searchText + '%'
                  }
              },
              {
                  deviceType: {
                      [Op.like]: '%' + searchText + '%'
                  }
              },
              {
                  partnerId: {
                      [Op.like]: '%' + searchText + '%'
                  }
              },
              ]
          }
  
          if (from && to) {
              // Adjust 'to' date to end of day
              const tomorrow = new Date(to);
              tomorrow.setDate(tomorrow.getDate() + 1);
              tomorrow.setHours(0, 0, 0, 0);
              whereClause.createdAt = {
                  [Op.between]: [from, tomorrow]
              }
          }
  
          if (deviceType && deviceType != 'all') {
              whereClause.deviceType = deviceType;
          }
          // else {
          //     delete includeOptions[0].where.serviceCategory;
          // }
  
  
          const data = await banner.findAndCountAll({
              where: whereClause,
              order: order,
              raw: true,
              nest: true
          });
          let finalData = [];
          data.rows.forEach(function (limitData) {
              finalData.push({
                  Date: limitData.createdAt ? formattedDateTime(limitData.createdAt) : "Not Available",
                  "Banner Link": limitData.bannerLink ? limitData.bannerLink : "Not Available",
                  // "Banner Title": limitData.bannerTitle ? limitData.bannerTitle : "Not Available",
                  // Description: limitData.description ? limitData.description : "Not Available",
                  // Highlights: limitData.highlights ? limitData.highlights : "Not Available",
                  "Device Type": limitData.deviceType ? limitData.deviceType : "Not Available",
                  "Position": limitData.position ? limitData.position : "Not Available",
                  "Partner Id": limitData.partnerId ? limitData.partnerId : "Not Available",
                  "Banner Image": limitData.bannerImage ? limitData.bannerImage : "Not Available",
                  Status: limitData.status > 0 ? "Active" : "In Active",
              });
          });
          return finalData;
      } catch (error) {
          console.log(error);
          throw { message: 'Something went wrong' };
      }
  
  })