'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('companyIncorporations');

    if (!table.credentialId) {
      await queryInterface.addColumn('companyIncorporations', 'credentialId', {
        type: Sequelize.INTEGER,
        allowNull: true,
      });
    }

    if (!table.corporateId) {
      await queryInterface.addColumn('companyIncorporations', 'corporateId', {
        type: Sequelize.INTEGER,
        allowNull: true,
      });
    }

    try {
      await queryInterface.addConstraint('companyIncorporations', {
        fields: ['credentialId'],
        type: 'foreign key',
        name: 'fk_companyIncorporations_credentialId',
        references: {
          table: 'credentials',
          field: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      });
    } catch (err) {
      if (err.original?.errno !== 1826 && err.original?.errno !== 1061) throw err;
    }

    try {
      await queryInterface.addIndex(
        'companyIncorporations',
        ['credentialId', 'corporateId', 'status'],
        { name: 'idx_company_credential_corporate_status' }
      );
    } catch (err) {
      if (err.original?.errno !== 1061) throw err;
    }
  },

  async down(queryInterface) {
    try {
      await queryInterface.removeIndex('companyIncorporations', 'idx_company_credential_corporate_status');
    } catch (err) {
      if (err.original?.errno !== 1091) throw err;
    }

    try {
      await queryInterface.removeConstraint('companyIncorporations', 'fk_companyIncorporations_credentialId');
    } catch (err) {
      if (err.original?.errno !== 1091) throw err;
    }

    const table = await queryInterface.describeTable('companyIncorporations');
    if (table.credentialId) {
      await queryInterface.removeColumn('companyIncorporations', 'credentialId');
    }
    if (table.corporateId) {
      await queryInterface.removeColumn('companyIncorporations', 'corporateId');
    }
  },
};