import { Button } from 'antd';
import { Link } from 'react-router-dom';

import { paths } from '@src/routes/paths';

import { DashboardApiResponse } from '../../types';

type KybButtonProps = {
    data: DashboardApiResponse;
};

const KybButton = ({ data }: KybButtonProps) => {
    const kybStatus = data?.paymentLinkKYB.kybStatus;

    switch (kybStatus) {
        case 'PENDING':
            return (
                <Link to={paths.invoice.kyb} className="my-5 cursor-pointer">
                    <Button type="default" danger size="large">
                        Complete KYB
                    </Button>
                </Link>
            );
        case 'IN PROGRESS':
            return (
                <Link to={paths.invoice.kybDocumentPage} className="my-5 cursor-pointer">
                    <Button type="default" danger size="large">
                        Complete KYB
                    </Button>
                </Link>
            );
        case 'UNDER REVIEW':
            return (
                <Link to={paths.invoice.kybVerification} className="my-5 cursor-pointer">
                    <Button type="default" danger size="large">
                        Complete KYB
                    </Button>
                </Link>
            );

        case 'APPROVED':
            return (
                <Button
                    className="text-successGreen border-successGreen "
                    size="large"
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={e => {
                        e.currentTarget.style.color = '#43AA00';
                        e.currentTarget.style.borderColor = '#43AA00';
                    }}
                    type="default"
                >
                    KYB Completed
                </Button>
            );

        case 'REJECTED':
            return (
                <Link to={`${paths.invoice.kyb}`} className="my-5 cursor-pointer">
                    <Button type="default" danger size="large">
                        KYB Rejected, Try Again
                    </Button>
                </Link>
            );
        default:
            return null;
    }
};

export default KybButton;
