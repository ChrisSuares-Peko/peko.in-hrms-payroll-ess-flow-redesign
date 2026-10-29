/* eslint-disable no-unused-vars */
const moment = require('moment');
const sequelizeConfig = require('../../../../configs/database/index');
const { getSpendingAlert } = require('../../dashboard');

// Include the actual getRevenue function in the test file
async function getRevenue(credentialId) {
    function diff(A, B) {
        return A.filter(function (a) {
            return B.indexOf(a) == -1;
        });
    }
    var element2 = [];
    for (let index = 0; index < 12; index++) {
        element2.push(
            moment()
                .subtract(index, "months")
                .startOf("month")
                .format("MMM YYYY")
        );
    }
    element2 = element2.reverse();

    let to = moment().format('YYYY-MM-DD') + ' 23:59:59';
    let currentDate = moment();
    let fromThirteenMonthsAgo = currentDate.clone().subtract(13, 'months').startOf('month').format('YYYY-MM-DD') + ' 00:00:00';

    let transactionDetails = await sequelizeConfig.query(
        `SELECT count(t.id) as count, 
                sum(o.amountInINR) as revenue, 
                sum(t.corporateCashback) as cashback, 
                Date(t.transactionDate) as Date 
        FROM transactions t 
        INNER JOIN orders o ON t.orderId = o.id
        WHERE t.credentialId = ? 
            AND t.status = "SUCCESS" 
            AND t.transactionDate BETWEEN ? AND ? 
            AND t.debitAmount >= 0  
            AND t.orderId IS NOT NULL
        GROUP BY Date(t.transactionDate);`,
        {
            replacements: [credentialId, fromThirteenMonthsAgo, to],
            type: sequelizeConfig.QueryTypes.SELECT
        }
    );

    var transData = transactionDetails.map(item => {
        return {
            date: moment(item.Date).format('MMM YYYY'),
            count: item.count,
            revenue: item.revenue,
            cashback: item.cashback
        };
    });

    transData = transData.reduce((result, item) => {
        var existingMonth = result.find(entry => entry.date === item.date);

        if (existingMonth) {
            existingMonth.count += item.count;
            existingMonth.revenue = (parseFloat(existingMonth.revenue) + parseFloat(item.revenue)).toFixed(4);
            existingMonth.cashback = (parseFloat(existingMonth.cashback) + parseFloat(item.cashback)).toFixed(4);
        } else {
            result.push({
                date: item.date,
                count: item.count,
                revenue: item.revenue,
                cashback: item.cashback
            });
        }
        return result;
    }, []);

    var gotDate = transData.map(data => data.date);

    var missed = diff(element2, gotDate);

    var indexes = missed.map(missedDay => element2.indexOf(missedDay));
    for (let index = 0; index < missed.length; index++) {
        transData.splice(indexes[index], 0, {
            date: missed[index],
            count: 0,
            revenue: 0,
            cashback: 0
        });
    }

    var label = transData.map(item => item.date.slice(0, 10));
    var revenueData = transData.map(item => item.revenue);

    let finalBarArray = {
        revenue: revenueData,
        labelDate: label
    };

    return finalBarArray;
}

// Mocking sequelizeConfig and its methods
jest.mock('../../../../configs/database/index', () => ({
    define: jest.fn().mockReturnValue({
        findAll: jest.fn(),
    }),
    query: jest.fn(),
    QueryTypes: {
        SELECT: 'SELECT',
    }
}));

jest.mock('../../../entities/credential', () => {
    const credentialMock = {
        prototype: {
            getResetPasswordToken: jest.fn(),
            validatePassword: jest.fn(),
            validatePasswords: jest.fn()
        },
        hashPassword: jest.fn(),
    };

    return credentialMock;
});

jest.mock('../../../entities/serviceOperator', () => ({
    belongsTo: jest.fn()
}));

jest.mock('../../../entities/subCorporateUsers', () => ({
    belongsTo: jest.fn()
}));

jest.mock('../../../entities/order', () => ({
    belongsTo: jest.fn()
}));

jest.mock('../../../entities/transaction', () => ({
    belongsTo: jest.fn()
}));
jest.mock('../../../entities/corporateUser',()=>({
    hasMany:jest.fn()
}))

describe('getSpendingAlert', () => {
    it('should return the percentage when current month spending exceeds 25% of the average monthly spending', async () => {
        sequelizeConfig.query.mockResolvedValueOnce([
            { Date: '2024-06-01', count: 10, revenue: 1000, cashback: 50 },
            { Date: '2024-07-01', count: 10, revenue: 1600, cashback: 50 },
        ]);

        const credentialId = 'some-credential-id';
        const result = await getSpendingAlert(credentialId);

        expect(result).toBe(60.00); // Adjust based on your mock data
    });

    it('should return false when current month spending does not exceed 25% of the average monthly spending', async () => {
        sequelizeConfig.query.mockResolvedValueOnce([
            { Date: '2024-06-01', count: 10, revenue: 1000, cashback: 50 },
            { Date: '2024-07-01', count: 10, revenue: 1100, cashback: 50 },
        ]);

        const credentialId = 'some-credential-id';
        const result = await getSpendingAlert(credentialId);

        expect(result).toBe(false); // Adjust based on your mock data
    });

    it('should handle months with zero spending and calculate correctly', async () => {
        sequelizeConfig.query.mockResolvedValueOnce([
            { Date: '2024-06-01', count: 10, revenue: 1000, cashback: 50 },
            { Date: '2024-07-01', count: 0, revenue: 0, cashback: 0 },
        ]);

        const credentialId = 'some-credential-id';
        const result = await getSpendingAlert(credentialId);

        expect(result).toBe(false); // Adjust based on your mock data
    });
});
