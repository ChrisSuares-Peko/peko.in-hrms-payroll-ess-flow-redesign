const ExcelJS = require("exceljs");




const form24QToJson = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: false,
        responseCode: "001",
        message: "No file provided",
        data: {},
      });
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);
    const worksheet = workbook.getWorksheet(1); // First sheet

    const jsonData = [];

    const skipValues = ["Field", "Input", "Sr. No.", ""]; // Values to skip

    worksheet.eachRow((row, rowNum) => {
      if (rowNum < 3) return; // Skip header/title rows

      const keyCell = row.getCell(1).value;
      const valCell = row.getCell(2).value;

      if (!keyCell || valCell === null || valCell === "") return;

      const key =
        typeof keyCell === "object" && keyCell.text
          ? keyCell.text.trim()
          : String(keyCell).trim();

      const value =
        typeof valCell === "object" && valCell.text
          ? valCell.text.trim()
          : String(valCell).trim();

      // Skip empty or placeholder rows
      if (!key || skipValues.includes(key)) return;

      jsonData.push({ field: key, value });
    });

    req.body.jsonData = jsonData;
    next();
  } catch (err) {
    console.error("Error parsing Excel:", err);
    return res.status(500).json({
      status: false,
      responseCode: "500",
      message: "Internal Server Error",
      error: err.message,
    });
  }
};


const mapExcelFieldsToSchema = (jsonData) => {
  const fieldMap = {
    "TAN (Tax Deduction Account Number)": "tan",
    "PAN of Deductor": "panOfDeductor",
    "Financial Year": "financialYear",
    "Assessment Year": "assessmentYear",
    "Statement filed earlier for this quarter (Y/N)": "statementFiledEarlier",
    "Name of Employer": "nameOfEmployer",
    "Type of Deductor (Govt/Others)": "typeOfDeductor",
    "Branch/Division (if any)": "branch",
    "Email": "email",
    "Name": "name",
    "Flat No.": "flatNo2",
    "Premises/Building Name": "buildingName2",
    "Road/Street/Lane": "street2",
    "Area/Location": "area2",
    "Town/City/District": "city2",
    "State": "state2",
    "Pin Code": "pin2",
    "Telephone No.": "phone2",
    "1": "tdsAmount",
  };

  const data = {};
  let addressCount = 0;

  for (const item of jsonData) {
    const originalKey = item.field;
    const value = item.value;

    // Handle address sets dynamically
    const addressFields = [
      "Flat No.",
      "Premises/Building Name",
      "Road/Street/Lane",
      "Area/Location",
      "Town/City/District",
      "State",
      "Pin Code",
      "Telephone No.",
    ];

    if (addressFields.includes(originalKey)) {
      addressCount++;
      const suffix = addressCount > addressFields.length ? "2" : "1";
      const keyBase = fieldMap[originalKey];
      data[keyBase.replace(/1|2/, "") + suffix] = value;
    } else if (fieldMap[originalKey]) {
      data[fieldMap[originalKey]] = value;
    }
  }

  return data;
};

module.exports = {
  form24QToJson,
  mapExcelFieldsToSchema
};
