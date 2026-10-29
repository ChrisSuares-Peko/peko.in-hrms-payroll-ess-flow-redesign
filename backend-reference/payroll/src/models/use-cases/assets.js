const asyncHandler = require("../../middleware/async");
const Asset = require("../entities/assets");
const { escapeSearch } = require('../../utils/escapeRegex');

exports.getAllAssets = async (params) => {
    try {
        const page = parseInt(params.page) || 1;
        const limit = parseInt(params.limit) || 10;
        const searchText = params.searchText || '';
        const assetType = params.assetType || '';
        const status = params.status || '';
        const skip = (page - 1) * limit;
        console.log(status,"Statttus")
        const queryConditions = {
            corporateUser: params.corporateUserID
        };

        // Add $or condition only if searchText is provided
        if (searchText) {
            console.log(searchText)
            queryConditions.$or = [
                { assetName: { $regex: new RegExp(`^${escapeSearch(searchText)}`, 'i') } },
                { assetId: { $regex: new RegExp(`^${escapeSearch(searchText)}`, 'i') } },
                { assetType: { $regex: new RegExp(`^${escapeSearch(searchText)}`, 'i') } },
                { status: { $regex: new RegExp(`^${escapeSearch(searchText)}`, 'i') } }
            ];
        }

        if (assetType) {
            queryConditions.assetType = { $regex: new RegExp(`^${escapeSearch(assetType)}`, 'i') };
        }

        if (status) {
            queryConditions.status = { $regex: new RegExp(`^${escapeSearch(status)}`, 'i') };
        }

        const assetData = await Asset.find(queryConditions).populate({
            path: 'employee',
            model: 'Employee',
            select: 'fullName'
        })
            .skip(skip)
            .limit(limit)
            .exec();

        const totalCount = await Asset.countDocuments(queryConditions);

        return {
            totalCount,
            assetData
        };
    } catch (error) {
        return (error);
    }
};

exports.createAssetData = asyncHandler(async (params) => {
    try {
        const assetsData = params.assetData;
        const newAssets = new Asset({
            ...assetsData,
            corporateUser: params.corporateUserID
        });

        const savedAssets = await newAssets.save();
        return savedAssets;


    } catch (error) {
        throw new Error('Error occured while adding asset. Please try again');
    }
});

exports.updateAssetData = asyncHandler(async (params) => {
    try {
        const { corporateUserID, assetId, assetData } = params;

        const updatedAsset = await Asset.findOneAndUpdate(
            { _id: assetId, corporateUser: corporateUserID },
            { $set: assetData },
            {new:true}
           
        );


        return updatedAsset;
    } catch (error) {
        return error;
    }
});



exports.deleteAsset = asyncHandler(async (params) => {
    try {
        const corporateUserID = params.corporateUserID;
        const assetId = params.assetId;

        const deleteAssetsData = await Asset.findOneAndDelete({
            _id: assetId,
            corporateUser: corporateUserID
        });

        return deleteAssetsData;


    } catch (error) {
        return error
    }
});

exports.uniqueAssets = asyncHandler(async (corporateUserID) => {
    try {
        const uniqueAssets = await Asset.aggregate([
            {
                $match: {
                    corporateUser: corporateUserID
                }
            },
            {
                $group: {
                    _id: "$assetType",
                    count: { $sum: 1 }
                }
            },
            {
                $project: {
                    _id: 0, // Exclude id field
                    label: "$_id",
                    value: "$_id",
                }
            }
        ]);

        return uniqueAssets;
    } catch (error) {
        return error;
    }
})



exports.findEmployeeAssets = asyncHandler(
  async ({employeeId, corporateUserId, searchText, assetType, status}) => {
    try {
       
      // Base query (mandatory filters)
      const query = {
        employee: employeeId,
        corporateUser: corporateUserId,
      };

      // 🔎 Search by text (example: assetName)
      if (searchText && searchText.trim() !== '') {
        query.$or = [
          {
            assetName: {
              $regex: escapeSearch(searchText),
              $options: 'i', // case-insensitive
            },
          },
          {
            assetCode: {
              $regex: escapeSearch(searchText),
              $options: 'i',
            },
          },
        ];
      }

      //  Filter by asset type
      if (assetType && assetType !== '') {
        query.assetType = assetType;
      }
      //  Filter by status
      if (status && status !== '') {
        query.status = status?.toUpperCase();
      }
    const assets = await Asset.find(query).sort({ createdAt: -1 });
      return assets;
    } catch (error) {
      throw new Error('Error fetching employee assets');
    }
  }
);