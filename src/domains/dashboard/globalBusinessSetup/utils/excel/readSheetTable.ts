import { cellToPrimitive } from './cellToPrimitive';
import { parseCsvText } from './parseCsvText';

const isBlankRow = (row: unknown[]) => !row.some(cell => String(cell ?? '').trim() !== '');

// Cells are read by index rather than with eachCell(), which skips empty cells
// and would shift every column that follows a gap in the row.
const readWorkbook = async (file: File): Promise<unknown[][]> => {
    const { default: ExcelJS } = await import('exceljs');
    const workbook = new ExcelJS.Workbook();

    await workbook.xlsx.load(await file.arrayBuffer());

    const worksheet = workbook.worksheets[0];

    if (!worksheet) return [];

    const width = worksheet.columnCount;

    return Array.from({ length: worksheet.rowCount }, (_row, rowIdx) => {
        const row = worksheet.getRow(rowIdx + 1);

        return Array.from({ length: width }, (_cell, colIdx) =>
            cellToPrimitive(row.getCell(colIdx + 1).value)
        );
    });
};

// Reads the first sheet of a CSV/Excel file into a plain 2D array with fully
// blank rows dropped. Date cells come back as JS Dates. exceljs is imported
// lazily so its ~950kb stays out of the route bundle until a file is picked.
export const readSheetTable = async (file: File): Promise<unknown[][]> => {
    const table = file.name.toLowerCase().endsWith('.csv')
        ? parseCsvText(await file.text())
        : await readWorkbook(file);

    return table.filter(row => !isBlankRow(row));
};
