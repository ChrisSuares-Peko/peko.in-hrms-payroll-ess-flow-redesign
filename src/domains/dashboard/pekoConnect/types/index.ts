type MessageContent = {
    message: string;
    attachments: any[]; // Define the specific type for attachments if available
};

type MessageMetadata = {
    type: string;
};

type Sender = {
    kind: 'communicationUser';
    communicationUserId: string;
};

export type ChatMessage = {
    content: MessageContent;
    createdOn: Date; // or string, depending on how you handle dates
    id: string;
    metadata: MessageMetadata;
    sender: Sender;
    senderDisplayName: string;
    sequenceId: string;
    type: string;
    version: string;
};
