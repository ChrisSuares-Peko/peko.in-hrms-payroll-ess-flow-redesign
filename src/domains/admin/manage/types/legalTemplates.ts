export type LegalTemplatesBody = {
    id: number;
    title: string;
    category: string;
    description: string;
    timeEstimate: string;
    iconKey: string;
    documentUrl: string;
    isActive: boolean;
    createdAt: string;
};

export type LegalTemplatesFormValues = {
    id?: number | string;
    title: string;
    category: string;
    description: string;
    timeEstimate: string;
    iconKey: string;
    documentFile?: string;
    documentFormat?: string;
    documentUrl?: string;
};

export type LegalTemplatesWithoutID = Omit<LegalTemplatesFormValues, 'id'>;

export type ApiResponseLegalTemplates = {
    draw: number;
    recordsTotal: number;
    recordsFiltered: number;
    data: LegalTemplatesBody[];
};

export type getLegalTemplates = {
    page: number;
    searchText: string;
    itemsPerPage: number;
    sort: 'ASC' | 'DESC';
    sortField?: string;
};

export type updateLegalTemplatesStatusPayload = {
    status: boolean;
    templateId: string | number;
};

export type RolePermissionAccessData = {
    view?: boolean;
    write?: boolean;
    update?: boolean;
};
