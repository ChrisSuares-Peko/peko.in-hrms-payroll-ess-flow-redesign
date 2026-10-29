const { uploadFileToS3 } = require("../utils/commonUploadFile");
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
                    let uploadedUrl = await uploadFileToS3(base64, filePath, format);
                    data[key] = uploadedUrl
                }
            }
        }
    }
};

async function handleFileUpload(data, user) {
 
    if (typeof data === 'object' && data !== null) {
        for (const key in data) {
            if (Object.prototype.hasOwnProperty.call(data, key)) {
                const value = data[key];
                if (
                    typeof value === 'object' &&
                    value !== null &&
                    'base64' in value &&
                    'format' in value
                ) {
                    // Handle the file upload here for value.base64 and value.format
                    const { name, url, offerLetterDoc, profileImage } = data
                    let uploadedUrl = ''
                    if (offerLetterDoc) {
                        let { base64, format } = offerLetterDoc
                        const filePath = `${NODE_ENV ? NODE_ENV : "staging"}/${
                        user?.role ? user?.role.toLowerCase() : "unknown-role"
                        }/${user?.username ? user?.username : "unknown-user"}/offerLetterDocs`
                        uploadedUrl = await uploadFileToS3(base64, filePath, format);
                    } else if (profileImage) {

                        let { base64, format } = profileImage
                        const filePath = `${NODE_ENV ? NODE_ENV : "staging"}/${
                        user?.role ? user?.role.toLowerCase() : "unknown-role"
                        }/${user?.username ? user?.username : "unknown-user"}/profileImageDocs`
                      
                        uploadedUrl = await uploadFileToS3(base64, filePath, format);
                    } else if (url && name) {
                        let { base64, format } = url
                        const filePath = `${NODE_ENV ? NODE_ENV : "staging"}/${
                        user?.role ? user?.role.toLowerCase() : "unknown-role"
                        }/${user?.username ? user?.username : "unknown-user"}/${name}Docs`
                        uploadedUrl = await uploadFileToS3(base64, filePath, format);
                    }
                    data[key] = uploadedUrl
                }
            }
        }
    }
}


async function handleFileUploadProfileImage(data, user) {
    if (typeof data === 'object' && data !== null && data.profileImage) {
        const { profileImage } = data;

        // Check if profileImage has base64 and format
        if (profileImage.base64 && profileImage.format) {
            const { base64, format } = profileImage;
            const filePath = `${process.env.NODE_ENV || "staging"}/${
                user?.role ? user.role.toLowerCase() : "unknown-role"
            }/${user?.username || "unknown-user"}/profileImageDocs`;

            // Upload file to S3
            const uploadedUrl = await uploadFileToS3(base64, filePath, format);

            // Update the data object
            if (uploadedUrl) {
                data.profileImage = uploadedUrl;
            }
        } else {
            // Remove invalid profileImage
            delete data.profileImage;
        }
    }

    return data; // Optional: return updated object
}

/**
 * Responsible for all kind of files upload associated with profile routes
 * @param {*} req receives the files in {base64,fileFormat} obj from body
 * @param {*} next pass req.body to controller after uploading the file to firebase and attach the url to same field in req.body 
 */
exports.employeeDocumentsFilesUpload= async (req, res, next) => {
    try {
        let data = req.body;
        if(typeof data.url === 'string'){
            next()
            return
        }
        if (typeof data.url === 'object' && data.url !== null) {
           const response= await handleFileUploadProfileImage({profileImage:data.url}, req.user);
          data.new_url=response.profileImage;
        }
        

        req.body = data;
        next();
    } catch (error) {
        next(error);
    }
};

exports.employeesFilesUpload = async (req, res, next) => {
    try {
        let data = req.body;
        
        
        //all bellow if else conditions are for targeting the different {base64,fileFormat} obj from body
        if (Array.isArray(data)) {
            // Process uploads concurrently for each object in the array
            await Promise.all(data.map(async (obj) => await handleFileUploadProfileImage(obj, req.user)));
        } else if (typeof data === 'object' && data !== null) {
           await handleFileUploadProfileImage(data, req.user);

        }
        if (Array.isArray(data.employeeDocuments)) {
            // Process uploads concurrently for each document object in the array
            await Promise.all(data.employeeDocuments.map(async (doc) => await handleFileUpload(doc, req.user)));
        }

        req.body = data;
        next();
    } catch (error) {
        next(error);
    }
};




/**
 * Responsible for all kind of files upload associated with hr-settings route
 * @param {*} req receives the files in {base64,fileFormat} obj from body
 * @param {*} next pass req.body to controller after uploading the file to firebase and attach the url to same field in req.body 
 */
exports.hrSettingsFilesUpload = async (req, res, next) => {
    try {
        let data = req.body;
        await uploadAndSetDocument(data.officialDocuments, req.user)
        req.body = data;
        next();
    } catch (error) {
        next(error);
    }
};
exports.reimbursementFilesUpload = async (req, res, next) => {
    try {
        let data = req.body;
        await uploadAndSetDocument(data, req.user)
        req.body = data;
        next();
    } catch (error) {
        next(error);
    }
};

exports.incrementFilesUpload = async (req, res, next) => {
    try {
        let data = req.body;
        await uploadAndSetDocument(data, req.user)
        req.body = data;
        next();
    } catch (error) {
        next(error);
    }
};

exports.documentRequestFilesUpload = async (req, res, next) => {
    try {
        let data = req.body;
        await uploadAndSetDocument(data, req.user)
        req.body = data;
        next();
    } catch (error) {
        next(error);
    }
};

exports.essDocumentFilesUpload = async (req, res, next) => {
    try {
        let data = req.body;
        await uploadAndSetDocument(data, req.user)
        req.body = data;
        next();
    } catch (error) {
        next(error);
    }
};


exports.leaveApplicationFilesUpload = async (req, res, next) => {
    try {
        let data = req.body;
        await uploadAndSetDocument(data, req.user)
        req.body = data;
        next();
    } catch (error) {
        next(error);
    }
};

exports.offBoardingFilesUpload = async (req, res, next) => {
    try {
        let data = req.body;
        await uploadAndSetDocument(data, req.user)
        req.body = data;
        next();
    } catch (error) {
        next(error);
    }
};




exports.wpsDocumentsUpload = async (req, res, next) => {
    async function handleWpsFileUpload(data, user) {
        if (typeof data === 'object' && data !== null) {
            for (const key in data) {
                if (Object.prototype.hasOwnProperty.call(data, key)) {
                    const value = data[key];
                    if (
                        typeof value === 'object' &&
                        value !== null &&
                        'base64' in value &&
                        'format' in value
                    ) {
                        // Handle the file upload here for value.base64 and value.format
                        const { name, url } = data
                        let uploadedUrl = ''
                        if (url && name) {
                            let { base64, format } = url
                            const filePath = `${NODE_ENV ? NODE_ENV : "staging"}/${
                            user?.role ? user?.role.toLowerCase() : "unknown-role"
                            }/${user?.username ? user?.username : "unknown-user"}/WpsDocs`
                            uploadedUrl = await uploadFileToS3(base64, filePath, format);
                        }
                        data[key] = uploadedUrl
                    }
                }
            }
        }
    }
    try {
        let data = req.body;

        if (data.wpsDocuments && Array.isArray(data.wpsDocuments)) {
            // Process uploads concurrently for each document object in the array
            await Promise.all(data.wpsDocuments.map(async (doc) => await handleWpsFileUpload(doc, req.user)));
        }
        req.body = data;
        next();
    } catch (error) {
        next(error);
    }
};

// for new payroll
exports.companyProfileFilesUpload = async (req, res, next) => {
    try {
        let data = req.body;
        await uploadAndSetDocument(data.companyProfile, req.user)
        req.body = data;
        next();
    } catch (error) {
        next(error);
    }
};