
const asyncHandler = require('../../middlewares/async')
const ErrorResponse = require('../../utils/error-response')
const puppeteer = require('puppeteer');
const fs = require("fs");
const {  create, findOneDuplicate, updatePartnerPermissionById, fetchAllPartnerPermissions, partnerPermissionExports, findPartnerPermissionById, findOnePartnerPermissionData } = require('../../models/use-cases/partnerPermission')
const { copyIconsBetweenTrees, restoreIconsUnderMoreServices } = require('../../utils/partnerPermissionIcons')
const { clonePermissionTree, summarisePermissionTree } = require('../../utils/partnerPermissionClone')
const { generateExcelBufferAndType } = require('../../utils/generateExcelBufferAndType');
const { reportPdfTemplate } = require('../../utils/reportTemplate');
const { customLog } = require('../../utils/loggerHelper');

exports.createPartnerPermission = asyncHandler(async (req, res, next) => {
    const data = req.body
    let {registeredBy} = data
    let duplicate = await findOneDuplicate(registeredBy)
    if(duplicate){
        return next(new ErrorResponse(`Partner already exist`, 400))
    }
     let result = await create(data)
   
    if (!result) {
        return next(new ErrorResponse(`Something went wrong while adding partner permission`, 500))
    } else {
        return res.status(200).json({
            'status': true,
            'message': 'Partner permission added successfully',
            'data': result,
            'responseCode' : '000'
        })
    }
})

exports.updatePartnerPermission = asyncHandler(async (req, res, next) => {
    const data = req.body
    let {id} = req.params
    let {registeredBy} = data
    if(registeredBy){
        let duplicate = await findOneDuplicate(registeredBy, id)
        if(duplicate){
            return next(new ErrorResponse(`Partner already exist`, 400))
        }
    }
    let result = await updatePartnerPermissionById(id,data)
   
    if (!result) {
        return next(new ErrorResponse(`Something went wrong while updating partner permission`, 500))
    } else {
        return res.status(200).json({
            'status': true,
            'message': 'Partner permission updated successfully',
            'data': {},
            'responseCode' : '000'
        })
    }
})

const resolvePartnerScope = (partnerId) =>
    (partnerId === 'default' || partnerId === null || partnerId === undefined ? null : partnerId)

exports.clonePartnerPermission = asyncHandler(async (req, res, next) => {
    const { fromPartnerId, toPartnerId } = req.body
    const sourceScope = resolvePartnerScope(fromPartnerId)
    const targetScope = resolvePartnerScope(toPartnerId)

    if (String(sourceScope) === String(targetScope)) {
        return next(new ErrorResponse(`Source and target partner must be different`, 400))
    }

    const source = await findOnePartnerPermissionData(sourceScope, ['id', 'registeredBy', 'permissions'])
    if (!source) {
        return next(new ErrorResponse(
            sourceScope === null
                ? `Default partner permission not found`
                : `Partner permission not found for the source partner`,
            404
        ))
    }

    const sourcePermissions = typeof source.permissions === 'string' ? JSON.parse(source.permissions) : source.permissions
    if (!Array.isArray(sourcePermissions)) {
        return next(new ErrorResponse(`Partner permission tree is not in the expected format`, 422))
    }

    const target = await findOnePartnerPermissionData(targetScope, ['id', 'registeredBy', 'permissions'])
    const targetPermissions = target
        ? (typeof target.permissions === 'string' ? JSON.parse(target.permissions) : target.permissions)
        : null
    const previous = target ? summarisePermissionTree(targetPermissions) : null

    let permissions = clonePermissionTree(sourcePermissions)
    let preservedIcons = 0
    if (Array.isArray(targetPermissions)) {
        const restored = restoreIconsUnderMoreServices(permissions, targetPermissions)
        permissions = restored.permissions
        preservedIcons = restored.preserved
    }
    const cloned = summarisePermissionTree(permissions)

    let action
    if (target) {
        const updated = await updatePartnerPermissionById(target.id, { permissions })
        if (!updated) {
            return next(new ErrorResponse(`Something went wrong while cloning the partner permission`, 500))
        }
        action = 'REPLACED'
    } else {
        const created = await create({ registeredBy: toPartnerId, permissions })
        if (!created) {
            return next(new ErrorResponse(`Something went wrong while cloning the partner permission`, 500))
        }
        action = 'CREATED'
    }

    customLog(req?.LogTraceId, 'info', {
        message: 'partnerPermission:cloned',
        action,
        fromPartnerId,
        toPartnerId,
        services: cloned.services,
        subServices: cloned.subServices,
        icons: cloned.icons,
        preservedIcons,
        replacedServices: previous ? previous.services : null,
    }, 'CONSOLE')

    return res.status(200).json({
        'status': true,
        'message': action === 'CREATED'
            ? 'Partner permission cloned successfully'
            : 'Partner permission cloned and the existing tree was replaced',
        'data': {
            fromPartnerId,
            toPartnerId,
            action,
            cloned,
            preservedIcons,
            replaced: previous,
        },
        'responseCode': '000'
    })
})

exports.copyPartnerPermissionIcons = asyncHandler(async (req, res, next) => {
    const { fromPartnerId, toPartnerId } = req.body
    const sourceScope = resolvePartnerScope(fromPartnerId)
    const targetScope = resolvePartnerScope(toPartnerId)

    if (String(sourceScope) === String(targetScope)) {
        return next(new ErrorResponse(`Source and target partner must be different`, 400))
    }

    const source = await findOnePartnerPermissionData(sourceScope, ['id', 'registeredBy', 'permissions'])
    if (!source) {
        return next(new ErrorResponse(
            sourceScope === null
                ? `Default partner permission not found`
                : `Partner permission not found for the source partner`,
            404
        ))
    }

    const target = await findOnePartnerPermissionData(targetScope, ['id', 'registeredBy', 'permissions'])
    if (!target) {
        return next(new ErrorResponse(`Partner permission not found for the target partner`, 404))
    }

    const sourcePermissions = typeof source.permissions === 'string' ? JSON.parse(source.permissions) : source.permissions
    const targetPermissions = typeof target.permissions === 'string' ? JSON.parse(target.permissions) : target.permissions

    if (!Array.isArray(sourcePermissions) || !Array.isArray(targetPermissions)) {
        return next(new ErrorResponse(`Partner permission tree is not in the expected format`, 422))
    }

    const result = copyIconsBetweenTrees(sourcePermissions, targetPermissions)

    if (result.copied > 0) {
        const updated = await updatePartnerPermissionById(target.id, { permissions: result.permissions })
        if (!updated) {
            return next(new ErrorResponse(`Something went wrong while copying the icons`, 500))
        }
    }

    return res.status(200).json({
        'status': true,
        'message': result.sourceIconCount === 0
            ? 'The source partner has no icons to copy'
            : `Copied ${result.copied} icon${result.copied === 1 ? '' : 's'} successfully`,
        'data': {
            fromPartnerId,
            toPartnerId,
            sourceIconCount: result.sourceIconCount,
            sourceIconBytes: result.sourceIconBytes,
            copied: result.copied,
            unchanged: result.unchanged,
            unmatched: result.unmatched,
        },
        'responseCode': '000'
    })
})

exports.findOnePartnerPermission = asyncHandler(async (req, res, next) => {
    const { id } = req.params

    const permission = await findPartnerPermissionById(id)

    if (!permission) {
        return next(new ErrorResponse(`Partner permission not found`, 404))
    }

    return res.status(200).json({
        'status': true,
        'message': 'Partner permission fetched successfully',
        'data': permission,
        'responseCode': '000'
    })
})

exports.findAllPartnerPermission = asyncHandler(async (req, res, next) => {
    let { from, to, searchText, page, itemsPerPage } = req.query;

    const sort = req.query.sort && req.query.sort === 'ASC' ?  'ASC' : 'DESC' ;
    let sortField = req.query.sortField || 'createdAt'
    

    // Parse page and itemsPerPage to integers (you can also use parseInt)
    page = page ? parseInt(page) : 1;
    itemsPerPage = itemsPerPage ? parseInt(itemsPerPage) : null;
    let limit = itemsPerPage

    // Calculate offset based on page and itemsPerPage
    let offset;
    if (page && itemsPerPage) {
        offset = (page - 1) * itemsPerPage;
    }


    let params = {
        from,
        to,
        searchText,
        sort,
        limit,
        offset,
        sortField
    }

    const permissions = await fetchAllPartnerPermissions(params)

    if (!permissions) {
        return next(new ErrorResponse(`Something went wrong while getting permissions`, 500))
    } else {
        return res.status(200).json({
            'status': true,
            'message': 'Permissions fetched successfully',
            'data': permissions,
           'responseCode' : '000'
    })
    }
})
exports.partnerPermissionExcelCSV = asyncHandler(async (req, res, next) => {
    let { from, to, searchText } = req.query;
    const {type} = req.params;

    const sort = req.query.sort && req.query.sort === 'ASC' ?  'ASC' : 'DESC' ;
    let sortField = req.query.sortField || 'createdAt'
    


    let params = {
        from,
        to,
        searchText,
        sort,
        sortField
    }

    const data = await partnerPermissionExports(params)

    if (!data) {
    return next(new ErrorResponse(`Something went wrong while generating report`, 500))
  } else if (data.length < 1) {
    return next(new ErrorResponse(`No data is available for export`, 500))
    } else {
        const {buffer, fileType} = await generateExcelBufferAndType(data,type)
        return res.status(200).json({
            'status': true,
            'data': {buffer, fileType},
            'message': 'Fetched excel/csv datas successfully',
            'responseCode': '000'
        })
    }
})
exports.partnerPermissionPDF = asyncHandler(async (req, res, next) => {
    let { from, to, searchText } = req.query;

    const sort = req.query.sort && req.query.sort === 'ASC' ?  'ASC' : 'DESC' ;
    let sortField = req.query.sortField || 'createdAt'
    


    let params = {
        from,
        to,
        searchText,
        sort,
        sortField
    }

    const data = await partnerPermissionExports(params)

    if (!data) {
    return next(new ErrorResponse(`Something went wrong while generating report`, 500))
  } else if (data.length < 1) {
    return next(new ErrorResponse(`No data is available for export`, 500))
    }
    
    const templateDetails = {
        title: 'Banners Report'
    }
    const reportHtmlWithStyle = reportPdfTemplate(data,templateDetails);
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
})


