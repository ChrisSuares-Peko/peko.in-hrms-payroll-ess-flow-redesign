import { partnerLabel } from '@src/domains/admin/accounting/utils/approvals';
import { joinNames, plural } from '@src/domains/admin/accounting/utils/text';

import {
    ClassificationOption,
    ClassificationPartner,
    ClassifyServiceResult,
    ServiceClassification,
    ServiceClassificationFilter,
    ServiceClassificationTab,
} from '../types/serviceClassification';

export const NONE_VALUE = 'none';

export const CLASSIFICATION_TABS: ServiceClassificationTab[] = [
    'with_plans',
    'without_plans',
    'peko_subscription',
    'peko_subscription_vendor',
];

export const CLASSIFICATION_LABELS = {
    with_plans: 'Vendor service with plans',
    without_plans: 'Vendor service without plans',
    peko_subscription: 'Peko’s own service subscription',
    peko_subscription_vendor: 'Peko Subscription Providing Vendors',
    [NONE_VALUE]: 'Not classified',
} as const;

const IN_A_SENTENCE: Record<ServiceClassificationTab, { one: string; many: string }> = {
    with_plans: { one: 'a vendor service with plans', many: 'vendor services with plans' },
    without_plans: { one: 'a vendor service without plans', many: 'vendor services without plans' },
    peko_subscription: {
        one: 'one of Peko’s own service subscriptions',
        many: 'Peko’s own service subscriptions',
    },
    peko_subscription_vendor: {
        one: 'a vendor providing a Peko subscription',
        many: 'vendors providing a Peko subscription',
    },
};

export const classificationInSentence = (planType: ServiceClassificationTab, count = 1) =>
    count === 1 ? IN_A_SENTENCE[planType].one : IN_A_SENTENCE[planType].many;

export const CLASSIFICATION_OPTIONS = [
    { value: NONE_VALUE, label: CLASSIFICATION_LABELS.none },
    ...CLASSIFICATION_TABS.map(tab => ({ value: tab, label: CLASSIFICATION_LABELS[tab] })),
];

export const FILTER_OPTIONS: { value: ServiceClassificationFilter; label: string }[] = [
    { value: 'all', label: 'All services' },
    { value: 'unclassified', label: 'Not classified' },
    ...CLASSIFICATION_TABS.map(tab => ({ value: tab, label: CLASSIFICATION_LABELS[tab] })),
];

export const NO_PERMISSION_TEXT = 'Sorry, you do not have permission to perform this action';

export const needsApproval = (planType: ServiceClassification) =>
    planType === 'with_plans' || planType === 'without_plans';

type UngatedTab = Exclude<ServiceClassificationTab, 'with_plans' | 'without_plans'>;

type UngatedNote = { one: string; many: string; move: string; remove: string };

const UNGATED_NOTES: Record<UngatedTab, UngatedNote> = {
    peko_subscription: {
        one: 'Its packages are priced under Peko Subscriptions in the Accounting portal, and it needs no accounting approval.',
        many: 'Their packages are priced under Peko Subscriptions in the Accounting portal, and they need no accounting approval.',
        move: 'It will no longer need accounting approval, and its packages are priced under Peko Subscriptions; earlier decisions are kept.',
        remove: 'Its packages will no longer be listed under Peko Subscriptions.',
    },
    peko_subscription_vendor: {
        one: 'Its vendor is listed under Vendors in the Accounting portal for deposits and the other entries recorded by hand; its orders stay off the vendor ledger, and it needs no accounting approval.',
        many: 'Their vendors are listed under Vendors in the Accounting portal for deposits and the other entries recorded by hand; their orders stay off the vendor ledger, and they need no accounting approval.',
        move: 'It will no longer need accounting approval; its vendor is listed under Vendors in the Accounting portal, and earlier decisions are kept.',
        remove: 'Its vendor will no longer be listed under Vendors in the Accounting portal unless another of its services is classified.',
    },
};

const ungatedNoteOf = (planType: ServiceClassificationTab): UngatedNote | null =>
    planType === 'with_plans' || planType === 'without_plans' ? null : UNGATED_NOTES[planType];

export const toSelectValue = (planType: ServiceClassification) => planType ?? NONE_VALUE;

export const fromSelectValue = (value: string): ServiceClassification =>
    CLASSIFICATION_TABS.find(tab => tab === value) ?? null;

export const classificationLabel = (planType: ServiceClassification) =>
    CLASSIFICATION_LABELS[planType ?? NONE_VALUE];

export const liveForLabel = (liveFor: ClassificationPartner[]) =>
    liveFor.length
        ? `Live for ${liveFor.length} ${plural(liveFor.length, 'partner', 'partners')}`
        : '—';

export const liveForNames = (liveFor: ClassificationPartner[]) =>
    liveFor.map(partner => partnerLabel(partner));

export const confirmLiveText = (serviceProvider: string, liveFor: ClassificationPartner[]) =>
    `${serviceProvider} is live for ${liveFor.length} ${plural(liveFor.length, 'partner', 'partners')} (${joinNames(
        liveForNames(liveFor)
    )}). Classifying it approves it for them straight away so nothing goes offline. Continue?`;

const decisionsNote = (skipped: string[]) =>
    ` ${joinNames(skipped)} already had a decision and ${
        skipped.length === 1 ? 'was left as it is' : 'were left as they are'
    }.`;

export const describeClassifyResult = (
    serviceProvider: string,
    result: ClassifyServiceResult
): { description: string; variant: 'success' | 'warning' | 'info' } => {
    if (!result.changed) {
        return {
            description: `${serviceProvider} already had this classification.`,
            variant: 'info',
        };
    }
    if (!result.planType) {
        return {
            description: `${serviceProvider} is no longer classified. It needs no accounting approval and is never hidden from corporates.`,
            variant: 'success',
        };
    }

    const moved = `${serviceProvider} is now ${classificationInSentence(result.planType)}.`;
    const note = ungatedNoteOf(result.planType);
    if (note) {
        return { description: `${moved} ${note.one}`, variant: 'success' };
    }
    if (needsApproval(result.previousPlanType)) return { description: moved, variant: 'success' };

    const approved = liveForNames(result.autoApproved);
    const skipped = liveForNames(result.skipped);
    let description = approved.length
        ? `${moved} Approved automatically for ${joinNames(approved)} so nothing goes offline.`
        : `${moved} It is pending approval in the Accounting portal.`;
    if (skipped.length) description += decisionsNote(skipped);
    return { description, variant: skipped.length ? 'warning' : 'success' };
};

export const TAB_LABELS: Record<ServiceClassificationTab, string> = {
    with_plans: CLASSIFICATION_LABELS.with_plans,
    without_plans: CLASSIFICATION_LABELS.without_plans,
    peko_subscription: CLASSIFICATION_LABELS.peko_subscription,
    peko_subscription_vendor: CLASSIFICATION_LABELS.peko_subscription_vendor,
};

export const otherTabs = (tab: ServiceClassificationTab): ServiceClassificationTab[] =>
    CLASSIFICATION_TABS.filter(candidate => candidate !== tab);

const isAre = (count: number) => (count === 1 ? 'is' : 'are');

export const liveOptionsTitle = (live: ClassificationOption[]) =>
    `${joinNames(live.map(option => option.serviceProvider))} ${isAre(live.length)} already live for partners`;

export const confirmLiveOptionsText = (live: ClassificationOption[]) =>
    `${liveOptionsTitle(live)} (${joinNames([
        ...new Set(live.flatMap(option => liveForNames(option.liveFor))),
    ])}). Classifying ${live.length === 1 ? 'it approves it' : 'them approves them'} for those partners straight away so nothing goes offline. Continue?`;

export const confirmMoveText = (
    serviceProvider: string,
    planType: ServiceClassificationTab,
    from: ServiceClassificationTab
) => {
    const question = `Move ${serviceProvider} to ${TAB_LABELS[planType]}?`;
    const note = ungatedNoteOf(planType);
    if (note) {
        return `${question} ${note.move}`;
    }
    if (!needsApproval(from)) {
        return `${question} It will need accounting approval; partners already using it are approved straight away so nothing goes offline.`;
    }
    return `${question} Its approvals are kept as they are.`;
};

export const confirmRemoveText = (serviceProvider: string, from: ServiceClassificationTab) => {
    const note = ungatedNoteOf(from);
    return note
        ? `Remove the classification of ${serviceProvider}? ${note.remove}`
        : `Remove the classification of ${serviceProvider}? It will no longer need accounting approval and is never hidden from corporates; earlier decisions are kept.`;
};

export const describeClassifyServicesResult = (
    planType: ServiceClassificationTab,
    results: ClassifyServiceResult[],
    nameOf: (accessKey: string) => string
): { description: string; variant: 'success' | 'warning' | 'info' } => {
    const changed = results.filter(result => result.changed);
    if (!changed.length) {
        return {
            description: 'Every selected service already had this classification.',
            variant: 'info',
        };
    }

    const names = changed.map(result => nameOf(result.accessKey));
    let description = `${joinNames(names)} ${isAre(names.length)} now ${classificationInSentence(planType, names.length)}.`;
    const note = ungatedNoteOf(planType);
    if (note) {
        return {
            description: `${description} ${names.length === 1 ? note.one : note.many}`,
            variant: 'success',
        };
    }

    const approved = [...new Set(changed.flatMap(result => liveForNames(result.autoApproved)))];
    const skipped = [...new Set(changed.flatMap(result => liveForNames(result.skipped)))];
    const newlyGated = changed.some(result => !needsApproval(result.previousPlanType));
    if (approved.length) {
        description += ` Approved automatically for ${joinNames(approved)} so nothing goes offline.`;
    } else if (newlyGated) {
        description += ' Pending approval in the Accounting portal.';
    }
    if (skipped.length) description += decisionsNote(skipped);
    return { description, variant: skipped.length ? 'warning' : 'success' };
};
