const fs = require('fs');




exports.convertToSIFBuffer = async (jsonData) => {
    let sifData = '';
    jsonData.forEach(item => {
        // Assuming each item includes source, target, and interaction type
        sifData += `${item?.source} ${item?.interaction} ${item?.target}\n`;
    });
    fs.writeFileSync(`outputSIF-${new Date().valueOf()}.sif`, sifData);
    // Convert SIF string data to a buffer
    const buffer = Buffer.from(sifData, 'utf-8');
    console.log({ buffer }, 'Conversion complete. SIF data converted to buffer.');

    return buffer;
}

exports.convertToCSVBuffer = async (jsonData) => {
    let csvData = '';
    jsonData.forEach(item => {
        // Assuming each item includes source, target, and interaction type
        csvData += `${item?.source},${item?.interaction},${item?.target}\n`;
    });
    const filename = `outputCSV-${new Date().valueOf()}.csv`;
    fs.writeFileSync(filename, csvData);
    
    // Convert CSV string data to a buffer
    const buffer = Buffer.from(csvData, 'utf-8');
    console.log({ buffer }, 'Conversion complete. CSV data converted to buffer.');

    return buffer;
}
