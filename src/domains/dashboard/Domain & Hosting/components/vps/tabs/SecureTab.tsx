import React from 'react';

import { Flex, Typography } from 'antd';

import AcronisIcon from '../../../assets/img/acronis.png';
import KvmIcon from '../../../assets/img/kvm.png';
import OpenStackIcon from '../../../assets/img/openstack.png';
import { TabLayout } from '../../../utils/vpsTabUtils';

const { Title } = Typography;

const INFRA_ICONS = [
    { label: 'OpenStack', src: OpenStackIcon },
    { label: 'KVM', src: KvmIcon },
    { label: 'Acronis', src: AcronisIcon },
];

const SecureTab: React.FC = () => (
    <TabLayout>
        <div className="mb-4">
            <Title level={5} style={{ marginBottom: 4 }}>DDOS Protection</Title>
            <p className="text-gray-600 m-0" style={{ fontSize: 13 }}>
                Our state-of-the-art infrastructure ensures your VPS is protected against any attacks.
            </p>
        </div>
        <div className="mb-4">
            <Title level={5} style={{ marginBottom: 4 }}>State-of-the-Art Infrastructure</Title>
            <p className="text-gray-600 mb-3" style={{ fontSize: 13 }}>
                All our servers are powered by world infrastructure to keep them online and running.
            </p>
            <Flex gap={16} align="center" wrap="wrap">
                {INFRA_ICONS.map(({ label, src }) => (
                    <div
                        key={label}
                        className="flex items-center gap-2 rounded-md py-1.5 px-3.5"
                    >
                        <img src={src} alt={label} className="object-contain" style={{ width: 60, height: 60 }} />
                        {/* <span style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>{label}</span> */}
                    </div>
                ))}
            </Flex>
        </div>
        <div>
            <Title level={5} style={{ marginBottom: 4 }}>Private Networking</Title>
            <p className="text-gray-600 m-0" style={{ fontSize: 13 }}>
                Setup and use network instantly in a few clicks.
            </p>
        </div>
    </TabLayout>
);

export default SecureTab;
