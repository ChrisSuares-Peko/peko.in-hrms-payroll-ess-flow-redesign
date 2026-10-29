import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, it, vi, expect, beforeEach } from 'vitest';

import Chat from '../../components/Chat';

vi.mock('@src/hooks/store', () => ({
    useAppDispatch: () => vi.fn(),
    useAppSelector: vi.fn(() => ({
        reducer: {
            user: { username: 'testUser' },
        },
    })),
}));
vi.mock('../../hooks/useChatMessages', () => ({
    useChatMessages: () => [{ text: 'Hello', sender: 'user1', createdAt: { seconds: 1678901234 } }],
}));
vi.mock('../../hooks/useFileHandling', () => ({
    useFileHandling: () => ({
        file: null,
        previewImage: null,
        previewVisible: false,
        handleInputChange: vi.fn(),
        handleProceedFileSend: vi.fn(),
        resetState: vi.fn(),
    }),
}));
vi.mock('../../hooks/usePeerConnection', () => ({
    usePeerConnection: () => ({
        createPeerConnection: vi.fn(),
        closePeerConnection: vi.fn(),
    }),
}));
vi.mock('../../hooks/usePostChatFile', () => ({
    default: () => ({
        handlePostChatFile: vi.fn(),
        isLoading: false,
    }),
}));
vi.mock('../../utils/setupWebrtc', () => ({
    initiateCall: vi.fn(),
}));
// vi.mock('firebase/firestore', () => ({
//     collection: vi.fn(() => ({
//         addDoc: vi.fn().mockResolvedValue({ id: 'mockMessageId' }),
//         onSnapshot: vi.fn(),
//     })),
//     addDoc: vi.fn().mockResolvedValue({ id: 'mockMessageId' }),
//     onSnapshot: vi.fn(),
//     serverTimestamp: vi.fn(),
//     updateDoc: vi.fn().mockResolvedValue({}),
//     doc: vi.fn(),
// }));
vi.mock('firebase/firestore', async () => {
    const original = await vi.importActual('firebase/firestore');

    return {
        ...original,
        collection: vi.fn(),
        doc: vi.fn(),
        updateDoc: vi.fn(),
        addDoc: vi.fn(),
        serverTimestamp: vi.fn(),
        onSnapshot: vi.fn(
            () => () => {} // Mock unsubscribe function
        ),
    };
});

vi.mock('../../config/firebaseConfig', () => ({
    db: {},
    firestore: {},
    auth: {
        currentUser: { email: 'testuser@example.com', uid: 'test-uid' },
        signInWithEmailAndPassword: vi.fn(),
        signOut: vi.fn(),
    },
}));
const mockCreatePeerConnection = vi.fn(() => ({
    createOffer: vi.fn(),
    setLocalDescription: vi.fn(),
    addTrack: vi.fn(),
    close: vi.fn(),
}));
const mockClosePeerConnection = vi.fn();

vi.mock('@src/domains/dashboard/pekoConnect/hooks/usePeerConnection', () => ({
    usePeerConnection: () => ({
        createPeerConnection: mockCreatePeerConnection,
        closePeerConnection: mockClosePeerConnection,
    }),
}));

describe('Chat Component', () => {
    const defaultProps = {
        currentUser: { email: 'test@example.com' },
        roomId: 'test-room',
        rName: 'Test Room',
        recieverId: 'receiver-id',
        sendId: 'sender-id',
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render Chat component with required elements', () => {
        render(<Chat {...defaultProps} />);

        expect(screen.getByPlaceholderText('Type your message here')).toBeInTheDocument();
        expect(screen.getByTestId('send-button')).toBeInTheDocument();
    });

    it('should send a message when clicking the send button', async () => {
        render(<Chat {...defaultProps} />);
        const inputField = screen.getByPlaceholderText('Type your message here');
        const sendButton = screen.getByTestId('send-button');

        fireEvent.change(inputField, { target: { value: 'Hello World' } });
        fireEvent.click(sendButton);

        await waitFor(() => expect(inputField).toHaveValue(''));
    });

    it('should send a message when pressing Enter key', async () => {
        render(<Chat {...defaultProps} />);
        const inputField = screen.getByPlaceholderText('Type your message here');

        fireEvent.change(inputField, { target: { value: 'Test Message' } });
        fireEvent.keyUp(inputField, { key: 'Enter' });

        await waitFor(() => expect(inputField).toHaveValue(''));
    });

    it('should handle file attachment click', async () => {
        render(<Chat {...defaultProps} />);
        const fileInput = screen.getByTestId('send-button');

        fireEvent.click(fileInput);
        await waitFor(() => expect(fileInput).toBeInTheDocument());
    });

    it('should initiate a video call when handleCall is triggered', async () => {
        render(<Chat {...defaultProps} />);
        const callButton = screen.getByTestId('video-call');

        fireEvent.click(callButton);
        await waitFor(() => expect(mockCreatePeerConnection).toHaveBeenCalled());
    });
});
