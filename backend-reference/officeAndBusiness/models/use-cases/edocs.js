/* eslint-disable no-unused-vars */
/* eslint-disable no-prototype-builtins */
const edocs = require('../entities/edocs')
const category = require('../entities/categories');
const {
    Op
} = require("sequelize");
const asyncHandler = require('../../middlewares/async')
const vendors = require('../entities/vendor');
const { formatNumberWithLocalString, formattedDateTime } = require("../../utils/formatter");
const { handleSortFields } = require("../../utils/sortHandle");
const { uploadFile } = require('../../utils/commonUploadFile');

exports.create = asyncHandler(async (params) => {
    if (params.hasOwnProperty('documentBase') && params.documentFormat) {
        const publicUrl = await uploadFile(params.documentBase, 'docs/edocs', params.documentFormat);
        //params = {}
        params.documentUrl = publicUrl;
    }
    return await edocs.create(params)
})

exports.update = asyncHandler(async (params, data) => {

    return await edocs.update(data, {
        where: {
            id: params.id
        }
    })

})

exports.findOne = asyncHandler(async (params) => {
    try {
        let {
            documentName,
            documentType,
        } = params
        return await edocs.findOne({
            where: {
                documentName,
                documentType
            },
            raw: true
        })
    } catch (error) {
        console.log(error)
    } finally {
        console.log("DOCUMENT FIND ONE ROUTE CALLED")
    }
})

exports.documentsAndCountExport = asyncHandler(async ({ searchText, sort, sortField }) => {
    try{
        let order = handleSortFields(sortField,sort)
    
        const searchPattern = `%${searchText}%`;
    
        const data = await edocs.findAndCountAll({
            include: [{
                model: category,
                attributes: ['id', 'categoryName']
            }],
            where: {
                [Op.or]: [
                    { id: { [Op.like]: searchPattern } },
                    { documentName: { [Op.like]: searchPattern } },
                    { description: { [Op.like]: searchPattern } },
                    {'$category.categoryName$': {
                        [Op.like]: '%' + searchText + '%',
                    }},
                ]
            },
            order: order,
            raw: true,
            nest: true,
        });
    
        let finalData = []
        data.rows.forEach(function (limitData) {
            finalData.push({
                Date: limitData.createdAt ? formattedDateTime(limitData.createdAt) : 'Not Available',
                "Document Name": limitData.documentName ? limitData.documentName : "Not Available",
                Category: limitData.category?.categoryName ? limitData.category?.categoryName : "Not Available",
                Description: limitData.description ? limitData.description : "Not Available",
                "Document Url": limitData.documentUrl ? limitData.documentUrl : "Not Available",
                Status: limitData.status>0 ? "Active"  : "In Active",
            })
        })
        return finalData
    } catch (error) {
      console.log(error);
      throw  {message:'Something went wrong'};
    }
});

exports.Delete = asyncHandler(async (params) => {
    return await edocs.destroy({
        where: {
            id: params.id
        }
    })
})

exports.findAllDocumentsCount = asyncHandler(async ({ page, itemsPerPage, searchText, sort, sortField }) => {
    try{
        let order = handleSortFields(sortField,sort)
        const searchPattern = `%${searchText}%`;
    
        const data = await edocs.findAndCountAll({
            include: [{
                model: category,
                attributes: ['id', 'categoryName']
            }],
            where: {
                [Op.or]: [
                    { id: { [Op.like]: searchPattern } },
                    { documentName: { [Op.like]: searchPattern } },
                    { description: { [Op.like]: searchPattern } },
                    {'$category.categoryName$': {[Op.like]: '%' + searchText + '%',
                 },}
                ]
            },
            order: order,
            limit: itemsPerPage,
            offset: (page - 1) * itemsPerPage,
            raw: true,
            nest: true,
        });
    
        return data;
    } catch (error) {
      console.log(error);
      throw  {message:'Something went wrong'};
    }
})

exports.fetchAllCategories = async (params) => {
    try {
        return await category.findAll({
            include: [{
                model: vendors,
                attributes: ['id', 'vendorName'],
                where: {
                    vendorName: 'edocs',
                }
            }],
            where: {
                categoryStatus: true
            }
        })
    } catch (error) {
        console.log(error)
    } finally {
        console.log("CATEGORY FIND ALL ROUTE CALLED")
    }
}

exports.getExcelCSVData = asyncHandler(async () => {

    const data = await edocs.findAndCountAll({
        order: [
            ['createdAt', 'DESC']
        ],
        raw: true,
        nest: true
    })

    let finalData = []
    data.rows.forEach(function (documentData) {
        finalData.push({
            'ID': documentData.id,
            'Document Type': documentData.documentType ? documentData.documentType : 'Not Available',
            'Document Name': documentData.documentName ? documentData.documentName : 'Not Available',
            'Document URL': documentData.documentUrl ? documentData.documentUrl : 'Not Available',
            'Status': documentData.status !== null ? (documentData.status ? 'Active' : 'Inactive') : 'Not Available'
        })
    })
    return finalData
})

exports.findAllCategories = async (categoryAttributes = undefined, vendorAttributes = undefined) => {
    try {
        return await category.findAll({
            attributes: categoryAttributes,
            include: [{
                model: vendors,
                where: {
                    vendorName: 'edocs',
                },
                attributes: vendorAttributes,
            }],
            where: {
                categoryStatus: true
            }
        })
    } catch (error) {
        console.log(error)
    } finally {
        console.log("CATEGORY FIND ALL ROUTE CALLED")
    }
}

exports.findAllDocuments = async (categoryName, searchText, sort, limit, offset, attributes = undefined) => {
    try {
        const queryOptions = {
            include: {
                model: category,
                attributes: ['id', 'categoryname']
            },
            where: {
                status: true
            },
            attributes,
            limit,
            offset,
            order: []
        };

        if (categoryName) {
            queryOptions.where['$category.categoryname$'] = categoryName;
        }

        if (searchText) {
            queryOptions.where.documentName = { [Op.like]: `%${searchText}%` };
        }

        if (sort) {
            if (sort === 'name') {
                queryOptions.order.push(['documentName', 'ASC']);
            } else if (sort === 'date') {
                queryOptions.order.push(['createdAt', 'DESC']);
            }
        }

        const documents = await edocs.findAll(queryOptions);

        const totalCount = await edocs.count({
            include: {
                model: category,
                attributes: ['id', 'categoryname']
            },
            where: {
                status: true,
                ...queryOptions.where 
            }
        });

        return {
            documents,
            totalCount
        };
    } catch (error) {
        console.log(error);
    } finally {
        console.log("DOCUMENT FIND ALL ROUTE CALLED");
    }
};

exports.findAllEdocs = async () => {
    try {
        const queryOptions = {
            attributes: ['id', 'documentName', 'categoryId'],
            where: {
                status: true
            }
        };
        return await edocs.findAll(queryOptions);
    } catch (error) {
        console.log(error);
    } finally {
        console.log("DOCUMENT FIND ALL ROUTE CALLED");
    }
};