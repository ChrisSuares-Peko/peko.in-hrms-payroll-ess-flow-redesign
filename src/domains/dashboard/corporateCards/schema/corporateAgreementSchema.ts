import * as Yup from 'yup';

import { emailRegex } from '@utils/regex';

import { requiredMessage, selectMessage, textField } from './validations';
import { AGREEMENT_LABELS as L } from '../utils/kybData';

const PIN_CODE = /^\d{6}$/;
const MOBILE = /^[6-9]\d{9}$/;
const GST = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const PAN = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const IFSC = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const TAN = /^[A-Z]{4}[0-9]{5}[A-Z]$/;
const TELEPHONE = /^[0-9+\-\s]{6,15}$/;
const CIN = /^[LU][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/;
const LLPIN = /^[A-Z]{3}-?[0-9]{4}$/;

/**
 * The one place a field's length is decided: the schema enforces it and the inputs cap typing at the same
 * number. Kept together so a control cannot let someone type past what validation will then reject, and so
 * the two cannot drift — the CIN input was capped at 21 while the rule allowed 30.
 *
 * Every value sits inside its DB column (VARCHAR(255) by default, 500 for the addresses, 20 for the phone
 * numbers), so capping here can never truncate something the server would have accepted.
 */
export const AGREEMENT_MAX = {
    entityName: 150,
    address: 250,
    city: 50,
    telephone: 15,
    email: 255,
    gstNumber: 15,
    panNumber: 10,
    cinLlpNumber: 21,
    tanNumber: 10,
    bankName: 100,
    bankBranch: 100,
    bankAccountNumber: 18,
    bankIfsc: 11,
    contactName: 100,
    mobile: 10,
    pinCode: 6,
} as const;

const required = requiredMessage;
const select = selectMessage;
const text = textField;

const email = (label: string) =>
    Yup.string()
        .trim()
        .max(AGREEMENT_MAX.email, `${label} cannot exceed ${AGREEMENT_MAX.email} characters`)
        .matches(emailRegex, {
            message: `Please enter a valid ${label}`,
            excludeEmptyString: true,
        })
        .required(required(label));

const mobile = (label: string) =>
    Yup.string()
        .trim()
        .matches(MOBILE, {
            message: `Please enter a valid 10-digit ${label}`,
            excludeEmptyString: true,
        })
        .required(required(label));

const pinCode = (label: string) =>
    Yup.string()
        .trim()
        .matches(PIN_CODE, { message: `${label} must be 6 digits`, excludeEmptyString: true })
        .required(required(label));

export const corporateAgreementSchema = (addressProofAlreadySaved = false) =>
    Yup.object().shape({
        addressProofSameAsGst: Yup.boolean(),
        addressProof: Yup.mixed()
            .nullable()
            .when('addressProofSameAsGst', {
                is: true,
                then: schema => schema.notRequired(),
                otherwise: schema =>
                    addressProofAlreadySaved
                        ? schema.notRequired()
                        : schema.required(`Please upload the ${L.addressProof}.`),
            }),
        entityName: text(L.entityName, AGREEMENT_MAX.entityName),

        regAddress: text(L.regAddress, AGREEMENT_MAX.address),
        regCity: text(L.regCity, AGREEMENT_MAX.city, 2),
        regState: Yup.string().trim().required(select(L.regState)),
        regPinCode: pinCode(L.regPinCode),
        regTelephone: Yup.string()
            .trim()
            .matches(TELEPHONE, {
                message: `Please enter a valid ${L.regTelephone}`,
                excludeEmptyString: true,
            })
            .required(required(L.regTelephone)),
        regEmail: email(L.regEmail),

        billSameAsRegistered: Yup.boolean(),
        billAddress: Yup.string()
            .trim()
            .when('billSameAsRegistered', {
                is: true,
                then: schema => schema.notRequired(),
                otherwise: () => text(L.billAddress, AGREEMENT_MAX.address),
            }),
        billCity: Yup.string()
            .trim()
            .when('billSameAsRegistered', {
                is: true,
                then: schema => schema.notRequired(),
                otherwise: () => text(L.billCity, AGREEMENT_MAX.city, 2),
            }),
        billState: Yup.string()
            .trim()
            .when('billSameAsRegistered', {
                is: true,
                then: schema => schema.notRequired(),
                otherwise: schema => schema.required(select(L.billState)),
            }),
        billPinCode: Yup.string()
            .trim()
            .when('billSameAsRegistered', {
                is: true,
                then: schema => schema.notRequired(),
                otherwise: () => pinCode(L.billPinCode),
            }),

        gstNumber: Yup.string()
            .trim()
            .matches(GST, {
                message: `Please enter a valid ${L.gstNumber}`,
                excludeEmptyString: true,
            })
            .required(required(L.gstNumber)),
        panNumber: Yup.string()
            .trim()
            .matches(PAN, {
                message: `Please enter a valid ${L.panNumber}`,
                excludeEmptyString: true,
            })
            .required(required(L.panNumber)),
        cinLlpNumber: Yup.string()
            .nullable()
            .trim()
            .test(
                'cin-llp',
                `Please enter a valid ${L.cinLlpNumber}`,
                value => !value || CIN.test(value) || LLPIN.test(value)
            ),
        // Nullable because a saved agreement returns null for every column the user left blank, and an
        // optional field is never touched — so a type error here would disable the submit with nothing
        // on screen to explain it.
        tanNumber: Yup.string()
            .nullable()
            .trim()
            .test('tan', `Please enter a valid ${L.tanNumber}`, value => !value || TAN.test(value)),

        bankName: text(L.bankName, AGREEMENT_MAX.bankName),
        bankBranch: text(L.bankBranch, AGREEMENT_MAX.bankBranch),
        bankAccountNumber: Yup.string()
            .trim()
            .matches(/^\d{9,18}$/, {
                message: `Please enter a valid ${L.bankAccountNumber}`,
                excludeEmptyString: true,
            })
            .required(required(L.bankAccountNumber)),
        bankIfsc: Yup.string()
            .trim()
            .matches(IFSC, {
                message: `Please enter a valid ${L.bankIfsc}`,
                excludeEmptyString: true,
            })
            .required(required(L.bankIfsc)),
        bankCity: text(L.bankCity, AGREEMENT_MAX.city, 2),

        officialContactName: text(L.officialContactName, AGREEMENT_MAX.contactName),
        officialContactMobile: mobile(L.officialContactMobile),
        officialContactEmail: email(L.officialContactEmail),

        salespersonName: text(L.salespersonName, AGREEMENT_MAX.contactName),
        salespersonMobile: mobile(L.salespersonMobile),
        salespersonEmail: email(L.salespersonEmail),

        signatoryName: text(L.signatoryName, AGREEMENT_MAX.contactName),
        signatoryContact: mobile(L.signatoryContact),
        signatoryEmail: email(L.signatoryEmail),
        signatoryIsPep: Yup.boolean().required('Please answer the PEP question'),
    });
