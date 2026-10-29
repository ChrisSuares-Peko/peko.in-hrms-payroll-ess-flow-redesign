const express = require("express");
const router = express.Router();
const multer = require("multer");
const { wpsRegistration, getAuthToken, checkSalaryStatus, uploadSalaryFile, getSipTemplate } = require("../controller/wps");
const { wpsDocumentsUpload } = require("../middleware/fileUpload");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10 MB

// const baseUrl = "https://orvillestaging.luluone.com:8443";

router.post("/registration",wpsDocumentsUpload, wpsRegistration);
router.get('/auth-token', getAuthToken);
router.get('/sip-template', getSipTemplate);
router.post("/upload-salary-file", upload.single("file"), uploadSalaryFile);
router.post("/check-salary-status", checkSalaryStatus);




// //file data  from other end  point is buffer data
// router.post("/uploadsalaryfile", async (req, res, next) => {
//     try {
//         const { file, userid, establishmentid } = req.body;
//         const apiUrl = `${baseUrl}/hbapi/v1_0/wps/uploadsalaryfile`;
//         const headers = {
//             sender: "<will_be_provided>",
//             company: "<will_be_provided>",
//         };
//         const data = {
//             file: file, //binary data
//             userid: userid, //string ,max length 16
//             establishmentid: establishmentid, //string,max length 30
//             processingtype: 1
//         };
//         const response = await axios.post(apiUrl, data, { headers });
//         const { code, message, payload } = response;
//         console.log("code:", code);
//         console.log("message", message);
//         console.log("payload:", payload);
//     } catch (error) {
//         console.error("Request Error:", error.message);
//         throw new Error(error.message);
//     }
// });

// //file data from other endpoint is to be converted into buffer data
// router.post(
//     "/uploadsalaryfile",
//     upload.single("file"),
//     async (req, res, next) => {
//         try {
//             if (!req.file) {
//                 return res.status(400).send("No file uploaded.");
//             }

//             const file = req.file.buffer; // Accessing file buffer data

//             const { userid, establishmentid } = req.body;
//             const apiUrl = `${baseUrl}/hbapi/v1_0/wps/uploadsalaryfile`;
//             const headers = {
//                 sender: "<will_be_provided>",
//                 company: "<will_be_provided>",
//             };
//             const data = {
//                 file: file, //binary data
//                 userid: userid, //string ,max length 16
//                 establishmentid: establishmentid, //string,max length 30
//                 processingtype: 1,
//             };
//             const response = await axios.post(apiUrl, data, { headers });
//             const { code, message, payload } = response;
//             console.log("code:", code);
//             console.log("message", message);
//             console.log("payload:", payload);
//         } catch (error) {
//             console.error("Request Error:", error.message);
//             throw new Error(error.message);
//         }
//     }
// );

// router.post("/checkSalaryStatus", async (req, res) => {
//     try {
//         const apiUrl = `${baseUrl}/hbapi/v1_0/wps/mypayfilestatus`;
//         const headers = {
//             sender: "<will_be_provided>",
//             company: "<will_be_provided>",
//         };
//         const data = {
//             userid: "159100661432642",
//             aFromDate: "2020-05-18 00:00:00.000",//date
//             aToDate: "2020-05-18 00:00:00.000",//date   
//             aEstablishmentId: "0000000165112",//Company code /MOLID
//             aSifFileName: "",//Sif file name
//             aSalaryMonth: "",//Month of which salary processed
//             aMyPayFileFormat: "SIF",
//             aSearchTypeDate: "UD",
//             aStatus: 0,
//         };
//         const response = await axios.post(apiUrl, data, { headers });
//         const { code, payload, message } = response;
//         console.log("code:", code);
//         console.log("message", message);
//         console.log("payload:", payload);
//     } catch (error) {
//         console.error("Request Error:", error.message);
//         throw new Error(error.message);
//     }
// });

module.exports = router;
