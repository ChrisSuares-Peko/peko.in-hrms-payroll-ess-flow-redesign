import { useEffect, useRef } from 'react';

import { PARTNER_DUTIES, PARTNER_RIGHTS } from './constants';
import { ISection } from '../../../../../types/forms';
import { useCustomSectionFields } from '../../useCustomSectionFields';

export type LlpChoice = 'standard' | 'custom';

// LLP Agreement selections, backed by the section's real fields so they persist and
// submit via the normal field-value path.
export function useLlpAgreement(section: ISection, instancePath: string) {
    const { get, set, error } = useCustomSectionFields(section, instancePath);
    const seeded = useRef(false);

    // Seed defaults on first mount when uninitialized (sentinel: meeting_quorum).
    // generateDefaultValues only stamps defaults the saved field carries; this keeps
    // the live UI correct for sections provisioned before the defaults existed.
    useEffect(() => {
        if (seeded.current) return;
        seeded.current = true;
        // Required choice field must never be empty (oneOf) — seed it whenever unset,
        // even on a partially-saved draft that the group sentinel below would skip.
        if (!get('llp_type')) set('llp_type', 'standard');
        if (get('meeting_quorum')) return;
        set('total_capital', '100000');
        set('meeting_quorum', '2');
        set('voting_threshold', 'simple_majority');
        set('dispute_method', 'arbitration');
        PARTNER_RIGHTS.forEach(r => set(`right_${r.key}`, r.default));
        PARTNER_DUTIES.forEach(d => set(`duty_${d.key}`, d.default));
    });

    const rights = PARTNER_RIGHTS.filter(r => !!get(`right_${r.key}`)).map(r => r.key);
    const duties = PARTNER_DUTIES.filter(d => !!get(`duty_${d.key}`)).map(d => d.key);

    return {
        llpType: (get('llp_type') as LlpChoice) || 'standard',
        setLlpType: (v: LlpChoice) => set('llp_type', v),
        totalCapital: (get('total_capital') as string) ?? '',
        setTotalCapital: (v: string) => set('total_capital', v),
        rights,
        toggleRight: (key: string) => set(`right_${key}`, !get(`right_${key}`)),
        duties,
        toggleDuty: (key: string) => set(`duty_${key}`, !get(`duty_${key}`)),
        meetingQuorum: (get('meeting_quorum') as string) || '2',
        setMeetingQuorum: (v: string) => set('meeting_quorum', v),
        votingThreshold: (get('voting_threshold') as string) || 'simple_majority',
        setVotingThreshold: (v: string) => set('voting_threshold', v),
        disputeMethod: (get('dispute_method') as string) || 'arbitration',
        setDisputeMethod: (v: string) => set('dispute_method', v),
        jurisdiction: (get('jurisdiction') as string) ?? '',
        setJurisdiction: (v: string) => set('jurisdiction', v),
        jurisdictionError: error('jurisdiction'),
        customLlpFile: get('custom_llp_file'),
        setCustomLlpFile: (file: File | undefined) => set('custom_llp_file', file),
        customLlpFileError: error('custom_llp_file'),
        confirmed: !!get('confirmed'),
        setConfirmed: (v: boolean) => set('confirmed', v),
        confirmedError: error('confirmed'),
    };
}

export type LlpAgreementController = ReturnType<typeof useLlpAgreement>;
