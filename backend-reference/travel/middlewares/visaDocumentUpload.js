const multer = require('multer');
const ErrorResponse = require('../utils/error-response');

// Staged visa documents: same rule as the frontend (TravellerDetails) — one JPG/PNG/PDF file, max 5 MB.
const MAX_STAGED_DOCUMENT_BYTES = 5 * 1024 * 1024;
const ALLOWED_STAGED_DOCUMENT_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
const stagedDocumentUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_STAGED_DOCUMENT_BYTES, files: 1 },
    fileFilter: (req, file, cb) => {
        if (ALLOWED_STAGED_DOCUMENT_TYPES.includes(file.mimetype)) return cb(null, true);
        return cb(new ErrorResponse('Only JPG, PNG or PDF files are allowed.', 400));
    },
});

// Turns multer's size/type rejections into a 400 instead of a 500.
const uploadStagedDocument = (req, res, next) => stagedDocumentUpload.single('file')(req, res, (err) => {
    if (!err) return next();
    if (err.code === 'LIMIT_FILE_SIZE') return next(new ErrorResponse('File size must be smaller than 5 MB.', 400));
    if (err instanceof multer.MulterError) return next(new ErrorResponse('Invalid file upload.', 400));
    return next(err);
});

module.exports = { uploadStagedDocument };
