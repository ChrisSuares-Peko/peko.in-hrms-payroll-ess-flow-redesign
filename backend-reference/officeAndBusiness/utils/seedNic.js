const ExcelJS = require("exceljs");
const path = require("path");
const nicCode = require("../models/entities/nicCodes");

function getLevel(code) {
  if (code.length === 2) return "division";
  if (code.length === 3) return "group";
  if (code.length === 4) return "class";
  if (code.length === 5) return "subclass";
}

function getParent(code) {
  if (code.length <= 2) return null;
  return code.slice(0, -1);
}

async function seedNIC() {
  const workbook = new ExcelJS.Workbook();
  console.log(__dirname)
  await workbook.xlsx.readFile(
    path.join(__dirname, "../public/excelReports/NIC_2008.xlsx")
  );

  const sheet = workbook.worksheets[0];
  const nicData = [];

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;

    const code = String(row.getCell(1).value || "").trim();
    const description = String(row.getCell(2).value || "").trim();

    if (!code) return;

    nicData.push({
      code,
      description,
      level: getLevel(code),
      parent_code: getParent(code),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  console.log("Preparing NIC rows:", nicData.length);

  await nicCode.bulkCreate(nicData, {
    ignoreDuplicates: true, // 🔥 critical
  });

  console.log("✅ NIC data inserted");
}

async function initNIC() {
  const count = await nicCode.count();

  if (count === 0) {
    console.log("NIC table empty → seeding...");
    await seedNIC();
  } else {
    console.log("NIC already exists → skipping");
  }
}

module.exports = initNIC;