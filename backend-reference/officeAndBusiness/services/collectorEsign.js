const { findServiceOperatorByAccessKey } = require("../utils/checkAndFetchServiceDetails")
const {createNewSupplier,findSupplierByCorporateUserId}=require('../models/use-cases/invoiceSupplier')
const moment = require('moment');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const libre = require('libreoffice-convert');
libre.convertAsync = require('util').promisify(libre.convert);
const fs = require('fs')
const path = require('path')
const axios = require('axios');
const { uploadFile } = require("../utils/commonUploadFile");
const accessKey = 'quick_links'

async function getESignRequestData(body) {
    try {
        let { docket_title, docket_description, expiry_date, documentBase64, initiator_email,
            sequentialSignature, signers_info = [] } = body
        if (expiry_date) {
            let expiryDateEOD = moment(expiry_date).set({ hour: 23, minute: 59, second: 59 }).format('YYYY-MM-DDTHH:mm:ss');
            body.expiry_date = expiryDateEOD
            expiry_date = formatDate(new Date(expiryDateEOD)) || undefined
        } else {
            expiry_date = undefined
        }
        const base64String = documentBase64.replace(/^data:application\/pdf;base64,/, '');
        const reference_id = new Date().valueOf()
        const reference_doc_id = reference_id + 1 // Unique for every uploaded file.
        let signer_ref_id = reference_id + 2 // Unique for every user

        const requestData = {
            // "mode":'draft',
            "reference_id": reference_id.toString(),
            "docket_title": docket_title,
            "enable_email_notification": true, // completion email functionality
            "description_in_invitation": true,
            "docket_description": docket_description,
            "final_copy_recipients": initiator_email,
            "expiry_date": expiry_date,
            "documents": [
                {
                    "reference_doc_id": reference_doc_id.toString(),
                    "content_type": "pdf",
                    "content": base64String, // base64 encoded content
                    "signature_sequence": sequentialSignature == true ? 'sequential' : 'parallel', // sequential OR parallel,
                    "custom": {
                        "access_key": accessKey,
                        "initiator_name": 'Peko',
                    }
                }
            ],
            "signers_info": signers_info.map((element, index) => {
                const {  signer_name, signer_email, sequence, page_number } = element;
                let newId = signer_ref_id + index
                const pageNumberString = page_number.join(',');
                return {
                    "document_to_be_signed": reference_doc_id.toString(),  // corresponding reference_doc_id.
                    "signer_position": {
                        "appearance": [{ x1: 418, x2: 528, y1: 240, y2: 280 }]
                    },
                    "signer_ref_id": newId.toString(),  //unique reference ID to identify each signer
                    "signer_name": signer_name,
                    "signer_email": signer_email,
                    //"signer_mobile": '', //req if "signature_type": "electronic"
                    "sequence": sequence, // order
                    "page_number": pageNumberString,
                    "signature_type": "electronic",
                    "esign_type": "otp",
                    "authentication_mode": "email", // email,mobile,both,none
                    "trigger_esign_request": true, // email notification to sign the document.
                    "trigger_esign_request_invitation": "email" // email,mobile
                }
            })
        };

        return requestData
    } catch (error) {
        console.log({ Error: error.message })
        throw new Error('Something went wrong')
    }
}


exports.sendCollectorAgreement = async (userData) => {
    try {
        let { vendor: { optional1, optional2, apiUrl } } = await findServiceOperatorByAccessKey('signDesk_eSign');

        const agreementData = {
            date: moment().format('DD-MM-YYYY'),
            corporateName: userData.name || 'name',
            email: userData.email,
            companyName: userData.companyName,
            designation:userData.designation,
            address:userData.address,
            city:userData.city
        };

        const documentBase64 = await generateAgreement(agreementData);
        // console.log("🚀 ~ exports.sendCollectorAgreement= ~ documentBase64:", documentBase64);
        let supplier = await findSupplierByCorporateUserId(userData.corporateUserId);
        if (!supplier) {
            const newSupplier = {
                corporateUserId: userData.corporateUserId,
                supplierEmail: userData.email,
                kybStatus: 'PENDING', 
                eSignStatus: 'E-SIGN PENDING',
                agreementDetails: agreementData,
                supplierName: userData.name,
                
            };
            
            // Call create function to add the supplier
            supplier = await createNewSupplier(newSupplier);
            if (!supplier) {
                console.error("Failed to create new supplier.");
                return false;
            }
        }
        if (!documentBase64) {
            //  failed to send the pdf 
            supplier.agreementDetails = {
                status: 'FAILED TO SENT',
                docket_id: null,
                document_id: null,
                agreement_sent_date: null,
                signer_info: null,
                signer_email: userData.email,
                count: 0
            }
            await supplier.save()
            return false
        }

        const signData = {
            docket_title: 'Agreement',
            documentBase64: documentBase64,
            initiator_email: userData.email,
            expiry_date: moment().add(7, 'days').format('YYYY-MM-DD'),
            sequentialSignature: true,
            signers_info: [
                {
                    sequence: "1",
                    signer_name: userData.signerName,
                    signer_email: userData.email,
                    signer_mobile: userData.mobileNo,
                    page_number: ["33"],
                    x_coordinate: 0, 
                    y_coordinate: 0,
                }
            ]
        };

        const config = {
            method: 'post',
            url: `${apiUrl}/signRequest`,
            headers: {
                'Content-Type': 'application/json',
                'x-parse-rest-api-key': optional1,
                'x-parse-application-id': optional2
            },
            data: await getESignRequestData(signData)
        };

        const signDeskResponse = await axios(config);
        const eSignResponse = signDeskResponse.data;
        console.log("🚀 ~ exports.sendCollectorAgreement= ~ eSignResponse:", eSignResponse);

        if (!eSignResponse || (eSignResponse.status && eSignResponse.status.toUpperCase() !== 'SUCCESS') || eSignResponse.error) {
            supplier.agreementDetails = {
                status: 'FAILED TO SENT',
                docket_id: null,
                document_id: null,
                agreement_sent_date: null,
                signer_info: null,
                signer_email: userData.email,
                count: 0
            }
            await supplier.save()
            return false;
        }

        const base64String = documentBase64.replace(/^data:application\/pdf;base64,/, '');
        const filePath = `${userData.credential?.role ? userData.credential.role.toLowerCase() : "unknown-role"}/${userData.credential?.username ? userData.credential.username : "unknown-user"}/Tripartite-Agreement`;
        let uploadedUrl = await uploadFile(base64String, filePath, 'pdf');

        const { docket_id, response_time_stamp, signer_info } = eSignResponse;

        // Assuming the agreement is sent successfully, save the details
        supplier.agreementDetails = {
            status: 'AGREEMENT SENT',
            docket_id: docket_id,
            document_id: signer_info[0]?.document_id,
            agreement_sent_date: response_time_stamp,
            signer_info: signer_info,
            agreement_url: uploadedUrl,
            signer_email: userData.email,
            signer_name: userData.signerName,
            designation:userData.designation,
            address:userData.address,
            city:userData.city,
            count: 1
        };
        console.log("suppolier.agreementDetails", supplier.agreementDetails)
        supplier.eSignStatus = 'E-SIGN PENDING';
        supplier.supplierEmail=userData.email;
        await supplier.save()
        return true;
    } catch (error) {
        console.error("Error in sending agreement:", error);
        return false;
    }
};

function getOrdinalSuffix(number) {
    if (number < 1 || number > 31) return "Invalid number"; 

    const suffixes = ["th", "st", "nd", "rd"];
    const lastDigit = number % 10;
    const lastTwoDigits = number % 100;

    if ([11, 12, 13].includes(lastTwoDigits)) return `${number}th`;

    return `${number}${suffixes[lastDigit] || "th"}`;
}

function getMonthName(monthStr) {
    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const monthIndex = parseInt(monthStr, 10) - 1;
    return months[monthIndex] || "Invalid month";
}


async function generateAgreement(agreementData) {
    try {

        // Load and read the DOCX template file
        const filePath = path.join(__dirname, '..', 'public', 'Decfin_MSA-Payment_Aggregator_Sub-Merchant.docx');
        const content = await fs.promises.readFile(filePath, 'binary');
        const zip = new PizZip(content);
        const doc = new Docxtemplater(zip);
        
        // Set the template variables
        doc.setData({
            signerName: agreementData.corporateName,
            designation: agreementData.designation, 
            address:agreementData.address , 
            city: agreementData.city, 
            date: agreementData.date,
            day: getOrdinalSuffix(Number(agreementData.date.split('-')[0])), 
            month: getMonthName(agreementData.date.split('-')[1]),
            year: agreementData.date.split('-')[2],
            email: agreementData.email,
            companyName: agreementData.companyName
            // natureOfBusiness: agreementData.natureOfBusiness,
            // iban: agreementData.bankDetails.iban,
            // bankName: agreementData.bankDetails.bankName,
            // bankAccountHolderName: agreementData.bankDetails.bankAccountHolderName,
        });

        // Render the document with the provided data
        doc.render();

        // Generate the DOCX in memory as a buffer
        const docxBuffer = doc.getZip().generate({ type: 'nodebuffer' });

        // Convert the DOCX buffer to PDF buffer
        const pdfBuffer = await libre.convertAsync(docxBuffer, '.pdf', undefined);

        // Convert the PDF buffer to a base64 string
        const pdfBase64 = pdfBuffer.toString('base64');

        // Return the base64 string
        return pdfBase64;
    } catch (error) {
        console.error('Error during document generation or conversion:', error);
        return false
    }
}


const formatDate = (date) => {
    try {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
    } catch (error) {
        return undefined
    }
};