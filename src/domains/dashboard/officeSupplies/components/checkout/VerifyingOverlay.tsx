import type { FC } from 'react';

import { createPortal } from 'react-dom';
import Lottie from 'react-lottie';

import verifyingLoader from '../../assets/animation/verifyingLoader.json';

const LOADER_OPTIONS = {
    loop: true,
    autoplay: true,
    animationData: verifyingLoader,
    rendererSettings: { preserveAspectRatio: 'xMidYMid meet' },
};

/**
 * Full-viewport blocking overlay for the ONDC /select round-trip (Figma 3868-32019).
 *
 * Verifying the cart with every seller takes up to ~30s. The scrim says the page
 * is busy and swallows stray clicks on the form underneath, so the quote can't be
 * invalidated mid-flight by an edit the buyer makes while waiting.
 *
 * Step 2 (/init, behind "Pay Now") deliberately has no overlay — its progress is
 * carried by the Order summary button's own spinner.
 *
 * Portaled to <body> on purpose. It is rendered from Order summary, whose card
 * carries `drop-shadow-*` — i.e. a `filter`, which makes that card a containing
 * block for `position: fixed` descendants. Rendered in place, `inset-0` would
 * resolve against the summary card and the scrim would cover only the right-hand
 * column instead of the page. Any `transform`/`filter`/`will-change` ancestor
 * would do the same, so the portal is the fix rather than removing one shadow.
 */
const VerifyingOverlay: FC<{ open: boolean; message: string }> = ({ open, message }) => {
    if (!open || typeof document === 'undefined') return null;

    return createPortal(
        <div
            className="fixed inset-0 z-[1000] flex items-center justify-center bg-[rgba(0,0,0,0.4)] px-3"
            role="status"
            aria-live="polite"
        >
            {/*
             * Plain elements, not antd Flex/Typography: antd's own `.ant-typography`
             * colour and size defaults fight the Tailwind utilities at equal
             * specificity, so the pill drifted off the design. This mirrors the
             * Figma node (3868:32398) exactly — 332×64 at the designed 17px.
             */}
            <div className="flex items-center justify-center gap-[10px] rounded-[12px] border-[0.5px] border-solid border-[#b4e8c2] bg-white px-[22px] py-[19px]">
                {/* Decorative — the text and role="status" carry the meaning. */}
                <span aria-hidden className="block h-6 w-6 shrink-0">
                    <Lottie options={LOADER_OPTIONS} width={24} height={24} isClickToPauseDisabled />
                </span>
                {/* No nowrap below sm: the pill is ~373px at the designed 17px, wider
                    than a 360px phone offers, so it was clipped at BOTH edges for the
                    whole ~30s /select wait. Wraps on phones, Figma-exact from sm up. */}
                <p className="m-0 text-[15px] font-medium leading-[1.5] tracking-[0.2975px] text-black sm:whitespace-nowrap sm:text-[17px]">
                    {message}
                </p>
            </div>
        </div>,
        document.body
    );
};

export default VerifyingOverlay;
