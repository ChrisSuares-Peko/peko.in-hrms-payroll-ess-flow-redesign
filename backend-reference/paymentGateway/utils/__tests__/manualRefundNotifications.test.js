'use strict';

jest.mock('../emailer', () => ({ email: jest.fn() }));
jest.mock('../loggerHelper', () => ({ customLog: jest.fn() }));
jest.mock('../partnerLogos', () => ({ partnerLogos: jest.fn().mockResolvedValue({ branding: 'Peko' }) }));
jest.mock('../../models/use-cases/notification', () => ({ createNotification: jest.fn() }));
jest.mock('../../models/use-cases/systemUser', () => ({ fetchPartnerDetails: jest.fn().mockResolvedValue({ branding: 'Mswipe BOS' }) }));
jest.mock('../../services/emailTemplateResolver', () => ({
  resolveEmailTemplate: jest.fn(async ({ fallback, fallbackSubject }) => ({ subject: fallbackSubject, html: fallback() })),
}));

const emailer = require('../emailer');
const { customLog } = require('../loggerHelper');
const { createNotification } = require('../../models/use-cases/notification');
const { fetchPartnerDetails } = require('../../models/use-cases/systemUser');
const { resolveEmailTemplate } = require('../../services/emailTemplateResolver');
const { notifyManualRefundStatus } = require('../manualRefundNotifications');

const customer = { username: 'acme', name: 'Acme Ltd', email: 'acme@example.com', registeredBy: 1854 };

beforeEach(() => {
  jest.clearAllMocks();
});

describe('notifyManualRefundStatus', () => {
  it('tells the customer the refund is in progress', async () => {
    await notifyManualRefundStatus({ corporateTxnId: '1790000000001', status: 'IN_PROGRESS', refundAmount: 450, customer });

    expect(createNotification).toHaveBeenCalledWith(expect.objectContaining({
      notificationTitle: 'Refund in progress',
      notificationTo: ['acme'],
      notificationCategory: 'CORPORATE',
    }));
    expect(resolveEmailTemplate).toHaveBeenCalledWith(expect.objectContaining({ key: 'REFUND_IN_PROGRESS', service: 'REFUND', partnerId: 1854 }));
    expect(emailer.email).toHaveBeenCalledWith(expect.objectContaining({ to: 'acme@example.com', subject: 'Refund in progress' }));
  });

  it('includes the refund reference once the refund is complete', async () => {
    await notifyManualRefundStatus({ corporateTxnId: '1790000000001', status: 'SUCCESS', refundAmount: 450, refundReference: 'MSW-REF-1', customer });

    expect(createNotification.mock.calls[0][0].notificationBrief).toContain('Reference: MSW-REF-1');
    const { body } = emailer.email.mock.calls[0][0];
    expect(body).toContain('Your refund is complete');
    expect(body).toContain('MSW-REF-1');
    expect(body).toContain('Team Mswipe BOS');
    expect(fetchPartnerDetails).toHaveBeenCalledWith(1854);
  });

  it('tells the customer a rejected refund will be followed up without exposing internal remarks', async () => {
    await notifyManualRefundStatus({ corporateTxnId: '1790000000001', status: 'FAILED', refundAmount: 450, customer });

    expect(createNotification.mock.calls[0][0].notificationTitle).toBe('Refund could not be completed');
    expect(emailer.email.mock.calls[0][0].body).toContain('Our support team will contact you shortly');
  });

  it('sends nothing for a status with no customer message', async () => {
    await notifyManualRefundStatus({ corporateTxnId: '1790000000001', status: 'PENDING', refundAmount: 450, customer });

    expect(createNotification).not.toHaveBeenCalled();
    expect(emailer.email).not.toHaveBeenCalled();
  });

  it('still emails the customer when the in-app notification fails', async () => {
    createNotification.mockRejectedValue(new Error('pusher down'));

    await notifyManualRefundStatus({ corporateTxnId: '1790000000001', status: 'IN_PROGRESS', refundAmount: 450, customer });

    expect(emailer.email).toHaveBeenCalled();
    expect(customLog).toHaveBeenCalledWith(undefined, 'error', expect.objectContaining({ action: 'refund:mswipeManualRefundNotificationFailed' }));
  });
});
