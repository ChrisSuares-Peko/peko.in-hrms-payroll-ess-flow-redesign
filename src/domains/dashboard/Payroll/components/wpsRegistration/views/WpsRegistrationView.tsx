import { useState, type FC } from 'react';

import { Flex } from 'antd';

import Registration from '../Registration';
import RegistrationStatus from '../RegistrationStatus';
import RegistrationSuccess from '../RegistrationSuccess';

interface WpsRegistrationViewProps {}

const WpsRegistrationView: FC<WpsRegistrationViewProps> = () => {
    const [wpsStep] = useState(2);

    return (
        <Flex vertical className=" min-h-screen">
            {wpsStep === 1 && <RegistrationStatus />}
            {wpsStep === 2 && <Registration />}
            {wpsStep === 3 && <RegistrationSuccess />}
        </Flex>
    );
};

export default WpsRegistrationView;
