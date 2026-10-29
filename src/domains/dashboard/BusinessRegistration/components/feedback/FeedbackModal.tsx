import { useState } from 'react';

import { Grid, Modal, Typography } from 'antd';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import RatingScale from './RatingScale';
import { submitFeedback } from '../../api';
import sendIcon from '../../assets/feedback/send.svg';

const { Text } = Typography;

const initials = (name: string) =>
    name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map(w => w[0]?.toUpperCase())
        .join('') || '?';

interface FeedbackModalProps {
    open: boolean;
    rmName: string;
    rmRole: string;
    serviceName: string;
    applicationId: string;
    engagementId: number | string;
    onSubmitted: () => void; // successful submit → continue leaving
    onSkip: () => void; // "Back" → leave without feedback
    onCancel: () => void; // unreachable (forced prompt)
}

// RM feedback modal (Figma 3948:30758). Rating is mandatory; the note optional.
const FeedbackModal = ({
    open,
    rmName,
    rmRole,
    serviceName,
    applicationId,
    engagementId,
    onSubmitted,
    onSkip,
    onCancel,
}: FeedbackModalProps) => {
    const dispatch = useAppDispatch();
    const { id: userId, role: userType } = useAppSelector(state => state.reducer.auth);
    const screens = Grid.useBreakpoint();
    const [rating, setRating] = useState<number | null>(null);
    const [feedback, setFeedback] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const displayName = rmName.toUpperCase();

    const handleSubmit = async () => {
        if (!rating) {
            dispatch(
                showToast({
                    description: 'Please select a rating before submitting.',
                    variant: 'error',
                })
            );
            return;
        }
        setSubmitting(true);
        const res = await submitFeedback({
            userId: Number(userId),
            userType: userType ?? '',
            applicationId,
            engagementId,
            rating,
            feedback: feedback.trim(),
            deviceType: screens.md ? 'desktop' : 'mobile',
        });
        setSubmitting(false);
        if (!res) {
            dispatch(
                showToast({
                    description: 'Could not submit your feedback. Please try again.',
                    variant: 'error',
                })
            );
            return;
        }
        dispatch(
            showToast({
                description: 'Thank you! Your feedback has been submitted.',
                variant: 'success',
            })
        );
        onSubmitted();
    };

    return (
        <Modal
            open={open}
            onCancel={onCancel}
            footer={null}
            closable={false}
            // Forced prompt — closes only via Back/Submit, not mask or ESC.
            maskClosable={false}
            keyboard={false}
            centered
            width={565}
            styles={{ content: { padding: 0, borderRadius: 32, overflow: 'hidden' } }}
        >
            <div
                className="flex flex-col items-center gap-8 px-8 pt-8 pb-6"
                style={{
                    backgroundImage:
                        'linear-gradient(180deg, rgba(255,79,79,0.14) 0%, rgba(255,255,255,0) 42%)',
                }}
            >
                <div className="flex flex-col items-center gap-3 w-full">
                    <div className="flex flex-col items-center gap-3">
                        <div className="size-[89px] rounded-full bg-white border-[1.35px] border-[#fde4e4] flex items-center justify-center">
                            <span className="text-[28px] font-semibold text-[#ff4f4f]">
                                {initials(rmName)}
                            </span>
                        </div>
                        <div className="flex flex-col items-center gap-1 text-center">
                            <Text className="!text-[22px] !font-medium !text-[#212121] !leading-none">
                                {rmName}
                            </Text>
                            <Text className="!text-[16px] !text-[#686868] !leading-none">
                                {rmRole}
                            </Text>
                        </div>
                    </div>
                    <div className="h-px w-full bg-[#ececec]" />
                    <p className="text-[18px] leading-[27px] text-black text-center">
                        How would you rate your experience with{' '}
                        <span className="text-[#ff4f4f] font-medium">{displayName}</span> for{' '}
                        <span className="text-[#ff4f4f]">{serviceName}?</span>
                    </p>
                </div>

                <RatingScale value={rating} onChange={setRating} />

                <div className="flex flex-col gap-6 w-full">
                    <div className="flex flex-col gap-2 w-full">
                        <Text className="!text-[14px] !text-[#334155]">Feedback</Text>
                        <textarea
                            value={feedback}
                            onChange={e => setFeedback(e.target.value)}
                            placeholder={`“What can ${displayName} do to further improve their performance?” (optional)`}
                            rows={3}
                            className="w-full resize-none rounded-[8px] border border-[#e2e8f0] px-4 py-3 text-[14px] text-[#334155] leading-[20px] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#ff4f4f]"
                        />
                    </div>
                    <div className="flex items-center justify-between gap-3">
                        <button
                            type="button"
                            onClick={onSkip}
                            className="h-[48px] px-6 rounded-[8px] border border-[#ff4f4f] text-[16px] text-[#ff4f4f] hover:bg-[#fff5f5] transition-colors"
                        >
                            Back
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="h-[48px] px-6 rounded-[8px] bg-[#ff4f4f] text-white text-[16px] font-medium flex items-center gap-2 hover:bg-[#e64444] transition-colors disabled:opacity-60"
                        >
                            <img src={sendIcon} alt="" className="w-5 h-5" />
                            {submitting ? 'Submitting…' : 'Submit Feedback'}
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default FeedbackModal;
