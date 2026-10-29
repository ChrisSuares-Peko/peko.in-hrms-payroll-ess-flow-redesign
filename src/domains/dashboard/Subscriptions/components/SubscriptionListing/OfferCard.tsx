import { Card, Flex, Image, Tag, Tooltip, Typography } from 'antd';
// import clevertap from 'clevertap-web-sdk';
import { useNavigate } from 'react-router-dom';

import { CardProps } from '@domains/dashboard/Subscriptions/types/types';
import useScreenSize from '@src/hooks/useScreenSize';
import { paths } from '@src/routes/paths';

import '../../assets/styles/styles.css';
import defaultImage from '../../assets/images/defaultImage.png';

const OfferCard = ({ title, discount, description, image, id }: CardProps) => {
    const { md } = useScreenSize();
    const navigate = useNavigate();
    const handleClick = (name: string) => {
        // clevertap.event.push('Softwares', {
        //     Page: 'Softwares',
        //     Action: `${name} clicked`,
        //     // Action:'softwares clicked',
        //     Email: user?.email,
        //     SubscriptionName: name,
        // });

        navigate(`/${paths.subscriptions.index}/${paths.subscriptions.details}/${id}`);
    };

    return (
        <Card
            className="relative transform border cursor-pointer xs:bg-white md:bg-white rounded-xl"
            onClick={() => handleClick(title)}
            style={{
                transition: 'transform .3s ease-in-out',
            }}
        >
            <Tag
                color="#29BD11"
                className="absolute top-[-10px] left-1/2 transform -translate-x-1/2"
            >
                Up to {discount}
            </Tag>
            {/* <Link to={`${paths.subscriptions.details}/${id}`}> */}
            <Flex vertical gap={10} align="center">
                <Flex
                    className="w-24 sm:w-20 md:h-28 xs:h-24 rounded-2xl sm:rounded-3xl"
                    align="center"
                    justify="center"
                >
                    <Image
                        preview={false}
                        src={image}
                        fallback={defaultImage}
                        width="90%"
                        alt={title}
                    />
                </Flex>
                <Typography.Text className="mt-0 font-medium md:mt-3 md:text-lg line-clamp-1">
                    <Tooltip title={md ? '' : title}>{title}</Tooltip>
                </Typography.Text>
            </Flex>
            {/* </Link> */}
        </Card>
    );
};

export default OfferCard;
