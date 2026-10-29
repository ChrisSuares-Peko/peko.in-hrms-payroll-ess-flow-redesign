const ErrorResponse = require("../../../utils/error-response");
const asyncHandler = require("../../../middlewares/async");
const {
  createAssetDoc,
  findAllAssetDocs,
  updateAssetDoc,
  deleteAssetDoc,
} = require("../../../models/use-cases/pekoCloud/cloud_assetDocs");

exports.createAssetDoc = asyncHandler(async (req, res, next) => {
  let data = req.body;
  let credentialId = req.user.id;

  //subcorporate user
  if (req.user?.role === 'CORPORATE_SUB_USER' && req.user?.subCorporateId) {
    data.subCorporateUserId = req.user?.subCorporateId
  }
  const result = await createAssetDoc({ ...data, credentialId }, req.user);
  if (!result.success) {
    return next(new ErrorResponse(result.error, 500));
  } else {
    return res.status(200).json({
      status: true,
      data: result,
      message: "Document created successfully",
      responseCode: "000",
    });
  }
});

//list all Asset Docs
exports.findAllAssetDocs = asyncHandler(async (req, res, next) => {
  let { page, itemsPerPage, sortField, sort, searchText, assetId } =
    req.query;
  page = page ? parseInt(page) : 1;
  itemsPerPage = itemsPerPage ? parseInt(itemsPerPage) : 10;

  if (!sortField || !sort) {
    sortField = sortField || 'createdAt'
    sort = sort == 'ASC' ? 'ASC' : 'DESC'
  }

  const result = await findAllAssetDocs(
    page,
    itemsPerPage,
    sortField,
    sort,
    searchText,
    assetId
  );
  if (!result.success) {
    return next(
      new ErrorResponse(`Something went wrong while fetching documents`, 500)
    );
  }

  return res.status(200).json({
    status: true,
    data: {
      result: result?.data?.rows,
      totalData: result?.data?.count,
    },
    message: "Fetched Documents successfully",
    responseCode: "000",
  });
});

exports.updateAssetDoc = asyncHandler(async (req, res, next) => {
  const { docId } = req.params;
  const data = req.body;
  const credentialId = req.user.id;
  const owner = (req.user?.role === 'CORPORATE_SUB_USER' && req.user?.subCorporateId)
      ? { subCorporateUserId: req.user.subCorporateId }
      : { credentialId };
  const result = await updateAssetDoc(docId, {...data, credentialId}, req.user, owner);
  if (!result.success) {
    return next(new ErrorResponse(result.error, 500));
  }

  return res.status(200).json({
    status: true,
    data: result?.data,
    message: "Document updated successfully",
    responseCode: "000",
  });
});

//Delete Asset Doc
exports.deleteAssetDoc = asyncHandler(async (req, res, next) => {
  const { docId } = req.params;

  const owner = (req.user?.role === 'CORPORATE_SUB_USER' && req.user?.subCorporateId)
      ? { subCorporateUserId: req.user.subCorporateId }
      : { credentialId: req.user.id };
  const result = await deleteAssetDoc(docId, owner);
  if (!result.success) {
    return next(new ErrorResponse(result.error, 500));
  }

  return res.status(200).json({
    status: true,
    data: result?.data,
    message: "Document deleted successfully",
    responseCode: "000",
  });
});
