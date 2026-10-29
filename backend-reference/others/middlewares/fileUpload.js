const { uploadFile } = require("../utils/commonUploadFile");

const { NODE_ENV } = process.env;

/**
 * Manage file uploads
 * @param {{key:{base64,format}}} data receive an obj key is the file name and value is the docs
 * it assign the uploaded url to key
 */
const uploadAndSetDocument = async (data, user) => {
    if (typeof data === 'object' && data !== null) {
        for (const key in data) {
            if (Object.prototype.hasOwnProperty.call(data, key)) {
                const value = data[key];
                if (typeof value === 'object' && value !== null && 'base64' in value && 'format' in value) {
                    let { base64, format } = data[key]
                    const filePath = `${NODE_ENV ? NODE_ENV : "staging"}/${
                    user?.role ? user?.role.toLowerCase() : "unknown-role"
                    }/${user?.username ? user?.username : "unknown-user"}/${key}Docs`
                    let uploadedUrl = await uploadFile(base64, filePath, format);
                    data[key] = uploadedUrl
                }
            }
        }
    }
};




exports.companyDocumentsFilesUpload = async (req, res, next) => {
    try {
        let data = req.body;
        await uploadAndSetDocument(data, req.user)
        req.body = data;
        next();
    } catch (error) {
        next(error);
    }
};
