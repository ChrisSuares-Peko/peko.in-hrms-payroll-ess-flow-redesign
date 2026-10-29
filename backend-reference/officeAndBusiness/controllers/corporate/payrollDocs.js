const {
  findAllDocuments,
  findAllCategories,
  findAllpayrollDocs,
} = require("../../models/use-cases/payrollDocs");
const asyncHandler = require("../../middlewares/async");
const ErrorResponse = require("../../utils/error-response");

exports.findAllCategoriesAndCount = asyncHandler(async (req, res, next) => {
  let categoryAttributes = ["id", "categoryName", "categoryImage"];
  let vendorAttributes = [];
  const categoryData = await findAllCategories(
    categoryAttributes,
    vendorAttributes
  );
  const documentData = await findAllpayrollDocs();

  const categoryDataWithCounts = categoryData.map((category) => {
    const matchingDocuments = documentData.filter(
      (doc) => doc.categoryId === category.id
    );
    return {
      id: category.id,
      categoryName: category.categoryName,
      categoryImage: category.categoryImage,
      documentCount: matchingDocuments.length,
    };
  });

  if (!categoryData) {
    return next(
      new ErrorResponse(`Something went wrong while fetching categories`, 500)
    );
  } else {
    return res.status(200).json({
      status: true,
      data: { categoryDataWithCounts },
      message: "all categories fetched successfully",
      responseCode: "000",
    });
  }
});

exports.findAllDocumentsAndCount = asyncHandler(async (req, res, next) => {
  let { categoryName, searchText, sort, page, itemsPerPage } = req.query;
  let attributes = ["id", "documentUrl", "documentName"];

  // Parse page and itemsPerPage to integers (you can also use parseInt)
  page = page ? parseInt(page) : 1;
  itemsPerPage = itemsPerPage ? parseInt(itemsPerPage) : null;
  let limit = itemsPerPage;

  // Calculate offset based on page and itemsPerPage
  let offset;
  if (page && itemsPerPage) {
    offset = (page - 1) * itemsPerPage;
  }

  const documentData = await findAllDocuments(
    categoryName,
    searchText,
    sort,
    limit,
    offset,
    attributes
  );
  if (!documentData) {
    return next(
      new ErrorResponse(`Something went wrong while fetching documents`, 500)
    );
  } else {
    return res.status(200).json({
      status: true,
      data: documentData,
      message: "all documents fetched successfully",
      responseCode: "000",
    });
  }
});
