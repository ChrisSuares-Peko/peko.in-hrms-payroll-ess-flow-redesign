/**
 * on_issue ingest, IGM 2.0 and 1.0.
 *
 * The 2.0 fixture is a REAL Workbench callback captured against
 * uatinapi.pekoapp.com (issue 485d1b2a-…, txn 47ea7e53-…). Before this work it
 * ingested as ZERO events and ACKed anyway: the reader looked at
 * `issue_actions.respondent_actions`, which IGM 2.0 does not have, so the buyer's
 * thread stayed empty while the seller had already resolved the complaint.
 */

jest.mock('../../../services/ondcObservability', () => ({
    reportInbound: jest.fn(),
    reportOutbound: jest.fn(),
}));
jest.mock('../../../models/use-cases/ondc_order', () => ({
    updateOndcOrderStatus: jest.fn().mockResolvedValue([1]),
    updateOndcOrderTracking: jest.fn().mockResolvedValue([1]),
    findOndcOrderByTransactionId: jest.fn(),
}));
jest.mock('../../../services/ondcPayoutHold', () => ({
    recordDeliveryAndHoldPayout: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../../../services/ondcReturnLifecycle', () => ({
    applyOndcReturnOnUpdate: jest.fn().mockResolvedValue(null),
}));
jest.mock('../../../services/ondcStatusWaiter', () => ({ notifyOnStatus: jest.fn() }));
jest.mock('../../../services/ondcIssueWaiter', () => ({ notifyOnIssue: jest.fn() }));
jest.mock('../../../services/ondcOnConfirmPersist', () => ({
    persistAndSettleFromOnConfirm: jest.fn(),
}));
jest.mock('../../../models/use-cases/ondc_callback_log', () => ({
    createCallbackLog: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../../../utils/loggerHelper', () => ({ customLog: jest.fn() }));
jest.mock('../../../models/use-cases/ondc_issue', () => ({
    findOndcIssueByIssueId: jest.fn(),
    updateOndcIssueFromCallback: jest.fn().mockResolvedValue([1]),
    createOndcIssue: jest.fn(),
}));
jest.mock('../../../models/use-cases/ondc_issue_event', () => ({
    recordOndcIssueEvent: jest.fn().mockResolvedValue({}),
}));

const { findOndcOrderByTransactionId } = require('../../../models/use-cases/ondc_order');
const { findOndcIssueByIssueId, updateOndcIssueFromCallback, createOndcIssue } = require('../../../models/use-cases/ondc_issue');
const { recordOndcIssueEvent } = require('../../../models/use-cases/ondc_issue_event');
const { onIssue } = require('../ondc');
const IGM2_PAYLOAD = require('./fixtures/onIssueIgm2.json');

const res = () => {
    const r = {};
    r.status = jest.fn(() => r);
    r.json = jest.fn(() => r);
    return r;
};

/** asyncHandler swallows throws into next(); rethrow so a broken handler fails loudly. */
const next = () => (err) => {
    throw err;
};

/** A deep copy, so a test mutating the payload can't leak into the next one. */
const payload = (mutate) => {
    const body = JSON.parse(JSON.stringify(IGM2_PAYLOAD));
    if (mutate) mutate(body);
    return { body, LogTraceId: 'trace-1' };
};

const recordedEvents = () => recordOndcIssueEvent.mock.calls.map(([args]) => args);

beforeEach(() => {
    jest.clearAllMocks();
    findOndcIssueByIssueId.mockResolvedValue({ id: 77, issueId: IGM2_PAYLOAD.message.issue.id });
});

describe('on_issue — IGM 2.0 ingest', () => {
    it('records the seller actions instead of silently dropping everything', async () => {
        await onIssue(payload(), res(), next());

        // The regression this whole change exists for: was 0.
        expect(recordOndcIssueEvent).toHaveBeenCalledTimes(3);
    });

    it('skips our own replayed OPEN so the buyer does not see their complaint twice', async () => {
        await onIssue(payload(), res(), next());

        // The fixture has four actions; the first is action_by uatinapi.pekoapp.com,
        // which is context.bap_id — ours, already stored at raise time.
        expect(recordedEvents()).toHaveLength(3);
        expect(recordedEvents().map((e) => e.eventType)).not.toContain('OPEN');
    });

    it('maps the seller codes to the right internal statuses, in order', async () => {
        await onIssue(payload(), res(), next());

        expect(recordedEvents().map((e) => e.eventType)).toEqual([
            'ACKNOWLEDGED', // PROCESSING
            'RESOLUTION_PROPOSED',
            'RESOLVED',
        ]);
    });

    // The trap the old substring mapper fell into: RESOLUTION_PROPOSED contains
    // "RESOLV", so it became RESOLVED — terminal — and locked the buyer out.
    it('does not treat the proposed resolution as resolved', async () => {
        await onIssue(payload(), res(), next());

        const proposed = recordedEvents()[1];
        expect(proposed.eventType).toBe('RESOLUTION_PROPOSED');
        expect(proposed.eventType).not.toBe('RESOLVED');
    });

    it('reads the message and actor from their 2.0 locations', async () => {
        await onIssue(payload(), res(), next());

        const [first] = recordedEvents();
        // descriptor.short_desc, not short_desc; actor_details.name, not updated_by.person.name
        expect(first.message).toBe('Complaint created');
        expect(first.actorName).toBe('mock-person');
        expect(first.actorType).toBe('RESPONDENT');
        expect(first.occurredAt).toBe('2026-08-17T09:19:53.445Z');
    });

    it('keys dedupe on the action id so a redelivery is a no-op', async () => {
        await onIssue(payload(), res(), next());

        expect(recordedEvents().map((e) => e.dedupeKey)).toEqual([
            'action_f02f7a4c-088b-4c82-9529-ffeade7d21d5',
            'action_94071a9d-f8ab-4b24-a636-64a6f41495ac',
            'action_fef64723-d97d-458f-afb5-cee39ef8fe42',
        ]);
    });

    it('persists the level and the proposed resolutions', async () => {
        await onIssue(payload(), res(), next());

        expect(updateOndcIssueFromCallback).toHaveBeenCalledWith(
            expect.objectContaining({
                id: 77,
                level: 'ISSUE',
                resolution: [
                    expect.objectContaining({
                        id: 'R5',
                        descriptor: expect.objectContaining({ code: 'NO_ACTION' }),
                    }),
                ],
            })
        );
    });

    it('flattens 2.0 Image objects to plain urls', async () => {
        await onIssue(
            payload((body) => {
                body.message.issue.actions[1].descriptor.images = [
                    { url: 'https://seller.example/a.png', size_type: 'xs' },
                ];
            }),
            res(),
            next()
        );

        expect(recordedEvents()[0].images).toEqual(['https://seller.example/a.png']);
    });

    it('always ACKs', async () => {
        const r = res();
        await onIssue(payload(), r, next());

        expect(r.status).toHaveBeenCalledWith(200);
        expect(r.json).toHaveBeenCalledWith({ message: { ack: { status: 'ACK' } } });
    });

    it('writes nothing when every action is ours', async () => {
        await onIssue(
            payload((body) => {
                body.message.issue.actions = [body.message.issue.actions[0]];
            }),
            res(),
            next()
        );

        expect(recordOndcIssueEvent).not.toHaveBeenCalled();
    });

    it('ignores a callback when the issue and order are both unknown', async () => {
        findOndcIssueByIssueId.mockResolvedValue(null);
        findOndcOrderByTransactionId.mockResolvedValue(null);
        await onIssue(payload(), res(), next());

        expect(createOndcIssue).not.toHaveBeenCalled();
        expect(recordOndcIssueEvent).not.toHaveBeenCalled();
        expect(updateOndcIssueFromCallback).not.toHaveBeenCalled();
    });

    it('upserts from on_issue when the issue row is missing but the order exists', async () => {
        findOndcIssueByIssueId.mockResolvedValue(null);
        findOndcOrderByTransactionId.mockResolvedValue({
            id: 9,
            orderId: 'ORD123',
            transactionId: IGM2_PAYLOAD.context.transaction_id,
            corporateUserId: 1,
            bppId: 'workbench.ondc.tech',
            bppUri: 'https://workbench.ondc.tech',
        });
        createOndcIssue.mockResolvedValue({
            id: 99,
            issueId: IGM2_PAYLOAD.message.issue.id,
            igmMeta: {},
        });

        await onIssue(payload(), res(), next());

        expect(createOndcIssue).toHaveBeenCalledWith(
            expect.objectContaining({
                ondcOrderId: 9,
                issueId: IGM2_PAYLOAD.message.issue.id,
                description: IGM2_PAYLOAD.message.issue.descriptor.long_desc,
            })
        );
        expect(recordOndcIssueEvent).toHaveBeenCalled();
        expect(updateOndcIssueFromCallback).toHaveBeenCalledWith(
            expect.objectContaining({ id: 99, igmMeta: expect.any(Object) })
        );
    });

    it('stores a fallback label when short_desc is empty', async () => {
        await onIssue(
            payload((body) => {
                body.message.issue.actions[1].descriptor.short_desc = '';
            }),
            res(),
            next()
        );

        expect(recordedEvents()[0].message).toBe('Seller is processing your complaint');
    });

    it('ignores a NACK', async () => {
        await onIssue(
            payload((body) => {
                body.error = { code: '31001', message: 'internal error' };
            }),
            res(),
            next()
        );

        expect(recordOndcIssueEvent).not.toHaveBeenCalled();
    });
});

describe('on_issue — IGM 1.0 ingest still works', () => {
    const v1 = () => ({
        body: {
            context: { message_id: 'msg-1', bap_id: 'uatinapi.pekoapp.com' },
            message: {
                issue: {
                    id: 'ISSUE-1',
                    issue_actions: {
                        respondent_actions: [
                            {
                                respondent_action: 'PROCESSING',
                                short_desc: 'Looking into it',
                                updated_at: '2026-08-17T09:00:00.000Z',
                                updated_by: { person: { name: 'Seller Support' } },
                            },
                            {
                                respondent_action: 'RESOLVED',
                                short_desc: 'Refund issued',
                                updated_at: '2026-08-17T10:00:00.000Z',
                                updated_by: { org: { name: 'seller.example' } },
                            },
                        ],
                    },
                },
            },
        },
        LogTraceId: 'trace-1',
    });

    it('records both respondent actions from the 1.0 shape', async () => {
        await onIssue(v1(), res(), next());

        expect(recordedEvents().map((e) => e.eventType)).toEqual(['ACKNOWLEDGED', 'RESOLVED']);
        expect(recordedEvents()[0].message).toBe('Looking into it');
        expect(recordedEvents()[0].actorName).toBe('Seller Support');
        expect(recordedEvents()[1].actorName).toBe('seller.example');
    });

    it('keeps the 1.0 composite dedupe key, which has no action id to use', async () => {
        await onIssue(v1(), res(), next());

        expect(recordedEvents()[0].dedupeKey).toBe('msg-1_PROCESSING_2026-08-17T09:00:00.000Z');
    });

    it('does not write issue-level 2.0 fields for a 1.0 callback', async () => {
        await onIssue(v1(), res(), next());

        expect(updateOndcIssueFromCallback).not.toHaveBeenCalled();
    });
});
