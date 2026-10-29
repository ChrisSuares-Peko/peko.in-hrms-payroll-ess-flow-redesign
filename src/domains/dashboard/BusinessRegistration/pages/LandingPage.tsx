import { useEffect, useState } from 'react';

import { Button, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

import { paths } from '@routes/paths';
import { useAppSelector } from '@src/hooks/store';

import { getApplications } from '../api';
import ExpertBanner from '../components/ExpertBanner';
import HeroStats from '../components/HeroStats';
import Requirements from '../components/Requirements';
import { HERO_CTA, HERO_DESCRIPTION, HERO_SUBTITLE, HERO_TITLE } from '../utils/data';

const { Title, Paragraph } = Typography;

const LandingPage = () => {
    const navigate = useNavigate();
    const { id: userId, role: userType } = useAppSelector(state => state.reducer.auth);
    // Shown only when the corporate has at least one application (ongoing
    // draft or submitted) — first-time visitors just see the start CTA.
    const [hasApplications, setHasApplications] = useState(false);

    useEffect(() => {
        let active = true;
        getApplications({ userId: Number(userId), userType: userType ?? '', limit: 1 }).then(res => {
            if (!active || !res) return;
            setHasApplications((res.total ?? res.applications?.length ?? 0) > 0);
        });
        return () => {
            active = false;
        };
    }, [userId, userType]);

    const handleStart = () => navigate(paths.businessRegistration.form);
    const handleMyApplications = () =>
        navigate(`${paths.businessRegistration.index}/${paths.businessRegistration.applications}`);

    return (
        <div className="bg-white min-h-screen p-3 sm:p-6">
            <div className="max-w-5xl mx-auto flex flex-col gap-8 sm:gap-12">
                {/* Hero */}
                <div className="flex flex-col items-center gap-6 sm:gap-8">
                    <div className="w-full flex flex-col items-center gap-8 sm:gap-10 py-4 sm:py-6">
                        <div className="text-center">
                            <Title
                                level={2}
                                className="!text-[24px] sm:!text-[33px] !font-bold !text-[#383838] !mb-2 !leading-tight"
                            >
                                {HERO_TITLE}
                            </Title>
                            <Paragraph className="!mb-0 text-[15px] sm:text-[20px] text-[#383838] !leading-snug max-w-[560px]">
                                {HERO_SUBTITLE}
                            </Paragraph>
                        </div>

                        <HeroStats />
                    </div>

                    <Paragraph className="!mb-0 max-w-[908px] text-center text-[14px] sm:text-[16px] text-[#383838] !leading-[1.6]">
                        {HERO_DESCRIPTION}
                    </Paragraph>

                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                        <Button
                            type="primary"
                            onClick={handleStart}
                            className="!h-[47px] !px-5 !text-[16px] !font-medium !rounded-[9px] !bg-[#ff4f4f] hover:!bg-[#e64444] w-full sm:w-auto transition-colors"
                        >
                            {HERO_CTA}
                        </Button>
                        {hasApplications && (
                            <Button
                                onClick={handleMyApplications}
                                className="!h-[47px] !px-5 !text-[16px] !font-medium !rounded-[9px] !border-[#ff4f4f] !text-[#ff4f4f] hover:!bg-[#fff5f5] w-full sm:w-auto transition-colors"
                            >
                                My Applications
                            </Button>
                        )}
                    </div>
                </div>

                <Requirements />

                <ExpertBanner />
            </div>
        </div>
    );
};

export default LandingPage;
