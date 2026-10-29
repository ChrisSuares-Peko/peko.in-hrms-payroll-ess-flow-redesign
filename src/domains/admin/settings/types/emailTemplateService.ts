// Admin-managed registry of email template "services" (e.g. AUTH, PAYROLL) — a
// step toward replacing the hardcoded EMAIL_TEMPLATE_SERVICES list a developer
// currently has to edit in code. Deliberately just `key` + `isActive` + audit
// fields: an earlier version of this on the backend also had name/description,
// dropped two hours after being added because nothing downstream read them.
export type EmailTemplateService = {
    id: number;
    key: string;
    isActive: boolean;
    updatedBy: string | null;
    createdAt: string;
    updatedAt: string;
};

export type EmailTemplateServiceListParams = {
    search?: string;
    isActive?: boolean;
    page?: number;
    itemsPerPage?: number;
};

export type EmailTemplateServiceListResponse = {
    recordsTotal: number;
    rows: EmailTemplateService[];
};

export type CreateEmailTemplateServicePayload = {
    key: string;
    isActive?: boolean;
};
