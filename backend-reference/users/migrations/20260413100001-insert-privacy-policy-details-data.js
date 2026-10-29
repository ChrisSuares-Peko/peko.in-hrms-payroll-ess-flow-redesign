'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('privacy_policy_details', [
      {
        id: 1,
        privacyPolicyRegistrationText:
          'I have read and understood the {Privacy Policy} and consent to the collection and processing of my personal data for the purposes described therein. I understand that I may withdraw my consent at any time in accordance with the Privacy Policy.',
        hyperLinkText: 'https://peko.one/in/privacy-policy',
        status: 'ACTIVE',
        effectiveFrom: new Date('2026-04-07 07:08:12'),
        isMandatory: true,
        validationText: 'You must accept the Privacy Policy',
        createdAt: new Date('2026-04-10 08:11:47'),
        updatedAt: new Date('2026-04-10 08:11:47'),
      },
      {
        id: 2,
        privacyPolicyRegistrationText:
          'I have read and agree to be bound by the {Peko Platform Agreement} and confirm that I am authorized to create an account and accept the Agreement on behalf of the business.',
        hyperLinkText: 'https://peko.one/in/platform-agreement',
        status: 'ACTIVE',
        effectiveFrom: new Date('2026-04-10 08:13:35'),
        isMandatory: true,
        validationText: 'You must accept the Platform Agreement',
        createdAt: new Date('2026-04-10 08:13:35'),
        updatedAt: new Date('2026-04-10 08:13:35'),
      },
      {
        id: 3,
        privacyPolicyRegistrationText:
          'I agree to receive marketing communications from Peko by email, SMS, phone, or WhatsApp. I can opt out at any time.',
        hyperLinkText: null,
        status: 'ACTIVE',
        effectiveFrom: new Date('2026-04-10 08:14:20'),
        isMandatory: false,
        validationText: null,
        createdAt: new Date('2026-04-10 08:14:20'),
        updatedAt: new Date('2026-04-10 08:14:20'),
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('privacy_policy_details', {
      id: [1, 2, 3],
    });
  },
};
