export type payload = {
    userId: number;
    userType: string;
};

export type supportTicketListing = payload & {
    fromDate?: string;
    toDate?: string;
    page: number;
    module?: string;
};
export type ticketListingResponse = {
    data: Tickets[];
    total: number;
};

export type TicketUpdate = {
    date: string;
    name: string;
    admin: boolean;
    message: string[];
};
export interface Tickets {
    id: number;
    type: string;
    module: string;
    description: string;
    screenshotImage: string;
    status: string;
    chats: TicketUpdate[];
    subject: string;
    updatedAt: string;
    systemUserId: string;
    corporateUserId: number;
    createdAt: string;
    ticketId: number;
    issueType: string;
}
export type ticketListingTableData = {
    date: string;
    issueType: string;

    id: number;
    module: string;
    updates?: number | string;
    status: string;
    view: string;
    ticketId: number;
};

export type supportTicketRaise = {
    userId: number;
    userType: string;
    TicketData: {
        corporateUserId: number;
        description: string;
        issueType: string;
        module: string;
        screenshot: string;
        screenshotImageFormat: string;
    };
};

export type updateTicketResponse = {
    body: string;
};
export type supportTicketDeletedResponse = {
    data: {};
};
export type createChatPayload = {
    userId: number;
    userType: string;
    supportId: number;
    isAdmin: boolean;
    message: string;
    name: string;
    date: string;
};
export type createChatResponse = {
    id: number;
    issueType: string;
    module: string;
    description: string;
    screenshotImage: string;
    status: string;
    chats: {
        message: string;
        name: string;
        admin: boolean;
        date: string;
    }[];
    createdAt: string;
    updatedAt: string;
    systemUserId: number;
    corporateUserId: number;
};

// single ticket
export type ticketPayload = payload & {
    ticketId: number | null;
};

export type Chat = {
    body: string;
    body_text: string;
    id: number;
    incoming: boolean;
    private: boolean;
    user_id: number;
    support_email: string;
    source: number;
    category: number;
    to_emails: string[];
    from_email: string;
    cc_emails: string[];
    bcc_emails: string[];
    email_failure_count: number | null;
    outgoing_failures: number | null;
    thread_id: number | null;
    thread_message_id: number | null;
    created_at: string; // ISO 8601 date string
    updated_at: string; // ISO 8601 date string
    last_edited_at: string | null; // ISO 8601 date string or null
    last_edited_user_id: number | null;
    attachments: any[]; // assuming attachments can be of any type
    automation_id: number | null;
    automation_type_id: number | null;
    auto_response: boolean;
    ticket_id: number;
    source_additional_info: any | null; // assuming it can be of any type or null
};

export type singleTicketResponse = {
    id: number;
    issueType: string;
    module: string;
    description: string;
    screenshotImage: string;
    status: string;
    chats: Chat[];
    type: string;
    attachments: { id: number; name: string; attachment_url: string }[];

    custom_fields: { cf_module: string };

    createdAt: string;
    created_at: string;
    updatedAt: string;
    systemUserId: null | number;
    corporateUserId: number;
    isClosed?: boolean;
};

export type singleTicketData = {
    id: number;
    issueType: string;
    type: string;
    module: string;
    status: string;
    screenshotImage: string;
    chats: Chat[];
    created_at: string;
    createdAt: string;
    isClosed?: boolean;
    custom_fields: { cf_module: string };
    attachments: { id: number; name: string; attachment_url: string }[];
};
// "attachments": [
//     {
//         "id": 1060013620106,
//         "content_type": "image/png",
//         "size": 141006,
//         "name": "screenshot.png",
//         // PROTOTYPE-SETUP: sample attachment_url removed (presigned S3 URL contained an AWS access key ID).
//         "created_at": "2024-06-04T06:27:29Z",
//         "updated_at": "2024-06-04T06:27:29Z"
//     }
// ],

// ticket creation
export type supportTicketRaiseResponse = {
    issueType: string;
    module: string;
    description: string;
    screenshotImage: string;
    status: string;
    chats: any[]; // Assuming chat messages will be of any type
    createdAt: string; // Date string in ISO format
    updatedAt: string; // Date string in ISO format
    corporateUserId: string;
};
export type SupportTicketResponse = {
    cc_emails: string[];
    fwd_emails: string[];
    reply_cc_emails: string[];
    ticket_cc_emails: string[];
    fr_escalated: boolean;
    spam: boolean;
    email_config_id: number;
    group_id: number | null;
    priority: number;
    requester_id: number;
    responder_id: number | null;
    source: number;
    company_id: number | null;
    status: number;
    subject: string;
    support_email: string | null;
    to_emails: string[] | null;
    product_id: number;
    id: number;
    type: string;
    due_by: string;
    fr_due_by: string;
    is_escalated: boolean;
    description: string;
    description_text: string;
    custom_fields: {
        cf_module: string;
    };
    created_at: string;
    updated_at: string;
    tags: string[];
    attachments: object[] | [];
    form_id: number;
    nr_due_by: string | null;
    nr_escalated: boolean;
};

export type TicketRaisePayload = {
    userId: number;
    userType: string;
    description: string;
    issueType: string;
    module: string;
    screenshot: string;
    screenshotImageFormat: string;
};
// ticket updation
export type ticketUpdateResponse = {
    issueType: string;
    module: string;
    description: string;
    screenshotImage: string;
    status: string;
    chats: any[]; // Assuming chat messages will be of any type
    createdAt: string; // Date string in ISO format
    updatedAt: string; // Date string in ISO format
    corporateUserId: string;
};
export type ticketUpdatePayload = {
    chatId?: number | null;
    attachmentId?: number | null;
    userId?: number;
    userType?: string;
    issueType?: string;
    module?: string;
    screenshot?: string | null;
    screenshotImageFormat?: string;
    screenshotImage?: string | null;
};

// issue type listing
export interface IssueOption {
    value: string;
    label: string;
}

export interface issueListingResponse {
    issueTypes: IssueOption[];
}

// module listing
export interface ModuleOption {
    value: string;
    label: string;
}

export interface ModuleListingResponse {
    modules: ModuleOption[];
}

// Faq listing
export type FAQ = {
    question: string;
    answer: string;
};

export type FAQListResponse = {
    faq: FAQ[];
};
export type FAQData = {
    question: string;
    answer: string;
}[];

export type FlattenedFAQData = {
    question: string;
    answer: string;
    category: string;
};

export type FAQDataResponse = {
    [category: string]: FAQ[]; // Using an index signature to allow any string as a key
};

export interface CategorizedFAQData {
    category: string;
    items: FAQ[];
}

export type UpdateTour = { type: 'All' } | { type: 'Single'; service: string };

export type productTourResponse = {
    result: productTour;
};

export type productTour = {
    productTour: {
        dashboard: boolean;
        payroll: boolean;
    };
};

export type conversationResponse = {
    status: boolean;
    data: {
        conversations: Conversation[];
        requesterId: number;
    };
    message: string;
    responseCode: string;
};

type Conversation = {
    body: string;
    body_text: string;
    id: number;
    incoming: boolean;
    private: boolean;
    user_id: number;
    support_email: string;
    source: number;
    category: number;
    to_emails: string[];
    from_email: string;
    cc_emails: string[];
    bcc_emails: string[];
    email_failure_count: null;
    outgoing_failures: null;
    thread_id: null;
    thread_message_id: null;
    created_at: string;
    updated_at: string;
    last_edited_at: null;
    last_edited_user_id: null;
    attachments: any[];
    automation_id: null;
    automation_type_id: null;
    auto_response: boolean;
    ticket_id: number;
    source_additional_info: null;
};

export type ConversationResponse = {
    status: boolean;
    data: ConversationData;
    message: string;
    responseCode: string;
};

export type ConversationData = {
    id: number;
    user_id: number;
    from_email: string;
    cc_emails: string[];
    bcc_emails: string[];
    body: string;
    body_text: string;
    ticket_id: number;
    to_emails: string[];
    attachments: any[]; // Adjust the type of attachments if you have a more specific type
    source_additional_info: any; // Use the specific type if known
    created_at: string;
    updated_at: string;
};
