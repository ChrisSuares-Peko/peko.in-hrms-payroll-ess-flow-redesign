/**
 * @file VideoPlayer.test.tsx
 * @description Unit tests for VideoPlayer component
 * Verifies:
 *  - Returns null when product is null
 *  - Renders without crashing when videos exist
 */

import React from 'react';

import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import VideoPlayer from '@src/domains/dashboard/softwares/components/product/sections/productDetails/overViewTab/VideoPlayer';
import { useProductContext } from '@src/domains/dashboard/softwares/contexts/ProductContext';

vi.mock('@src/domains/dashboard/softwares/contexts/ProductContext', () => ({
    useProductContext: vi.fn(),
}));
vi.mock('react-player', () => ({ default: () => <div data-testid="player" /> }));

const mockedUseProductContext = vi.mocked(useProductContext);

describe('VideoPlayer', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return null when product is null', () => {
        mockedUseProductContext.mockReturnValue({ product: null, isLoading: false } as any);
        const { container } = render(<VideoPlayer />);
        expect(container.firstChild).toBeNull();
    });

    it('should render without crashing when videos exist', () => {
        mockedUseProductContext.mockReturnValue({
            isLoading: false,
            product: { videos: ['https://youtube.com/watch?v=abc'] },
            playingVideoIndex: null,
            setPlayingVideoIndex: vi.fn(),
        } as any);
        const { container } = render(<VideoPlayer />);
        expect(container).toBeTruthy();
    });
});
