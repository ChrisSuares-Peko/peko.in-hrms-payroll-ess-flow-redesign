const multer = require('multer')

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1,
    fields: 50,
    fieldNameSize: 100,
    fieldSize: 1024 * 1024 // 1MB
  }
})

module.exports = upload;
