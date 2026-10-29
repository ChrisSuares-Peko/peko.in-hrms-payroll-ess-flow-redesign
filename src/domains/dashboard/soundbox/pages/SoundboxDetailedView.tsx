import React from 'react';

import { Row } from 'antd';
import { Content } from 'antd/es/layout/layout';

import About from '@domains/dashboard/soundbox/components/SoundboxAbout';
import Features from '@domains/dashboard/soundbox/components/SoundboxFeatures';
import SoundBoxHeader from '@domains/dashboard/soundbox/components/SoundBoxHeader';

function SoundboxDetailedView() {
    return (
        <Content className="px-0 sm:px-6">
            <SoundBoxHeader />
            <Row gutter={[40, 40]} className="mt-8">
                <About />
                <Features />
            </Row>
        </Content>
    );
}

export default SoundboxDetailedView;
