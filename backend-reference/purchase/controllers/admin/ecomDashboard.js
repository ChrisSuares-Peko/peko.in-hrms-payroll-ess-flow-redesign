const { findStatusCountEcommerce, findLatestFiveOrders } = require("../../models/use-cases/transaction");
const asyncHandler = require("../../middlewares/async");
const { fetchCounts } = require("../../models/use-cases/products");
const ErrorResponse = require("../../utils/error-response");

exports.fetchEcommerceOrdersByStatus = asyncHandler(async (req, res, next) => {
    const serviceCategory = "Office Supplies"
    const result = await findStatusCountEcommerce({serviceCategory})
    const products = await fetchCounts();
    if (!result) {
      return next(new ErrorResponse(`Something went wrong while fetching counts by status`, 500));
    } else {
      const totalCount = result.reduce((sum, order) => sum + order.count, 0);
      const countsByStatus = result.reduce((acc, item) => {
          acc[item.ecomOrderStatus] = item.count;
        return acc;
      }, {});
      return res.status(200).json({
        status: true,
        data: {...countsByStatus,TOTAL: totalCount,PRODUCTSCOUNT:products.count },
        message: "Ecommerce status count fetched successfully",
        responseCode: '000'
      });
    }
  })

  exports.findLatestOrder = asyncHandler(async (req, res, next) => {
    const length = 5;
    const order = 'DESC';
    const column = 'createdAt';
    const serviceCategory = 'Office Supplies';
    let params = {
      length,
      order,
      column,
      serviceCategory
    };
    const transactionsData = await findLatestFiveOrders(params);
    if (!transactionsData) {
      return next(new ErrorResponse(`Something went wrong while getting latest orders from DB`, 500));
    } else {
      return res.status(200).json({
        status: true,
        data: {
        recordsTotal: transactionsData.count,
        recordsFiltered: transactionsData.count,
        data: transactionsData.rows },
        message: 'Transaction fetched successfully',
        responseCode: '000'
      });
    }
  });