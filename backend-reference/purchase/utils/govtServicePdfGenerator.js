'use strict'

const puppeteer = require('puppeteer')
const { uploadFile } = require('./commonUploadFile')

const TEMPLATES = {
  'govt_fssai_basic':           require('./govtServiceTemplates/fssai-basic-registration'),
  'govt_drug_license':          require('./govtServiceTemplates/drug-license-retail'),
  'govt_drug_manufacturing':    require('./govtServiceTemplates/drug-manufacturing-license'),
  'govt_fcra_registration':     require('./govtServiceTemplates/fcra-registration'),
  'govt_factory_license':       require('./govtServiceTemplates/factory-license'),
  'govt_trademark_registration': require('./govtServiceTemplates/trademark-registration'),
  'govt_tan_registration':      require('./govtServiceTemplates/tan-registration'),
  'govt_drug_license_wholesale': require('./govtServiceTemplates/drug-license-wholesale'),
}

const PDF_SERVICES = new Set(Object.keys(TEMPLATES))

async function generateGovtServicePdf(service, formData, applicationId) {
  const templateFn = TEMPLATES[service]
  if (!templateFn) return null

  const html = templateFn(formData)

  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] })
  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true })
    const base64 = Buffer.from(pdfBuffer).toString('base64')
    return await uploadFile(base64, `govt-service-docs/${applicationId}/generated-form`, 'pdf', 10)
  } finally {
    await browser.close()
  }
}

module.exports = { generateGovtServicePdf, PDF_SERVICES }
