/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
/* eslint-disable no-constant-condition */
const axios = require('axios')
const asyncHandler = require('../../middlewares/async')
const ErrorResponse = require('../../utils/error-response')
const { findByAnyField, create, update, findAllGiftCards, bulkCreate, getExcelCSVData, updateStatusByServiceOperatorId, findAllGiftCardIdsByServiceOperatorId, findServiceOperatorByAccessKey, findServiceOperatorById , updateAllStatus, giftCardsAndCountExport} = require('../../models/use-cases/giftCards')
const { getValue, setValue } = require('../../utils/cacheDataMethods')
const moment = require("moment");
const crypto = require("crypto");
const cryptoJS = require("crypto-js");
const { findAllServiceOperatorOnCategory, findServiceOperatorOnAccesskey } = require('../../models/use-cases/serviceOperator')
const { generateJwtTokenPaytm } = require('../../utils/jwtToken')
const { generateExcelBufferAndType } = require('../../utils/generateExcelBufferAndType')
const { v4: uuidv4 } = require("uuid");

const puppeteer = require('puppeteer')
const fs = require('fs')
const { reportPdfTemplate } = require('../../utils/reportTemplate')
const { customLog } = require('../../utils/loggerHelper')
const operatorsData = require("../../utils/operatorsData.json");
const { encrypt, decrypt } = require('../../utils/giftCardsUtils')

const { XMLParser } = require("fast-xml-parser");





// Define a common function for checking field uniqueness
async function checkFieldUniqueness(data, id = null) {
    const { brand_name, product_id, product_name } = data;
    const fieldsToCheck = [
        { fieldName: 'product_name', value: product_name, errorMessage: 'This name is already associated with another gift card' },
        { fieldName: 'brand_name', value: brand_name, errorMessage: 'This Brand name is already associated with another gift card' },
        { fieldName: 'product_id', value: product_id, errorMessage: 'This Product ID is already associated with another gift card' },
    ];

    const fieldsToCheckWithValue = fieldsToCheck.filter(field => field.value !== undefined && field.value !== null && field.value !== "");
    const fieldExists = await Promise.all(fieldsToCheckWithValue.map(field => findByAnyField({ [field.fieldName]: field.value })));

    for (let i = 0; i < fieldExists.length; i++) {
        if (id !== null) {
            if (fieldExists[i] && fieldExists[i].id !== parseInt(id)) {
                return `${fieldsToCheckWithValue[i].errorMessage} `;
            }
        } else {
            if (fieldExists[i]) {
                return `${fieldsToCheckWithValue[i].value}-${fieldsToCheckWithValue[i].errorMessage}`;
            }
        }
    }

    return null; // No errors found
}

exports.createGiftCard = asyncHandler(async (req, res, next) => {
    let data = req.body;

    const errorMessage = await checkFieldUniqueness(data);
    if (errorMessage) {
        return next(new ErrorResponse(errorMessage, 403));
    }
    // let accessKey = data.accessKey
    // if(accessKey){
    //     let serviceData = await findServiceOperatorOnAccesskey(accessKey)
    //     if(serviceData){
    //         data = {...req.body, serviceOperatorId: serviceData.id, serviceAccessCode: accessKey}
    //     }
    // }
    let result = await create(data);

    if (!result) {
        return next(new ErrorResponse(`Something went wrong while adding product`, 500));
    } else {
        return res.status(200).json({
            'status': true,
            'message': 'Gift card added successfully',
            'data': result ,
            'responseCode' : '000'
        });
    }
});

exports.updateGiftCard = asyncHandler(async (req, res, next) => {
    const id = req.params.id;
    let data = req.body;

    // Step 1: Check if gift card fields are unique
    const errorMessage = await checkFieldUniqueness(data, id);
    if (errorMessage) {
        return next(new ErrorResponse(errorMessage, 200));
    }
    // let accessKey = data.accessKey
    // if(accessKey){
    //     let serviceData = await findServiceOperatorOnAccesskey(accessKey)
    //     if(serviceData){
    //         data = {...req.body, serviceOperatorId: serviceData.id, serviceAccessCode: accessKey}
    //     }
    // }
    // Step 3: Update the product data
    const result = await update(id, data);

    if (!result) {
        return next(new ErrorResponse(`Something went wrong while updating the gift card`, 200))
    } else {
        return res.status(200).json({
            'success': true,
            'message': 'Gift card updated successfully',
            'data': {result},
            'responseCode':'000'
        })
    }
})

exports.updateStatus = asyncHandler(async (req, res, next) => {
    let id = req.params.id;
    let data = req.body
    let result = await update(id, data);
    if (!result) {
        return next(new ErrorResponse(`Something went wrong while updating status`, 500))
    } else {
        return res.status(200).json({
            'status': true,
            'message': 'Status updated successfully',
            'data': {result},
            'responseCode' : '000'
        })
    }
})
exports.updateAllStatus = asyncHandler(async (req, res, next) => {
    let serviceOperatorId = req.query.serviceOperatorId;
    let data = req.body
    // let { id: serviceOperatorId } = await findServiceOperatorByAccessKey(accessKey)
    let result = await updateStatusByServiceOperatorId(serviceOperatorId, data);
    if (!result) {
        return next(new ErrorResponse(`Something went wrong while updating status`, 500))
    } else {
        return res.status(200).json({
            'status': true,
            'message': `Status updated successfully`,
            'data': {...result,message:`Status updated successfully`} ,
            'responseCode' : '000'
        })
    }
})

exports.getAllGiftCards = asyncHandler(async (req, res, next) => {

    //need to define get products query.....

    let result = []
    if (!result) {
        return next(new ErrorResponse(`Something went wrong while updating status`, 200))
    } else {
        return res.status(200).json({
            'success': true,
            'message': 'Gift card fetch successfully',
            'data': result
        })
    }
})

exports.findAllGiftCardsAndCount = asyncHandler(async (req, res, next) => {
  
    let { searchText, page, itemsPerPage } = req.query;

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
         limit,
         offset,
         searchText,
         sort,
         sortField,
    }
    const giftCardsData = await findAllGiftCards(params);
    if (!giftCardsData) {
        return next(new ErrorResponse(`Something went wrong while getting all Gift Cards from database`, 200))
    } else {
        return res.status(200).json({
            'status': true,
            'data': {
            'recordsTotal': giftCardsData.count,
            'recordsFiltered': giftCardsData.count,
            'data': giftCardsData.rows
            },
            'message' : 'Gift cards fetched successfully',
            'responseCode': '000'
        })
    }
})

exports.giftCardsAndCountExcelCSV = asyncHandler(async (req, res, next) => {
     let { searchText } = req.query
     let { type } = req.params

     const sort = req.query.sort && req.query.sort === 'ASC' ? 'ASC' : 'DESC'
     let sortField = req.query.sortField || 'createdAt'

     let params = {
          searchText,
          sort,
          sortField,
     }
     const data = await giftCardsAndCountExport(params)
     if (!data) {
          return next(new ErrorResponse(`Something went wrong while generating report`, 500))
     } else if (data.length < 1) {
          return next(new ErrorResponse(`No data is available for export`, 500))
     } else {
          const { buffer, fileType } = await generateExcelBufferAndType(data, type)
          return res.status(200).json({
               status: true,
               data: { buffer, fileType },
               message: 'Fetched excel/csv datas successfully',
               responseCode: '000',
          })
     }
})

exports.giftCardsAndCountPDF = asyncHandler(async (req, res, next) => {
     let { searchText } = req.query

     const sort = req.query.sort && req.query.sort === 'ASC' ? 'ASC' : 'DESC'
     let sortField = req.query.sortField || 'createdAt'
     let params = {
          searchText,
          sort,
          sortField,
     }
     const data = await giftCardsAndCountExport(params)
     if (!data) {
          return next(new ErrorResponse(`Something went wrong while generating report`, 500))
     } else if (data.length < 1) {
          return next(new ErrorResponse(`No data is available for export`, 500))
     }

     const templateDetails = {
          title: 'Giftcards',
     }
     const reportHtmlWithStyle = reportPdfTemplate(data, templateDetails)
     let random = new Date().valueOf()

     // Create a browser instance with Puppeteer
     const browser = await puppeteer.launch({
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
     })
     const page = await browser.newPage()

     // Set content to the page
     await page.setContent(reportHtmlWithStyle, { waitUntil: 'domcontentloaded' })

     // Generate PDF using Puppeteer
     const outputFile = `report-${random}.pdf`
     await page.pdf({
          path: outputFile,
          format: 'A4',
          preferCSSPageSize: true,
     })

     const buffer = fs.readFileSync(outputFile)

     browser.close()

     fs.unlinkSync(outputFile)

     return res.status(200).json({
          status: true,
          message: 'report generated successfully.',
          data: {
               buffer,
               fileType: 'application/pdf',
          },
          responseCode: '000',
     })
})

exports.bulkCreateGiftCard = asyncHandler(async (req, res, next) => {
    if (!req.excelToJsonData) {
        return next(new ErrorResponse(`Something went wrong!`, 200));
    }
    const jsonData = req.excelToJsonData;

    //check weather any other gift card already not exists in db
    const errorMessages = [];
    for (const element of jsonData) {
        const errorMessage = await checkFieldUniqueness(element);
        if (errorMessage) {
            errorMessages.push(errorMessage);
            break; // Exit the loop on the first error
        }
    }
    if (errorMessages.length > 0) {
        return next(new ErrorResponse(errorMessages.join(', '), 200));
    }
    // Next, you can continue with the bulk create logic
    let result = await bulkCreate(jsonData);

    if (!result) {
        return next(new ErrorResponse(`Something went wrong while adding gift cards`, 200));
    } else {
        return res.status(200).json({
            'success': true,
            'message': 'Gift card added successfully',
            'data': result
        });
    }
});

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

exports.autoUpdateGiftCard = asyncHandler(async (req, res, next) => {
    try {
        let { serviceOperatorId } = req.query
        let serviceOperator = await findServiceOperatorById(serviceOperatorId)
        let accessKey = serviceOperator.accessKey
        let vendor = serviceOperator?.vendor
        let venderId = vendor.id
        if (!serviceOperator || !venderId) {
            return next(new ErrorResponse(`The requested vendor was not found. Please try again with a valid vendor.`, 404))
        }
        let giftCardsResponse;
        switch (accessKey) {
            case 'gift-card':
                giftCardsResponse = await getAllEdenredGiftCards(serviceOperator)
                break;

            case 'xoxoday':
                giftCardsResponse = await getAllXoxodayGiftCards(serviceOperator)
                break;

            default:
                return next(new ErrorResponse("Invalid access key:", accessKey, 404));
        }


        if (!giftCardsResponse?.status) {
            return next(
                new ErrorResponse(
                    giftCardsResponse?.message || "Failed to fetch gift cards from vendor",
                    400
                )
            );
        }

        console.log("these are the giftCardsResponse", giftCardsResponse)
        let { status, giftCards, message } = giftCardsResponse



        // if (!status || !giftCards||giftCards.length === 0) {
        //     return next(new ErrorResponse(`Something went wrong while updating the gift card`, 400))
        // } 

        // else {
        //     return res.status(200).json({
        //         'status': true,
        //         'message': 'giftcards fetched successfully',
        //         'responseCode': "000"
        //     })
        // }



        //<--------------Commented out for testing the vendor API---------------------------------->

        //Step #3
        //if we get 0 gift cards we need to disable existing gift cards (for this particular vendor) in our db
        //boz the api provider may stopped support for the card or out of stock
        if (!status || !Array.isArray(giftCards) || giftCards.length === 0 || !giftCards[0].product_id) {
            let result = await updateStatusByServiceOperatorId(serviceOperatorId, { isAccessible: false });
            return next(new ErrorResponse(`${message}, ${result} gift cards were made inaccessible due to unavailability.`, 400))
        }

        //get all gift cards with this serviceOperator in our db(receives as Map )
        const allExisting = await findAllGiftCardIdsByServiceOperatorId(serviceOperatorId)

        //Step #4
        //iterate through gift cards and check weather is is exists in db or not 
        const updatedResponses = await Promise.all(giftCards.map(async (card) => {
            const sanitized = sanitizeCard(card);
            const exists = allExisting.get(String(sanitized.product_id)); // <-- use ProductCode

            if (exists) {
                allExisting.delete(exists.product_id);
                const result = await update(exists.id, sanitized);
                if (!result || (Array.isArray(result) && result[0] !== 1)) {
                    console.error(`[FAILED UPDATE] product_id: ${sanitized.product_id}`, JSON.stringify(sanitized, null, 2));
                }
                return result;
            } else {
                const result = await create(sanitized);
                if (!result || typeof result !== 'object') {
                    console.error(`[FAILED CREATE] product_id: ${sanitized.product_id}`, JSON.stringify(sanitized, null, 2));
                }
                return result;
            }
        }));


        //Step #5
        // if we get get 10 cards from vendor and we already have a 15 cards we need to make other cards disabled
        //so  disable all the gift cards last updated is more then 'currentDate'  respective to this vendor
        const updatePromises = [];
        for (const [key, value] of allExisting.entries()) {
            updatePromises.push(update(value.id, { isAccessible: false }));
        }
        const disabledResponses = await Promise.all(updatePromises);


        if (!updatedResponses) {
            return next(new ErrorResponse(`Something went wrong while updating the gift card`, 400))
        } else {
            return res.status(200).json({
                'status': true,
                'message': `${generateResponseMessage(updatedResponses, 'updated')}, ${generateResponseMessage(disabledResponses, 'disabled')}`,
                'responseCode': "000"
            })
        }
    } catch (error) {
        console.error("autoUpdateGiftCard error:", error);

        return next(
            new ErrorResponse(
                "Unexpected error occurred while auto updating gift cards",
                500
            )
        );
    }
})



////Helper functions for edenred

const getAllEdenredGiftCards = asyncHandler(async (serviceOperator) => {
    try {
        let { vendor, id } = serviceOperator
       

        const encryptionKey = serviceOperator.vendor.optionals.encryptionKey;
        const consumerCode = serviceOperator.vendor.optionals.consumerCode;
        const orderNumber = serviceOperator.vendor.optionals.orderNumber;
        const apiBaseUrl = serviceOperator.vendor.healthUrl;

        const correlationId = uuidv4();

        if (!encryptionKey) {
            return next(new ErrorResponse("Encryption key not configured", 500));
        }

        // STEP 1: Construct the inner request DTO
        //         const innerXml =
        // `<GetProdInfoByOrderRequestDto xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema"><ClientCode>${consumerCode}</ClientCode><OrderNumber>${orderNumber}</OrderNumber></GetProdInfoByOrderRequestDto>`;


        // STEP 1: Construct FULL inner request DTO (with wrapper)
        const innerXml =
            `<?xml version="1.0" encoding="utf-8"?>
<GetProdInfoByOrderV2RequestDto xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
<ConsumerCode>${consumerCode}</ConsumerCode>
<RequestId>${correlationId}</RequestId>
<OrderNumber>${orderNumber}</OrderNumber>
<ClientCode>${consumerCode}</ClientCode>
<PageNumber>1</PageNumber>
</GetProdInfoByOrderV2RequestDto>`;

        // console.log("the inner request DTO.",innerXml)
        customLog(null, "info", { message: "the inner request DTO.", innerXml }, "VENDOR");

        // STEP 2: Convert the inner request DTO into escaped XML format
        const escapedInnerXml = innerXml
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");

        console.log(" inner request DTO into escaped XML format", escapedInnerXml)
        customLog(null, "info", { message: " inner request DTO into escaped XML format", escapedInnerXml }, "VENDOR");


        // STEP 3: Construct the outer request DTO and put the value of step 2 into <Parameter> tag
        const outerXml =
            `<?xml version="1.0" encoding="utf-8"?>
<RequestDto xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
<OperationCode>GetProdInfoByOrderV2</OperationCode>
<Parameters>${escapedInnerXml}</Parameters>
<RequestGuid>${correlationId}</RequestGuid>
</RequestDto>`;


        console.log(" the outer request DTO", outerXml)
        customLog(null, "info", { message: " the outer request DTO", outerXml }, "VENDOR");

        // STEP 4: Encrypt the outer request DTO with client’s security algorithm and key.
        console.log("this is encryptionKey", encryptionKey)
        const encryptedParams = encrypt(outerXml, encryptionKey);

        console.log("encryptedParams", encryptedParams)
        customLog(null, "info", { message: " the encryptedParams", encryptedParams }, "VENDOR");

        // STEP 5: In SOAP envelope, put the encrypted request DTO into <parameter> tag. Provide <OperationCode> and <ConsumerCode>. Send SOAP request.
        const soapEnvelope = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tic="http://ticketxpress.com.tw/"><soapenv:Header/><soapenv:Body><tic:Invoke><tic:consumerCode>${consumerCode}</tic:consumerCode><tic:operationCode>GetProdInfoByOrderV2</tic:operationCode><tic:parameters>${encryptedParams}</tic:parameters></tic:Invoke></soapenv:Body></soapenv:Envelope>`;

        console.log("In SOAP envelope, put the encrypted request DTO")

        let soapResponse
        customLog(null, "info", { message: "XML PAYLOAD product listing", soapEnvelope }, "VENDOR");


        try {

            const response = await axios.post(apiBaseUrl, soapEnvelope, {
                headers: {
                    "Content-Type": "text/xml; charset=utf-8",
                    "SOAPAction": "http://ticketxpress.com.tw/IPublicService/Invoke"
                },
            });
            customLog(null, "info", { message: "response from giftcards listing api", response }, "VENDOR");

            soapResponse = response.data;
        } catch (error) {
            customLog(
                null,
                "error",
                { message: "error from giftcards listing api", error: error?.response?.data || error?.response || error },
                "VENDOR"
            );
            return {
                status: false,
                message: "Something went wrong while fetching giftcards details",
                error: error.message,
            };
        }

//         soapResponse = `<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">
//     <s:Body>
//         <InvokeResponse xmlns="http://ticketxpress.com.tw/">
//             <InvokeResult>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</InvokeResult>
//         </InvokeResponse>
//     </s:Body>
// </s:Envelope>`


        if (!soapResponse) {
            return {
                status: false,
                message: "Empty SOAP response received",
            };
        }

        // STEP 6: Extract <InvokeResult>
        const match = soapResponse.match(/<InvokeResult>([\s\S]*?)<\/InvokeResult>/);

        if (!match || !match[1]) {
            return {
                status: false,
                message: "InvokeResult not found in SOAP response",
            };
        }

        const encryptedResponse = match[1];
        // console.log("encryptedResponse", encryptedResponse)

        // STEP 7: Decrypt Response
        const decryptedXml = decrypt(encryptedResponse, encryptionKey);
        // console.log("decryptedXml", decryptedXml)

        // STEP 8: Extract <Response> node
        const responseMatch = decryptedXml.match(/<Response>([\s\S]*?)<\/Response>/);

        if (!responseMatch || !responseMatch[1]) {
            return {
                status: false,
                message: "Response node not found in decrypted XML",
            };
        }

        let escapedInnerResponse = responseMatch[1];
        // console.log("escapedInnerResponse", escapedInnerResponse)
        // const escapedInnerResponse =MOCK_EDENRED_RESULT
        customLog(null, "info", { message: "escapedInnerResponse from giftcards listing api", escapedInnerResponse }, "VENDOR");

        escapedInnerResponse = escapedInnerResponse
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&amp;/g, "&")
            .replace(/&quot;/g, '"');
        // console.log("escapedInnerResponse after replace", escapedInnerResponse)
        const parser = new XMLParser({ ignoreAttributes: false, processEntities: { maxTotalExpansions: 5000 } });


        let finalJson;
        try {
            const parsedResponse = parser.parse(escapedInnerResponse);
            // console.log("parsedResponse here", parsedResponse)

            if (!parsedResponse.GetProdInfoByOrderV2ResponseDto) {
                return {
                    status: false,
                    message: "Invalid ResponseOutDto structure",
                };
            }

            innerResponseXml = parsedResponse?.GetProdInfoByOrderV2ResponseDto?.OrderProductInfos?.OrderProductInfoV2;
            customLog(null, "info", { message: "innerResponseXml from giftcards listing api", innerResponseXml }, "VENDOR");

            // innerResponseXml = innerResponseXml
            //     .replace(/&lt;/g, "<")
            //     .replace(/&gt;/g, ">")
            //     .replace(/&amp;/g, "&")
            //     .replace(/&quot;/g, '"');

            // finalJson = parser.parse(innerResponseXml);
            // customLog(null, "info", { message: "finalJson from giftcards listing api", finalJson }, "VENDOR");

        } catch (err) {
            return {
                status: false,
                message: "XML parsing failed",
                error: err.message,
            };
        }

        // const businessData =
        //     finalJson?.GetProdInfoByOrderResponseDto?.OrderProductInfos?.OrderProductInfo;

        customLog(null, "info", { message: "businessData from giftcards listing api", innerResponseXml }, "VENDOR");


        if (!innerResponseXml) {
            return {
                status: false,
                message: "OrderProductInfos not found",
            };
        }

        let giftCards = []
        if (innerResponseXml && Array.isArray(innerResponseXml)) {
            let apiGiftCards = innerResponseXml;

            apiGiftCards.forEach(card => {

                giftCards.push({
                    serviceOperatorId: id,
                    product_id: card?.ProductCode,
                    product_name: card?.ProductName,
                    image: card?.ImageURL,
                    priceType: "FIXED",
                    min_price: card?.FaceValue,
                    max_price: card?.FaceValue,
                    denominations: [card?.FaceValue],
                    brand_name: card?.BrandName,
                    category: null,
                    description: card?.description,
                    expiry: card?.expiry,
                    expiryAndValidity: card?.ExpiryScheme || null,
                    terms_and_condition: card?.ProductFootNote,
                    isAccessible: true
                })

            });

        }

        return {
            status: true,
            message: "Gift cards fetched successfully",
            giftCards: giftCards,
        };
    } catch (error) {
        customLog(
            null,
            "error",
            { message: "error from giftcards listing function", error: error },
            "VENDOR"
        );
        console.log("error", error)
        return {
            status: false,
            message: "Unexpected error while fetching gift cards",
            error: error.message,
        };
    }
});


////Helper functions for xoxoday

/**
 * Core refresh — calls Xoxoday /v1/oauth/token/user with the stored refresh token,
 * updates Redis, and returns the new access token.
 * Called by xoxodayAuthToken (on cache miss) and by scheduleXoxodayTokenRefresh.
 */
const xoxodayRefreshToken = async (details, accessKey) => {
  const XOXODAY_BASE_URL        = details.apiUrl || details.healthUrl;
  const ACCESS_TOKEN_CACHE_KEY  = `xoxoday-access-token-${accessKey}`;
  const REFRESH_TOKEN_CACHE_KEY = `xoxoday-refresh-token-${accessKey}`;
  const NEXT_REFRESH_CACHE_KEY  = `xoxoday-token-next-refresh-${accessKey}`;

  const clientId     = details.optional1;
  const clientSecret = details.optional2;

  if (!clientId || !clientSecret) {
    customLog(null, "error", { message: "[Xoxoday] clientId or clientSecret missing in serviceDetails" }, "VENDOR");
    return false;
  }

  // Prefer cached refresh token; fall back to seed value from serviceDetails (first run only)
  let refreshToken = await getValue(REFRESH_TOKEN_CACHE_KEY);
  if (!refreshToken) {
    refreshToken = details.optional4; // seed refresh token from dashboard — used only once
  }

  if (!refreshToken) {
    customLog(null, "error", { message: "[Xoxoday] No refresh token available. Set optional4 (seed refresh token) in serviceDetails." }, "VENDOR");
    return false;
  }

  try {
    const response = await axios({
      method: "post",
      url: `${XOXODAY_BASE_URL}/token/user`,
      headers: { "Content-Type": "application/json" },
      data: {
        grant_type:    "refresh_token",
        refresh_token: refreshToken,
        client_id:     clientId,
        client_secret: clientSecret,
      },
    });

    const tokenData = response.data;
    console.log("here is the tokenData",tokenData)

    if (!tokenData || !tokenData.access_token) {
      customLog(null, "error", { message: "[Xoxoday] Token refresh failed", response: tokenData }, "VENDOR");
      return false;
    }

    const newAccessToken  = tokenData.access_token;
    const newRefreshToken = tokenData.refresh_token || refreshToken;

    const ACCESS_TTL  = 14 * 24 * 60 * 60; // 14 days in seconds (token valid 15 days)
    const REFRESH_TTL = 30 * 24 * 60 * 60; // 30 days — survives multiple access-token cycles
    // Next proactive refresh: 13 days from now
    const nextRefreshAt = Date.now() + 13 * 24 * 60 * 60 * 1000;

    await setValue(ACCESS_TOKEN_CACHE_KEY,  ACCESS_TTL,  newAccessToken);
    await setValue(REFRESH_TOKEN_CACHE_KEY, REFRESH_TTL, newRefreshToken);
    await setValue(NEXT_REFRESH_CACHE_KEY,  REFRESH_TTL, String(nextRefreshAt));

    customLog(null, "info", { message: "[Xoxoday] Access token refreshed successfully", accessKey, nextRefreshAt: new Date(nextRefreshAt).toISOString() }, "VENDOR");
    return newAccessToken;

  } catch (error) {
      const errData = error?.response?.data;
      const isInvalidToken = error?.response?.status === 403 &&
        (errData?.error === 'invalid_request' || errData?.error_description?.toLowerCase().includes('expired') || errData?.error_description?.toLowerCase().includes('invalid'));
  
      if (isInvalidToken) {
        customLog(null, "error", { message: "[Xoxoday] Refresh token invalid/expired, clearing cache and retrying with latest DB value", accessKey }, "VENDOR");
  
        // Clear stale refresh token from cache
        await setValue(REFRESH_TOKEN_CACHE_KEY, 1, "");
  
        // Re-fetch vendor fresh from DB to get latest optional4
        const freshServiceOperator = await findServiceOperatorByAccessKey(accessKey);
        const freshRefreshToken = freshServiceOperator?.vendor?.optional4;
  
        if (freshRefreshToken && freshRefreshToken !== refreshToken) {
          customLog(null, "info", { message: "[Xoxoday] Found different refresh token in DB, retrying" }, "VENDOR");
         
          try {
            const retryResponse = await axios({
              method: "post",
              url: `${XOXODAY_BASE_URL}/token/user`,
              headers: { "Content-Type": "application/json" },
              data: { grant_type: "refresh_token", refresh_token: freshRefreshToken, client_id: clientId, client_secret: clientSecret },
            });
             
          
  
            const retryTokenData = retryResponse.data;
            customLog(null, "info", { message: "[Xoxoday] Access token refreshed and new tokens generated", retryTokenData }, "VENDOR");
            if (!retryTokenData?.access_token) {
              customLog(null, "error", { message: "[Xoxoday] Retry token refresh failed", response: retryTokenData }, "VENDOR");
              return false;
            }
  
            const newAccessToken  = retryTokenData.access_token;
            const newRefreshToken = retryTokenData.refresh_token || freshRefreshToken;
            const ACCESS_TTL  = 14 * 24 * 60 * 60;
            const REFRESH_TTL = 30 * 24 * 60 * 60;
            const nextRefreshAt = Date.now() + 13 * 24 * 60 * 60 * 1000;
  
            await setValue(ACCESS_TOKEN_CACHE_KEY,  ACCESS_TTL,  newAccessToken);
            await setValue(REFRESH_TOKEN_CACHE_KEY, REFRESH_TTL, newRefreshToken);
            await setValue(NEXT_REFRESH_CACHE_KEY,  REFRESH_TTL, String(nextRefreshAt));
  
            customLog(null, "info", { message: "[Xoxoday] Access token refreshed via DB fallback", accessKey }, "VENDOR");
            return newAccessToken;
          } catch (retryError) {
            customLog(null, "error", { message: "[Xoxoday] Retry also failed", error: retryError?.response?.data || retryError.message }, "VENDOR");
            return false;
          }
        }
  
        customLog(null, "error", { message: "[Xoxoday] DB refresh token is same as failed one — manual token update required", accessKey }, "VENDOR");
      }
  
      customLog(null, "error", { message: "[Xoxoday] Error during token refresh", error: errData || error.message }, "VENDOR");
      return false;
    }
};


/**
 * Auth — returns a valid access token.
 * 1. Checks Redis cache first.
 * 2. On first run (cache empty): primes cache with the seed access token from optional3,
 *    and stores the seed refresh token from optional4 for future refreshes.
 * 3. On subsequent cache misses: calls xoxodayRefreshToken to get a new token.
 */
const xoxodayAuthToken = async (details, accessKey) => {
  const ACCESS_TOKEN_CACHE_KEY  = `xoxoday-access-token-${accessKey}`;
  const REFRESH_TOKEN_CACHE_KEY = `xoxoday-refresh-token-${accessKey}`;
  const NEXT_REFRESH_CACHE_KEY  = `xoxoday-token-next-refresh-${accessKey}`;

  // 1. Return cached token if still valid
  const cachedAccessToken = await getValue(ACCESS_TOKEN_CACHE_KEY);
  if (cachedAccessToken) {
    return cachedAccessToken;
  }

  // 2. First run — prime cache with seed tokens from Xoxoday dashboard
  const seedAccessToken  = details.optional3;
  const seedRefreshToken = details.optional4;
  const refreshTokenInCache = await getValue(REFRESH_TOKEN_CACHE_KEY);

  if (seedAccessToken && !refreshTokenInCache) {
    // Very first call: store seed tokens and set next-refresh timestamp
    const ACCESS_TTL  = 14 * 24 * 60 * 60;
    const REFRESH_TTL = 30 * 24 * 60 * 60;
    const nextRefreshAt = Date.now() + 13 * 24 * 60 * 60 * 1000;

    await setValue(ACCESS_TOKEN_CACHE_KEY,  ACCESS_TTL,  seedAccessToken);
    if (seedRefreshToken) {
      await setValue(REFRESH_TOKEN_CACHE_KEY, REFRESH_TTL, seedRefreshToken);
      await setValue(NEXT_REFRESH_CACHE_KEY,  REFRESH_TTL, String(nextRefreshAt));
    }
    customLog(null, "info", { message: "[Xoxoday] Seed access token loaded from serviceDetails (first run)", accessKey }, "VENDOR");
    return seedAccessToken;
  }

  // 3. Cache expired — use refresh token to get a new access token
  return await xoxodayRefreshToken(details, accessKey);
};


/**
 * Fetches all Xoxoday gift card vouchers via the getVouchers API (paginated).
 * Filters to India only (country=IN, currencyCode=INR).
 * Maps response fields to the giftCards DB schema and returns in the same
 * format as getAllEdenredGiftCards.
 *
 * Xoxoday API:  POST {baseUrl}/v1/oauth/api
 * Headers:      Authorization: Bearer {accessToken}
 */
const getAllXoxodayGiftCards = asyncHandler(async (serviceOperator) => {
    try {
        const { id, accessKey, vendor } = serviceOperator;
        const details = vendor;

        const XOXODAY_BASE_URL = details.apiUrl 

        // Step 1: Get a valid access token from cache / refresh flow
        const accessToken = await xoxodayAuthToken(details, accessKey);
      
        if (!accessToken) {
            customLog(null, "error", { message: "[Xoxoday] Failed to obtain access token for getVouchers" }, "VENDOR");
            return { status: false, message: "Failed to obtain Xoxoday access token" };
        }

        const headers = {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        };

        // Step 2: Fetch all India/INR vouchers in a single call (limit: 0, page: 0 = full catalog)
        const config = {
            method: 'post',
            url: `${XOXODAY_BASE_URL}/api/`,
            headers,
            data: {
    "query": "plumProAPI.mutation.getVouchers",
    "tag": "plumProAPI",
    "variables": {
        "data": {
            "limit": 0,
            "page": 0,
            "includeProducts": "",
            "excludeProducts": "",
            "exchangeRate": 1,
            "sort": {
                "field": "",
                "order": ""
            },
            "filters": [
                               {
                    "key": "product",
                    "value": ""
                },
                 {
                    "key": "productName",
                    "value": ""
                },
                {
                    "key": "country",
                    "value": "India"
                },
                {
                    "key": "voucher_category",
                    "value": ""
                },
                {
                    "key": "minPrice",
                    "value": ""
                },
                {
                    "key": "maxPrice",
                    "value": ""
                },
                {
                    "key": "deliveryType",
                    "value": ""
                },
                {
                    "key": "currencyCode",
                    "value": "INR"
                }
            ]
        }
    }
}
        };

        customLog(null, "info", { message: "[Xoxoday] Fetching all vouchers (IN/INR)" }, "VENDOR");

        const response = await axios(config);
        const resData = response?.data?.data?.getVouchers;

        if (!resData || !Array.isArray(resData.data)) {
            customLog(null, "error", { message: "[Xoxoday] Unexpected response structure", response: response?.data }, "VENDOR");
            return { status: false, message: "Unexpected response from Xoxoday" };
        }

        const allVouchers = resData.data;

        if (allVouchers.length === 0) {
            return { status: false, message: "No vouchers returned from Xoxoday" };
        }

        // Step 3: Map Xoxoday response fields → giftCards DB schema
        const giftCards = allVouchers.map(card => {
            const isFixed = card.valueType === 'fixed_denomination';

            // valueDenominations is a comma-separated string e.g. "499" or "5000,1000,500"
            const denominations = card.valueDenominations
                ? card.valueDenominations.split(',').map(v => parseFloat(v.trim())).filter(v => !isNaN(v))
                : [];

            return {
                serviceOperatorId: id,
                product_id:          String(card.productId),
                product_name:        card.name,
                image:               card.imageUrl,
                description:         card.description,
                brand_name:          null,
                category:            card.categories ? card.categories.replace(/ & /g, ' and ') : null,
                priceType:           isFixed ? 'FIXED' : 'FLEXI',
                min_price:           isFixed ? (denominations[denominations.length - 1] || 0) : (card.minValue || 0),
                max_price:           isFixed ? (denominations[0] || 0)                        : (card.maxValue || 0),
                denominations:       denominations,
                terms_and_condition: card.termsAndConditionsInstructions,
                how_to_redeem:       card.redemptionInstructions,
                expiry:              null,   // Xoxoday does not return an absolute expiry date
                isAccessible:        true,
                quantityLimit:       card.orderQuantityLimit || null,
                expiryAndValidity:   card.expiryAndValidity || null,
                usageType:           card.usageType || null,
                deliveryType:        card.deliveryType || null,
                tatInDays:           card.tatInDays !== undefined && card.tatInDays !== null && card.tatInDays !== ''
                    ? parseInt(card.tatInDays, 10) || 0
                    : null,
            };
        });

        customLog(null, "info", { message: "[Xoxoday] Vouchers fetched and mapped", count: giftCards.length }, "VENDOR");

        return {
            status: true,
            message: "Gift cards fetched successfully",
            giftCards,
        };

    } catch (error) {
        customLog(null, "error", {
            message: "[Xoxoday] Error in getAllXoxodayGiftCards",
            error: error?.response?.data || error.message,
        }, "VENDOR");
        return {
            status: false,
            message: "Unexpected error while fetching Xoxoday gift cards",
            error: error.message,
        };
    }
});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                       HELPER FUNCTIONS FOR GETTING ALL GIFT CARDS


let sortObject = (object) => {
    if (object instanceof Array) {
        var sortedObj = [],
            keys = Object.keys(object);
    } else {
        sortedObj = {},
            keys = Object.keys(object);
    }

    keys.sort(function (key1, key2) {
        if (key1 < key2) return -1;
        if (key1 > key2) return 1;
        return 0;
    });

    for (var index in keys) {
        var key = keys[index];
        if (typeof object[key] == 'object') {

            if ((object[key] instanceof Array)) {
                sortedObj[key] = sortObject(object[key]);
            }
            sortedObj[key] = sortObject(object[key]);
        } else {
            sortedObj[key] = object[key];
        }
    }
    return sortedObj;
}

exports.fetchServiceOperator = asyncHandler(async (req, res, next) => {
    let serviceCategory = 'Gift Cards/Vouchers'
    let data = await findAllServiceOperatorOnCategory(serviceCategory)
    if(!data){
        return res.status(500).json({
            'status': false,
            'message': `Something went wrong`,
            'data': {},
            'responseCode' : '001'
        })
    }else{
        return res.status(200).json({
            'status': true,
            'message': `Service operator fetched successfully`,
            'data': { data },
            'responseCode' : '000'

        })
    }
})

const getAllGiftCardsFromServer = asyncHandler(async (vendor) => {
  let message = "No gift cards found";
  let errors = [];
  let status = false;
  let giftCards = [];
  let pageNo = 1;
  let pageSize = 100;
  const gvType = "ONLINE";
  // return giftCardSample_MOCK;

  try {
    let token = await this.authToken(vendor);
    const headers = { Authorization: token, client_id: vendor.optional1 };
    while (true) {
      const config = {
        method: "post",
        url: `${vendor.apiUrl}/v1/fulfillment/fetch/catalog`,
        headers: headers,
        data: {
          page_count: pageNo,
          items_per_page: pageSize,
          gvType: gvType,
        },
      };
      const response = await axios(config);
      const { data } = response;
      if (data.status === "SUCCESS" && Array.isArray(data.response.products)) {
        giftCards.push(...data.response.products.filter((card) => card));
        pageNo++;
        if (!data.has_more) break; //exit from loop, if there is no more items
      } else {
        errors.push(`Something went wrong, ${data.status}`);
        break; //exit from loop if there is any error
      }
    }

    // Check the status of the newly created gift card array
    if (giftCards.length > 0) {
      status = true;
      message = "Gift card found successfully";
    }
  } catch (error) {
    console.error(error.message);
    return { status, giftCards, message: error.message || "Something went wrong while getting gift cards from vendor", errors };
  }

  return { status, giftCards, message, errors };
});

exports.authToken = async (details, accessKey) => {
    let isTokenData = await getValue(`token-${accessKey}`);
    if (isTokenData) {
      return isTokenData;
    } else {
      const clientId = details.optional1;
      const clientSecret = details.optional2;
      const jwtSigningKey = details.optional3;
  
      if (!clientSecret || !jwtSigningKey || !clientId) {
        return false;
      }
      const token = await generateJwtTokenPaytm(clientId, clientSecret, jwtSigningKey);
      if (token) {
        let tokenData = token;
        await setValue(`token-${accessKey}`, 6 * 24 * 60 * 60, tokenData); //6 days expiry
        return tokenData;
      } else {
        return false;
      }
    }
  };




  function sanitizeCard(card) {
    const TEXT_FIELDS = ['product_name', 'brand_name', 'description', 'terms_and_condition', 'how_to_redeem'];
    const sanitized = { ...card };
    TEXT_FIELDS.forEach(field => {
        if (typeof sanitized[field] === 'string') {
            sanitized[field] = sanitized[field]
                .normalize('NFD')                        // decompose accented chars (Ö → O + combining char)
                .replace(/[\u0300-\u036f]/g, '')         // strip combining diacritical marks
                .replace(/[\u2018\u2019]/g, "'")         // curly single quotes → '
                .replace(/[\u201C\u201D]/g, '"')         // curly double quotes → "
                .replace(/[\u2013\u2014]/g, '-')         // en/em dash → -
                .replace(/\u2026/g, '...')               // ellipsis → ...
                .replace(/[^\u0020-\u007E\t\n\r]/g, '');  // strip any remaining non-ASCII
        }
    });
    return sanitized;
  }

  function generateResponseMessage(responses, action) {
    try {
        let totalCount = responses.length;
        let successCount = 0;
        let failureCount = 0;
        responses.forEach(element => {
            const isObject = typeof element === 'object' && !Array.isArray(element)
            const isArrayWithFirstElement1 = Array.isArray(element) && element[0] === 1;
            const ISvALID = (element !== null && element !== undefined);
            if ((isObject || isArrayWithFirstElement1) && ISvALID) {
                successCount++;
            } else {
                failureCount++;
            }
        });
        if (totalCount === successCount) {
            return `${successCount} gift cards ${action} successfully`;
        } else if (successCount > 0 && failureCount > 0) {
            return `${successCount} gift cards ${action} successfully, but ${failureCount} failed`;
        } else {
            return `${successCount} gift cards ${action} and ${failureCount} failed`;
        }
    } catch (error) {
        customLog(null, "error", { message: "An error occurred", error: error });
        return `Something went wrong while generating the success message!`;
    }
}


     const MOCK_EDENRED_RESULT = `
        <?xml version="1.0" encoding="utf-8"?> 
        <ResponseOutDto xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
        xmlns:xsd="http://www.w3.org/2001/XMLSchema"> 
          <RequestGuid>94d9ff94-9853-47f0-a7e1-25877e3a155b</RequestGuid> 
          <Response>&lt;?xml version="1.0" encoding="utf-8"?&gt; 
        &lt;GetProdInfoByOrderResponseDto xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
        xmlns:xsd="http://www.w3.org/2001/XMLSchema"&gt; 
          &lt;ResponseCode&gt;0000&lt;/ResponseCode&gt; 
          &lt;Message&gt;Success&lt;/Message&gt; 
          &lt;OrderNumber&gt;202107148936&lt;/OrderNumber&gt; 
          &lt;EndClientIdentityCode&gt;000000000000187&lt;/EndClientIdentityCode&gt; 
          &lt;OrderProductInfos&gt; 
            &lt;OrderProductInfo&gt; 
              &lt;ProgramCode&gt;00001&lt;/ProgramCode&gt; 
              &lt;ProductCode&gt;IDPSM001&lt;/ProductCode&gt; 
              &lt;ProductName&gt;TX Integration Demo SCV Product Rs. 250&lt;/ProductName&gt; 
              &lt;ProductDescription /&gt; 
              &lt;SoldPrice&gt;200.0000&lt;/SoldPrice&gt; 
              &lt;ImageURL&gt;http://media-uat.ticketxpress.co.in/Images/41fcbd47-0672-4655-a435
        e4eda17ce182.jpg&lt;/ImageURL&gt; 
              &lt;ProductFootNote /&gt; 
              &lt;ExpiryScheme&gt;Within12MonthsExpiredAfterActivation&lt;/ExpiryScheme&gt; 
              &lt;ExpiryDate /&gt; 
              &lt;ProductStatus&gt;Active&lt;/ProductStatus&gt; 
              &lt;ProductType&gt;1&lt;/ProductType&gt; 
              &lt;Balance&gt;1&lt;/Balance&gt; 
              &lt;IsMasterProduct&gt;true&lt;/IsMasterProduct&gt; 
              &lt;ProductTagListLength&gt;3&lt;/ProductTagListLength&gt; 
              &lt;ProductTagList&gt; 
                &lt;ProductTagDto&gt; 
                  &lt;TagName&gt;Digital&lt;/TagName&gt; 
                  &lt;TagValue&gt;true&lt;/TagValue&gt; 
                &lt;/ProductTagDto&gt; 
                &lt;ProductTagDto&gt; 
                  &lt;TagName&gt;Delivery&lt;/TagName&gt; 
                  &lt;TagValue&gt;false&lt;/TagValue&gt; 
                &lt;/ProductTagDto&gt; 
                &lt;ProductTagDto&gt; 
                  &lt;TagName&gt;Paper&lt;/TagName&gt; 
                  &lt;TagValue&gt;false&lt;/TagValue&gt; 
                &lt;/ProductTagDto&gt; 
              &lt;/ProductTagList&gt; 
              &lt;ProductExternalProperyListLength&gt;1&lt;/ProductExternalProperyListLength&gt; 
              &lt;ProductExternalProperyList&gt; 
                &lt;ProductExternalPropertyDto&gt; 
                  &lt;PropertyName&gt;SCVBannerImage1&lt;/PropertyName&gt; 
                  &lt;PropertyValue&gt;76&lt;/PropertyValue&gt; 
                  &lt;PropertyDescription /&gt; 
                &lt;/ProductExternalPropertyDto&gt; 
              &lt;/ProductExternalProperyList&gt; 
              &lt;SoldPriceWithTax&gt;200.0000&lt;/SoldPriceWithTax&gt; 
              &lt;FaceValue&gt;25000&lt;/FaceValue&gt; 
              &lt;FaceValueWithTax&gt;25000&lt;/FaceValueWithTax&gt; 
            &lt;/OrderProductInfo&gt; 
            &lt;OrderProductInfo&gt; 
              &lt;ProgramCode&gt;00001&lt;/ProgramCode&gt; 
              &lt;ProductCode&gt;IDP001&lt;/ProductCode&gt; 
              &lt;ProductName&gt;TX Integration Demo EGV Product Rs. 250&lt;/ProductName&gt; 
              &lt;ProductDescription&gt;This is demo product created for client integration project 
        development and testing&lt;/ProductDescription&gt; 
              &lt;SoldPrice&gt;200.0000&lt;/SoldPrice&gt; 
              &lt;ProductFootNote /&gt; 
              &lt;ExpiryScheme&gt;Within12MonthsExpiredAfterActivation&lt;/ExpiryScheme&gt; 
              &lt;ExpiryDate /&gt; 
              &lt;ProductStatus&gt;Active&lt;/ProductStatus&gt; 
              &lt;ProductType&gt;2&lt;/ProductType&gt; 
              &lt;Balance&gt;0&lt;/Balance&gt; 
              &lt;IsMasterProduct&gt;false&lt;/IsMasterProduct&gt; 
              &lt;ProductTagListLength&gt;3&lt;/ProductTagListLength&gt; 
              &lt;ProductTagList&gt; 
                &lt;ProductTagDto&gt; 
                  &lt;TagName&gt;Digital&lt;/TagName&gt; 
                  &lt;TagValue&gt;true&lt;/TagValue&gt; 
                &lt;/ProductTagDto&gt; 
                &lt;ProductTagDto&gt; 
                  &lt;TagName&gt;Delivery&lt;/TagName&gt; 
                  &lt;TagValue&gt;false&lt;/TagValue&gt; 
                &lt;/ProductTagDto&gt; 
                &lt;ProductTagDto&gt; 
                  &lt;TagName&gt;Paper&lt;/TagName&gt; 
                  &lt;TagValue&gt;false&lt;/TagValue&gt; 
                &lt;/ProductTagDto&gt; 
              &lt;/ProductTagList&gt; 
              &lt;ProductExternalProperyListLength&gt;0&lt;/ProductExternalProperyListLength&gt; 
              &lt;SoldPriceWithTax&gt;200.0000&lt;/SoldPriceWithTax&gt; 
              &lt;FaceValue&gt;25000&lt;/FaceValue&gt; 
              &lt;FaceValueWithTax&gt;25000&lt;/FaceValueWithTax&gt; 
            &lt;/OrderProductInfo&gt; 
            &lt;OrderProductInfo&gt; 
              &lt;ProgramCode&gt;00001&lt;/ProgramCode&gt; 
              &lt;ProductCode&gt;IDP002&lt;/ProductCode&gt; 
              &lt;ProductName&gt;TX Integration Demo EGV Product Rs. 250 with PIN&lt;/ProductName&gt; 
              &lt;ProductDescription&gt;This is demo product created for client integration project 
        development and testing&lt;/ProductDescription&gt; 
              &lt;SoldPrice&gt;200.0000&lt;/SoldPrice&gt; 
              &lt;ProductFootNote&gt;This is&amp;amp;nbsp;TX Integration Demo EGV Product Rs. 250 with 
        PIN footnote&lt;/ProductFootNote&gt; 
              &lt;ExpiryScheme&gt;Within12MonthsExpiredAfterActivation&lt;/ExpiryScheme&gt; 
              &lt;ExpiryDate /&gt; 
              &lt;ProductStatus&gt;Active&lt;/ProductStatus&gt; 
              &lt;ProductType&gt;2&lt;/ProductType&gt; 
              &lt;Balance&gt;0&lt;/Balance&gt; 
              &lt;IsMasterProduct&gt;false&lt;/IsMasterProduct&gt; 
              &lt;ProductTagListLength&gt;3&lt;/ProductTagListLength&gt; 
              &lt;ProductTagList&gt; 
                &lt;ProductTagDto&gt; 
                  &lt;TagName&gt;Digital&lt;/TagName&gt; 
                  &lt;TagValue&gt;true&lt;/TagValue&gt; 
                &lt;/ProductTagDto&gt; 
                &lt;ProductTagDto&gt; 
                  &lt;TagName&gt;Delivery&lt;/TagName&gt; 
                  &lt;TagValue&gt;false&lt;/TagValue&gt; 
                &lt;/ProductTagDto&gt; 
                &lt;ProductTagDto&gt; 
                  &lt;TagName&gt;Paper&lt;/TagName&gt; 
                  &lt;TagValue&gt;false&lt;/TagValue&gt; 
                &lt;/ProductTagDto&gt; 
              &lt;/ProductTagList&gt; 
              &lt;ProductExternalProperyListLength&gt;0&lt;/ProductExternalProperyListLength&gt; 
              &lt;SoldPriceWithTax&gt;200.0000&lt;/SoldPriceWithTax&gt; 
              &lt;FaceValue&gt;25000&lt;/FaceValue&gt; 
              &lt;FaceValueWithTax&gt;25000&lt;/FaceValueWithTax&gt; 
            &lt;/OrderProductInfo&gt; 
            &lt;OrderProductInfo&gt; 
              &lt;ProgramCode&gt;00002&lt;/ProgramCode&gt; 
              &lt;ProductCode&gt;IDP003&lt;/ProductCode&gt; 
              &lt;ProductName&gt;TP Integration Demo EGV Product Rs. 250&lt;/ProductName&gt; 
              &lt;ProductDescription&gt;This is demo product created for client integration project 
        development and testing&lt;/ProductDescription&gt; 
              &lt;SoldPrice&gt;200.0000&lt;/SoldPrice&gt; 
              &lt;ProductFootNote&gt;This is integration demo footnote&lt;/ProductFootNote&gt; 
              &lt;ExpiryScheme&gt;Flexible Date Deferred Within End Of 12 Months Expired After 
        Activation&lt;/ExpiryScheme&gt; 
              &lt;ExpiryDate /&gt; 
              &lt;ProductStatus&gt;Active&lt;/ProductStatus&gt; 
              &lt;ProductType&gt;2&lt;/ProductType&gt; 
              &lt;Balance&gt;0&lt;/Balance&gt; 
              &lt;IsMasterProduct&gt;false&lt;/IsMasterProduct&gt; 
              &lt;ProductTagListLength&gt;3&lt;/ProductTagListLength&gt; 
              &lt;ProductTagList&gt; 
                &lt;ProductTagDto&gt; 
                  &lt;TagName&gt;Digital&lt;/TagName&gt; 
                  &lt;TagValue&gt;true&lt;/TagValue&gt; 
                &lt;/ProductTagDto&gt; 
                &lt;ProductTagDto&gt; 
                  &lt;TagName&gt;Delivery&lt;/TagName&gt; 
                  &lt;TagValue&gt;false&lt;/TagValue&gt; 
                &lt;/ProductTagDto&gt; 
                &lt;ProductTagDto&gt; 
                  &lt;TagName&gt;Paper&lt;/TagName&gt; 
                  &lt;TagValue&gt;false&lt;/TagValue&gt; 
                &lt;/ProductTagDto&gt; 
              &lt;/ProductTagList&gt; 
              &lt;ProductExternalProperyListLength&gt;0&lt;/ProductExternalProperyListLength&gt; 
              &lt;SoldPriceWithTax&gt;200.0000&lt;/SoldPriceWithTax&gt; 
              &lt;FaceValue&gt;25000&lt;/FaceValue&gt; 
              &lt;FaceValueWithTax&gt;25000&lt;/FaceValueWithTax&gt; 
            &lt;/OrderProductInfo&gt; 
            &lt;OrderProductInfo&gt; 
              &lt;ProgramCode&gt;00002&lt;/ProgramCode&gt; 
              &lt;ProductCode&gt;IDP004&lt;/ProductCode&gt; 
              &lt;ProductName&gt;TP Integration Demo EGV Product Rs. 250 with PIN&lt;/ProductName&gt; 
              &lt;ProductDescription&gt;This is demo product created for client integration project 
        development and testing&lt;/ProductDescription&gt; 
              &lt;SoldPrice&gt;200.0000&lt;/SoldPrice&gt; 
              &lt;ProductFootNote&gt;This is integration demo footnote&lt;/ProductFootNote&gt; 
              &lt;ExpiryScheme&gt;Flexible Date Deferred Within End Of 12 Months Expired After 
        Activation&lt;/ExpiryScheme&gt; 
              &lt;ExpiryDate /&gt; 
              &lt;ProductStatus&gt;Active&lt;/ProductStatus&gt; 
              &lt;ProductType&gt;2&lt;/ProductType&gt; 
              &lt;Balance&gt;0&lt;/Balance&gt; 
              &lt;IsMasterProduct&gt;false&lt;/IsMasterProduct&gt; 
              &lt;ProductTagListLength&gt;3&lt;/ProductTagListLength&gt; 
              &lt;ProductTagList&gt; 
                &lt;ProductTagDto&gt; 
                  &lt;TagName&gt;Digital&lt;/TagName&gt; 
                  &lt;TagValue&gt;true&lt;/TagValue&gt; 
                &lt;/ProductTagDto&gt; 
                &lt;ProductTagDto&gt; 
                  &lt;TagName&gt;Delivery&lt;/TagName&gt; 
                  &lt;TagValue&gt;false&lt;/TagValue&gt; 
                &lt;/ProductTagDto&gt; 
                &lt;ProductTagDto&gt; 
                  &lt;TagName&gt;Paper&lt;/TagName&gt; 
                  &lt;TagValue&gt;false&lt;/TagValue&gt; 
                &lt;/ProductTagDto&gt; 
              &lt;/ProductTagList&gt; 
              &lt;ProductExternalProperyListLength&gt;0&lt;/ProductExternalProperyListLength&gt; 
              &lt;SoldPriceWithTax&gt;200.0000&lt;/SoldPriceWithTax&gt; 
              &lt;FaceValue&gt;25000&lt;/FaceValue&gt; 
              &lt;FaceValueWithTax&gt;25000&lt;/FaceValueWithTax&gt; 
            &lt;/OrderProductInfo&gt; 
          &lt;/OrderProductInfos&gt; 
        &lt;/GetProdInfoByOrderResponseDto&gt;</Response> 
        </ResponseOutDto>`

       
       
       
  
  