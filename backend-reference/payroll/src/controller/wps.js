/* eslint-disable no-unused-vars */
const { default: axios } = require("axios");
const asyncHandler = require("../middleware/async");
const ErrorResponse = require("../utils/error-response");
const { updateWpsDocuments } = require("../models/use-cases/corporateUser");
const baseUrl = "https://orvillestaging.luluone.com:8443";
const emailer = require("../utils/email/emailer");
const { getWpsAuthToken } = require("../services/getWpsAuthToken");
const { getWpsAuthToken2 } = require("../services/getWpsAuthToken2");


exports.wpsRegistration = asyncHandler(async (req, res) => {

    const corporateUserID = req.user._id;
    const { registrationStatus } = req.user.wps
    const { isFreeZoneCompany } = req.user
    let { wpsDocuments } = req.body
    if (isFreeZoneCompany === true) {
        throw new ErrorResponse('Free zone company! Wps registration is not required', 400)
    }
    if (registrationStatus === 'REGISTERED') {
        // throw new ErrorResponse('You are already registered under wps', 400)
    } else if (registrationStatus === 'INPROGRESS') {
        // throw new ErrorResponse('Your wps registration is in progress', 400)
    }

    //next need to send these docs via emial as attachment
    let emailId = 'onlineac012@gmail.com'
    let subject = 'WPS registration request'
    const body = 'Please find bellow attachments...'
    const attachments = wpsDocuments.map(doc => ({
        filename: doc.name,
        path: doc.url
    }));
    // Call email function to send email with payment details in the body
    const { status, message } = await emailer.emailWithAttachmentBulk(emailId, subject, body, attachments);
    if (!status) {
        throw new ErrorResponse(message, 400)
    }
    const updatedDocs = await updateWpsDocuments(corporateUserID, wpsDocuments)

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: "Documents submitted successfully",
        data: updatedDocs
    });

})

exports.getAuthToken = asyncHandler(async (req, res) => {

    const token = await getWpsAuthToken2()
    console.log({ token })
    // await convertToSIFBuffer([
    //     { "source": "ProteinA", "target": "ProteinB", "interaction": "binds" },
    //     { "source": "ProteinB", "target": "ProteinC", "interaction": "interacts_with" }
    // ])
    // await convertToCSVBuffer([
    //     { "source": "ProteinA", "target": "ProteinB", "interaction": "binds" },
    //     { "source": "ProteinB", "target": "ProteinC", "interaction": "interacts_with" }
    // ])
    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: "",
        data: token,
    });
})

exports.getSipTemplate = asyncHandler(async (req, res) => {
    const sipTemplateUrl = `${req.protocol}://${req.get('host')}/Peko-SIF-Template.xlsx`;

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: "SIF Template",
        data: {
            url: sipTemplateUrl
        }
    });

})

exports.uploadSalaryFile = asyncHandler(async (req, res) => {
    console.log({ body: req.body })
    if (!req.file) {
        throw new ErrorResponse("No file uploaded.", 400)
    }

    const file = req.file.buffer; // Accessing file buffer data
    console.log({ file: req.file, buffer: req.file.buffer })
    // const { userid, establishmentid } = req.body;
    const apiUrl = `${baseUrl}/hbapi/v1_0/wps/uploadsalaryfile`;

    let config = {
        method: 'post',
        url: apiUrl,
        headers: {
            sender: "<will_be_provided>",
            company: "<will_be_provided>",
        },
        data: {
            file: file, //binary data
            userid: 'userid', //string ,max length 16
            establishmentid: 'establishmentid', //string,max length 30
            processingtype: 1,
        }
    };
    const response = await axios(config);
    console.log({ response })
    const { code, message, payload } = response;
    console.log({ code, payload, message })

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: "",
        data: response,
    });

})

exports.checkSalaryStatus = asyncHandler(async (req, res) => {
    const apiUrl = `${baseUrl}/hbapi/v1_0/wps/mypayfilestatus`;
    let config = {
        method: 'post',
        url: apiUrl,
        headers: {
            sender: "<will_be_provided>",
            company: "<will_be_provided>",
        },
        data: {
            userid: "159100661432642",
            aFromDate: "2020-05-18 00:00:00.000",//date
            aToDate: "2020-05-18 00:00:00.000",//date   
            aEstablishmentId: "0000000165112",//Company code /MOLID
            aSifFileName: "",//Sif file name
            aSalaryMonth: "",//Month of which salary processed
            aMyPayFileFormat: "SIF",
            aSearchTypeDate: "UD",
            aStatus: 0,
        }
    };
    const response = await axios(config);
    const { code, payload, message } = response;
    console.log({ code, payload, message })

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: "",
        data: response,
    });
})

