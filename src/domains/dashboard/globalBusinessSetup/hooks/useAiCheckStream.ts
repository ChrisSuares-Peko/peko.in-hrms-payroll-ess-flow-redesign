import { useEffect, useRef, useState } from 'react';

import Pusher from 'pusher-js';

import { VITE_PUSHER_APPKEY } from '@src/config-global';

import { SubmitUpdate } from '../types/forms';

export type StepStatus = 'pending' | 'loading' | 'success' | 'error';

export type Step = {
    stage: 'preparing' | 'validating' | 'processing' | 'saving' | 'compliance';
    label: string;
    status: StepStatus;
};

export type AiCheckUpdate = SubmitUpdate;

const STEP_DEFINITIONS: Array<Omit<Step, 'status'>> = [
    { stage: 'preparing', label: 'Preparing your application' },
    { stage: 'validating', label: 'Validating fields' },
    { stage: 'processing', label: 'Uploading documents' },
    { stage: 'saving', label: 'Saving records' },
    { stage: 'compliance', label: 'Compliance screening' },
];

const buildInitialSteps = (): Step[] =>
    STEP_DEFINITIONS.map((s, i) => ({ ...s, status: i === 0 ? 'loading' : 'pending' }));

// Sub-item events advance their parent step to loading but are otherwise
// consumed by useSubmitProgress, not the step machine.
const SUB_STAGE_PARENT: Record<string, Step['stage']> = {
    validating_item: 'validating',
    processing_item: 'processing',
    saving_item: 'saving',
    compliance_check: 'compliance',
};

interface UseAiCheckStreamResult {
    steps: Step[];
    updates: SubmitUpdate[];
    errors: string[];
    isComplete: boolean;
    isFailed: boolean;
    isPending: boolean;
    reset: () => void;
}

export const useAiCheckStream = (
    referenceId: string | null,
    enabled: boolean,
    apiSuccess = false
): UseAiCheckStreamResult => {
    const [steps, setSteps] = useState<Step[]>(buildInitialSteps);
    const [updates, setUpdates] = useState<SubmitUpdate[]>([]);
    const [errors, setErrors] = useState<string[]>([]);
    const [isComplete, setIsComplete] = useState(false);
    const [isFailed, setIsFailed] = useState(false);
    const [isPending, setIsPending] = useState(false);

    const pusherRef = useRef<Pusher | null>(null);
    // Once compliance screening starts, saving-success no longer completes the
    // flow — we wait for the compliance terminal event.
    const complianceStartedRef = useRef(false);

    const reset = () => {
        setSteps(buildInitialSteps());
        setUpdates([]);
        setErrors([]);
        setIsComplete(false);
        setIsFailed(false);
        setIsPending(false);
        complianceStartedRef.current = false;
    };

    useEffect(() => {
        if (!enabled || !referenceId) return () => {};

        // Fresh state on each subscription
        setSteps(buildInitialSteps());
        setUpdates([]);
        setErrors([]);
        setIsComplete(false);
        setIsFailed(false);
        setIsPending(true);
        complianceStartedRef.current = false;

        const pusher = new Pusher(VITE_PUSHER_APPKEY, { cluster: 'ap2' });
        pusherRef.current = pusher;

        const channelName = `global-business-setup-${referenceId}`;
        const channel = pusher.subscribe(channelName);

        const advanceTo = (next: Step[], stage: Step['stage']) => {
            const idx = next.findIndex(s => s.stage === stage);
            if (idx === -1) return;
            next.forEach((s, i) => {
                if (i < idx && s.status !== 'error') s.status = 'success';
            });
            if (next[idx].status !== 'error') next[idx].status = 'loading';
        };

        const handler = (data: SubmitUpdate) => {
            const incoming: SubmitUpdate = {
                ...data,
                stage: data.stage ?? '',
                status: data.status ?? '',
                message: data.message ?? '',
            };

            setUpdates(prev => [...prev, incoming]);

            const subParent = SUB_STAGE_PARENT[incoming.stage];

            if (incoming.stage === 'compliance' || subParent === 'compliance') {
                complianceStartedRef.current = true;
            }

            // Advance the fixed step state based on incoming stage
            setSteps(prev => {
                const next = prev.map(s => ({ ...s }));
                const idxOf = (stage: string) => next.findIndex(s => s.stage === stage);

                if (subParent) {
                    advanceTo(next, subParent);
                } else if (incoming.stage === 'validating') {
                    advanceTo(next, 'validating');
                } else if (incoming.stage === 'validation_failed') {
                    if (idxOf('validating') !== -1) next[idxOf('validating')].status = 'error';
                } else if (incoming.stage === 'processing') {
                    advanceTo(next, 'processing');
                } else if (incoming.stage === 'saving') {
                    advanceTo(next, 'saving');
                } else if (incoming.stage === 'compliance') {
                    advanceTo(next, 'compliance');
                } else if (
                    incoming.stage === 'compliance_flagged' ||
                    incoming.stage === 'compliance_blocked'
                ) {
                    const idx = idxOf('compliance');
                    if (idx !== -1) next[idx].status = 'error';
                }

                return next;
            });

            // Capture errors when status indicates failure
            if (incoming.status === 'error' || incoming.status === 'failed') {
                if (incoming.message) {
                    setErrors(prev => [...prev, incoming.message as string]);
                }
                setIsFailed(true);
                setIsPending(false);

                setSteps(prev =>
                    prev.map(s => (s.status === 'loading' ? { ...s, status: 'error' } : s))
                );
            }

            // Compliance verdicts: flagged/blocked need review — surface as an
            // error-ish stop so the footer renders and auto-continue is held.
            if (
                incoming.stage === 'compliance_flagged' ||
                incoming.stage === 'compliance_blocked'
            ) {
                const verdict =
                    incoming.stage === 'compliance_blocked'
                        ? 'Compliance screening blocked this application.'
                        : 'Compliance screening flagged this application for review.';
                setErrors(prev => [...prev, incoming.message || verdict]);
                setIsFailed(true);
                setIsPending(false);
            }

            // Completion:
            // - compliance success is always terminal
            // - saving success is terminal only when no compliance stage started
            if (
                incoming.stage === 'compliance' &&
                (incoming.status === 'success' ||
                    incoming.status === 'completed' ||
                    incoming.status === 'done')
            ) {
                setSteps(prev =>
                    prev.map(s => (s.status === 'error' ? s : { ...s, status: 'success' }))
                );
                setIsComplete(true);
                setIsPending(false);
            } else if (
                incoming.stage === 'saving' &&
                incoming.status === 'success' &&
                !complianceStartedRef.current
            ) {
                setSteps(prev =>
                    prev.map(s =>
                        s.stage === 'compliance' || s.status === 'error'
                            ? s
                            : { ...s, status: 'success' }
                    )
                );
                setIsComplete(true);
                setIsPending(false);
            }
        };

        channel.bind('ai-check-status', handler);
        // Vendor's richer submit-progress event stream (sub-items) — relayed
        // through our BE on the same channel.
        channel.bind('company_submit_update', handler);

        return () => {
            channel.unbind_all();
            pusher.unsubscribe(channelName);
            pusher.disconnect();
            pusherRef.current = null;
        };
    }, [referenceId, enabled]);

    // Fallback: when the submit API returns successfully, treat that as the
    // definitive "saved" signal — regardless of whether the final Pusher event
    // arrived. Fast-forward any non-errored steps to success. When compliance
    // screening has started, hold completion until its terminal event.
    useEffect(() => {
        if (!enabled || !apiSuccess || isComplete || isFailed) return;
        if (complianceStartedRef.current) return;
        setSteps(prev => prev.map(s => (s.status === 'error' ? s : { ...s, status: 'success' })));
        setIsComplete(true);
        setIsPending(false);
    }, [apiSuccess, enabled, isComplete, isFailed]);

    return { steps, updates, errors, isComplete, isFailed, isPending, reset };
};
