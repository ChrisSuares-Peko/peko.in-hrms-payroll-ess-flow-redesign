import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { describe, expect, it } from 'vitest';

import LocalAvatarRenderer from '../../components/LocalAvatarRenderer';

const mockStore = configureStore();
const createStore = (companyName?: string) =>
    mockStore({
        reducer: {
            user: { user: { companyName } },
        },
    });

describe('LocalAvatarRenderer Component', () => {
    it('renders the avatar when video is not muted', () => {
        const store = createStore('TechCorp');
        render(
            <Provider store={store}>
                <LocalAvatarRenderer localVideoRef={{ current: null }} videoMuted={false} />
            </Provider>
        );

        expect(screen.getByText('T')).toBeInTheDocument();
    });

    it('does not render anything when video is muted', () => {
        const store = createStore('TechCorp');
        const { container } = render(
            <Provider store={store}>
                <LocalAvatarRenderer localVideoRef={{ current: null }} videoMuted />
            </Provider>
        );

        expect(container.firstChild).toBeNull();
    });

    it('displays the first letter of companyName', () => {
        const store = createStore('OpenAI');
        render(
            <Provider store={store}>
                <LocalAvatarRenderer localVideoRef={{ current: null }} videoMuted={false} />
            </Provider>
        );

        expect(screen.getByText('O')).toBeInTheDocument();
    });

    it('shows "-" when companyName is missing', () => {
        const store = createStore(undefined);
        render(
            <Provider store={store}>
                <LocalAvatarRenderer localVideoRef={{ current: null }} videoMuted={false} />
            </Provider>
        );

        expect(screen.getByText('-')).toBeInTheDocument();
    });

    it('has the correct styles and structure', () => {
        const store = createStore('FinTech');
        render(
            <Provider store={store}>
                <LocalAvatarRenderer localVideoRef={{ current: null }} videoMuted={false} />
            </Provider>
        );

        const avatarText = screen.getByText('F');
        expect(avatarText).toBeInTheDocument();
        expect(avatarText).toHaveClass('text-3xl', 'font-bold', 'md:text-6xl', 'text-brandColor');

        const avatarContainer = avatarText.closest('.ant-avatar');
        expect(avatarContainer).toHaveClass('bg-[#ffeeee]', 'w-16', 'h-16', 'md:w-28', 'md:h-28');
    });
});
