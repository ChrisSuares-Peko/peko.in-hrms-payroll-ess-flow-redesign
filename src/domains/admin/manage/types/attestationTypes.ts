export interface AttestationCategoryData {
    id: number;
    label: string;
    value: string;
    price: string;
    country: string;
    createdAt: string;
    countryCode: string;
}

export type createCategoryPayload = {
    countryCode: string; // ISO country code (e.g., "US")
    label: string; // Name or label of the attestation category
    value: string; // Unique identifier or value for the category
    price: number; // Price of the attestation category
    country: string; // Full name of the country (e.g., "United States")
};
export type updateCategoryPayload = {
    id: number;
    countryCode: string;
    label: string;
    value: string;
    price: number;
    country: string;
};

export interface AttestationCategoryResponse {
    data: AttestationCategoryData[]; // Array of attestation categories
    recordsTotal: number; // Total number of records
}

export interface getAttestationCategoriesPayload {
    sort?: 'ASC' | 'DESC'; // Sorting order
    sortField?: string; // Field to sort by
    page?: number; // Current page number
    itemsPerPage?: number; // Number of items per page
    searchText?: string; // Text to search for
    from?: string; // Optional start date
    to?: string; // Optional end date
}

export interface updateStatusPayload {
    userType: string;
    userId: number;
    categoryId: number; // ID of the category to update
    status: boolean; // New status (active/inactive)
}

export interface activeResponse {
    success: boolean; // Whether the action was successful
    message: string; // Status message
}

export interface deleteCategoryPayload {
    userType: string;
    userId: number;
    categoryId: number; // ID of the category to delete
}

export interface FileBufferResponse {
    buffer: { data: number[] }; // File buffer data as an array of numbers
    fileType: string; // MIME type of the file (e.g., 'application/pdf')
}

export interface FileBufferRequestPayload {
    type: 'excel' | 'csv' | 'pdf'; // File format type
    sort?: 'ASC' | 'DESC'; // Sorting order
    sortField?: string; // Field to sort by
    page?: number; // Current page number
    itemsPerPage?: number; // Number of items per page
    searchText?: string; // Text to search for
    from?: string; // Optional start date
    to?: string; // Optional end date
}
export type RolePermissionAccessData = {
    view?: boolean;
    write?: boolean;
    update?: boolean;
};
