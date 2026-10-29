import React, { useState } from 'react';

import { Typography } from 'antd';

import { cancelpolicyRoom } from '../types/cancellationTypes';

const Policy = () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [policy, setPolicy] = useState<cancelpolicyRoom[]>([]);
    

    // const { cancellationPolicyDetails } = useCancellationPolicyApi();

    // cancellationPolicyDetails(
    //     keyData.conversationId,
    //     bookArr,
    //     response.hotelDetails.commonData.culture
    // )
    //     .then(data => {
    //         setPolicy(data);
    //     })
    //     .catch(error => false);

    const responseData = policy[0]?.description;
    const policyData = responseData?.replace(/<br\/?>/g, '\n');
    const formattedPolicyData = policyData?.split('. ').map((sentence, index) => (
        <Typography.Text className="mt-2" key={index}>
            {sentence}.<br />
        </Typography.Text>
    ));

    return <div>{formattedPolicyData}</div>;
};

export default Policy;
