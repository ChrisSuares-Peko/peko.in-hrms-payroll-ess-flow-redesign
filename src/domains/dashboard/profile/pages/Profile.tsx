import { Row, Col, Divider, Skeleton } from 'antd';

import { useAppSelector } from '@src/hooks/store';
import useScreenSize from '@src/hooks/useScreenSize';

import MobileProfile from './MobileProfile';
import SubCorporateProfile from './SubCorporateProfile';
import AddressList from '../components/AddressList';
import BankAccounts from '../components/BankAccounts';
import BasicInfo from '../components/BasicInfo';
import CompanyInfo from '../components/CompanyInfo';
import ProfileInfo from '../components/ProfileInfo';
import ReferralCode from '../components/ReferralCode';
import useBasicInfoApi from '../hooks/useBasicInfoApi';

const Profile = () => {
    const { lg } = useScreenSize();
    const { user } = useAppSelector(state => state.reducer.user);
    useBasicInfoApi({});

    if (user?.roleName === 'corporate sub user') {
        return <SubCorporateProfile />;
    }

    if (lg === undefined) return <Skeleton />;

    if (!lg) return <MobileProfile />;

    return (
        <Row gutter={[52, 52]} className="md:mr-[-.7rem!important]">
            <Col
                xs={24}
                md={12}
                lg={13}
                xl={14}
                className="sm:px-[.5rem!important] md:px-[1.57rem!important]"
            >
                <ProfileInfo />
                <BasicInfo />
                <Row gutter={[22, 22]} className="mt-8 flex">
                    <Col xs={24} md={24} lg={24} xl={12} className="min-h-10">
                        <ReferralCode />
                    </Col>
                    <Col xs={24} md={24} lg={24} xl={12} className="min-h-10">
                        <BankAccounts />
                    </Col>
                </Row>
            </Col>
            <Col xs={24} md={12} lg={11} xl={10} className="w-full bg-gray-50 rounded-3xl p-6 ">
                <CompanyInfo />
                <Divider />
                <AddressList />
            </Col>
        </Row>
    );
};

export default Profile;
