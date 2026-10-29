import { useEffect, useState } from 'react';

import { collection, onSnapshot, query, orderBy, updateDoc, doc } from 'firebase/firestore';

import { db } from '../config/firebaseConfig';

interface Message {
    id: string;
    text: string;
    createdAt: Date;
    senderId: string;
    seenBy: string[];
}
export const useChatMessages = (roomId: string, currentUserEmail: string) => {
    const [messages, setMessages] = useState<Message[]>([]);

    useEffect(() => {
        if (!roomId) return;

        const messagesRef = collection(db, 'rooms', roomId, 'messages');
        const q = query(messagesRef, orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q, snapshot => {
            const msgs = snapshot.docs.map(docData => ({
                id: docData.id,
                ...docData.data(),
            })) as Message[];

            setMessages(msgs);

            // Mark messages as seen
            const markAsSeen = async () => {
                const updatePromises = msgs.map(async message => {
                    if (!message.seenBy.includes(currentUserEmail)) {
                        const messageRef = doc(db, 'rooms', roomId, 'messages', message.id);
                        await updateDoc(messageRef, {
                            seenBy: [...message.seenBy, currentUserEmail],
                        });
                    }
                });
                await Promise.all(updatePromises);
            };

            markAsSeen();
        });

        // eslint-disable-next-line consistent-return
        return () => unsubscribe();
    }, [roomId, currentUserEmail]);

    return messages;
};
