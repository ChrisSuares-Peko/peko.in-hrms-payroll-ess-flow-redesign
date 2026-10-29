const asyncHandler = require('../../middlewares/async');
const support = require('./../entities/support');

exports.findAllTickets = asyncHandler(async (where) => {

  const messages = await support.findAll({
    where
  });
  return messages;
})

exports.updateTicketStatus = asyncHandler(async (ticketId, status, isClosed) => {
  return await support.update(
    {
      status,
      isClosed,
    },
    {
      where: { id: ticketId },
    }
  );
})