const PizZip = require('pizzip')
const { resolveBusinessType } = require('../constants/kybDocuments')

const DOCUMENT_PART = 'word/document.xml'

/**
 * The committed template is Pine Labs' printable application form: labels with blank cells, and no
 * docxtemplater tags anywhere. Filling it therefore means writing into the form's own cells.
 *
 * Every entry is addressed by position and carries the label it expects to find there, so a template
 * whose layout has changed makes this throw instead of writing a value into the wrong cell of a
 * contract. `cell` replaces an empty value cell; `append` writes after an inline "Label:"; `tick`
 * marks one of a set of ☐ options.
 */
const FIELD_MAP = [
    { row: 0, cell: 1, mode: 'cell', expect: '', label: 'Execution Date:', labelCell: 0, field: 'agreementDate' },
    { row: 0, cell: 2, mode: 'append', expect: 'Corporate Code:', field: 'kybReference' },
    { row: 1, cell: 1, mode: 'cell', expect: '', label: 'Name of the Entity', labelCell: 0, field: 'entityName' },
    { row: 3, cell: 0, mode: 'append', expect: 'Registered Address', field: 'regAddress' },
    { row: 4, cell: 1, mode: 'cell', expect: '', label: 'City', labelCell: 0, field: 'regCity' },
    { row: 4, cell: 3, mode: 'cell', expect: '', label: 'State', labelCell: 2, field: 'regState' },
    { row: 5, cell: 1, mode: 'cell', expect: '', label: 'Pin Code', labelCell: 0, field: 'regPinCode' },
    { row: 5, cell: 3, mode: 'cell', expect: '', label: 'Telephone', labelCell: 2, field: 'regTelephone' },
    { row: 6, cell: 1, mode: 'cell', expect: '', label: 'Email ID', labelCell: 0, field: 'regEmail' },
    { row: 7, cell: 0, mode: 'append', expect: 'Billing Address', field: 'billAddress' },
    { row: 8, cell: 1, mode: 'cell', expect: '', label: 'City', labelCell: 0, field: 'billCity' },
    { row: 8, cell: 3, mode: 'cell', expect: '', label: 'State', labelCell: 2, field: 'billState' },
    { row: 9, cell: 1, mode: 'cell', expect: '', label: 'Pin Code', labelCell: 0, field: 'billPinCode' },
    { row: 12, cell: 0, mode: 'append', expect: 'GST Registration No', field: 'gstNumber' },
    { row: 13, cell: 0, mode: 'append', expect: 'Permanent Account Number (PAN)', field: 'panNumber' },
    { row: 15, cell: 0, mode: 'append', expect: 'CIN/LLP Number', field: 'cinLlpNumber' },
    { row: 15, cell: 1, mode: 'append', expect: 'TAN Number', field: 'tanNumber' },
    { row: 16, cell: 1, mode: 'append', expect: 'Branch:', field: 'bankBranch' },
    { row: 17, cell: 0, mode: 'append', expect: 'Account Number:', field: 'bankAccountNumber' },
    { row: 17, cell: 1, mode: 'append', expect: 'Bank:', field: 'bankName' },
    { row: 18, cell: 0, mode: 'append', expect: 'IFSC Code:', field: 'bankIfsc' },
    { row: 18, cell: 1, mode: 'append', expect: 'City:', field: 'bankCity' },
    { row: 20, cell: 0, mode: 'append', expect: 'Name', field: 'officialContactName' },
    { row: 20, cell: 1, mode: 'append', expect: 'Name', field: 'salespersonName' },
    { row: 21, cell: 0, mode: 'append', expect: 'Mobile Number', field: 'officialContactMobile' },
    { row: 21, cell: 1, mode: 'append', expect: 'Mobile Number', field: 'salespersonMobile' },
    { row: 22, cell: 0, mode: 'append', expect: 'Email', field: 'officialContactEmail' },
    { row: 22, cell: 1, mode: 'append', expect: 'Email', field: 'salespersonEmail' },
    { row: 24, cell: 0, mode: 'append', expect: 'Name', field: 'signatoryName' },
    { row: 25, cell: 0, mode: 'append', expect: 'Contact Number', field: 'signatoryContact' },
    { row: 26, cell: 0, mode: 'append', expect: 'Email id', field: 'signatoryEmail' },
]

/** Every Peko business type against the option printed on the form, so each ticks exactly one box. */
const ORGANISATION_OPTIONS = {
    PROPRIETORSHIP: 'Sole Proprietorship',
    PARTNERSHIP: 'Partnership',
    SOCIETY_TRUST: 'Trust',
    PRIVATE_LIMITED: 'Pvt Ltd',
    PUBLIC_LIMITED: 'Public Ltd',
    LLP: 'LLP',
}

const EMPTY_BOX = '☐'
const TICKED_BOX = '☑'

/**
 * Each option's ☐ is its own run right after the option's label run, so the matching box is ticked in
 * place rather than a note being appended beside the row.
 */
const tickOption = (cellXml, option) => {
    const runs = [...cellXml.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)]
    const labelRun = runs.find((run) => run[1].trim().endsWith(option))
    if (!labelRun) return null

    const searchFrom = labelRun.index + labelRun[0].length
    const box = runs.find((run) => run.index >= searchFrom && run[1].trim() === EMPTY_BOX)
    if (!box) return null

    const ticked = box[0].replace(EMPTY_BOX, TICKED_BOX)
    return `${cellXml.slice(0, box.index)}${ticked}${cellXml.slice(box.index + box[0].length)}`
}

const PEP_ROWS = { yes: { row: 25, cell: 1, expect: 'Yes' }, no: { row: 26, cell: 1, expect: 'No' } }

// XML 1.0 permits only tab, newline and carriage return below 0x20, and nothing in 0x7F-0x9F. A stray
// control character would produce a .docx that Word refuses to open, reported to the corporate as ready.
// eslint-disable-next-line no-control-regex
const CONTROL_CHARACTERS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g

const escapeXml = (value) =>
    String(value)
        .replace(CONTROL_CHARACTERS, '')
        .replace(/[\t\r\n]+/g, ' ')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')

const visibleText = (fragment) =>
    (fragment.match(/<w:t[^>]*>[^<]*<\/w:t>/g) || [])
        .map((node) => node.replace(/<[^>]+>/g, ''))
        .join('')

const normalise = (value) => visibleText(value).replace(/\s+/g, ' ').trim()

const splitTables = (xml) => {
    const tables = []
    const re = /<w:tbl>[\s\S]*?<\/w:tbl>/g
    let match = re.exec(xml)
    while (match) {
        tables.push({ start: match.index, end: match.index + match[0].length, xml: match[0] })
        match = re.exec(xml)
    }
    return tables
}

const splitBy = (xml, openRe, closeTag) => {
    const parts = []
    const re = new RegExp(openRe, 'g')
    let match = re.exec(xml)
    while (match) {
        const end = xml.indexOf(closeTag, match.index)
        if (end === -1) break
        const stop = end + closeTag.length
        parts.push({ start: match.index, end: stop, xml: xml.slice(match.index, stop) })
        re.lastIndex = stop
        match = re.exec(xml)
    }
    return parts
}

const runProperties = (cellXml) => {
    const match = cellXml.match(/<w:rPr>[\s\S]*?<\/w:rPr>/)
    return match ? match[0] : ''
}

const valueRun = (rPr, text) => `<w:r>${rPr}<w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r>`

const fillCell = (cellXml, value) => {
    const rPr = runProperties(cellXml)
    const paragraph = `<w:p>${valueRun(rPr, value)}</w:p>`

    if (/<w:p\s*\/>/.test(cellXml)) return cellXml.replace(/<w:p\s*\/>/, paragraph)

    const lastClose = cellXml.lastIndexOf('</w:p>')
    if (lastClose === -1) return null
    return `${cellXml.slice(0, lastClose)}${valueRun(rPr, value)}${cellXml.slice(lastClose)}`
}

const appendToCell = (cellXml, value) => {
    const lastClose = cellXml.lastIndexOf('</w:p>')
    if (lastClose === -1) return null
    const rPr = runProperties(cellXml)
    return `${cellXml.slice(0, lastClose)}${valueRun(rPr, ` ${value}`)}${cellXml.slice(lastClose)}`
}

const hasTags = (xml) => /\{[^{}]+\}/.test(visibleText(xml))

/**
 * Writes the agreement values into the form's cells and returns the .docx buffer.
 *
 * Throws when the template's layout no longer matches the map, rather than producing a contract with
 * values in the wrong places.
 */
const fillAgreementForm = (templateBuffer, values = {}) => {
    const zip = new PizZip(templateBuffer)
    const original = zip.file(DOCUMENT_PART).asText()

    const tables = splitTables(original)
    if (!tables.length) throw new Error('The agreement template has no tables to fill.')

    let tableXml = tables[0].xml
    const rows = splitBy(tableXml, '<w:tr[ >]', '</w:tr>')

    const edits = []
    const mismatches = []
    let filled = 0

    const planEdit = ({ row, cell, mode, expect, text, label, labelCell = 0 }) => {
        const rowPart = rows[row]
        if (!rowPart) {
            mismatches.push(`row ${row} is missing`)
            return
        }
        const cells = splitBy(rowPart.xml, '<w:tc>', '</w:tc>')
        const cellPart = cells[cell]
        if (!cellPart) {
            mismatches.push(`row ${row} cell ${cell} is missing`)
            return
        }

        const actual = normalise(cellPart.xml)
        const wanted = expect.replace(/\s+/g, ' ').trim()
        if (wanted ? !actual.startsWith(wanted) : actual !== '') {
            mismatches.push(`row ${row} cell ${cell} reads "${actual}", expected "${wanted}"`)
            return
        }

        // An empty cell proves nothing on its own — the neighbouring label is what identifies it.
        if (label !== undefined) {
            const labelPart = cells[labelCell]
            const labelText = labelPart ? normalise(labelPart.xml) : ''
            if (!labelText.startsWith(label.replace(/\s+/g, ' ').trim())) {
                mismatches.push(
                    `row ${row} cell ${labelCell} reads "${labelText}", expected the label "${label}"`
                )
                return
            }
        }

        const replacement = mode === 'cell' ? fillCell(cellPart.xml, text) : appendToCell(cellPart.xml, text)
        if (!replacement) {
            mismatches.push(`row ${row} cell ${cell} has no paragraph to write into`)
            return
        }

        edits.push({
            start: rowPart.start + cellPart.start,
            end: rowPart.start + cellPart.end,
            xml: replacement,
        })
        filled += 1
    }

    FIELD_MAP.forEach((entry) => {
        const raw = values[entry.field]
        const text = raw === null || raw === undefined ? '' : String(raw).trim()
        if (!text) return
        planEdit({ ...entry, text })
    })

    if (values.businessType) {
        const option = ORGANISATION_OPTIONS[resolveBusinessType(values.businessType)]
        const rowPart = rows[2]
        const cells = rowPart ? splitBy(rowPart.xml, '<w:tc>', '</w:tc>') : []
        const cellPart = cells[1]
        const ticked = option && cellPart ? tickOption(cellPart.xml, option) : null

        if (!option) {
            mismatches.push(`business type "${values.businessType}" has no matching option on the form`)
        } else if (!ticked) {
            mismatches.push(`the form has no "${option}" option to tick for the type of organisation`)
        } else {
            edits.push({
                start: rowPart.start + cellPart.start,
                end: rowPart.start + cellPart.end,
                xml: ticked,
            })
            filled += 1
        }
    }

    if (values.signatoryIsPep !== null && values.signatoryIsPep !== undefined) {
        const target = values.signatoryIsPep === true || values.signatoryIsPep === 'Yes' ? PEP_ROWS.yes : PEP_ROWS.no
        planEdit({ ...target, mode: 'append', text: TICKED_BOX })
    }

    if (mismatches.length) {
        throw new Error(
            `The agreement template no longer matches the expected form layout: ${mismatches.join('; ')}`
        )
    }
    if (!filled) throw new Error('No agreement values were written into the template.')

    edits
        .sort((a, b) => b.start - a.start)
        .forEach((edit) => {
            tableXml = `${tableXml.slice(0, edit.start)}${edit.xml}${tableXml.slice(edit.end)}`
        })

    const filledXml = `${original.slice(0, tables[0].start)}${tableXml}${original.slice(tables[0].end)}`
    zip.file(DOCUMENT_PART, filledXml)
    return zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' })
}

module.exports = { FIELD_MAP, ORGANISATION_OPTIONS, fillAgreementForm, hasTags, visibleText }
