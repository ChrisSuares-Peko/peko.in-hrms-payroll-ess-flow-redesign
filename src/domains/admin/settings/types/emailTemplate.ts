export type EmailTemplateStatus = 'DRAFT' | 'PUBLISHED';

// `header`/`footer` are ids from adminEmailLayouts (each a positive integer
// or null). The whole field can also be entirely `null` — no layout set.
export type EmailTemplateLayout = {
    header?: number | null;
    footer?: number | null;
};

// Fields returned by GET /email-templates/:id (and by create/update/publish
// responses). The list endpoint intentionally omits draftHtmlBody/
// publishedHtmlBody — see EmailTemplateListItem below.
export type EmailTemplate = {
    id: number;
    key: string;
    name: string;
    service: string;
    partnerId: string | number | null;
    subject: string;
    sender: string | null;
    publishedSubject: string | null;
    draftHtmlBody: string;
    publishedHtmlBody: string | null;
    layout: EmailTemplateLayout | null;
    status: EmailTemplateStatus;
    isActive: boolean;
    version: number;
    updatedBy: string | null;
    publishedBy: string | null;
    publishedAt: string | null;
    createdAt: string;
    updatedAt: string;
};

// Shape of each row from GET /email-templates (list) — metadata only.
export type EmailTemplateListItem = Omit<EmailTemplate, 'draftHtmlBody' | 'publishedHtmlBody'>;

export type EmailTemplateListResponse = {
    recordsTotal: number;
    rows: EmailTemplateListItem[];
};

export type EmailTemplateListParams = {
    page: number;
    itemsPerPage: number;
    searchText?: string;
    service?: string;
    partnerId?: string | number | null;
    status?: EmailTemplateStatus | '';
    isActive?: boolean;
    sort?: string;
    sortField?: string;
};

// POST body — only fields the API accepts on create.
export type CreateEmailTemplatePayload = {
    key: string;
    name: string;
    service: string;
    partnerId?: string | number | null;
    subject: string;
    sender?: string;
    draftHtmlBody: string;
    layout?: EmailTemplateLayout | null;
    isActive: boolean;
};

// PUT body — `key` is immutable after creation, so it's deliberately absent.
export type UpdateEmailTemplateDraftPayload = {
    name: string;
    service: string;
    partnerId?: string | number | null;
    subject: string;
    sender?: string;
    draftHtmlBody: string;
    layout?: EmailTemplateLayout | null;
};

export type RolePermissionAccessData = {
    view?: boolean;
    write?: boolean;
    update?: boolean;
};

// POST /email-templates/import body — a plain JSON array, one object per row,
// each shaped like CreateEmailTemplatePayload.
export type ImportEmailTemplatesPayload = {
    templates: CreateEmailTemplatePayload[];
    overwrite?: boolean;
};

export type ImportEmailTemplateResult = {
    index: number;
    key?: string;
    service?: string;
    partnerId?: string | number | null;
    status: 'created' | 'updated' | 'skipped' | 'error';
    message?: string;
    id?: number;
};

export type ImportEmailTemplatesResponse = {
    total: number;
    created: number;
    updated: number;
    skipped: number;
    failed: number;
    results: ImportEmailTemplateResult[];
};
