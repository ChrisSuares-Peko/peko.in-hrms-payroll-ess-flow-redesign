export type payload = {
    userId?: number;
    userType?: string;
};

export type updateChatIdResponse = {
    data: {};
};

export type updateChatIdPayload = payload & {
    restoreId: string | null;
};
