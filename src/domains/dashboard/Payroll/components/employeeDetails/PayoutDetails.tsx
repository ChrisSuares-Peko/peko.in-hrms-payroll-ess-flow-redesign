import React from 'react';

import { Flex } from 'antd';

import BonusAndIncentives from '../SalaryProfile/BonusAndIncentives';
import Overtime from '../SalaryProfile/Overtime';

// Bonus + Incentives consolidated into one "Bonus & Incentives" list with a payment Type
// dropdown (Bonus, Incentive, Joining/Referral Bonus, Commission, Leave Encashment, Spot
// Award), per the Dev Notes — Overtime stays separate with its own hours × rate maths.
const PayoutDetails = () => (
    <Flex vertical gap={40}>
        <BonusAndIncentives />
        <Overtime />
    </Flex>
);

export default PayoutDetails;
