import { CheckOutlined, CloseOutlined } from '@ant-design/icons';

import ListItem from './ListItem';

const PanFields = ({ data }: any) => (
    <>
        <ListItem property="Type" value={data?.verificationResponse?.type} />
        <ListItem property="Name Provided" value={data?.verificationResponse?.name_provided} />
        <ListItem property="Registered Name" value={data?.verificationResponse?.registered_name} />
        <ListItem
            property="Name Match Result"
            value={data?.verificationResponse?.name_match_result}
        />
        <ListItem property="Pan Status" value={data?.verificationResponse?.pan_status} />
        <ListItem
            property="Valid"
            value={data?.verificationResponse?.valid ? <CheckOutlined /> : <CloseOutlined />}
        />
    </>
);

export default PanFields;
