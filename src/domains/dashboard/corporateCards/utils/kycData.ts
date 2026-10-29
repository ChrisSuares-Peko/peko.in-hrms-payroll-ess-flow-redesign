import { KycRequirement, KycSubmissionInfo } from './types';
import aadhaar from '../assets/kyc/aadhaar.png';
import digilocker from '../assets/kyc/digilocker.png';
import pan from '../assets/kyc/pan.png';

/** Static copy + data for the Corporate Cards KYC gate (Initiate + Submitted screens). */

export const KYC_INTRO = {
    badge: 'Identity Verification Required',
    title: 'Verify Your Identity',
    description:
        'Complete your KYC to activate your corporate card benefits. This process is fully digital, secure, and typically takes 30 minutes to 24 hours.',
    checklistTitle: 'Before you begin, keep the following ready:',
    ctaLabel: 'Initiate KYC',
    termsPrefix: '',
    termsLinkLabel: '*T&C',
    termsSuffix: 'apply',
    termsUrl: 'https://www.pineperks.in/termsConditions?lang=english#peko',
    securityNote: 'Your data is encrypted and protected under RBI guidelines',
};

export const KYC_REQUIREMENTS: KycRequirement[] = [
    { key: 'aadhaar', label: 'Aadhaar Number', image: aadhaar },
    { key: 'digilocker', label: 'DigiLocker PIN', image: digilocker },
    { key: 'pan', label: 'Original PAN Card', image: pan },
];

export const KYC_SUBMITTED = {
    title: 'KYC Submitted Successfully',
    description:
        'Thank you for completing your KYC verification. Our team is reviewing your documents and video submission. You will be notified via email and SMS once your KYC is approved.',
    ctaLabel: 'Go to Dashboard',
    expectedCompletionPrefix: 'Expected completion:',
};

export const KYC_SUBMISSION_INFO: KycSubmissionInfo = {
    status: 'Under Review',
    expectedCompletion: 'Within 24 hours',
};
