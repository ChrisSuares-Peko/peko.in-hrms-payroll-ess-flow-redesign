const ErrorResponse = require("../../utils/error-response");
const { customLog } = require("../../utils/loggerHelper");
const {
    getAllCatalog,
    createCatalogItem,
    updateCatalogItem,
    deleteCatalogItem,
} = require("../../models/use-cases/invoiceCatalog");

// GET /invoicing/v2/catalog
exports.getCatalog = async (req, res, next) => {
    try {
        const corporateUserId = req.user.corporateId;
        let { searchText, sortField, sort, from, to, page, itemsPerPage } = req.query;

        page = page ? parseInt(page) : 1;
        itemsPerPage = itemsPerPage ? parseInt(itemsPerPage) : null;
        const limit = itemsPerPage || null;
        const offset = page && itemsPerPage ? (page - 1) * itemsPerPage : 0;

        const params = { corporateUserId, searchText, sortField, sort, from, to, limit, offset };
        if (req.user.role === "CORPORATE_SUB_USER" && req.user.subCorporateId) {
            params.subCorporateUserId = req.user.subCorporateId;
        }

        const data = await getAllCatalog(params);
        return res.status(200).json({
            status: true,
            data,
            message: "Catalog fetched successfully",
            responseCode: "000",
        });
    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message });
        return next(new ErrorResponse("Failed to fetch catalog", 500));
    }
};

// POST /invoicing/v2/catalog
exports.addProduct = async (req, res, next) => {
    try {
        const corporateUserId = req.user.corporateId;
        const data = { ...req.body, corporateUserId };
        if (req.user.role === "CORPORATE_SUB_USER" && req.user.subCorporateId) {
            data.subCorporateUserId = req.user.subCorporateId;
        }
        const item = await createCatalogItem(data);
        return res.status(201).json({
            status: true,
            data: item,
            message: "Product added successfully",
            responseCode: "000",
        });
    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message });
        return next(new ErrorResponse("Failed to add product", 500));
    }
};

// PUT /invoicing/v2/catalog/:id
exports.editProduct = async (req, res, next) => {
    try {
        const corporateUserId = req.user.corporateId;
        const { id } = req.params;
        const item = await updateCatalogItem(id, corporateUserId, req.body);
        if (!item) return next(new ErrorResponse("Product not found", 404));
        return res.status(200).json({
            status: true,
            data: item,
            message: "Product updated successfully",
            responseCode: "000",
        });
    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message });
        return next(new ErrorResponse("Failed to update product", 500));
    }
};

// DELETE /invoicing/v2/catalog/:id
exports.deleteProduct = async (req, res, next) => {
    try {
        const corporateUserId = req.user.corporateId;
        const { id } = req.params;
        const result = await deleteCatalogItem(id, corporateUserId);
        if (!result) return next(new ErrorResponse("Product not found", 404));
        return res.status(200).json({
            status: true,
            data: {},
            message: "Product deleted successfully",
            responseCode: "000",
        });
    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message });
        return next(new ErrorResponse("Failed to delete product", 500));
    }
};
