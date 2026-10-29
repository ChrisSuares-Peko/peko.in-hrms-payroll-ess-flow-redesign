import { describe, expect, it } from 'vitest';

import { ClassifyServiceResult } from '../../types/serviceClassification';
import {
    FILTER_OPTIONS,
    confirmLiveText,
    confirmMoveText,
    confirmRemoveText,
    describeClassifyResult,
    describeClassifyServicesResult,
    fromSelectValue,
    liveForLabel,
    toSelectValue,
} from '../../utils/serviceClassification';

const result = (overrides: Partial<ClassifyServiceResult>): ClassifyServiceResult => ({
    accessKey: 'soundbox',
    planType: 'with_plans',
    previousPlanType: null,
    changed: true,
    autoApproved: [],
    skipped: [],
    ...overrides,
});

const DEFAULT = { partnerPermissionId: 1, partnerName: null };
const GULF = { partnerPermissionId: 12, partnerName: 'Gulf Reach' };

describe('select values', () => {
    it('round-trips the three classifications through the select', () => {
        expect(toSelectValue(null)).toBe('none');
        expect(toSelectValue('with_plans')).toBe('with_plans');
        expect(fromSelectValue('none')).toBeNull();
        expect(fromSelectValue('without_plans')).toBe('without_plans');
        expect(fromSelectValue('peko_subscription')).toBe('peko_subscription');
        expect(fromSelectValue('anything')).toBeNull();
        expect(FILTER_OPTIONS.map(option => option.value)).toEqual([
            'all',
            'unclassified',
            'with_plans',
            'without_plans',
            'peko_subscription',
            'peko_subscription_vendor',
        ]);
    });
});

describe('vendors providing a Peko subscription', () => {
    it('says the vendor is listed under Vendors and that nothing needs approval', () => {
        expect(
            describeClassifyResult(
                'Peko POS',
                result({ planType: 'peko_subscription_vendor', previousPlanType: null })
            )
        ).toEqual({
            description:
                'Peko POS is now a vendor providing a Peko subscription. Its vendor is listed under Vendors in the Accounting portal for deposits and the other entries recorded by hand; its orders stay off the vendor ledger, and it needs no accounting approval.',
            variant: 'success',
        });
        expect(
            describeClassifyServicesResult(
                'peko_subscription_vendor',
                [
                    result({ accessKey: 'peko_pos', planType: 'peko_subscription_vendor' }),
                    result({ accessKey: 'soundbox', planType: 'peko_subscription_vendor' }),
                ],
                key => (key === 'soundbox' ? 'Soundbox' : 'Peko POS')
            ).description
        ).toBe(
            'Peko POS and Soundbox are now vendors providing a Peko subscription. Their vendors are listed under Vendors in the Accounting portal for deposits and the other entries recorded by hand; their orders stay off the vendor ledger, and they need no accounting approval.'
        );
    });

    it('words a move into or out of the class, and its removal', () => {
        expect(confirmMoveText('Peko POS', 'peko_subscription_vendor', 'without_plans')).toBe(
            'Move Peko POS to Peko Subscription Providing Vendors? It will no longer need accounting approval; its vendor is listed under Vendors in the Accounting portal, and earlier decisions are kept.'
        );
        expect(confirmMoveText('Peko POS', 'with_plans', 'peko_subscription_vendor')).toBe(
            'Move Peko POS to Vendor service with plans? It will need accounting approval; partners already using it are approved straight away so nothing goes offline.'
        );
        expect(confirmRemoveText('Peko POS', 'peko_subscription_vendor')).toBe(
            'Remove the classification of Peko POS? Its vendor will no longer be listed under Vendors in the Accounting portal unless another of its services is classified.'
        );
    });
});

describe('live partners', () => {
    it('counts the partners a service is switched on for', () => {
        expect(liveForLabel([])).toBe('—');
        expect(liveForLabel([DEFAULT])).toBe('Live for 1 partner');
        expect(liveForLabel([DEFAULT, GULF])).toBe('Live for 2 partners');
        expect(confirmLiveText('Soundbox', [DEFAULT, GULF])).toBe(
            'Soundbox is live for 2 partners (Peko (Default) and Gulf Reach). Classifying it approves it for them straight away so nothing goes offline. Continue?'
        );
    });
});

describe('describeClassifyResult', () => {
    it('explains an unchanged, an unclassified and a moved service', () => {
        expect(describeClassifyResult('Soundbox', result({ changed: false }))).toEqual({
            description: 'Soundbox already had this classification.',
            variant: 'info',
        });
        expect(
            describeClassifyResult(
                'Soundbox',
                result({ planType: null, previousPlanType: 'with_plans' })
            )
        ).toEqual({
            description:
                'Soundbox is no longer classified. It needs no accounting approval and is never hidden from corporates.',
            variant: 'success',
        });
        expect(
            describeClassifyResult(
                'Soundbox',
                result({ planType: 'without_plans', previousPlanType: 'with_plans' })
            )
        ).toEqual({
            description: 'Soundbox is now a vendor service without plans.',
            variant: 'success',
        });
    });

    it('says whether a newly classified service is pending or was approved where it is live', () => {
        expect(describeClassifyResult('Soundbox', result({}))).toEqual({
            description:
                'Soundbox is now a vendor service with plans. It is pending approval in the Accounting portal.',
            variant: 'success',
        });
        expect(
            describeClassifyResult('Soundbox', result({ autoApproved: [DEFAULT, GULF] }))
        ).toEqual({
            description:
                'Soundbox is now a vendor service with plans. Approved automatically for Peko (Default) and Gulf Reach so nothing goes offline.',
            variant: 'success',
        });
        expect(
            describeClassifyResult(
                'Soundbox',
                result({
                    autoApproved: [DEFAULT],
                    skipped: [{ ...GULF, code: 'EXISTS', status: 'REJECTED' }],
                })
            )
        ).toEqual({
            description:
                'Soundbox is now a vendor service with plans. Approved automatically for Peko (Default) so nothing goes offline. Gulf Reach already had a decision and was left as it is.',
            variant: 'warning',
        });
    });
});

describe('Peko’s own service subscriptions', () => {
    it('names the service as Peko’s own and says it needs no approval', () => {
        expect(
            describeClassifyResult(
                'Peko Commerce',
                result({ planType: 'peko_subscription', previousPlanType: null })
            )
        ).toEqual({
            description:
                'Peko Commerce is now one of Peko’s own service subscriptions. Its packages are priced under Peko Subscriptions in the Accounting portal, and it needs no accounting approval.',
            variant: 'success',
        });
    });

    it('treats a move from Peko’s own into a vendor class as a fresh approval', () => {
        expect(
            describeClassifyResult(
                'Peko Commerce',
                result({ previousPlanType: 'peko_subscription', autoApproved: [GULF] })
            ).description
        ).toBe(
            'Peko Commerce is now a vendor service with plans. Approved automatically for Gulf Reach so nothing goes offline.'
        );
    });

    it('words the bulk result and the row confirmations for each direction', () => {
        expect(
            describeClassifyServicesResult(
                'peko_subscription',
                [
                    result({ accessKey: 'ecommerce_store', planType: 'peko_subscription' }),
                    result({ accessKey: 'whatsapp', planType: 'peko_subscription' }),
                ],
                key => (key === 'whatsapp' ? 'WhatsApp' : 'Peko Commerce')
            ).description
        ).toBe(
            'Peko Commerce and WhatsApp are now Peko’s own service subscriptions. Their packages are priced under Peko Subscriptions in the Accounting portal, and they need no accounting approval.'
        );
        expect(confirmMoveText('Peko Commerce', 'with_plans', 'peko_subscription')).toBe(
            'Move Peko Commerce to Vendor service with plans? It will need accounting approval; partners already using it are approved straight away so nothing goes offline.'
        );
        expect(confirmMoveText('Visa', 'peko_subscription', 'without_plans')).toContain(
            'It will no longer need accounting approval'
        );
        expect(confirmMoveText('Visa', 'with_plans', 'without_plans')).toBe(
            'Move Visa to Vendor service with plans? Its approvals are kept as they are.'
        );
        expect(confirmRemoveText('Peko Commerce', 'peko_subscription')).toBe(
            'Remove the classification of Peko Commerce? Its packages will no longer be listed under Peko Subscriptions.'
        );
    });
});
