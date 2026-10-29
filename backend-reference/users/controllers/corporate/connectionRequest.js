const asyncHandler = require("../../middlewares/async");
const ErrorResponse = require("../../utils/error-response");
const { create, findOne, udpateStatus, findAllRequests, findExisting, countPendingRequests } = require("../../models/use-cases/connectionRequest");
const { findOneCorporate, fetchAllCorporate } = require("../../models/use-cases/corporateUser");
const { createNotification } = require("../../models/use-cases/notification");
const { uploadFile } = require("../../utils/commonUploadFile");

exports.createConnectionRequest = asyncHandler(async (req, res, next) => {
  const { receiverId, message } = req.body;
  const senderId = req.user.corporateId;
  if (senderId == receiverId) {
    return next(new ErrorResponse("Invalid request", 400));
  }
  const existingRequest = await findExisting({ senderId, receiverId });
  if (existingRequest) {
    if (existingRequest.status === 'PENDING') {
      return next(new ErrorResponse("The connection has not yet accepted your request.", 400));
    } else if (existingRequest.status === 'ACCEPTED') {
      return next(new ErrorResponse("A connection request between these corporates has already been accepted.", 400));
    }else{
      return next(new ErrorResponse("A connection is already exists between these corporates.", 400));
    }
  }

  const result = await create(senderId, receiverId, message);
  const { credential } = await findOneCorporate({ id: receiverId }, ["name"])
  // Send push notification with requset details
  const notificationData = {
    notificationTitle: "New Connection Request",
    notificationBrief: `${req.user.name} has sent you a connection request. Accept the request to start the conversation.`,
    notificationTo: [credential.username],
    notificationCategory: "CORPORATE",
    notificationBy: req.user.username,
  };
  createNotification(notificationData);
  
  result.pendingRequests = await countPendingRequests({ receiverId:senderId });

  if (result) {
    return res.status(201).json({
      status: true,
      message: "Connection request created successfully",
      data: result,
      responseCode: "000",
    });
  } else {
    return res.status(400).json({
      status: false,
      message: "Failed to create request",
      data: {},
      responseCode: "001",
    });
  }
});

// Chat attachments are stored publicly readable, so only document/image types the chat UI offers are accepted,
// and the bytes must actually be that type (an .html or script renamed to .pdf is refused).
const CHAT_UPLOAD_MAX_BYTES = 10 * 1024 * 1024;
const ZIP_SIGNATURE = ["504b0304"];
const OLE_SIGNATURE = ["d0cf11e0"];
const CHAT_UPLOAD_SIGNATURES = {
  png: ["89504e47"],
  jpg: ["ffd8ff"],
  jpeg: ["ffd8ff"],
  gif: ["47494638"],
  webp: ["52494646"],
  pdf: ["25504446"],
  docx: ZIP_SIGNATURE,
  xlsx: ZIP_SIGNATURE,
  pptx: ZIP_SIGNATURE,
  doc: OLE_SIGNATURE,
  xls: OLE_SIGNATURE,
  ppt: OLE_SIGNATURE,
};

const chatUploadError = (file, fileFormat) => {
  const format = String(fileFormat || "").toLowerCase().trim();
  const signatures = CHAT_UPLOAD_SIGNATURES[format];
  if (!signatures) return "This file type is not supported";
  if (typeof file !== "string" || !file) return "File is required";
  const bytes = Buffer.from(file, "base64");
  if (!bytes.length) return "File is required";
  if (bytes.length > CHAT_UPLOAD_MAX_BYTES) return "File size exceeds, maximum size is 10MB";
  const header = bytes.subarray(0, 8).toString("hex");
  if (!signatures.some((signature) => header.startsWith(signature))) return "File content does not match its type";
  return null;
};

exports.uploadFileChat = asyncHandler(async (req, res) => {
  try {
    const data = req.body;
    const user = req.user;
    let publicUrl;
    if (Object.prototype.hasOwnProperty.call(data, "file") && data.fileFormat) {
      const validationError = chatUploadError(data.file, data.fileFormat);
      if (validationError) {
        return res.status(400).json({
          status: false,
          message: validationError,
          data: {},
          responseCode: "001",
        });
      }
      const filePath = `corporate/${user?.username ? user?.username : "unknown-user"}/peko-connect`;
      publicUrl = await uploadFile(data.file, filePath, String(data.fileFormat).toLowerCase().trim());
    }
    return res.status(200).json({
      status: true,
      message: "File uploaded successfully",
      data: { publicUrl },
      responseCode: "000",
    });
  } catch (error) {
    // customLog(req?.LogTraceId, "error", { message: error?.message, data: error?.response?.data })
    return res.status(500).json({
      status: false,
      message: "Failed to upload: " + error.message,
      data: {},
      responseCode: "001",
    });
  }
});



exports.updateConnectionRequestStatus = asyncHandler(async (req, res, next) => {
  const { requestId, status } = req.body;
  if (!["ACCEPTED", "REJECTED"].includes(status)) {
    return next(new ErrorResponse("Invalid status", 400));
  }
  const userId = req.user.corporateId;

  const existingRequest = await findOne({ id: requestId, receiverId: userId });
  if (!existingRequest) {
    return next(new ErrorResponse("Connection requests not found", 404));
  }

  const result = await udpateStatus(requestId, userId, status);

  if (!result) {
    return next(new ErrorResponse("Failed to update status", 400));
  }
  const userDetails = await findOneCorporate({ id: existingRequest.senderId }, ["name"]);
  userDetails.pendingRequests = await countPendingRequests({ receiverId:userId });
  
  return res.status(201).json({
    status: true,
    message: "Connection request updated successfully",
    data: userDetails,
    responseCode: "000",
  });
});

exports.findAllRequests = asyncHandler(async (req, res, next) => {
  const userId = req.user.corporateId;
  const result = await findAllRequests(userId);
  if (result) {
    return res.status(201).json({
      status: true,
      message: "Connection fetched successfully",
      data: result,
      responseCode: "000",
    });
  } else {
    return next(new ErrorResponse("Error finding requests", 400));
  }
});

exports.fetchAllCorporateUsers = asyncHandler(async (req, res, next) => {
  let searchText = req.query.searchText;
  const corporateId = req.user.corporateId;
  let result = await fetchAllCorporate(searchText,corporateId, ['id', 'name'], ['username']);
  if (!result) {
    return next(new ErrorResponse(`Something went wrong while fetching all corporate user`, 500));
  } 
    return res.status(200).json({
      status: true,
      data: { result },
      message: 'Fetched all corporate users successfully',
      responseCode: '000'
    });
  
});