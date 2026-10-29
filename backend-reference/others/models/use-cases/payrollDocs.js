/* eslint-disable no-unused-vars */
/* eslint-disable no-prototype-builtins */
const payrollDocs = require('../entities/payrollDocs')
const category = require('../entities/payrollCategories');
const vendor = require('../entities/vendor')
const {
    Op
} = require("sequelize");
const asyncHandler = require('../../middlewares/async')
const {
    uploadFile
} = require("../../utils/commonUploadFile");
const vendors = require('../entities/vendor');
const {  formattedDateTime } = require("../../utils/formatter");
const { handleSortFields } = require("../../utils/sortHandle");
const payrollDocuments = require("../../models/entities/payrollSubcategories");
const payrollCategory = require("../../models/entities/payrollCategories")


exports.create = asyncHandler(async (params) => {
    if (params.hasOwnProperty('documentBase') && params.documentFormat) {
        const publicUrl = await uploadFile(params.documentBase, 'payrollDocs', params.documentFormat);
        //params = {}
        params.documentUrl = publicUrl;
    }
    return await payrollDocs.create(params)
})

exports.update = asyncHandler(async (params, data) => {

    return await payrollDocs.update(data, {
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
        return await payrollDocs.findOne({
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
    
        const data = await payrollDocs.findAndCountAll({
            include: [{
                model: category,
                attributes: ['id', 'categoryName']
            }],
            where: {
                [Op.or]: [
                    { id: { [Op.like]: searchPattern } },
                    { documentName: { [Op.like]: searchPattern } },
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
    return await payrollDocs.destroy({
        where: {
            id: params.id
        }
    })
})

exports.findAllDocumentsCount = asyncHandler(async ({ page, itemsPerPage, searchText, sort, sortField }) => {
    try{
        let order = handleSortFields(sortField,sort)
        const searchPattern = `%${searchText}%`;
    
        const data = await payrollDocs.findAndCountAll({
            include: [{
                model: category,
                attributes: ['id', 'categoryName']
            }],
            where: {
                [Op.or]: [
                    { id: { [Op.like]: searchPattern } },
                    { documentName: { [Op.like]: searchPattern } },
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
                    vendorName: 'Payroll',
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

    const data = await payrollDocuments.findAndCountAll({
        include: [{
            model: payrollCategory,
            attributes: ['categoryName']
        }],
        where: {
            document: {
                [Op.and]: [
                    { [Op.not]: null },
                    { [Op.ne]: '' }
                ]
            }
        },
        order: [['createdAt', 'DESC']],
        raw: true,
        nest: true
    });

    let finalData = [];

    data.rows.forEach((row) => {
        finalData.push({
            'Date': row.createdAt
                ? new Date(row.createdAt).toLocaleString()
                : '-',

            'Document Name': row.documentName || '-',

            'Category': row.payrollCategory?.categoryName || '-',

            'Document': row.document || '-',

            'Status': row.documentStatus ? 'Active' : 'Inactive'
        });
    });

    return finalData;
});

exports.findAllCategories = async (categoryAttributes = undefined, vendorAttributes = undefined) => {
    try {
        return await category.findAll({
            attributes: categoryAttributes,
            include: [{
                model: vendors,
                where: {
                    vendorName: 'Payroll',
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

        const documents = await payrollDocs.findAll(queryOptions);

        const totalCount = await payrollDocs.count({
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

exports.findAllpayrollDocs = async () => {
    try {
        const queryOptions = {
            attributes: ['id', 'documentName', 'categoryId'],
            where: {
                status: true
            }
        };
        return await payrollDocs.findAll(queryOptions);
    } catch (error) {
        console.log(error);
    } finally {
        console.log("DOCUMENT FIND ALL ROUTE CALLED");
    }
};


exports.fetchVendorDetails = asyncHandler(async (query, type, vendors) => {
    const whereCondition = {
        vendorName: {
            [Op.like]: '%' + query + '%'
        }
    };

    if (type) {
        whereCondition.type = type;
    }

    if (vendors && vendors.length > 0) {
        whereCondition.id = {
            [Op.in]: vendors
        };
    }

    return await vendor.findAll({
        where: whereCondition,
        attributes: ['id', 'vendorName']
    });
});


exports.updateDocument = asyncHandler(async (documentId, payload,  type, vendors) => {
  const document = await payrollDocuments.findByPk(documentId);
  if (!document) throw new Error('Document not found');
  
  payload.updatedAt = new Date();

  await document.update(payload);
  return document;
});


exports.documentsAndCountExport = asyncHandler(async ({ searchText = '', sort = 'DESC', sortField = 'createdAt' }) => {

    const searchPattern = `%${searchText}%`;

    const data = await payrollDocuments.findAndCountAll({
        include: [{
            model: payrollCategory,
            attributes: ['categoryName']
        }],
         where: {
        [Op.and]: [
            {
                document: {
                    [Op.ne]: null
                }
            },
            {
                document: {
                    [Op.ne]: ''
                }
            },
            {
                [Op.or]: [
                    { documentName: { [Op.like]: searchPattern } },
                    { '$payrollCategory.categoryName$': { [Op.like]: searchPattern } }
                ]
            }
        ]
    },
        order: [[sortField, sort]],
        raw: true,
        nest: true
    });

    let finalData = [];

    data.rows.forEach((row) => {

        finalData.push({
            Date: row.createdAt
                ? new Date(row.createdAt).toLocaleString()
                : '-',

            "Document Name": row.documentName || '-',

            Category: row.payrollCategory?.categoryName || '-',

            Document: row.document || '-',

            Status: row.documentStatus ? 'Active' : 'Inactive'
        });

    });

    return finalData;
});



exports.createCategoryWithDocument = asyncHandler(async (req, res) => {
    const { categoryName, documentName } = req.body;

    if (!categoryName || !documentName) {
        return res.status(400).json({
            status: false,
            message: 'Category and Document name are required'
        });
    }

    // 1️⃣ Find category
    let category = await payrollCategory.findOne({
        where: { categoryName: categoryName.trim() }
    });

    // 2️⃣ If category doesn't exist → create it
    if (!category) {
        category = await payrollCategory.create({
            categoryName: categoryName.trim(),
            categoryStatus: true
        });
    }

    // 3️⃣ Check duplicate document inside SAME category
    const existingDocument = await payrollDocuments.findOne({
        where: {
            documentName: documentName.trim(),
            categoryId: category.id
        }
    });

    if (existingDocument) {
        return res.status(400).json({
            status: false,
            message: 'Document already exists under this category'
        });
    }

    // 4️⃣ Create document under category
    const newDocument = await payrollDocuments.create({
        documentName: documentName.trim(),
        categoryId: category.id,
        documentStatus: true
    });

    return res.status(201).json({
        status: true,
        message: 'Document created successfully',
        data: newDocument
    });
});


