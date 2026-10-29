import { useCallback, useContext, useEffect, useRef, useState } from 'react';

import { UNSAFE_NavigationContext } from 'react-router-dom';

import { ApplicationStatus } from '../../api';

const ENTITY_SERVICE_LABELS: Record<string, string> = {
    proprietorship: 'Proprietorship Registration',
    partnership: 'Partnership Firm Registration',
    opc: 'One Person Company (OPC) Registration',
    private_limited: 'Private Limited Company Registration',
    llp: 'Limited Liability Partnership (LLP) Registration',
};

const rmNameOf = (status: ApplicationStatus | null) => {
    const rm = status?.engagement?.rm;
    return rm && rm !== 'Unassigned' ? rm : 'your Relationship Manager';
};

type HistoryNav = {
    push: (...args: unknown[]) => void;
    replace: (...args: unknown[]) => void;
};

// Feedback modal on exit from an incorporated application's tracking page.
// useBlocker is unavailable here (BrowserRouter, not a data router), so we patch
// the history navigator to catch in-app navigation.
export const useExitFeedback = (status: ApplicationStatus | null) => {
    const navigator = useContext(UNSAFE_NavigationContext).navigator as unknown as HistoryNav;
    const eid = status?.engagement?.eid;
    const [open, setOpen] = useState(false);
    const [handled, setHandled] = useState(false);
    const pendingRef = useRef<(() => void) | null>(null);

    const armed = Boolean(status?.srn && eid) && !handled && !status?.feedbackGiven;
    const armedRef = useRef(armed);
    armedRef.current = armed;

    useEffect(() => {
        if (!armed) return undefined;
        const nav = navigator;
        const origPush = nav.push;
        const origReplace = nav.replace;
        let bypass = false;
        const guard =
            (orig: HistoryNav['push']) =>
            (...args: unknown[]) => {
                if (bypass || !armedRef.current) {
                    orig.apply(nav, args);
                    return;
                }
                // Hold the attempted navigation and ask for feedback first.
                pendingRef.current = () => {
                    bypass = true;
                    orig.apply(nav, args);
                    bypass = false;
                };
                setOpen(true);
            };
        nav.push = guard(origPush);
        nav.replace = guard(origReplace);
        return () => {
            nav.push = origPush;
            nav.replace = origReplace;
        };
    }, [armed, navigator]);

    // Browser Back fires POP (not the navigator patch above) — keep a sentinel
    // entry so a POP lands back here; leaving for real jumps past both.
    useEffect(() => {
        if (!armed) return undefined;
        // Duplicate the current entry, preserving react-router's history state.
        const trap = () => window.history.pushState(window.history.state, '');
        trap();
        const onPopState = () => {
            if (!armedRef.current) return;
            trap();
            pendingRef.current = () => window.history.go(-2);
            setOpen(true);
        };
        window.addEventListener('popstate', onPopState);
        return () => window.removeEventListener('popstate', onPopState);
    }, [armed]);

    // Disarm, then run the held navigation next tick (after the guard tears down).
    const proceed = useCallback(() => {
        setOpen(false);
        setHandled(true);
        const go = pendingRef.current;
        pendingRef.current = null;
        setTimeout(() => go?.(), 0);
    }, []);

    // Persistence is server-side (BE sets feedbackGiven) — just proceed.
    const onSubmitted = useCallback(() => proceed(), [proceed]);

    const onSkip = useCallback(() => proceed(), [proceed]);

    // Cancel (unreachable while the modal is a forced prompt — mask/ESC disabled).
    const onCancel = useCallback(() => {
        setOpen(false);
        setHandled(true);
        pendingRef.current = null;
    }, []);

    return {
        open,
        rmName: rmNameOf(status),
        rmRole: status?.engagement?.rm_role || 'Relationship Manager',
        serviceName: ENTITY_SERVICE_LABELS[status?.entityType ?? ''] ?? 'your registration',
        applicationId: status?.applicationId ?? '',
        engagementId: eid ?? '',
        onSubmitted,
        onSkip,
        onCancel,
    };
};
