export type useFilterCommon = {
    searchText: string;
    page: number;
    itemsPerPage: number;
    partnerId?: string | number;
    sort?: 'ASC' | 'DESC';
};

export type DownloadExcelResponse = {
    buffer: {
        type: string;
        data: [];
    };
    fileType: string;
};
