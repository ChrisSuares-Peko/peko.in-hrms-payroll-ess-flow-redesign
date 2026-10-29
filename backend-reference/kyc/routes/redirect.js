const router = module.exports = require('express')()

router.get('/', function (req, res) {
  res.redirect('/system/login')
})
router.get('/system/', function (req, res) {
  res.redirect('/system/login')
})