jest.mock('../configs/database/index', () => ({
     define: jest.fn().mockImplementation((modelName, attributes) => {
          const model = {
               ...attributes,
               findOne: jest.fn(),
               findAll: jest.fn(),
               create: jest.fn(),
               update: jest.fn(),
               destroy: jest.fn(),
               findAndCountAll: jest.fn(),
               findByPk: jest.fn(),
               count: jest.fn(),
               sum: jest.fn(),
               bulkCreate: jest.fn(),
               prototype: {
                    getResetPasswordToken: jest.fn(),
                    validatePassword: jest.fn(),
               },
               belongsTo: jest.fn(),
               hasOne: jest.fn(),
               hasMany: jest.fn(),
               belongsToMany: jest.fn(),
          }
          if (modelName === 'credential') {
               model.hashPassword = jest.fn()
          }
          return model
     }),
     sync: jest.fn(),
     transaction: jest.fn().mockResolvedValue({
          commit: jest.fn(),
          rollback: jest.fn(),
     }),
     authenticate: jest.fn(),
     query: jest.fn(),
     QueryTypes: { SELECT: 'SELECT', UPDATE: 'UPDATE' },
}));

jest.mock('../utils/loggerHelper', () => ({
     customLog: jest.fn()
}));

jest.mock('../utils/logger', () => ({
     info: jest.fn(),
     error: jest.fn(),
     warn: jest.fn(),
     debug: jest.fn(),
}));

jest.mock('../services/scheduleReports', () => ({
     dailyReportScheduler: jest.fn(),
     weeklyReportScheduler: jest.fn(),
     monthlyReportScheduler: jest.fn(),
     scheduleDailyReportOfCorporates: jest.fn(),
     scheduleDailyReportOfCorporatesAdmin: jest.fn(),
     scheduleWeeklyReportOfCorporates: jest.fn(),
     scheduleMonthlyReportOfCorporates: jest.fn(),
}));
