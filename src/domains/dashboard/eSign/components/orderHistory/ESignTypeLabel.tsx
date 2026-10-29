import type { FC } from 'react';

import { Typography } from 'antd';

import { SignerInfo, SigningPolicy } from '../../types';

interface ESignTypeLabelProps {
    signingPolicy?: SigningPolicy;
    signers_info: SignerInfo[];
}

const ESignTypeLabel: FC<ESignTypeLabelProps> = ({ signingPolicy, signers_info }) => {
    const isAadhaarBased = signingPolicy
        ? signingPolicy === 'AADHAAR'
        : (signers_info || []).some(signer => signer.signingPolicy === 'AADHAAR');
    return <Typography.Text>{isAadhaarBased ? 'Aadhaar-based eSign' : 'Normal eSign'}</Typography.Text>;
};

export default ESignTypeLabel;
