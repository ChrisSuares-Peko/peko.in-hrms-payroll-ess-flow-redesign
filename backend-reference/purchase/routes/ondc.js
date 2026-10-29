const express = require('express')
const router = express.Router()
const { search, onSearch } = require('../controllers/ondc')

router.post('/search', search)
router.post('/on_search', onSearch)

module.exports = router
