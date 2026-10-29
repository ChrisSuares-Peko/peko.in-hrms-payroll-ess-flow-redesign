const {
    findAllCategory,
    findAllCategoryCount,
    updateCategory,
    find,
    create,
    deleteCategory,
    fetchCategory,
    getExcelCSVData
} = require('../../models/use-cases/category')
const asyncHandler = require('../../middlewares/async')
const ErrorResponse = require('../../utils/error-response');
const { uploadFile } = require('../../utils/commonUploadFile');

exports.createCategory = asyncHandler(async (req, res, next) => {
    const data = req.body
  
    const isCategoryAvailable = await find(data);
    if (isCategoryAvailable) {
        return next(new ErrorResponse(`Category Already Exists with this name`, 200))
    }
    if (data.categoryImage && data.imageFormat) {
        const publicUrl = await uploadFile(data.categoryImage, 'category', data.imageFormat);
        data.categoryImage = publicUrl;
    }
    let result = await create(data)
    if (!result) {
        return next(new ErrorResponse(`Something went wrong while adding Category`, 200))
    } else {
        return res.status(200).json({
            'success': true,
            'data': result,
            'message': 'Category added succesfully'
        })
    }
});

exports.findAllCategoryAndCount = asyncHandler(async (req, res, next) => {
    const start = parseInt(req.query.start)
    const length = parseInt(req.query.length)
    const draw = parseInt(req.query.draw)
    let searchText = req.query.search.value
    let order = req.query.orderCol,
        column = req.query.column
    let params = {
        start,
        length,
        draw,
        searchText,
        order,
        column
    }
    const categoryData = await findAllCategoryCount(params);
    if (!categoryData) {
        return next(new ErrorResponse(`Something went wrong while getting all categories from DB`, 200))
    } else {
        return res.status(200).json({
            'success': true,
            'draw': draw,
            'recordsTotal': categoryData ? categoryData.count : 0,
            'recordsFiltered': categoryData ? categoryData.count : 0,
            'data': categoryData ? categoryData.rows : 0
        })
    }
});

exports.updateCategory = asyncHandler(async (req, res, next) => {
    let params = req.params
    let data = req.body
    const isCategoryAvailable = await find(data);
    if (isCategoryAvailable && isCategoryAvailable.id != params.id) {
        return next(new ErrorResponse(`Category Already Exists with this name`, 210))
    }
    if (data.categoryImage && data.imageFormat) {
        const publicUrl = await uploadFile(data.categoryImage, 'category', data.imageFormat);
        data.categoryImage = publicUrl;
    }
    const result = await updateCategory(params, data);
    if (!result) {
        return next(new ErrorResponse(`Something went wrong while updating category`, 200))
    } else {
        return res.status(200).json({
            'success': true,
            'data': 'Updated successfully',
            'message': 'Category updated successfully'
        })
    }
});

exports.fetchCategory = asyncHandler(async (req, res, next) => {
    let searchText = req.query.q
    let result = await fetchCategory(searchText)
    if (!result) {
        return next(new ErrorResponse(`Something went wrong while fetching specific Category`, 200))
    } else {
        return res.status(200).json({
            'success': true,
            'data': result
        })
    }
})

exports.findAllCategory = asyncHandler(async (req, res, next) => {
    let result = await findAllCategory()
    if (!result) {
        return next(new ErrorResponse(`Something went wrong while fetching Category`, 200))
    } else {
        return res.status(200).json({
            'success': true,
            'data': result
        })
    }
})

exports.getExcel = asyncHandler(async (req, res, next) => {

    let result = await getExcelCSVData()
    if (!result) {
        return next(new ErrorResponse(`Something went wrong while fetching excelCSV data`, 200))
    } else {
        return res.status(200).json({
            'success': true,
            'data': result
        })
    }
})

exports.deleteCategory = async (req, res) => {
    const id = req.params.id;
    try {
      const result = await deleteCategory({id});
      if (result) {
        res.sendStatus(204);
      } else {
        res.sendStatus(404);
      }
    } catch (error) {
      res.status(500).send(error);
    }
};