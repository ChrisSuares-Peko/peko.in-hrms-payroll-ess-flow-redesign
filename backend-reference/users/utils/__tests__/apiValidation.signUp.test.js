/* eslint-disable jest/expect-expect */
const {
    validateRegister,
    validateOtpRequest,
    validateOTPRequest,
    validateEmailAndMobileInput,
    validateLogin,
    validateForgotPassword,
} = require('../apiValidation');

const run = (middleware, body) => {
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    middleware({ body }, res, next);
    return { res, next };
};

const expectPass = (middleware, body) => {
    const { res, next } = run(middleware, body);
    expect(res.status).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
};

const expectReject = (middleware, body, messagePart) => {
    const { res, next } = run(middleware, body);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json.mock.calls[0][0].message).toContain(messagePart);
};

const registerBody = {
    contactPersonName: 'Priya Sharma',
    countryCode: 91,
    mobileNo: '9876543210',
    email: 'priya@example.com',
    name: 'Peko Technologies',
    password: 'REDACTED',
    scope: 'email',
    emailOtp: '1234',
    signupType: 'EXISTING_COMPANY',
    accountType: 'corporate',
};

describe('validateRegister', () => {
    it.each(['Mary-Jane Watson', "Conor O'Neil", 'J.R.R. Tolkien'])(
        'accepts contactPersonName %s',
        value => expectPass(validateRegister, { ...registerBody, contactPersonName: value })
    );

    it.each(['...', "'''", 'Priya@Sharma', 'Priya123'])('rejects contactPersonName %s', value =>
        expectReject(
            validateRegister,
            { ...registerBody, contactPersonName: value },
            'Please enter valid name'
        )
    );

    it.each(["O'Reilly Media", 'Peko Tech. Pvt. Ltd.', 'Tata-Sons & Co'])(
        'accepts company name %s',
        value => expectPass(validateRegister, { ...registerBody, name: value })
    );

    it.each(['...', "'-.", 'Peko@Tech'])('rejects company name %s', value =>
        expectReject(validateRegister, { ...registerBody, name: value }, 'Please enter valid company name')
    );

    it.each(["o'neil@example.com", 'john.doe-x@sub-domain.example.co.in'])(
        'accepts email %s',
        value => expectPass(validateRegister, { ...registerBody, email: value })
    );

    it('rejects an email with a space', () =>
        expectReject(
            validateRegister,
            { ...registerBody, email: 'sp ace@example.com' },
            'Please enter valid business email'
        ));
});

describe('the other sign-up validators accept an apostrophe in the email', () => {
    const email = "o'neil@example.com";

    it('validateOtpRequest', () =>
        expectPass(validateOtpRequest, {
            mobileNo: '9876543210',
            email,
            scope: 'email',
            name: 'Priya',
            resend: false,
        }));

    it('validateOTPRequest', () =>
        expectPass(validateOTPRequest, { mobileNo: '9876543210', email, emailOtp: '1234' }));

    it('validateEmailAndMobileInput', () =>
        expectPass(validateEmailAndMobileInput, { mobileNo: '9876543210', email }));

    it('validateLogin', () => expectPass(validateLogin, { username: email, password: 'x' }));
});

describe('sign-up and forgot-password emails allow up to 55 characters', () => {
    const atLimit = `${'a'.repeat(43)}@example.com`;
    const overLimit = `${'a'.repeat(44)}@example.com`;

    const cases = [
        ['validateRegister', validateRegister, email => ({ ...registerBody, email })],
        [
            'validateOtpRequest',
            validateOtpRequest,
            email => ({ mobileNo: '9876543210', email, scope: 'email', name: 'Priya', resend: false }),
        ],
        [
            'validateOTPRequest',
            validateOTPRequest,
            email => ({ mobileNo: '9876543210', email, emailOtp: '1234' }),
        ],
        [
            'validateEmailAndMobileInput',
            validateEmailAndMobileInput,
            email => ({ mobileNo: '9876543210', email }),
        ],
        ['validateForgotPassword', validateForgotPassword, email => ({ username: email })],
    ];

    it.each(cases)('%s accepts a 55-character email', (_name, middleware, body) => {
        expect(atLimit).toHaveLength(55);
        expectPass(middleware, body(atLimit));
    });

    it.each(cases)('%s rejects a 56-character email', (_name, middleware, body) =>
        expectReject(middleware, body(overLimit), 'at most 55 characters'));
});
