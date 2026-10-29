const schedule = require("node-schedule");
const { emailWithAttachment } = require("../utils/emailer");
const { promises: fsPromises } = require("fs");
const paytmBpos = require("../models/entities/paytmBpos");
const fs = require("fs");
const path = require("path");
const ExcelJS = require("exceljs");
const { Op } = require("sequelize");
const moment = require("moment");

exports.BPOSReportScheduler = async () => {
  if (!fs.existsSync(path.join(__dirname, "../public/excelReports"))) {
    fs.mkdirSync(path.join(__dirname, "../public/excelReports"));
  }

  const scheduleTime = process.env.BPOS_REPORT_TIME;
  const [hour, minute] = scheduleTime.split(":");

  schedule.scheduleJob(`${minute} ${hour} * * *`, async () => {
    console.log("Generating BPOS Report...");

    const todayDate = moment().startOf("day");
    const bposData = await paytmBpos.findAll({
      where: {
        status: "Customer Contacted",
        createdAt: {
          [Op.between]: [todayDate.toDate(), moment().toDate()], // Filter createdAt to today's date
        },
      },
      attributes: {
        exclude: ["id", "createdAt", "updatedAt", "credentialId", "status"],
      },
      raw: true,
      nest: true,
    });

    const excelData = await generateExcel(bposData);

    const currentDate = moment().format("DD-MM-YYYY");

    const to = process.env.BPOS_REPORT_EMAIL;
    const subject = `Peko - Paytm BPOS Daily Leads Report ${currentDate}`;
    const body = `<p>Hello Partner,</p>
            <p>Attached is the report for leads generated for ${currentDate}.
            You are requested to connect with the leads and update us with the status.</p>
            <p>Regards,</p>
            <p>Peko</p>`;

    if (excelData) {
      emailWithAttachment(
        to,
        subject,
        body,
        excelData.fileName,
        excelData.filePath,
        async () => {
          try {
            console.log("successfully send Bpos excel report to vendor");
            await fsPromises.unlink(excelData.filePath);
          } catch (err) {
            console.error("Error removing file:", err);
          }
        }
      );
    }
  });
};

async function generateExcel(data) {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("BPOS Report");

    if (data.length > 0) {
      const headers = [
        "Store Name",
        "Business Category",
        "Contact Person",
        "Mobile Number",
        "Email",
        "City",
        "Preferred Language",
      ];
      worksheet.addRow(headers);
      // Add data to the worksheet
      data.forEach((item) => {
        const rowValues = [
          item.storeName,
          item.businessCategory || "N/A",
          item.contactPerson,
          item.mobileNumber,
          item.email,
          item.city || "N/A",
          item.preferredLanguage || "N/A",
        ];
        worksheet.addRow(rowValues);
      });
      // Automatically adjust column widths based on content
      worksheet.columns.forEach((column) => {
        let maxLength = 0;
        column.eachCell({ includeEmpty: true }, (cell) => {
          const columnLength = cell.value ? cell.value.toString().length : 10; // Minimum width of 10 characters
          if (columnLength > maxLength) {
            maxLength = columnLength;
          }
        });
        column.width = maxLength < 20 ? 20 : maxLength + 2;
      });

      const fileName = "BPOS-Daily-Report.xlsx";
      const filePath = `./public/excelReports/${fileName}`;
      // Save the workbook
      const excelFile = workbook.xlsx
        .writeFile(filePath)
        .then(async () => {
          console.log(
            "\x1b[32m \u2713 Excel file created successfully!\x1b[0m"
          );
          return { fileName, filePath };
        })
        .catch((err) => {
          console.error(
            "\x1b[31m \u26D4 Error creating Excel file: \x1b[0m",
            err
          );
          return false;
        });
      return excelFile;
    } else {
      console.log(
        "\x1b[33m \u26a0 No data found for sending BPOS report \x1b[0m"
      );
      return false;
    }
  } catch (error) {
    console.error(error);
    console.error("\x1b[31m \u26D4 Error creating Excel file \x1b[0m");
  }
}
