module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables()
    if (!tables.includes('govtServices')) return

    const tableDescription = await queryInterface.describeTable('govtServices')

    // Add missing authority column
    if (!tableDescription.authority) {
      await queryInterface.addColumn('govtServices', 'authority', {
        type: Sequelize.ENUM('Central', 'State'),
        allowNull: true,
        after: 'tag'
      })
    }

    // Update category ENUM to include all new values (raw query avoids Sequelize ENUM change bugs on MySQL)
    if (tableDescription.category) {
      await queryInterface.sequelize.query(
        "ALTER TABLE `govtServices` MODIFY COLUMN `category` ENUM('Tax & Compliance','Licenses & Permits','Certifications','Trade Enablement','Pharma & Drugs','Pesticides','Fertilizers','Hospital & Healthcare','Hotels & Hospitality','Data Security','Financial Services','Telecom & IT','Education','Transport & Logistics','Business Recognition','Intellectual Property') NOT NULL"
      )
    }
  },

  async down(queryInterface) {
    const tables = await queryInterface.showAllTables()
    if (!tables.includes('govtServices')) return

    const tableDescription = await queryInterface.describeTable('govtServices')

    if (tableDescription.authority) {
      await queryInterface.removeColumn('govtServices', 'authority')
    }

    // Revert category ENUM to original values
    if (tableDescription.category) {
      await queryInterface.sequelize.query(
        "ALTER TABLE `govtServices` MODIFY COLUMN `category` ENUM('Tax & Compliance','Licenses & Permits') NOT NULL"
      )
    }
  }
}
