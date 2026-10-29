const { calculateCCF1 } = require('../../billPayments_utils');

const makeBillerData = (ccf1) => ({ interchangeFeeCCF1: ccf1 });

describe('calculateCCF1', () => {
    it('should return null when billerData has no interchangeFeeCCF1', () => {
        expect(calculateCCF1({}, 100)).toBeNull();
        expect(calculateCCF1(null, 100)).toBeNull();
    });

    it('should return null when interchangeFeeCCF1 is absent', () => {
        expect(calculateCCF1({ someOtherField: 1 }, 100)).toBeNull();
    });

    it('should return null when calculated fee is zero or negative', () => {
        const billerData = makeBillerData({ flatFee: 0, percentFee: 0 });
        expect(calculateCCF1(billerData, 100)).toBeNull();
    });

    it('should calculate fee from flatFee only', () => {
        const billerData = makeBillerData({ flatFee: 10, percentFee: 0 });
        // flatFee=10, calculated=10, withGST=floor(10*1.18)=11, no min/max bounds
        expect(calculateCCF1(billerData, 100)).toBe('11');
    });

    it('should calculate fee from percentFee only', () => {
        // txnAmountRupees=100 → paisa=10000, percentFee=1 → 10000*1/100=100
        // withGST = floor(100*1.18) = 118
        const billerData = makeBillerData({ flatFee: 0, percentFee: 1 });
        expect(calculateCCF1(billerData, 100)).toBe('118');
    });

    it('should apply 18% GST with floor', () => {
        // flatFee=5, percentFee=0, calculated=5, withGST=floor(5*1.18)=floor(5.9)=5
        const billerData = makeBillerData({ flatFee: 5, percentFee: 0 });
        expect(calculateCCF1(billerData, 0)).toBe('5');
    });

    it('should enforce feeMinAmt lower bound', () => {
        // calculated=5, withGST=5, but feeMinAmt=10
        const billerData = makeBillerData({ flatFee: 5, percentFee: 0, feeMinAmt: 10, feeMaxAmt: 100 });
        expect(calculateCCF1(billerData, 0)).toBe('10');
    });

    it('should enforce feeMaxAmt upper bound', () => {
        // flatFee=100, percentFee=0, withGST=floor(100*1.18)=118, but feeMaxAmt=50
        const billerData = makeBillerData({ flatFee: 100, percentFee: 0, feeMinAmt: 0, feeMaxAmt: 50 });
        expect(calculateCCF1(billerData, 0)).toBe('50');
    });

    it('should combine flatFee and percentFee', () => {
        // txnAmountRupees=200 → paisa=20000, flatFee=5, percentFee=0.5
        // calculated = 5 + (20000*0.5/100) = 5 + 100 = 105
        // withGST = floor(105 * 1.18) = floor(123.9) = 123
        const billerData = makeBillerData({ flatFee: 5, percentFee: 0.5 });
        expect(calculateCCF1(billerData, 200)).toBe('123');
    });

    it('should return string type', () => {
        const billerData = makeBillerData({ flatFee: 10 });
        const result = calculateCCF1(billerData, 0);
        expect(typeof result).toBe('string');
    });

    it('should default missing flatFee and percentFee to 0', () => {
        // only feeMinAmt set, flatFee/percentFee absent → calculated=0 → return null
        const billerData = makeBillerData({ feeMinAmt: 5 });
        expect(calculateCCF1(billerData, 100)).toBeNull();
    });
});
