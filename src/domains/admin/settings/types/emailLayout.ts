// Free-form string, not a fixed enum, so any backend value round-trips even though the Select only offers Header/Footer.
export type EmailLayoutType = string;

export type EmailLayoutStatus = 'DRAFT' | 'PUBLISHED';

// GET /email-layouts/:id (and create/update/publish) response; list endpoint omits draftHtml/publishedHtml (see below).
export type EmailLayout = {
    id: number;
    name: string;
    type: EmailLayoutType;
    // absent/null = shared/default layout (same convention as EmailTemplate's partnerId).
    partnerId: string | number | null;
    draftHtml: string;
    publishedHtml: string | null;
    status: EmailLayoutStatus;
    isActive: boolean;
    version: number;
    updatedBy: string | null;
    publishedBy: string | null;
    publishedAt: string | null;
    createdAt: string;
    updatedAt: string;
};

// Shape of each row from GET /email-layouts (list) — metadata only.
export type EmailLayoutListItem = Omit<EmailLayout, 'draftHtml' | 'publishedHtml'>;

export type EmailLayoutListResponse = {
    recordsTotal: number;
    rows: EmailLayoutListItem[];
};

export type EmailLayoutListParams = {
    page?: number;
    itemsPerPage?: number;
    search?: string;
    type?: EmailLayoutType | '';
    status?: EmailLayoutStatus | '';
    isActive?: boolean;
    sort?: 'ASC' | 'DESC';
    sortField?:
        | 'id'
        | 'name'
        | 'type'
        | 'status'
        | 'isActive'
        | 'version'
        | 'createdAt'
        | 'updatedAt'
        | 'publishedAt';
};

// POST /email-layouts body; draftHtml is plain HTML, no Base64, matching draftHtmlBody.
export type CreateEmailLayoutPayload = {
    name: string;
    type: EmailLayoutType;
    partnerId?: string | number | null;
    draftHtml?: string;
    isActive?: boolean;
};

// PUT /email-layouts/:id body, all fields optional. Unlike emailTemplate's key, `type` is mutable here.
export type UpdateEmailLayoutDraftPayload = {
    name?: string;
    type?: EmailLayoutType;
    partnerId?: string | number | null;
    draftHtml?: string;
};
