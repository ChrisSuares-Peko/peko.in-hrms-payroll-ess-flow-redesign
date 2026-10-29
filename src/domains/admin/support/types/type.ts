import { CorporateUser } from '../../settings/types/disabledTypes';
import { Credential } from '../../users/types/corporateUserTypes';

export type payload = {
    userId: number;
    userType: string;
};

export type supportTicketListing = payload & {
    fromDate?: string;
    toDate?: string;
    page: number;
    module?: string;
    status?: 'all' | 'RESOLVED' | 'PENDING' | 'REJECTED';
};
export type ticketListingResponse = {
    data: Tickets[];
    recordsTotal: number;
};

export type TicketUpdate = {
    date: string;
    name: string;
    admin: boolean;
    message: string[];
};

interface CredentialObj {
    credential: Credential;
}
export interface Tickets {
    id: number;
    issueType: string;
    module: string;
    description: string;
    screenshotImage: string;
    status: string;
    chats: TicketUpdate[];
    createdAt: string;
    updatedAt: string;
    ticketId: string;
    systemUserId: string;
    corporateUserId: number;
    corporateUser: CredentialObj;
}
export type ticketListingTableData = {
    date: string;
    issueDetails: string;
    id: number;
    module: string;
    updates: number | string;
    status: string;
    view: string;
    description: string;
    ticketId: string;
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
    date: string;
    name: string;
    isAdmin: boolean;
    admin?: boolean;
    message: string;
    supportId: number | null;
};

export type singleTicketResponse = {
    id: number;
    issueType: string;
    module: string;
    description: string;
    screenshotImage: string;
    status: 'PENDING' | 'RESOLVED' | 'REJECTED';
    chats: Chat[];
    createdAt: string;
    updatedAt: string;
    systemUserId: null | number;
    corporateUserId: number;
};

export type TicketUpdateStatus = {
    status: 'PENDING' | 'RESOLVED' | 'REJECTED';
};

export type singleTicketData = {
    id: number;
    issueType: string;
    module: string;
    screenshotImage: string;
    chats: Chat[];
    createdAt: string;
    status: 'PENDING' | 'RESOLVED' | 'REJECTED';
    description: string;
};

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
    userId?: number;
    userType?: string;
    status: 'PENDING' | 'RESOLVED' | 'REJECTED';
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

export type CorporateListResponse = {
    result: CorporateUser[];
};
