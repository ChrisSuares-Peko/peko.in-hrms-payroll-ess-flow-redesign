import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import KybLanding from '../../../../components/kyb/admin/KybLanding';
import { KYB_LANDING, KYB_LANDING_FEATURES } from '../../../../utils/kybData';

describe('KybLanding', () => {
    it('renders the badge, headline and the value proposition', () => {
        render(<KybLanding onGetStarted={vi.fn()} />);

        expect(screen.getByText(KYB_LANDING.badge)).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: KYB_LANDING.title })).toBeInTheDocument();
        expect(screen.getByText(KYB_LANDING.description)).toBeInTheDocument();
    });

    it('renders every feature with its title and description', () => {
        render(<KybLanding onGetStarted={vi.fn()} />);

        expect(KYB_LANDING_FEATURES.length).toBeGreaterThan(0);
        KYB_LANDING_FEATURES.forEach(feature => {
            expect(screen.getByText(feature.title)).toBeInTheDocument();
            expect(screen.getByText(feature.description)).toBeInTheDocument();
        });
    });

    it('sets how long verification takes, and that it is one-off', () => {
        render(<KybLanding onGetStarted={vi.fn()} />);

        expect(screen.getByText(KYB_LANDING.footerNote)).toBeInTheDocument();
    });

    it('calls onGetStarted when the CTA is clicked', () => {
        const onGetStarted = vi.fn();
        render(<KybLanding onGetStarted={onGetStarted} />);

        fireEvent.click(screen.getByRole('button', { name: KYB_LANDING.ctaLabel }));

        expect(onGetStarted).toHaveBeenCalledTimes(1);
    });

    describe('the feature grid', () => {
        const cards = () =>
            Array.from(document.querySelectorAll('img[aria-hidden]')).map(
                img => img.closest('div[class*="min-h-"]') as HTMLElement
            );

        it('centres a part-filled last row instead of leaving a gap', () => {
            render(<KybLanding onGetStarted={vi.fn()} />);

            const row = cards()[0].parentElement;
            expect(row?.className).toContain('flex-wrap');
            expect(row?.className).toContain('justify-center');
        });

        it('keeps three cards a row on wide screens and two on tablet', () => {
            render(<KybLanding onGetStarted={vi.fn()} />);

            cards().forEach(card => {
                expect(card.className).toContain('w-full');
                expect(card.className).toContain('sm:w-[calc(50%-0.625rem)]');
                expect(card.className).toContain('xl:w-[calc(33.333%-1.167rem)]');
            });
        });
    });

    describe('illustrations', () => {
        const artwork = () =>
            Array.from(document.querySelectorAll('img')).filter(img =>
                img.hasAttribute('aria-hidden')
            );

        const tiltedCard = () =>
            document.querySelector('img[aria-hidden][class*="rotate"]') as HTMLImageElement | null;

        const centredArtwork = () => artwork().filter(img => img !== tiltedCard());

        it('renders one exported illustration per feature', () => {
            render(<KybLanding onGetStarted={vi.fn()} />);

            expect(artwork()).toHaveLength(KYB_LANDING_FEATURES.length);
        });

        // Each illustration was exported at its own geometry; one shared width would stretch five of six.
        it('gives each centred illustration its own designed width', () => {
            render(<KybLanding onGetStarted={vi.fn()} />);

            const widths = centredArtwork().map(img => img.style.width);
            expect(widths).toEqual(
                KYB_LANDING_FEATURES.filter(f => !f.media).map(f => `${f.imageWidth}px`)
            );
            expect(new Set(widths).size).toBeGreaterThan(1);
        });

        it('never lets a centred illustration overflow its card', () => {
            render(<KybLanding onGetStarted={vi.fn()} />);

            centredArtwork().forEach(img => {
                expect(img.className).toContain('max-w-full');
                expect(img.className).toContain('h-auto');
            });
        });

        // Decorative product mock-ups: announcing six of them would bury the actual copy.
        describe('the Virtual & Physical Cards mock-up', () => {
            it('is tilted and shadowed as designed', () => {
                render(<KybLanding onGetStarted={vi.fn()} />);

                const card = tiltedCard();
                expect(card?.className).toContain('-rotate-[7.73deg]');
                expect(card?.className).toContain('drop-shadow-[0_4px_4px_rgba(0,0,0,0.25)]');
            });

            it('uses a shadow that follows the card, not a box around it', () => {
                render(<KybLanding onGetStarted={vi.fn()} />);

                expect(tiltedCard()?.className).not.toMatch(/(^|\s)shadow-\[/);
            });

            it('is placed in fixed pixels so the crop cannot change with the viewport', () => {
                render(<KybLanding onGetStarted={vi.fn()} />);

                const card = tiltedCard();
                expect(card?.className).toContain('w-[167px]');
                expect(card?.className).toContain('right-[14px]');
                expect(card?.className).toContain('top-[119px]');
                expect(card?.className).not.toMatch(/w-\[\d+%\]/);
            });

            it('carries no inline width, unlike the centred illustrations', () => {
                render(<KybLanding onGetStarted={vi.fn()} />);

                expect(tiltedCard()?.style.width).toBe('');
            });
        });

        it('hides the decorative illustrations from assistive tech', () => {
            render(<KybLanding onGetStarted={vi.fn()} />);

            artwork().forEach(img => expect(img).toHaveAttribute('alt', ''));
        });
    });
});
