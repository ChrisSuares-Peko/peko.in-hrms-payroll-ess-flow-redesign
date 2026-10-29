import { useEffect, useMemo } from 'react';

import { Content } from 'antd/es/layout/layout';
import { useNavigate } from 'react-router-dom';

import { paths } from '@src/routes/paths';

import AlmaLinuxIcon from '../assets/svg/almalinux.svg';
import RockyLinuxIcon from '../assets/svg/rockylinux.svg';
import UbuntuIcon from '../assets/svg/ubuntu.svg';
import VpsFeatureTabs from '../components/vps/VpsFeatureTabs';
import VpsHero from '../components/vps/VpsHero';
import useHostingPlans from '../hooks/useHostingPlans';

const OS_ICON_MAP: Record<string, { label: string; src: string }> = {
    alma: { label: 'AlmaLinux', src: AlmaLinuxIcon },
    rocky: { label: 'Rocky Linux', src: RockyLinuxIcon },
    ubuntu: { label: 'Ubuntu', src: UbuntuIcon },
};

const VpsServerDetailPage = () => {
    const navigate = useNavigate();
    const { plans } = useHostingPlans('vps_server');
    const { plans: backupPlans, fetchPlans: fetchBackupPlans } = useHostingPlans('backup', { lazy: true });

    useEffect(() => {
        fetchBackupPlans({ serverLocation: 'in' });
    }, [fetchBackupPlans]);

    const acronisPricePerGb = backupPlans[0]?.pricingDetails?.add?.['1'] ?? backupPlans[0]?.price ?? null;
    const acronisMinStorageGb = backupPlans[0]?.vendorDetails?.minimumStorageSize ?? null;
    const acronisMaxStorageGb = backupPlans[0]?.vendorDetails?.maximumStorageSize ?? null;

    const minPrice =
        plans.length > 0
            ? Math.min(...plans.flatMap(p => Object.values(p.pricingDetails?.add ?? {})))
            : null;

    const uniqueOsIcons = useMemo(() => {
        const seen = new Set<string>();
        return plans
            .flatMap(plan => plan.vendorDetails?.supported_os ?? [])
            .filter(o => !o.is_discontinued)
            .reduce<{ label: string; src: string }[]>((acc, o) => {
                const family = Object.keys(OS_ICON_MAP).find(k => o.os_name.startsWith(k));
                if (family && !seen.has(family)) {
                    seen.add(family);
                    acc.push(OS_ICON_MAP[family]);
                }
                return acc;
            }, []);
    }, [plans]);

    const handleBuyPlans = () => {
        navigate(`${paths.dashboard.domainHosting}/${paths.domainHosting.vpsServer}`);
    };

    return (
        <Content className="bg-white" style={{ minHeight: '100vh' }}>
            <VpsHero minPrice={minPrice} onBuyPlans={handleBuyPlans} />
            <VpsFeatureTabs
                osIcons={uniqueOsIcons}
                acronisPricePerGb={acronisPricePerGb}
                acronisMinStorageGb={acronisMinStorageGb}
                acronisMaxStorageGb={acronisMaxStorageGb}
            />
        </Content>
    );
};

export default VpsServerDetailPage;
