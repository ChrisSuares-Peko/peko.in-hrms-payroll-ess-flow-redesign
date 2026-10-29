import React from 'react';

import { Card, Flex, Image, Typography } from 'antd';
import { Content } from 'antd/es/layout/layout';
import { Link } from 'react-router-dom';
import { ReactSVG } from 'react-svg';

import useScreenSize from '@src/hooks/useScreenSize';
import { paths } from '@src/routes/paths';

import { MapPin } from '../../assets/icons/projectDetails';
import { Project } from '../../types/dashboard';

const { Text } = Typography;

type Props = {
    projectDetails: Project | undefined;
};
function toTitleCase(str: string) {
    return str.toLowerCase().replace(/(?:^|\s)\w/g, match => match.toUpperCase());
}
const ProjectDetailsCard = ({ projectDetails }: Props) => {
    const { xxl } = useScreenSize();

    let projectName;
    if (projectDetails) projectName = toTitleCase(projectDetails.name);
    return (
        <Card className="h-full my-3 sm:border-none md:border md:border-solid rounded-2xl">
            <Image
                loading="eager"
                height={xxl ? 260 : 240}
                width="100%"
                src={projectDetails?.logo}
                preview={false}
                className="object-cover rounded-xl"
            />
            <Flex vertical gap={15}>
                <Text className="mt-4 text-xl font-medium text-valueText xxl:text-2xl">
                    {projectName}
                </Text>
                <Flex align="center" gap={3}>
                    <ReactSVG src={MapPin} />
                    <Text className="text-sm font-normal text-textGrey xxl:text-lg">
                        {`${projectDetails?.city}, ${projectDetails?.country}`}
                    </Text>
                </Flex>
                <Text className="text-base font-light text-start line-clamp-6 xxl:text-lg">
                    {projectDetails && (
                        <Content dangerouslySetInnerHTML={{ __html: projectDetails.body.html }} />
                    )}
                </Text>
                <Link
                    target="_blank" // Open link in new tab
                    rel="noopener noreferrer"
                    to={`${paths.dashboard.moreServices}/${paths.zeroCarbon.index}/${paths.zeroCarbon.projectDetails}/${projectDetails?.id}`}
                    className="flex justify-end mt-0"
                >
                    <Text className="-mt-3 font-medium  text-bgOrange2 text-end xxl:text-lg">
                        Read more
                    </Text>
                </Link>
            </Flex>
        </Card>
    );
};
export default ProjectDetailsCard;
