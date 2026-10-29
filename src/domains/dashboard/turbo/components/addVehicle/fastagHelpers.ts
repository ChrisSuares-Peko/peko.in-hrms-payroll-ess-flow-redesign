export const findInfoValue = (infoArr: any[], keywords: string[]) => {
    const match = infoArr.find(i =>
        keywords.some(k => (i?.infoName || '').toLowerCase().includes(k))
    );
    return match?.infoValue || null;
};
