import { Button } from 'antd';
import { useNavigate } from 'react-router-dom';

import StatusCallout from './StatusCallout';

type Props = {
    pricing: { status?: string } | null | undefined;
    editPath?: string;
};

export default function PricingStatusAlert({ pricing, editPath }: Props) {
    const navigate = useNavigate();

    if (!pricing || pricing.status === 'active') return null;

    return (
        <StatusCallout
            tone="warning"
            className="mb-4"
            title="Quote No Longer Valid"
            description="The pricing selected for this application is no longer active. Please update your quote before proceeding to payment."
            action={
                editPath ? (
                    <Button type="default" danger onClick={() => navigate(editPath)}>
                        Edit Application
                    </Button>
                ) : undefined
            }
        />
    );
}
