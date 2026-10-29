import React from 'react';

import { Flex } from 'antd';
import { Link } from 'react-router-dom';
import { ReactSVG } from 'react-svg';

import { socialPaths } from '../utils/data';

type Props = {};

const SocialLinks = (props: Props) => (
    <Flex gap="middle" wrap="wrap">
        {socialPaths.map((element, index) => (
            <Link to={element.path} target="_blank">
                <ReactSVG
                    key={index}
                    beforeInjection={svg => {
                        svg.classList.add('svg-class-name');
                        svg.setAttribute('style', 'width: 25px');
                        svg.setAttribute('style', 'height: 25px');
                    }}
                    src={element.icon}
                />
            </Link>
        ))}
    </Flex>
);

export default SocialLinks;
