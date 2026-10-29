import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { onSnapshot, updateDoc } from 'firebase/firestore';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import IncomingCallListener from '../../components/IncomingCallListener';

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
vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
    useAppDispatch: vi.fn(),
}));
// Mock Peer Connection hook
vi.mock('../../hooks/usePeerConnection', () => ({
    usePeerConnection: () => ({
        createPeerConnection: vi.fn(() => ({
            addTrack: vi.fn(),
            ontrack: vi.fn(),
        })),
        closePeerConnection: vi.fn(),
    }),
}));

describe('IncomingCallListener Component', () => {
    const userId = 'testUser';
    beforeEach(() => {
        vi.clearAllMocks();
        // cleanup();
        (useAppSelector as Mock).mockReturnValue({ user: { userId } });
    });
    // afterEach(() => {
    //     vi.clearAllMocks();
    // });

    it('renders children when no call is active', () => {
        render(
            <IncomingCallListener userId={userId}>
                <p>Test Child</p>
            </IncomingCallListener>
        );

        expect(screen.getByText('Test Child')).toBeInTheDocument();
    });

    it('displays incoming call UI when a call is received', async () => {
        (onSnapshot as Mock).mockImplementation((_, callback) => {
            callback({
                data: () => ({ callerId: 'caller123', callerName: 'Alice', type: 'video' }),
            });
            return vi.fn();
        });

        render(<IncomingCallListener userId={userId} />);

        await waitFor(() => expect(screen.getByText('Incoming Call')).toBeInTheDocument());
        expect(screen.getByText('Alice')).toBeInTheDocument();
    });

    it('plays ringtone when a call is received', async () => {
        (onSnapshot as Mock).mockImplementation((_, callback) => {
            callback({
                data: () => ({ callerId: 'caller123', callerName: 'Alice', type: 'audio' }),
            });
            return vi.fn();
        });

        render(<IncomingCallListener userId={userId} />);
        await waitFor(() => expect(screen.getByText('Incoming Call')).toBeInTheDocument());

        const audioElement = document.querySelector('audio');
        expect(audioElement).toBeInTheDocument();
        expect(audioElement).toHaveAttribute('autoplay');
    });

    it('calls handleAnswerCall when the "Video Call" button is clicked', async () => {
        (onSnapshot as Mock).mockImplementation((_, callback) => {
            callback({
                data: () => ({ callerId: 'caller123', callerName: 'Alice', type: 'video' }),
            });
            return vi.fn();
        });

        render(<IncomingCallListener userId={userId} />);

        await waitFor(() => expect(screen.getByText('Incoming Call')).toBeInTheDocument());

        const answerButton = document.querySelector('.bg-vidoCallGreen');
        expect(answerButton).toBeInTheDocument();

        await act(async () => {
            if (!answerButton) {
                throw new Error('Video Call button not found');
            }
            fireEvent.click(answerButton);
        });
    });
    it('calls handleRejectCall when "Decline" button is clicked', async () => {
        (onSnapshot as Mock).mockImplementation((_, callback) => {
            callback({
                data: () => ({ callerId: 'caller123', callerName: 'Alice', type: 'audio' }),
            });
            return vi.fn();
        });

        render(<IncomingCallListener userId={userId} />);

        await waitFor(() => expect(screen.getByText('Incoming Call')).toBeInTheDocument());

        const declineButton = document.querySelector('.ant-btn-dangerous');
        if (!declineButton) {
            throw new Error('Video Call button not found');
        }
        fireEvent.click(declineButton);

        expect(updateDoc).toHaveBeenCalledWith(undefined, { rejected: true });
    });

    it('closes call UI when call is rejected or ended', async () => {
        (onSnapshot as Mock).mockImplementation((_, callback) => {
            callback({ data: () => ({ rejected: true }) });
            return vi.fn();
        });

        render(<IncomingCallListener userId={userId} />);

        await waitFor(() => expect(screen.queryByText('Incoming Call')).not.toBeInTheDocument());
    });
});
