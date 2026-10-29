const multer = require('multer')


// const multerFilter = (req, file, cb) => {
//     if (file.mimetype.startsWith("image")) {
//       cb(null, true);
//     } else {
//       cb(console.log("Multer Filter: Must upload an Image"), false);
//     }
//   };
//   const upload = multer({ storage:multer.memoryStorage(), fileFilter: multerFilter });

const path = require('path')
const ErrorResponse = require('../utils/error-response')

// Callers (employee bulk excel upload, form 24Q upload) only accept spreadsheet files
const ALLOWED_MIME_TYPES = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls (also sent for .csv by some browsers)
    'text/csv',
    'application/csv',
    'application/octet-stream',
]
const ALLOWED_EXTENSIONS = ['.xlsx', '.xls', '.csv']

const spreadsheetFilter = (req, file, cb) => {
    const extension = path.extname(file.originalname || '').toLowerCase()
    if (ALLOWED_MIME_TYPES.includes(file.mimetype) || ALLOWED_EXTENSIONS.includes(extension)) {
        return cb(null, true)
    }
    return cb(new ErrorResponse('Invalid file type. Please upload an Excel (.xlsx, .xls) or CSV file.', 400), false)
}

const upload=multer({
    storage:multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
    fileFilter: spreadsheetFilter,
})

module.exports=upload;