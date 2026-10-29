'use strict'

const express = require('express')
const router = express.Router({ mergeParams: true })
const { lookupObjectionApplicationV2 } = require('../../../../controllers/corporate/govtServicesObjectionV2')

router.get('/application-lookup', lookupObjectionApplicationV2)

module.exports = router
