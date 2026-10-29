const Form16A = require("../entities/form16A");
const Form16B = require("../entities/form16B");
const Salary = require("../entities/salary");
const ComplianceSettings = require("../entities/complianceSettings");
const { form16AHtml, form16BHtml } = require("../../utils/email/emailTemplates/form16");
const wkhtmltopdf = require('wkhtmltopdf');
const fs = require("fs");
const os = require("os");
const path = require('path');

// Form16 watermark, inlined as a data URI (wkhtmltopdf runs without local file access).
let tdsWatermarkDataUri = null;
function getTdsWatermarkDataUri() {
  if (tdsWatermarkDataUri === null) {
    try {
      const img = fs.readFileSync(path.join(__dirname, "../../../public/docs", "tds.png"));
      tdsWatermarkDataUri = `data:image/png;base64,${img.toString("base64")}`;
    } catch (e) {
      console.error(`Form16 watermark not found: ${e?.message}`);
      tdsWatermarkDataUri = "";
    }
  }
  return tdsWatermarkDataUri;
}


exports.createForm16A = async (formData) => {
  try {
    // Basic validation
    if (!formData.employeeDetails || !formData.employeeDetails.pan) {
      throw new Error("Employee PAN is required");
    }

    if (!formData.employerDetails || !formData.employerDetails.pan) {
      throw new Error("Employer PAN is required");
    }

    // Save into DB
    const form = new Form16A(formData);
    const savedForm = await form.save();

    return savedForm; // <-- RETURN VALUE (controller handles response)

  } catch (error) {
    console.error("Create Form16A error:", error);
    throw error; // <-- throw error back to controller
  }
};

exports.getForm16A = async (employee, assessmentYear) => {
    try {
        const existingForm16 = await Form16A.findOne({
            employee,
            assessmentYear
        });
        return existingForm16;
    } catch (error) {
        return error;
    }
}
    
exports.checkExistingForm16A = async (employeeId, assessmentYear) => {
    return await Form16A.findOne({
      employee: employeeId,
      assessmentYear,
    });
};

exports.createForm16B = async (formData) => {
  try {
    /* ---------------- BASIC VALIDATION ---------------- */
    if (!formData.employee) {
      throw new Error("Employee ID is required");
    }

    if (!formData.employeeDetails || !formData.employeeDetails.pan) {
      throw new Error("Employee PAN is required");
    }

    if (!formData.employerDetails || !formData.employerDetails.pan) {
      throw new Error("Employer PAN is required");
    }

    /* ---------------- INSERT INTO DATABASE ---------------- */
    const form = new Form16B(formData);
    const savedForm = await form.save();

    return savedForm;  // controller will handle response

  } catch (error) {
    console.error("Create Form16B error:", error);
    throw error; // pass error back to controller
  }
};

exports.checkExistingForm16B = async (employeeId, assessmentYear) => {
    return await Form16B.findOne({
      employee: employeeId,
      assessmentYear,
    });
};

exports.getForm16B = async (employee, assessmentYear) => {
    try {
        const existingForm16 = await Form16B.findOne({
            employee,
            assessmentYear
        });
        return existingForm16;
    } catch (error) {
        return error;
    }
}

exports.updateForm16B = async (formId, updateData) => {
  try {
    const updated = await Form16B.findByIdAndUpdate(
      formId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updated) {
      throw new Error("Form 16B not found for update");
    }

    return updated;

  } catch (error) {
    console.error("Update Form16B error:", error);
    throw error;
  }
};


exports.downloadForm16 = async (params) => {
    try {
        const { existingForm16A,existingForm16B, formType } = params
        const data = await generatePdfFile(existingForm16A,existingForm16B,formType)
        return {
            status: true,
            message: `Form 16 send successfully`,
            data: data
        }
    } catch (error) {
        console.log(error)
        return {
            status: false,
            message: `${error?.message}`,
            data: {}
        }
    }
}



async function generatePdfFile(existingForm16A,existingForm16B,formType) {
  return new Promise((resolve, reject) => {
    (async () => {
    let tmpDir;
    try {
      const watermarkImg = getTdsWatermarkDataUri();
      let id = existingForm16A?.employee?.employeeInformation?.employeeId || 123;
      let html ;
      if ((formType).toUpperCase()==='FORM16B'){
       html = form16BHtml(existingForm16B,watermarkImg);
      }
      else{
        html = form16AHtml(existingForm16A,watermarkImg);
      }
      // const html = form16Html(existingForm16B);
      let fileName = `${id}-${formType}-${id}`;
      let ranDomNumber = Math.floor(Math.random() * 1000) + 1;

      // Private temp dir; file names built from data are sanitized.
      tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'payroll-pdf-'));
      const safeName = String(`${fileName}-${ranDomNumber}`).replace(/[^a-zA-Z0-9_-]/g, '_');
      const inputFile = path.join(tmpDir, `${safeName}.html`);
      const outputFile = path.join(tmpDir, `${safeName}.pdf`);
      const cleanupTmp = () => removeTmpDir(tmpDir);

      /* -------------------------
         1. Save HTML
      -------------------------- */
      fs.writeFile(inputFile, html, { encoding: "utf8" }, async (err) => {
        if (err) {
          cleanupTmp();
          return reject(err);
        }

        /* -------------------------
           2. FIXED wkhtmltopdf OPTIONS
        -------------------------- */
        const pdfOptions = {
          pageSize: "A4",
          orientation: "Portrait",
          printMediaType: true,
          disableJavascript: true,
          marginTop: "15mm",
          marginBottom: "15mm",
          marginLeft: "10mm",
          marginRight: "10mm"
        };
        wkhtmltopdf(html, pdfOptions, async (pdfErr, stream) => {
          if (pdfErr) {
            cleanupTmp();
            return reject(pdfErr);
          }

          const writeStream = fs.createWriteStream(outputFile);
          stream.pipe(writeStream);

          writeStream.on("finish", async () => {
            try {
              const pdfData = fs.readFileSync(outputFile);
              cleanupTmp();
              resolve({ pdfData, filename: fileName });
            } catch (readErr) {
              cleanupTmp();
              reject(readErr);
            }
          });

          writeStream.on("error", (err) => {
            cleanupTmp();
            reject(err);
          });
        });
      });
    } catch (error) {
      console.log("error",error)
      removeTmpDir(tmpDir);
      reject(error);
    }
    })();
  });
}

/* -------------------------
   Cleanup helper
-------------------------- */
function removeTmpDir(dir) {
  if (!dir) return;
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch (e) {
    console.error(`Error removing temp dir ${dir}: ${e?.message}`);
  }
}

exports.getTdsList = async ({ corporateUserID, month, year, regimeType }) => {
  try {
    const compliance = await ComplianceSettings.findOne({ corporateUser: corporateUserID }).lean();

    const query = { corporateUser: corporateUserID, year, paymentStatus: 'APPROVED' };
    if (month) query.month = Number(month);

    const salaries = await Salary.find(query)
      .populate({
        path: "employee",
        select: "personalInformation.fullName personalInformation.email"
      })
      .lean();

    // Map regime display label → stored value for filtering
    // "Old Tax Regime" → "old", "New Tax Regime" → "new"
    const regimeFilter = regimeType === "Old Tax Regime" ? "old"
                       : regimeType === "New Tax Regime" ? "new"
                       : null; // null = no filter, return all

    return salaries
      .filter((salary) => {
        if (!regimeFilter) return true;
        const regime = salary.salaryInformation?.taxInformation?.regime;
        return regime === regimeFilter;
      })
      .map((salary) => {
        const emp     = salary.employee || {};
        const taxInfo = salary.salaryInformation?.taxInformation || {};

        return {
          employeeId:    emp._id,
          name:          emp?.personalInformation?.fullName,
          email:         emp?.personalInformation?.email,
          taxRegime:     taxInfo?.regime === "old" ? "Old Tax Regime" : "New Tax Regime",
          tdsFrequency:  compliance?.tds?.deductionCycle || "Monthly",
          taxableIncome: taxInfo?.taxableIncome || 0,
          exemptions:    taxInfo?.exemptions    || 0,
          tdsDeduction:  taxInfo?.tdsMonthly    || 0
        };
      });
    // const salaries = await Salary.find({
    //   corporateUser: corporateUserID,
    //   month: month,
    //   year: year
    // })
    //   .populate({
    //     path: "employee",
    //     select: "personalInformation.fullName personalInformation.email"
    //   })
    //   .lean();

    // return salaries.map((salary) => {

    //   const taxInfo = salary?.salaryInformation?.taxInformation || {};
    //   const employee = salary?.employee || {};
    //   const personalInfo = employee?.personalInformation || {};
    //   return {
    //     employeeId: employee?._id || null,

    //     name: personalInfo?.fullName || "",

    //     email: personalInfo?.email || "",

    //     taxableIncome: taxInfo.taxableIncome || 0,

    //     exemptions: taxInfo.exemptions || 0,

    //     tdsDeduction:
    //       taxInfo.tdsMonthly ||
    //       salary.salaryInformation?.tdsAmount ||
    //       0
    //   };

    // });

  } catch (err) {
    console.log("Error", err)
  }


};

exports.getTdsDetails = async ({
  corporateUserID,
  employee,
  month,
  year
}) => {
  try {
 
    const salary = await Salary.findOne({
      corporateUser: corporateUserID,
      employee: employee,
      month,
      year
    })
      .populate({
        path: "employee",
        select: "personalInformation.fullName personalInformation.email employeeInformation.taxRegime"
      })
      .lean();

    if (!salary) return {};
    const name  = salary?.employee?.personalInformation?.fullName || "";
    const email = salary?.employee?.personalInformation?.email   || "";
    const taxInfo = salary?.salaryInformation?.taxInformation || {};

    const employeeTaxRegime = salary?.employee?.employeeInformation?.taxRegime || "";

    return {
      employeeDetails: {
        name,
        email
      },

      taxRegime: employeeTaxRegime,
      fy:               taxInfo.fy               || "",

      grossAnnual:      taxInfo.grossAnnual      || 0,
      exemptions:       taxInfo.exemptions       || 0,
      taxableIncome:    taxInfo.taxableIncome    || 0,   // net taxable income (after all deductions)

      slabBreakdown:    taxInfo.slabBreakdown    || [],
      taxBeforeRebate:  taxInfo.taxBeforeRebate  || 0,
      rebate:           taxInfo.rebate           || 0,
      surcharge:        taxInfo.surcharge        || 0,
      cess:             taxInfo.cess             || 0,
      totalTax:         taxInfo.totalTax         || 0,

      monthlyTds:       taxInfo.tdsMonthly       || 0,
      tdsFrequency:     "Monthly",
    }

  } catch (err) {
    console.log("Error", err)
  }


}