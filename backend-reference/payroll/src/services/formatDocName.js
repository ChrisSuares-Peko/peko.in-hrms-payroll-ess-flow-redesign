exports.formatDocName = (docName) => {
    // Convert camelCase to space-separated words
    const spaced = docName.replace(/([a-z])([A-Z])/g, '$1 $2');
    // Capitalize the first letter of each word
    return spaced
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
};

