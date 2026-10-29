const { uploadFile } = require("../utils/commonUploadFile");

const { NODE_ENV } = process.env;

const detectFormat = (base64) => {
  if (base64.startsWith("JVBERi0")) return "pdf";
  if (base64.startsWith("/9j/")) return "jpg";
  if (base64.startsWith("iVBORw0KGgo")) return "png";
  return "png";
};

const uploadAndSetDocument = async (data, user) => {
  if (typeof data === "object" && data !== null) {
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        const value = data[key];
        let base64, format;

        if (typeof value === "object" && value !== null && "base64" in value && "format" in value) {
          // { base64: "...", format: "png" }
          base64 = value.base64;
          format = value.format;
        } else if (typeof value === "string" && value.length > 100) {
          // plain base64 string — auto-detect format
          base64 = value;
          format = detectFormat(value);
        }

        if (base64 && format) {
          const filePath = `${NODE_ENV || "staging"}/${
            user?.role ? user.role.toLowerCase() : "unknown-role"
          }/${user?.username || "unknown-user"}/${key}Docs`;
          data[key] = await uploadFile(base64, filePath, format, 10);
        }
      }
    }
  }
};

exports.companyDocumentsFilesUpload = async (req, res, next) => {
  try {
    await uploadAndSetDocument(req.body, req.user);
    next();
  } catch (error) {
    next(error);
  }
};
