const Sequelize = require('sequelize');
const sequelizeConfig = require('../../configs/database/index');
const payrollCategory = require('./payrollCategories'); // import the category model

const payrollDocuments = sequelizeConfig.define('payrollDocuments', {
    id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    documentName: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: false, // uniqueness will be enforced per category in bulk logic
    },
    document:{
        type:Sequelize.STRING,

    },
    documentStatus: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
    },
    categoryId: {
    type: Sequelize.BIGINT,
    allowNull: false,
    references: {
      model: 'payrollCategories',
      key: 'id',
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  },
});

// Link subcategory to category
payrollDocuments.belongsTo(payrollCategory, {
    foreignKey: 'categoryId',
    onDelete: 'CASCADE', // if a category is deleted, subcategories are deleted too
});

payrollCategory.hasMany(payrollDocuments, {
    foreignKey: 'categoryId',
    as:'documents'
});

module.exports = payrollDocuments;