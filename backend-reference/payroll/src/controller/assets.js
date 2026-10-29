const asyncHandler = require("../middleware/async");
const Asset = require("../models/entities/assets");
const Employee = require("../models/entities/employee");
const { getAllAssets, createAssetData, deleteAsset, uniqueAssets,findEmployeeAssets,updateAssetData } = require("../models/use-cases/assets");
const ErrorResponse = require('../utils/error-response');
const { humanReadableDate } = require("../utils/dateUtils");
const emailer = require("../utils/email/emailer");
const { customLog } = require("../utils/loggerHelper");
const { findOneHrSettings } = require("../models/use-cases/hrSettings");
const { fetchPartnerBranding } = require("../services/partnerDetailsResolver");
const { resolveDynamicEmail } = require("../services/emailTemplateResolver");
const { PAYROLL_EMAIL_TEMPLATE_KEYS } = require("../utils/email/emailTemplateKeys");
const { v2LayoutVariables } = require("../utils/email/sharedLayout");
const {
  assetAddedToInventory,
  assetAssignedToEmployee,
  assetDecommissioned,
} = require("../utils/email/emailTemplates/assets");
const { sanitizeBody, isEmployeeOfCorporate } = require("../utils/tenantScope");

// Notify corporate (and the assigned employee, if any) that a new asset was added.
// Best-effort: a mail failure must never fail the asset creation.
async function emailAssetAdded({ req, corporateUserId, asset, logTraceId }) {
  try {
    const hrSettings = await findOneHrSettings(corporateUserId);
    const companyName = hrSettings?.companyProfile?.companyName || hrSettings?.corporateUser?.companyName;
    const partnerBranding = await fetchPartnerBranding(req);
    const isPartner = !!req.user?.registeredBy;
    // Logo/branding name stay exactly as fetchPartnerBranding resolves them - only the
    // website/link falls back to the corporate's own saved website when there's no
    // genuine reseller partner registration, instead of Peko's own.
    const branding = {
      ...partnerBranding,
      website: isPartner ? partnerBranding?.website : (hrSettings?.corporateUser?.website || partnerBranding?.website),
    };

    const corporateEmail = hrSettings?.corporateUser?.email;
    if (corporateEmail) {
      const resolvedCorporateEmail = await resolveDynamicEmail({
        req,
        key: PAYROLL_EMAIL_TEMPLATE_KEYS.ASSET_ADDED_TO_INVENTORY,
        variables: {
          adminName: companyName || 'Team',
          assetName: asset?.assetName || '',
          assetId: asset?.assetId || '',
          assetCategory: asset?.assetType || '',
          ...v2LayoutVariables(branding),
        },
        fallbackSubject: 'New Asset Added to Inventory',
        fallbackHtml: assetAddedToInventory({
          adminName: companyName,
          assetName: asset?.assetName,
          assetId: asset?.assetId,
          assetCategory: asset?.assetType,
        }, branding),
        partnerId: req.user?.registeredBy || null,
      });

      const response = await emailer.email(corporateEmail, resolvedCorporateEmail.subject, resolvedCorporateEmail.html);
      if (!response?.status) {
        customLog(logTraceId, "error", { message: "Failed to send asset added to inventory email", error: response?.message });
      }
    }

    if (asset?.employee) {
      const employee = await Employee.findOne(
        { _id: asset.employee, corporateUser: corporateUserId },
        'personalInformation.fullName personalInformation.email'
      );
      const employeeEmail = employee?.personalInformation?.email;
      if (employeeEmail) {
        const resolvedEmployeeEmail = await resolveDynamicEmail({
          req,
          key: PAYROLL_EMAIL_TEMPLATE_KEYS.ASSET_ASSIGNED_TO_EMPLOYEE,
          variables: {
            companyName: companyName || 'Peko',
            employeeName: employee?.personalInformation?.fullName || 'Employee',
            assetName: asset?.assetName || '',
            assetId: asset?.assetId || '',
            assignedDate: asset?.purchasedDate ? humanReadableDate(asset.purchasedDate) : '',
            ...v2LayoutVariables(branding),
          },
          fallbackSubject: `${asset?.assetName || 'An asset'} has been assigned to you`,
          fallbackHtml: assetAssignedToEmployee({
            companyName,
            employeeName: employee?.personalInformation?.fullName,
            assetName: asset?.assetName,
            assetId: asset?.assetId,
            assignedDate: asset?.purchasedDate ? humanReadableDate(asset.purchasedDate) : '',
          }, branding),
          partnerId: req.user?.registeredBy || null,
        });

        const response = await emailer.email(employeeEmail, resolvedEmployeeEmail.subject, resolvedEmployeeEmail.html);
        if (!response?.status) {
          customLog(logTraceId, "error", { message: "Failed to send asset assigned to employee email", error: response?.message });
        }
      }
    }
  } catch (error) {
    customLog(logTraceId, "error", { message: "Failed to send asset added email", error: error?.message });
  }
}

// Notify corporate that an asset has been removed from their inventory.
// Best-effort: a mail failure must never fail the asset deletion.
async function emailAssetDecommissioned({ req, corporateUserId, asset, logTraceId }) {
  try {
    const hrSettings = await findOneHrSettings(corporateUserId);
    const companyName = hrSettings?.companyProfile?.companyName || hrSettings?.corporateUser?.companyName;
    const partnerBranding = await fetchPartnerBranding(req);
    const isPartner = !!req.user?.registeredBy;
    // Logo/branding name stay exactly as fetchPartnerBranding resolves them - only the
    // website/link falls back to the corporate's own saved website when there's no
    // genuine reseller partner registration, instead of Peko's own.
    const branding = {
      ...partnerBranding,
      website: isPartner ? partnerBranding?.website : (hrSettings?.corporateUser?.website || partnerBranding?.website),
    };

    const corporateEmail = hrSettings?.corporateUser?.email;
    if (!corporateEmail) {
      return;
    }

    const resolvedEmail = await resolveDynamicEmail({
      req,
      key: PAYROLL_EMAIL_TEMPLATE_KEYS.ASSET_DECOMMISSIONED,
      variables: {
        adminName: companyName || 'Team',
        assetName: asset?.assetName || '',
        assetId: asset?.assetId || '',
        ...v2LayoutVariables(branding),
      },
      fallbackSubject: `${asset?.assetName || 'Asset'} has been decommissioned`,
      fallbackHtml: assetDecommissioned({
        adminName: companyName,
        assetName: asset?.assetName,
        assetId: asset?.assetId,
      }, branding),
      partnerId: req.user?.registeredBy || null,
    });

    const response = await emailer.email(corporateEmail, resolvedEmail.subject, resolvedEmail.html);
    if (!response?.status) {
      customLog(logTraceId, "error", { message: "Failed to send asset decommissioned email", error: response?.message });
    }
  } catch (error) {
    customLog(logTraceId, "error", { message: "Failed to send asset decommissioned email", error: error?.message });
  }
}

exports.getAllAssets = asyncHandler(async (req, res, next) => {
        const corporateUserID = req.user._id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const searchText = req.query.searchText || '';
        const assetType = req.query.assetType;
        const status = req.query.status;
        const skip = (page - 1) * limit;

        const params = {
            corporateUserID,
            page,
            limit,
            searchText,
            assetType,
            skip,
            status
        }

        const result = await getAllAssets(params);

        if (result.errors) {
            return next(new ErrorResponse('something went wrong while fetching assets', 400));
        }

        return res.status(201).json({
            status: true,
            responseCode: '000',
            message: 'Assets fetched successfully',
            data: result
        });

})

exports.createAssets = asyncHandler(async (req, res, next) => {
    
        const corporateUserID = req.user._id;
        if (!(await isEmployeeOfCorporate(req.body.employee, corporateUserID))) {
            return next(new ErrorResponse('Employee not found', 404));
        }
        const assetData = { ...sanitizeBody(req.body), employee: req.body.employee };

        const params = {
            corporateUserID,
            assetData
        }

        const result = await createAssetData(params);

        await emailAssetAdded({
            req,
            corporateUserId: corporateUserID,
            asset: result?.toObject ? result.toObject() : result,
            logTraceId: req?.LogTraceId,
        });

        return res.status(201).json({
            status: true,
            responseCode: '000',
            message: 'Assets created successfully',
            data: result
        });

})

exports.deleteAssets = asyncHandler(async (req, res, next) => {
    
        const corporateUserID = req.user._id;
        const assetId = req.params.assetId;

        const foundAssets = await Asset.findOne({
            _id: assetId,
            corporateUser: corporateUserID
        });
        if (!foundAssets) {
            return next(new ErrorResponse('assets not found or unauthorized to delete', 400));
        }

        const params = {
            corporateUserID,
            assetId
        }

        const result = await deleteAsset(params);

        await emailAssetDecommissioned({
            req,
            corporateUserId: corporateUserID,
            asset: foundAssets,
            logTraceId: req?.LogTraceId,
        });

        return res.status(201).json({
            status: true,
            responseCode: '000',
            message: 'Assets deleted successfully',
            data: result
        });

})

exports.fetchAllAssetTypes = asyncHandler(async (req, res) => {
    
    
        const corporateUserID = req.user._id;

        const assetTypes = await uniqueAssets(corporateUserID)

        if (assetTypes) {
            return res.status(200).json({
                status: true,
                data: {assetTypes},
                message: 'Fetched all assets type successfully',
                responseCode: '000'
            })
        } else {
            return res.status(400).json({
                status: false,
                data: {},
                message: 'Something went wrong while fetching assets types',
                responseCode: '000'
            })
        }
        
})


exports.getAllAssetsById = asyncHandler(async (req, res, next) => {
   
  const { employeeId } = req.params;

  const corporateUserId = req.user._id;
   const searchText = req.query.searchText || '';
   const assetType = req.query.assetType;
   const status = req.query.status;
  const params={employeeId, corporateUserId,searchText,assetType,status}
  const result = await findEmployeeAssets(params);
  if (result.errors) {
    return next(
      new ErrorResponse("something went wrong while fetching assets", 400)
    );
  }

  return res.status(201).json({
    status: true,
    responseCode: "000",
    message: "Assets fetched successfully",
    data: {
        assets: result,
        total: result.length
      },
  });
});


exports.updateAssets = asyncHandler(async (req, res, next) => {
    const { assetId } = req.params;
   
    const corporateUserId = req.user._id;
    
    const assetData = sanitizeBody(req.body);
    // Reassigning the asset is allowed, but only to an employee of this corporate.
    if (req.body.employee) {
        if (!(await isEmployeeOfCorporate(req.body.employee, corporateUserId))) {
            return next(new ErrorResponse('Employee not found', 404));
        }
        assetData.employee = req.body.employee;
    }

    const params = {
        corporateUserID: corporateUserId,
        assetId: assetId,
        assetData
    };

    const result = await updateAssetData(params);


    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'Asset updated successfully',
        data: result
    });
})
