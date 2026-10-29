jest.mock('nodemailer', () => {
    const transport = { sendMail: jest.fn() };
    return { createTransport: jest.fn(() => transport), transport };
});
jest.mock('@sendgrid/mail', () => ({ setApiKey: jest.fn(), setTimeout: jest.fn(), send: jest.fn() }));
jest.mock('email-templates', () => jest.fn());

const fs = require('fs');
const nodemailer = require('nodemailer');
const sgMail = require('@sendgrid/mail');
const { customLog } = require('../loggerHelper');
const emailer = require('../emailer');

const smtp = nodemailer.transport;
const ENV_KEYS = ['EMAILVIA', 'SENDGRID_API_KEY', 'NODE_ENV', 'EMAILER_USER_PROD', 'EMAILER_USER_DEV'];
const savedEnv = {};

const useSendGrid = () => {
    process.env.EMAILVIA = 'sendgrid';
    process.env.SENDGRID_API_KEY = 'REDACTED';
};

const delivered = (send) => new Promise((resolve) => send(resolve));

beforeAll(() => {
    ENV_KEYS.forEach((key) => { savedEnv[key] = process.env[key]; });
});

beforeEach(() => {
    jest.clearAllMocks();
    ENV_KEYS.forEach((key) => { delete process.env[key]; });
    smtp.sendMail.mockImplementation((options, callback) => callback(null, { response: '250 OK' }));
    sgMail.send.mockResolvedValue([{ statusCode: 202, headers: { 'x-message-id': 'msg-1' } }]);
});

afterAll(() => {
    ENV_KEYS.forEach((key) => {
        if (savedEnv[key] === undefined) delete process.env[key];
        else process.env[key] = savedEnv[key];
    });
});

describe('travel emailer — transport selection', () => {
    it('sends over SMTP by default', async () => {
        await delivered((done) => emailer.email('a@x.com', 'Hi', '<p>body</p>', done));

        expect(smtp.sendMail).toHaveBeenCalledWith(
            expect.objectContaining({ from: 'Peko<support@peko.one>', to: 'a@x.com', subject: 'Hi' }),
            expect.any(Function)
        );
        expect(sgMail.send).not.toHaveBeenCalled();
    });

    it('stays on SMTP when EMAILVIA is sendgrid but no key is configured, and says so once', async () => {
        process.env.EMAILVIA = 'sendgrid';

        await delivered((done) => emailer.email('a@x.com', 'Hi', 'body', done));
        await delivered((done) => emailer.email('b@x.com', 'Hi', 'body', done));

        expect(smtp.sendMail).toHaveBeenCalledTimes(2);
        expect(sgMail.send).not.toHaveBeenCalled();
        const warnings = customLog.mock.calls.filter(([, , data]) => data?.action === 'email:sendgridKeyMissing');
        expect(warnings).toHaveLength(1);
    });

    it('sends through SendGrid when EMAILVIA is sendgrid and a key is present, in any letter case', async () => {
        useSendGrid();
        process.env.EMAILVIA = ' SendGrid ';

        await delivered((done) => emailer.email('a@x.com', 'Hi', '<p>body</p>', done));

        expect(sgMail.setApiKey).toHaveBeenCalledWith('SG.test-key');
        expect(sgMail.send).toHaveBeenCalledWith({
            from: 'Peko<support@peko.one>',
            to: ['a@x.com'],
            subject: 'Hi',
            html: '<p>body</p>',
        });
        expect(smtp.sendMail).not.toHaveBeenCalled();
    });
});

describe('travel emailer — SendGrid message', () => {
    beforeEach(useSendGrid);

    it('sends from the configured mailbox for the environment', async () => {
        process.env.NODE_ENV = 'production';
        process.env.EMAILER_USER_PROD = 'support@peko.one';
        process.env.EMAILER_USER_DEV = 'dev@peko.one';

        await delivered((done) => emailer.email('a@x.com', 'Hi', 'body', done));
        expect(sgMail.send).toHaveBeenLastCalledWith(expect.objectContaining({ from: 'Peko<support@peko.one>' }));

        process.env.NODE_ENV = 'staging';
        await delivered((done) => emailer.email('a@x.com', 'Hi', 'body', done));
        expect(sgMail.send).toHaveBeenLastCalledWith(expect.objectContaining({ from: 'Peko<dev@peko.one>' }));
    });

    it('splits comma-separated recipients and drops cc addresses already in to', async () => {
        await delivered((done) => emailer.emailWithCc('a@x.com, b@x.com', 'Hi', 'body', ['B@x.com', 'c@x.com'], done));

        expect(sgMail.send).toHaveBeenCalledWith(expect.objectContaining({
            to: ['a@x.com', 'b@x.com'],
            cc: ['c@x.com'],
        }));
    });

    it('base64-encodes buffer attachments and reports success to the callback', async () => {
        const pdf = Buffer.from('%PDF-1.4 ticket');

        const error = await delivered((done) => emailer.emailWithMultipleAttachment(
            ['a@x.com'], 'Ticket', 'body', [{ filename: 'tickets/TIN1.pdf', content: pdf }, null], done
        ));

        expect(error).toBeUndefined();
        expect(sgMail.send).toHaveBeenCalledWith(expect.objectContaining({
            attachments: [{ content: pdf.toString('base64'), filename: 'TIN1.pdf', type: 'application/pdf', disposition: 'attachment' }],
        }));
    });

    it('reads a file attachment from its path', async () => {
        const readFile = jest.spyOn(fs.promises, 'readFile').mockResolvedValue(Buffer.from('ticket'));

        await delivered((done) => emailer.emailWithAttachment('a@x.com', 'Ticket', 'body', 'TIN1.pdf', 'TIN1.pdf', done));

        expect(readFile).toHaveBeenCalledWith('TIN1.pdf');
        expect(sgMail.send).toHaveBeenCalledWith(expect.objectContaining({
            attachments: [expect.objectContaining({ content: Buffer.from('ticket').toString('base64'), filename: 'TIN1.pdf' })],
        }));
        readFile.mockRestore();
    });

    it('passes a SendGrid failure to the callback and logs it', async () => {
        const failure = Object.assign(new Error('Forbidden'), { response: { body: { errors: [{ message: 'sender not verified' }] } } });
        sgMail.send.mockRejectedValue(failure);

        const error = await delivered((done) => emailer.emailWithMultipleAttachment('a@x.com', 'Ticket', 'body', [], done));

        expect(error).toBe(failure);
        expect(customLog).toHaveBeenCalledWith(null, 'error', expect.objectContaining({
            action: 'email:sendgridFailed',
            error: { errors: [{ message: 'sender not verified' }] },
        }));
    });

    it('addresses a bcc-only mail to the sender mailbox', async () => {
        await delivered((done) => emailer.emailBcc(['a@x.com', 'b@x.com'], 'Notice', 'body', 'report.pdf', null, done));

        expect(sgMail.send).toHaveBeenCalledWith(expect.objectContaining({
            to: ['support@peko.one'],
            bcc: ['a@x.com', 'b@x.com'],
        }));
    });
});
