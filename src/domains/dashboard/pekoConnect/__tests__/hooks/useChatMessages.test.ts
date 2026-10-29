import { renderHook, act } from '@testing-library/react';
import { collection, onSnapshot, query, orderBy, updateDoc, doc } from 'firebase/firestore';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { db } from '../../config/firebaseConfig';
import { useChatMessages } from '../../hooks/useChatMessages';

vi.mock('firebase/firestore', async () => {
    const original = await vi.importActual('firebase/firestore');

    return {
        ...original,
        collection: vi.fn(),
        doc: vi.fn(),
        updateDoc: vi.fn(),
        addDoc: vi.fn(),
        serverTimestamp: vi.fn(),
        onSnapshot: vi.fn(() => () => {}),
        query: vi.fn(),
        orderBy: vi.fn(),
    };
});

describe('useChatMessages', () => {
    const roomId = 'room123';
    const currentUserEmail = 'user@example.com';
    let unsubscribeMock: () => void;

    beforeEach(() => {
        vi.clearAllMocks();
        unsubscribeMock = vi.fn();

        (collection as Mock).mockReturnValue({});
        (query as Mock).mockReturnValue({});
        (orderBy as Mock).mockReturnValue({});
        (doc as Mock).mockImplementation((_, __, ___, ____, messageId) => ({ id: messageId }));

        (onSnapshot as Mock).mockImplementation((_q, callback) => {
            callback({
                docs: [
                    {
                        id: 'msg1',
                        data: () => ({
                            text: 'Hello',
                            createdAt: new Date(),
                            senderId: 'user1',
                            seenBy: [],
                        }),
                    },
                    {
                        id: 'msg2',
                        data: () => ({
                            text: 'Hi',
                            createdAt: new Date(),
                            senderId: 'user2',
                            seenBy: ['user@example.com'],
                        }),
                    },
                ],
            });
            return unsubscribeMock;
        });
    });

    it('subscribes to Firestore and updates messages', async () => {
        const { result } = renderHook(() => useChatMessages(roomId, currentUserEmail));

        expect(result.current.length).toBe(2);
        expect(result.current[0].text).toBe('Hello');
        expect(result.current[1].text).toBe('Hi');

        expect(collection).toHaveBeenCalledWith(db, 'rooms', roomId, 'messages');
        expect(onSnapshot).toHaveBeenCalled();
    });

    it('marks messages as seen', async () => {
        renderHook(() => useChatMessages(roomId, currentUserEmail));

        await act(async () => {
            expect(updateDoc).toHaveBeenCalledWith(expect.objectContaining({ id: 'msg1' }), {
                seenBy: expect.arrayContaining([currentUserEmail]),
            });

            // Ensure msg2 is NOT updated since it's already seen
            expect(updateDoc).not.toHaveBeenCalledWith(
                expect.objectContaining({ id: 'msg2' }),
                expect.any(Object)
            );
        });
    });

    it('cleans up the Firestore subscription on unmount', async () => {
        const { unmount } = renderHook(() => useChatMessages(roomId, currentUserEmail));

        unmount();
        expect(unsubscribeMock).toHaveBeenCalled();
    });

    it('does not subscribe if roomId is missing', () => {
        renderHook(() => useChatMessages('', currentUserEmail));

        expect(onSnapshot).not.toHaveBeenCalled();
    });
});
