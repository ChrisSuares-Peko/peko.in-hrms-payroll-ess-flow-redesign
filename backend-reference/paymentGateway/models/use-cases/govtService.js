'use strict'

const govtService = require('../entities/govtService')
const asyncHandler = require('../../middlewares/async')

exports.findOne = asyncHandler(async (where) => {
  return await govtService.findOne({ where })
})
