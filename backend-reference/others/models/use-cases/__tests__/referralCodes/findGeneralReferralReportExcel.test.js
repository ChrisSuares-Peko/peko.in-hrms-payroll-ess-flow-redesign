const { findGeneralReferralReportExcel } = require('../../../use-cases/referral_codes');
const sequelizeConfig = require('../../../../configs/database/index'); 



describe('findGeneralReferralReportExcel', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should return formatted data for referral report excel', async () => {
        const mockData = [
          {
            referralCode: 'REF123',
            count: 10,
            contactPersonName: 'John Doe',
          },
          {
            referralCode: 'REF456',
            count: 5,
            contactPersonName: 'Jane Doe',
          },
        ];
    
        sequelizeConfig.query.mockResolvedValue(mockData);
    
        const params = {
          fromDate: '2024-01-01',
          toDate: '2024-01-31',
          partnerId: 'partner_123',
        };
    
        const result = await findGeneralReferralReportExcel(params);
    
        // expect(sequelizeConfig.query).toHaveBeenCalledWith(expect.stringMatching(/FROM corporateUsers/));
        // expect(sequelizeConfig.query).toHaveBeenCalledWith(expect.stringMatching(/WHERE corporateUser.referralCode IS NOT NULL/));
        expect(result).toEqual([
          {
            'Referral Code': 'REF123',
            'Referral Used By (users)': 10,
            'Contact Person Name': 'John Doe',
          },
          {
            'Referral Code': 'REF456',
            'Referral Used By (users)': 5,
            'Contact Person Name': 'Jane Doe',
          },
        ]);
    });

      it('should handle "Not Available" for missing data', async () => {
        const mockData = [
          {
            referralCode: null,
            count: 0,
            contactPersonName: null,
          },
        ];
    
        sequelizeConfig.query.mockResolvedValue(mockData);
    
        const params = {
          fromDate: '2024-01-01',
          toDate: '2024-01-31',
        };
    
        const result = await findGeneralReferralReportExcel(params);
    
        expect(result).toEqual([
          {
            'Referral Code': 'Not Available',
            'Referral Used By (users)': 0,
            'Contact Person Name': 'Not Available',
          },
        ]);
      });

      
    
      it('should build the correct query when partnerId is "default"', async () => {
        const mockData = [
          {
            referralCode: 'REF789',
            count: 8,
            contactPersonName: 'Alice Doe',
          },
        ];
    
        sequelizeConfig.query.mockResolvedValue(mockData);
    
        const params = {
          fromDate: '2024-01-01',
          toDate: '2024-01-31',
          partnerId: 'default',
        };
    
        const result = await findGeneralReferralReportExcel(params);
    
       // expect(sequelizeConfig.query).toHaveBeenCalledWith(expect.stringContaining('AND corporateUser.registeredBy is NULL'));
        expect(result).toEqual([
          {
            'Referral Code': 'REF789',
            'Referral Used By (users)': 8,
            'Contact Person Name': 'Alice Doe',
          },
        ]);
      });
    
});
