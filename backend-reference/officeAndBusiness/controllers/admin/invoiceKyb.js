const asyncHandler = require("../../middlewares/async");

const { findAllInvoiceSuppliers, updateSupplierStatus } = require("../../models/use-cases/invoiceSupplier");

const ErrorResponse = require("../../utils/error-response");

exports.findAllInvoiceKybAndCount = asyncHandler(async (req, res, next) => {

    const page = parseInt(req.query.page) || 1;
    const itemsPerPage = parseInt(req.query.itemsPerPage) || 10;
    let searchText = req.query.searchText || '';
    const sort = req.query.sort && req.query.sort === 'ASC' ? 'ASC' : 'DESC';
    let sortField = req.query.sortField || 'createdAt'

    let params = {
        page,
        itemsPerPage,
        searchText,
        sort,
        sortField
    };

    const kybData = await findAllInvoiceSuppliers(params);

    if (!kybData) {
        return next(new ErrorResponse(`Something went wrong while getting user kyb details`, 400))
    }

    return res.status(200).json({
        status: true,
        data: {
            recordsTotal: kybData ? kybData.count : 0,
            rows: kybData.rows ? kybData.rows : []
        },
        message: 'Fetched Successfully',
        responseCode: '000'
    });
});

exports.updateKybStatus = asyncHandler(async (req, res, next) => {
    try {
        const corporateId = req.params.corporateId
        const { kybStatus } = req.body
        const rejectReason = req.body.rejectReason || null
    
        const data = await updateSupplierStatus({ corporateId, kybStatus, rejectReason })
        if (!data.isUpdated) {
            return next(new ErrorResponse(`Something went wrong while updating status `, 400))
        }
        
        return res.status(200).json({
            status: true,
            data: {},
            message: 'Status Updated Successfully',
            responseCode: '000'
        });
        
    } catch (error) {
        return next(new ErrorResponse(`Something went wrong while updating status `, 400))
    }
})
