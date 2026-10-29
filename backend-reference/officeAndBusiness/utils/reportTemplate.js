exports.reportPdfTemplate=(data,templateDetails)=>{
    if (data.length === 0) {
        return '<p>No data available.</p>';
    }

    // Get the keys from the first transaction object to use as headers
    const headers = Object.keys(data[0]);

    // Generate header HTML
    const headerHtml = headers.map(header => `<th>${header}</th>`).join('');

    // Generate rows HTML
    const rowsHtml = data.map(transaction => {
        const rowHtml = headers.map(header => `<td>${transaction[header]}</td>`).join('');
        return `<tr>${rowHtml}</tr>`;
    }).join('');

    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${templateDetails?.title??'Report'}</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 20px;
                }
                h1 {
                    text-align: center;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                }
                table, th, td {
                    border: 1px solid black;
                }
                th, td {
                    padding: 10px;
                    text-align: left;
                }
                th {
                    background-color: #f2f2f2;
                }
            </style>
        </head>
        <body>
            <h1>${templateDetails?.title??'Report'}</h1>
            <table>
                <thead>
                    <tr>
                        ${headerHtml}
                    </tr>
                </thead>
                <tbody>
                    ${rowsHtml}
                </tbody>
            </table>
        </body>
        </html>
    `;
}