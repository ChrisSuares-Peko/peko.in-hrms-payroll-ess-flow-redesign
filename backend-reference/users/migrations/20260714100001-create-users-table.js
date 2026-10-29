'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();
    if (tables.includes('users')) {
      console.log('[Migration] users table already exists, skipping');
      return;
    }
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      name: Sequelize.STRING,
      email: Sequelize.STRING,
      mobileNo: Sequelize.STRING,
      corporateUserId: Sequelize.INTEGER,
      // Stores the MongoDB ObjectId of the employee profile in the payroll service
      employeeId: Sequelize.STRING,
      userAccessService: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      credentialId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'credentials',
          key: 'id',
        },
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('users');
  },
};
