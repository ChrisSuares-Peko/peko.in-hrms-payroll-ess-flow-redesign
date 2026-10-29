const express = require("express");
const router = express.Router({ mergeParams: true });
const {
  createMessage,
  // findAllTickets,
  updateMessage,
  deleteMessage,
  findAllMessageAndCount,
  createChatMessage,
  getAllChatMessage,
  fetchTicketDetails,
  deleteAttachment,
  updateChatId,
} = require("../../../../controllers/corporate/support");
const { validateSupportTicket, validateSupportMessage, validateUpdateChatId } = require("../../../../utils/apiValidation");
const { validateTicketIdParam, validateTicketsQuery } = require("../../../../utils/queryValidation");

router.post("/", validateSupportTicket, createMessage);
router.get("/ticketDetials/:id", validateTicketIdParam, fetchTicketDetails);
router.put("/:id", validateSupportTicket, updateMessage);
router.delete("/:id", deleteMessage);
router.delete("/attachment/:id", deleteAttachment);
router.get("/tickets", validateTicketsQuery, findAllMessageAndCount);
router.post("/create", validateSupportMessage, createChatMessage);
router.get("/chats/:id", validateTicketIdParam, getAllChatMessage);
router.patch("/chatId", validateUpdateChatId, updateChatId); //to update the freshdesk chat ID

module.exports = router;
