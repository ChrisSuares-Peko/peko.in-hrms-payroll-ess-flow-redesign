const {

  updateDocument,
  getExcelCSVData,
  documentsAndCountExport
} = require("../../models/use-cases/payrollDocs");
const asyncHandler = require("../../middlewares/async");
const ErrorResponse = require("../../utils/error-response")
const payrollCategory = require("../../models/entities/payrollCategories");
const payrollDocuments = require("../../models/entities/payrollSubcategories");
const { payrollCategoriesData } = require("../../utils/validation/payrollCategory");
const { Op } = require("sequelize");
const { generateExcelBufferAndType } = require("../../utils/generateExcelBufferAndType");
const { reportPdfTemplate } = require("../../utils/reportTemplate");
const puppeteer = require("puppeteer");
const fs = require("fs");
const sequelize = require('../../configs/database/index');


exports.findAllCategoriesAndDocuments = asyncHandler(async (req, res) => {

  // 1️⃣ Inject default categories + documents only if categories table is empty
  const categoryCount = await payrollCategory.count();

  if (categoryCount === 0) {
    console.log("Injecting default payroll categories and documents...");

    for (let cat of payrollCategoriesData) {
      const createdCategory = await payrollCategory.create({
        categoryName: cat.label.trim(),
        categoryStatus: true,
      });

      // Insert default documents
      if (cat.documentNames && cat.documentNames.length) {
        const docs = cat.documentNames.map(docName => ({
          documentName: docName,
          categoryId: createdCategory.id,
          documentStatus: true,
        }));
        await payrollDocuments.bulkCreate(docs);
      }
    }
  }

  // 2️⃣ Fetch all categories and all documents
  const categoryData = await payrollCategory.findAll({
    where: { categoryStatus: true },
    raw: true
  });

  const documentData = await payrollDocuments.findAll({ raw: true });

  // 3️⃣ Map documents to categories
  const categoryDataWithDocuments = categoryData.map(category => {
    const matchingDocuments = documentData
      .filter(doc => doc.categoryId === category.id)
      .map(doc => ({ id: doc.id, name: doc.documentName }));

    return {
      id: category.id,
      categoryName: category.categoryName,
      documents: matchingDocuments, // this is what your dropdown will use
    };
  });

  // 4️⃣ Send response
  return res.status(200).json({
    status: true,
    data: { categoryDataWithDocuments },
    message: "All payroll categories with documents fetched successfully",
    responseCode: "000",
  });
});


exports.createPayrollDocumentForCorp = async (req, res) => {
  try {
    const { categoryId, categoryName, documentId, documentBase, documentName } = req.body;
    // console.log(categoryId, categoryName, id, documentBase, documentName,"paramllll")

    let finalCategoryId = categoryId;

    // 1️⃣ Handle new category creation if categoryId not provided
    if (!finalCategoryId && categoryName) {
      const newCategory = await payrollCategory.create({
        categoryName,
        categoryStatus: true,
      });
      finalCategoryId = newCategory.id;
    }

    if (!finalCategoryId) {
      return res.status(400).json({ status: false, message: "Category is required" });
    }

    // 2️⃣ Determine document name (existing template vs new doc)
    let finalDocumentName = documentName;

    if (documentId) {
      const doc = await payrollDocuments.findByPk(documentId);

      if (!doc) {
        return res.status(404).json({
          status: false,
          message: "Document not found",
        });
      }

      doc.document = documentBase;
      doc.documentStatus = true;

      await doc.save();

      return res.status(200).json({
        status: true,
        message: "Document updated",
        data: doc,
      });
    }

    // 3️⃣ Check for duplicate document under same category
    const existingDoc = await payrollDocuments.findOne({
      where: {
        categoryId: finalCategoryId,
        documentName: finalDocumentName,
        document: {
          [Op.ne]: null, // only consider uploaded documents
        },
      },
    });

    if (existingDoc) {
      return res.status(409).json({
        status: false,
        message: "A document with the same name already exists in this category",
      });
    }

   
  } catch (err) {
    console.log(err, "errrror");
    return res.status(500).json({ status: false, message: "Something went wrong" });
  }
};

exports.listPayrollDocumentsForCorp = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const offset = (page - 1) * pageSize;
    const searchText = req.query.searchText || '';
    const sortField = req.query.sortField || 'createdAt';
    const orderCol = req.query.orderCol || 'DESC';
    const { Op } = require('sequelize');
    const whereCondition = {
      document: { [Op.ne]: null },
    };

    // Add search filter for documentName or categoryName
    if (searchText) {
      whereCondition[Op.or] = [
        { documentName: { [Op.like]: `%${searchText}%` } },
        { '$payrollCategory.categoryName$': { [Op.like]: `%${searchText}%` } },
      ];
    }

    const { count, rows } = await payrollDocuments.findAndCountAll({
      where: whereCondition,
      include: [
        {
          model: payrollCategory,
          as: 'payrollCategory',
          attributes: ['id', 'categoryName'],
          required: false,
        },
      ],
      order: [[sortField || 'createdAt', orderCol]],
      limit: pageSize,
      offset,
    });

    return res.status(200).json({
      status: true,
      message: 'Documents fetched successfully',
      data: { rows, count },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: false, message: 'Something went wrong' });
  }
};

exports.deleteDocument = asyncHandler(async (req, res) => {
  try {
    const { documentId } = req.params;
    console.log("is to de;ete", documentId);

    const document = await payrollDocuments.findByPk(documentId);

    if (!document) {
      return res.status(404).json({
        status: false,
        message: "Document not found",
        responseCode: "404"
      });
    }

    await document.destroy();

    return res.status(200).json({
      status: true,
      message: "Document deleted successfully",
      responseCode: "000"
    });
  } catch (err) {
    console.log(err, "errorerrr")
  }
});


exports.editPayrollDocumentForCorp = async (req, res, next) => {
  try {

    const { documentId } = req.params;
    const payload = req.body; // after middleware, new files are uploaded URLs, existing URLs remain as-is

    if (!documentId) {
      return res.status(400).json({ status: false, message: 'Document ID is required' });
    }

    const updatedDocument = await updateDocument(documentId, payload,);

    return res.status(200).json({
      status: true,
      message: 'Document updated successfully',
      data: updatedDocument,
    });
  } catch (error) {
    console.error('Error editing payroll document:', error);
    next(error);
  }
};



exports.updateStatus = async (req, res) => {
  try {
    const { documentId } = req.params;
    const { status } = req.body;

    if (typeof status !== 'boolean') {
      return res.status(400).json({
        status: false,
        message: 'Status must be boolean (true/false)',
      });
    }

    const doc = await payrollDocuments.findByPk(documentId);
    if (!doc) {
      return res.status(404).json({
        status: false,
        message: 'Document not found',
      });
    }

    doc.documentStatus = status; // assuming your model field is documentStatus
    await doc.save();

    return res.status(200).json({
      status: true,
      message: `Document status updated to ${status ? 'active' : 'inactive'}`,
      data: {
        id: doc.id,
        documentName: doc.documentName,
        documentStatus: doc.documentStatus,
      },
    });
  } catch (error) {
    console.error('Error updating document status:', error);
    return res.status(500).json({
      status: false,
      message: 'Internal server error',
    });
  }
};


exports.createCategoryWithDocument = async (req, res) => {
  try {
    const { categoryName, documentName } = req.body;

    // Validate required fields
    if (!categoryName || !documentName) {
      return res.status(400).json({
        status: false,
        message: 'Both categoryName and documentName are required'
      });
    }

    // Check if category already exists
    let category = await payrollCategory.findOne({ where: { categoryName } });

    if (!category) {
      // Create new category if it doesn't exist
      category = await payrollCategory.create({ categoryName });
    }

    // Create document name under this category (no file yet)
    const newDocument = await payrollDocuments.create({
      documentName,
      categoryId: category.id,
      documentStatus: true, // default status
    });

    return res.status(201).json({
      status: true,
      message: 'Category added successfully. Head over to “Add Document” to attach related files.',
      data: {
        category,
        document: newDocument,
      },
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: false, message: 'Something went wrong' });
  }
};

exports.editPayrollCategory = asyncHandler(async (req, res) => {
  const { categoryId } = req.params;
  const { categoryName, categoryStatus, documentName, docId } = req.body;
  console.log(categoryName, categoryStatus, documentName, docId, "payoloaad")
  const category = await payrollCategory.findByPk(categoryId);
  if (!category) {
    return res.status(404).json({
      status: false,
      message: "Category not found",
      responseCode: "404",
    });
  }

  if (typeof categoryName === "string") {
    const trimmed = categoryName.trim();
    if (!trimmed) {
      return res.status(400).json({
        status: false,
        message: "categoryName cannot be empty",
        responseCode: "400",
      });
    }

    const duplicate = await payrollCategory.findOne({
      where: {
        categoryName: trimmed,
        id: { [Op.ne]: category.id },
      },
    });

    if (duplicate) {
      return res.status(409).json({
        status: false,
        message: "Category name already exists",
        responseCode: "409",
      });
    }

    category.categoryName = trimmed;
  }

  if (typeof categoryStatus === "boolean") {
    category.categoryStatus = categoryStatus;
  }

  await category.save();

  let updatedDocument = null;
  if (typeof documentName === "string") {
    const trimmedDoc = documentName.trim();
    if (!trimmedDoc) {
      return res.status(400).json({
        status: false,
        message: "documentName cannot be empty",
        responseCode: "400",
      });
    }

    if (docId) {
      updatedDocument = await payrollDocuments.findByPk(docId);
      if (!updatedDocument) {
        return res.status(404).json({
          status: false,
          message: "Document not found",
          responseCode: "404",
        });
      }
      if (String(updatedDocument.categoryId) !== String(category.id)) {
        return res.status(400).json({
          status: false,
          message: "Document does not belong to this category",
          responseCode: "400",
        });
      }
    } else {
      // Default/template doc created with category (no uploaded file yet)
      updatedDocument = await payrollDocuments.findOne({
        where: {
          categoryId: category.id,
          document: { [Op.is]: null },
        },
        order: [["createdAt", "ASC"]],
      });
      if (!updatedDocument) {
        return res.status(404).json({
          status: false,
          message: "Default document for this category not found",
          responseCode: "404",
        });
      }
    }

    const duplicateDoc = await payrollDocuments.findOne({
      where: {
        categoryId: category.id,
        documentName: trimmedDoc,
        id: { [Op.ne]: updatedDocument.id },
      },
    });

    if (duplicateDoc) {
      console.log(duplicateDoc, "duplicateee doc")
      return res.status(409).json({
        status: false,
        message: "A document with the same name already exists in this category",
        responseCode: "409",
      });
    }

    updatedDocument.documentName = trimmedDoc;
    await updatedDocument.save();
  }

  return res.status(200).json({
    status: true,
    message: "Category updated successfully",
    data: {
      category,
      document: updatedDocument,
    },
    responseCode: "000",
  });
});

exports.deletePayrollCategory = asyncHandler(async (req, res) => {
  const { categoryId } = req.params;

  const category = await payrollCategory.findByPk(categoryId);
  if (!category) {
    return res.status(404).json({
      status: false,
      message: "Category not found",
      responseCode: "404",
    });
  }

  await sequelize.transaction(async (transaction) => {
    await payrollDocuments.destroy({
      where: { categoryId: category.id },
      transaction,
    });

    await category.destroy({ transaction });
  });

  return res.status(200).json({
    status: true,
    message: "Category and related documents deleted successfully",
    responseCode: "000",
  });
});


exports.getExcel = asyncHandler(async (req, res,) => {
  let result = await getExcelCSVData();
  const { type } = req.params;
  if (!result || result.length === 0) {
    return res.status(200).json({
      status: false,
      message: "No data available to export",
      data: [],
      responseCode: "001",
    });
  }
  const { buffer, fileType } = await generateExcelBufferAndType(
    result,
    type
  );

  return res.status(200).json({
    success: true,
    data: { buffer, fileType },
    responseCode: "000",
    message: "Excel data fetched successfully",
  });

});


exports.documentsAndCountPDF = asyncHandler(async (req, res, next) => {
  let searchText = req.query.search || '';
  const sort = req.query.sort && req.query.sort === 'ASC' ? 'ASC' : 'DESC';
  let sortField = req.query.sortField || 'createdAt'
  let params = {
    searchText,
    sort,
    sortField
  };

  try {
    const data = await documentsAndCountExport(params);
    if (!data) {
      return next(new ErrorResponse(`Something went wrong while generating report`, 500))
    } else if (data.length < 1) {
      return next(new ErrorResponse(`No data is available for export`, 500))
    }

    const templateDetails = {
      title: 'E-Docs'
    }
    const reportHtmlWithStyle = reportPdfTemplate(data, templateDetails);
    let random = new Date().valueOf();

    // Create a browser instance with Puppeteer
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();

    // Set content to the page
    await page.setContent(reportHtmlWithStyle, { waitUntil: 'domcontentloaded' });

    // Generate PDF using Puppeteer
    const outputFile = `report-${random}.pdf`;
    await page.pdf({
      scale: 0.6,
      path: outputFile,
      format: 'A4',
      preferCSSPageSize: true
    });

    console.log('PDF generated successfully!');

    const buffer = fs.readFileSync(outputFile);

    browser.close();

    fs.unlinkSync(outputFile);

    return res.status(200).json({
      status: true,
      message: 'report generated successfully.',
      data: {
        buffer,
        fileType: 'application/pdf'
      },
      responseCode: '000'
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: false,
      message: `Something went wrong while generating report`,
      data: {},
      responseCode: '001'
    });
  }
});









