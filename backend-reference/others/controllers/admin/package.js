const {
     findAllPackagesCount,
     createPackage,
     getExcelCSVData,
     findPackageCashback,
     deletePackage,
     findAllActivePackage,
     packagesAndCountExport,
     findOneIndividualPackage,
     updatePackage,
     findOnePackage,
     findAllActiveServicePackage
} = require('../../models/use-cases/package')
const package = require('../../models/entities/package')
const asyncHandler = require('../../middlewares/async')
const { findCorporatesByPackage } = require('../../models/use-cases/corporateUser');
const emailer = require('../../utils/emailer');
const { packageUpdateEmail } = require('../../utils/emailTemplate/package');
const ErrorResponse = require('../../utils/error-response')
const { createNotification } = require('../../models/use-cases/notification');
const puppeteer = require('puppeteer')
const fs = require('fs')
const { generateExcelBufferAndType } = require('../../utils/generateExcelBufferAndType')
const { reportPdfTemplate } = require('../../utils/reportTemplate')
const { formattedDateOnly } = require('../../utils/formatter')
const { fetchPartnerDetails } = require('../../models/use-cases/systemUser');
const { partnerLogos } = require('../../utils/partnerLogos');
const sequelize = require("../../configs/database/index");

const { uploadFile } = require('../../utils/commonUploadFile');
const { resolveEmailTemplate } = require('../../services/emailTemplateResolver');
const { EMAIL_TEMPLATE_KEYS, EMAIL_TEMPLATE_SERVICES } = require('../../utils/emailTemplateKeys');

exports.findAllPackagesAndCount = asyncHandler(async (req, res) => {

    let { searchText, page, itemsPerPage, partnerId, type } = req.query;

    const sort = req.query.sort && req.query.sort === 'ASC' ? 'ASC' : 'DESC';
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
        limit,
        offset,
        searchText,
        sort,
        sortField,
        partnerId,
        type,
        isAdmin: true
    }
    const packageData = await findAllPackagesCount(params);
    if (!packageData) {
        return res.status(500).json({
            'status': false,
            'data': {},
            'message': 'Something went wrong.',
            'responseCode': '001'
        })
    } else {
        return res.status(200).json({
            'status': true,
            'data': {
                'recordsTotal': packageData.count,
                'recordsFiltered': packageData.count,
                'data': packageData.rows
            },
            'message': 'Package fetched successfully',
            'responseCode': '000'
        })
    }
});

exports.packagesAndCountExcelCSV = asyncHandler(async (req, res, next) => {

    let { searchText, partnerId,packageType } = req.query;
    let { type } = req.params;

    const sort = req.query.sort && req.query.sort === 'ASC' ? 'ASC' : 'DESC';
    let sortField = req.query.sortField || 'createdAt'
    let params = {
        searchText,
        sort,
        sortField,
        partnerId,
        packageType
    }
    const data = await packagesAndCountExport(params);
    if (!data) {
        return next(new ErrorResponse(`Something went wrong while generating report`, 500))
    } else if (data.length < 1) {
        return next(new ErrorResponse(`No data is available for export`, 500))
    } else {
        const { buffer, fileType } = await generateExcelBufferAndType(data, type)
        return res.status(200).json({
            'status': true,
            'data': { buffer, fileType },
            'message': 'Fetched excel/csv datas successfully',
            'responseCode': '000'
        })
    }
});
exports.packagesAndCountPDF = asyncHandler(async (req, res, next) => {

    let { searchText,partnerId,packageType } = req.query;
    const sort = req.query.sort && req.query.sort === 'ASC' ? 'ASC' : 'DESC';
    let sortField = req.query.sortField || 'createdAt'
    let params = {
        searchText,
        sort,
        sortField,
        partnerId,
        packageType
    }
    const data = await packagesAndCountExport(params);
    if (!data) {
        return next(new ErrorResponse(`Something went wrong while generating report`, 500))
    } else if (data.length < 1) {
        return next(new ErrorResponse(`No data is available for export`, 500))
    }

    const templateDetails = {
        title: packageType=='1'? 'Packages' :'Service Packages'
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
});

exports.createPackage = asyncHandler(async (req, res, next) => {
    try {
        const data = req.body

        if (data.packageLogo && data.imageFormat) {
            const publicUrl = await uploadFile(data.packageLogo, 'service-operators', data.imageFormat);
            data.packageLogo = publicUrl;
        }

        if (data.packageType === 'INDIVIDUAL') {

            if (data.accessCode != 'whatsapp' && data.accessCode != 'accounting' && data.accessCode != 'ecommerce_store' && data.accessCode != 'peko_pos') {
                const isIndividualExist = await findOneIndividualPackage({ accessCode: data.accessCode, partnerId: data.partnerId })

                if (isIndividualExist) {
                    return next(new ErrorResponse(`The package with the access code already exists.`, 500))
                }
            }
        }
        const externalId = req.body.externalId === '' ? null : req.body.externalId;
        let package = await createPackage({ ...data, externalId })

        if (!package) {
            return res.status(404).json({
                status: false,
                message: "Something went wrong",
                data: {},
                responseCode: '001'
            });
        }

        await package.save(); 

        return res.status(200).json({
            'status': true,
            'data': package,
            'message': 'Package added successfully',
            'responseCode': '000'
        })
    } catch (error) {
        console.log(error?.response?.data);
        return res.status(500).json({
            'status': false,
            'data': {},
            'message': 'Something went wrong',
            'responseCode': '001'
        })
    }
});
exports.updatePackageData = asyncHandler(async (req, res) => {
    const params = req.params;
    const data = req.body;
    const transaction = await sequelize.transaction();
    try {
        if (data.packageLogo && data.imageFormat) {
            const publicUrl = await uploadFile(data.packageLogo, 'service-operators', data.imageFormat);
            data.packageLogo = publicUrl;
        }
        const externalId = req.body.externalId === '' ? null : req.body.externalId;
        
        const previousPackageData = await findOnePackage({id: params.id})
        let successSubscriptions = [];
        let failedSubscriptions = [];

        let result = await updatePackage({ ...data, externalId, transaction }, params.id)

        if (!result.success) {
            await transaction.rollback();
            return res.status(404).json({
                status: false,
                message: result.message || "Something went wrong while updating package",
                data: {},
                responseCode: '001'
            });
        }

        await transaction.commit();

        if(data.notifyCorporates && (previousPackageData.packagePrices.monthly !== data.packagePrices.monthly || previousPackageData.packagePrices.annually !== data.packagePrices.annually)) {
            const date = formattedDateOnly(new Date());
            let message = ""; 
            if(previousPackageData.packagePrices.monthly !== data.packagePrices.monthly){
                message += `₹ ${data.packagePrices.monthly}/month, `
            }
            if(previousPackageData.packagePrices.annually !== data.packagePrices.annually){
                message += `₹ ${data.packagePrices.annually}/year, `
            }
            const notificationData = {
                notificationTitle: `Subscription Pricing Update`,
                notificationBrief: `The price for your ${data.packageName} has been updated to ${message} effective from ${date}. `,
                notificationTo: "ALL",
                notificationCategory: "CORPORATE",
                notificationBy: "ADMIN",
            };
            createNotification(notificationData);
            

            const corporateUserEmails = await findCorporatesByPackage(params.id);
            if(corporateUserEmails && corporateUserEmails.length > 0) {
                corporateUserEmails.forEach( async user => {
                    const templateDetails = user.registeredBy ? await fetchPartnerDetails(user.registeredBy) : await partnerLogos()
                    const to = user.email
                    const subject = "Important Update: Changes to your subscription pricing"
                    const oldPackage = previousPackageData.packagePrices;
                    const newPackage = data.packagePrices;
                    const priceRows = [
                        oldPackage.monthly !== newPackage.monthly
                            ? `<tr>
                                        <td width="33.333333333333336%" style="padding: 10px; word-break: break-word; border-top: 1px solid #dddddd; border-right: 1px solid #dddddd; border-bottom: 1px solid #dddddd; border-left: 1px solid #dddddd;">Monthly Price&nbsp;</td>
                                        <td width="33.333333333333336%" style="padding: 10px; word-break: break-word; border-top: 1px solid #dddddd; border-right: 1px solid #dddddd; border-bottom: 1px solid #dddddd; border-left: 1px solid #dddddd;">₹ ${oldPackage.monthly}/month&nbsp;</td>
                                        <td width="33.333333333333336%" style="padding: 10px; word-break: break-word; border-top: 1px solid #dddddd; border-right: 1px solid #dddddd; border-bottom: 1px solid #dddddd; border-left: 1px solid #dddddd;">₹ ${newPackage.monthly}/month&nbsp;</td>
                                      </tr>`
                            : '',
                        oldPackage.annually !== newPackage.annually
                            ? `<tr>
                                        <td width="33.333333333333336%" style="padding: 10px; word-break: break-word; border-top: 1px solid #dddddd; border-right: 1px solid #dddddd; border-bottom: 1px solid #dddddd; border-left: 1px solid #dddddd;">Yearly Price&nbsp;</td>
                                        <td width="33.333333333333336%" style="padding: 10px; word-break: break-word; border-top: 1px solid #dddddd; border-right: 1px solid #dddddd; border-bottom: 1px solid #dddddd; border-left: 1px solid #dddddd;">₹ ${oldPackage.annually}/year&nbsp;</td>
                                        <td width="33.333333333333336%" style="padding: 10px; word-break: break-word; border-top: 1px solid #dddddd; border-right: 1px solid #dddddd; border-bottom: 1px solid #dddddd; border-left: 1px solid #dddddd;">₹ ${newPackage.annually}/year&nbsp;</td>
                                      </tr>`
                            : '',
                    ].join('');
                    const resolved = await resolveEmailTemplate({
                        key: EMAIL_TEMPLATE_KEYS.PACKAGE_PRICE_UPDATE,
                        service: EMAIL_TEMPLATE_SERVICES.PACKAGE,
                        variables: {
                            username: user.name,
                            packageName: data.packageName,
                            date,
                            priceRows,
                            branding: templateDetails?.branding || 'Peko',
                            logo: templateDetails?.logo,
                            copyrightYear: new Date().getUTCFullYear(),
                        },
                        fallback: () => packageUpdateEmail(user.name, data.packageName, oldPackage, newPackage, date, templateDetails),
                        fallbackSubject: subject,
                        logTraceId: req?.LogTraceId,
                    });
                    emailer.email( to, resolved.subject, resolved.html);
                })
            }  
        }

        return res.status(200).json({
            status: true,
            message: "Package updated successfully",
            data: {failedSubscriptions, successSubscriptions},
            responseCode: '000'
        });
    } catch (error) {
        console.log("🚀 ~ exports.updatePackageData=asyncHandler ~ error:", error?.response?.data ?? error?.response ?? error)
        return res.status(404).json({
            status: false,
            message: "Something went wrong",
            data: {},
            responseCode: '001'
        });
    }
});
// exports.updatePackage = asyncHandler(async (req, res) => {
//     const params = req.params;
//     const data = req.body;

//     try {
//         if (data.packageLogo && data.imageFormat) {
//             const filePath = `${NODE_ENV ? NODE_ENV : "staging"}/service-operators`
//             const publicUrl = await uploadFileToS3(data.packageLogo, filePath, data.imageFormat);
//             data.packageLogo = publicUrl;
//         }
//         const externalId = req.body.externalId === '' ? null : req.body.externalId;

//         let result = await updatePackage({ ...data, externalId }, params.id)

//         if (!result.success) {
//             return res.status(404).json({
//                 status: false,
//                 message: result.message || "Something went wrong while updating package",
//                 data: {},
//                 responseCode: '001'
//             });
//         }
//         return res.status(200).json({
//             status: true,
//             message: "Package updated successfully",
//             data: {},
//             responseCode: '000'
//         });
//     } catch (error) {
//         console.log(error);
//         return res.status(404).json({
//             status: false,
//             message: "Something went wrong",
//             data: {},
//             responseCode: '001'
//         });
//     }
// });

exports.deletePackage = async (req, res, next) => {
    const id = req.params.id;
    try {
        const packageData = await findPackageCashback(id)
        if (packageData.length > 0) {
            return res.status(403).json({
                status: false,
                message: "Unable to delete. Package is already assigned.",
                data: {},
                responseCode: '001'
            });
        }
        const result = await deletePackage({
            id
        });
        if (result === 1) {
            return res.status(200).json({
                status: true,
                message: "Package deleted successfully",
                data: {},
                responseCode: '000'
            });
        } else {
            return res.status(400).json({
                status: false,
                message: "An error occured while deleting the package.",
                data: {},
                responseCode: '001'
            });
        }
    } catch (error) {
        next(error);
    }
};

exports.findAllPackage = async (req, res, next) => {
    const partnerId = req.query.partnerId
    const excludeBasic = req.query.excludeBasic === 'true'
     const excludeServicePackages = req.query.excludeServicePackages === 'true'
    let data = await findAllActivePackage(['packageName', 'id', 'aliasName', 'accessCode', 'type'], partnerId, excludeBasic, excludeServicePackages);
    if (!data) {
        return next(new ErrorResponse(`Something went wrong while fetching all package`, 500))
    }
    return res.status(200).json({
        'status': true,
        'data': { data },
        'message': 'Packages fetched successfully.',
        'responseCode': '000'
    })
};

exports.getExcel = asyncHandler(async (req, res, next) => {
    let result = await getExcelCSVData()
    if (!result) {
        return next(new ErrorResponse(`Something went wrong while fetching excel/CSV data`, 200))
    } else {
        return res.status(200).json({
            'success': true,
            'data': result
        })
    }

})

exports.updatePackageStatus = asyncHandler(async (req, res) => {
    const params = req.params;
    const data = req.body;
    const result = await package.update(data, {
        where: {
            id: params.id
        }
    });
    if (result[0] === 0) {
        res.status(404).json({
            status: false,
            data: {},
            message: 'Something went wrong',
            responseCode: "001"
        });
    } else {
        res.status(200).json({
            status: true,
            data: {},
            message: 'Package updated successfully',
            responseCode: '000'
        });
    }
})

exports.findAllServicePackage = async (req, res, next) => {
    const { partnerId, excludeBasic } = req.query;
    const data = await findAllActiveServicePackage(['packageName', 'id'], partnerId, excludeBasic);
    if (!data) {
        return next(new ErrorResponse(`Something went wrong while fetching all package`, 500))
    }
    return res.status(200).json({
        'status': true,
        'data': { data },
        'message': 'Packages fetched successfully.',
        'responseCode': '000'
    })
};