const { uploadFile } = require("../utils/commonUploadFile");
/**
 * Manage file uploads
 * @param {{key:{base64,format}}} data receive an obj key is the file name and value is the docs
 * it assign the uploaded url to key
 */
exports.uploadAndSetDocument = async (data, user) => {
    if (typeof data === 'object' && data !== null) {
        for (const key in data) {
            if (Object.prototype.hasOwnProperty.call(data, key)) {
                const value = data[key];
                if (typeof value === 'object' && value !== null && 'base64' in value && 'format' in value) {
                    let { base64, format } = data[key]
                    const filePath = `${user?.role ? user?.role.toLowerCase() : "unknown-role"
                        }/${user?.username ? user?.username : "unknown-user"}/passportDoc`
                    let uploadedUrl = await uploadFile(base64, filePath, format);
                    data[key] = uploadedUrl
                }
            }
        }
    }
};

exports.uploadAndSetDocumentForTradeLicenseDoc = async (data) => {
    if (typeof data === 'object' && data !== null) {
        for (const key in data) {
            if (Object.prototype.hasOwnProperty.call(data, key)) {
                const value = data[key];
                if (typeof value === 'object' && value !== null && 'base64' in value && 'format' in value) {
                    let { base64, format } = data[key]
                    const filePath = `${key}/tradeLicenseDocDocs`
                    let uploadedUrl = await uploadFile(base64, filePath, format);
                    data[key] = uploadedUrl
                }
            }
        }
    }
};




exports.taxDocFileUpload = async (req, res, next) => {
    try {
        let data = req.body;
        await this.uploadAndSetDocument(data)
        if (data.tradeLicenseDoc && Array.isArray(data.tradeLicenseDoc)) {
            let tradeLicenseDoc = data.tradeLicenseDoc
            for (let i = 0; i < tradeLicenseDoc.length; i++) {
                let doc = tradeLicenseDoc[i]
                await this.uploadAndSetDocumentForTradeLicenseDoc(doc)
            }
        }
        req.body = data;
        next();
    } catch (error) {
        next(error);
    }
};


