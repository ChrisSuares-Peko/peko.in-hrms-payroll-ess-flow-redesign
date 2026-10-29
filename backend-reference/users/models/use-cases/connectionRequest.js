const ConnectionRequest = require("./../entities/connectionRequest.js");
const { Op } = require('sequelize');

const asyncHandler = require("../../middlewares/async");
const connectionRequest = require("./../entities/connectionRequest");
const sequelize = require("../../configs/database/index");

exports.findOne = asyncHandler(async (params) => {
  try {
    return await ConnectionRequest.findOne({
      where: params,
    });
  } catch (error) {
    console.error("Error finding connection request row:", error);
    return false;
  }
});

exports.create = asyncHandler(async (senderId, receiverId, message) => {
  try {
    return await ConnectionRequest.create({
      senderId,
      receiverId,
      message,
    });
  } catch (error) {
    console.error("Error creating new connection request:", error);
    return false;
  }
});

exports.udpateStatus = asyncHandler(async (requestId, receiverId, status) => {
  try {
    return await connectionRequest.update(
      { status },
      {
        where: {
          id: requestId,
          receiverId,
        },
      }
    );
  } catch (error) {
    console.error("Error creating new connection request:", error);
    return false;
  }
});

exports.findAllRequests = async (corporateId) => {
  try {
    
    const incomingRequests = await sequelize.query(`
      SELECT 
          cr.*,
          sender.id AS senderId,
          sender.name AS senderName,
          sender.acs_user_id AS senderAcsUserId,
          sender.logo AS senderLogo,
          receiver.id AS receiverId,
          receiver.name AS receiverName,
          receiver.acs_user_id AS receiverAcsUserId,
          receiver.logo AS receiverLogo,
          senderCredential.username AS senderUsername,
          receiverCredential.username AS receiverUsername
      FROM connection_requests cr
      LEFT JOIN corporateUsers sender ON cr.senderId = sender.id
      LEFT JOIN corporateUsers receiver ON cr.receiverId = receiver.id
      LEFT JOIN credentials senderCredential ON sender.credentialId = senderCredential.id
      LEFT JOIN credentials receiverCredential ON receiver.credentialId = receiverCredential.id
      WHERE (cr.senderId = :corporateId OR cr.receiverId = :corporateId) 
        AND cr.status = 'PENDING'
    `, {
      replacements: { corporateId },
      type: sequelize.QueryTypes.SELECT
    });

    return incomingRequests;
  } catch (error) {
    console.error("Error fetching all connection requests:", error);
    return false;
  }
};

exports.findExisting = asyncHandler(async ({ senderId, receiverId }) => {
  try {
    return await ConnectionRequest.findOne({
      where: {
        [Op.and]: [
          {
            [Op.or]: [
              { senderId, receiverId },
              { senderId: receiverId, receiverId: senderId }
            ]
          },
          {
            status: { [Op.ne]: 'REJECTED' }
          }
        ]
      },
    });
  } catch (error) {
    console.error("Error finding connection request row:", error);
    return false;
  }
});

exports.countPendingRequests = asyncHandler(async ({ receiverId }) => {
  try {
    const count = await ConnectionRequest.count({
      where: {
        receiverId,
        status: 'PENDING',
      },
    });

    return count;
  } catch (error) {
    console.error("Error counting pending connection requests:", error);
    return 0; // Return 0 in case of an error
  }
});
