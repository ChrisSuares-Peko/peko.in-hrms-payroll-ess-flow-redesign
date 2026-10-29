import { useLocation, useNavigate } from 'react-router-dom';

import { paths } from '@src/routes/paths';

import { useRecurringDetail } from './useRecurringDetail';
import { freqTextFromApi } from '../../../utils/recurrenceEngine';

export const useRecurringViewPage = () => {
    const navigate = useNavigate();
    const { state } = useLocation();

    const recurringId: string | null = state?.id != null ? String(state.id) : null;

    const { schedule, isLoading, isActioning, handlePause, handleResume, handleEnd } =
        useRecurringDetail(recurringId);

    const backToList = () => navigate(`/${paths.invoice.index}/${paths.invoice.recurring}`);

    const isActive = schedule?.status === 'ACTIVE';
    const isPaused = schedule?.status === 'PAUSED';
    const isEnded = schedule?.status === 'ENDED';

    const subtitle = schedule
        ? [
              schedule.sourceInvoice?.name ? `${schedule.sourceInvoice.name} · ` : '',
              freqTextFromApi(schedule.frequency),
          ].join('')
        : '';

    return {
        recurringId,
        schedule,
        isLoading,
        isActioning,
        isActive,
        isPaused,
        isEnded,
        subtitle,
        backToList,
        handlePause,
        handleResume,
        handleEnd,
    };
};
