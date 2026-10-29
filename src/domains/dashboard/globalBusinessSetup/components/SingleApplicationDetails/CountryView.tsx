// import { Avatar, Typography, Space } from 'antd';

// import { useCountries } from '../../hooks/useCountries';
import { Country } from '../../types/globalBusinessSetup';

// const { Text } = Typography;

type CountryViewProps = {
    country: Country | string | null;
};

// function CountryDisplay({ country }: { country: Country }) {
//     return (
//         <Space align="center">
//             <Avatar
//                 src={country.logo}
//                 shape="square"
//                 size={24}
//                 style={{
//                     borderRadius: 6,
//                     border: '1px solid #eee',
//                     objectFit: 'cover',
//                 }}
//             />
//             <Text>{country.name || 'Not available'}</Text>
//         </Space>
//     );
// }

export default function CountryView({ country }: CountryViewProps) {
    // const { countries, loading, error } = useCountries();
    // if (!country) {
    //     return <Text type="secondary">Country not available</Text>;
    // }
    // // If object passed directly → render immediately
    // if (typeof country === 'object' && country.name) {
    //     return <CountryDisplay country={country} />;
    // }
    // // Otherwise treat as ID → lookup
    // if (loading) {
    //     return <Skeleton.Input active size="small" style={{ width: 120 }} />;
    // }
    // if (error) {
    //     return <Text type="secondary">Error loading country</Text>;
    // }
    // const found = countries.find(c => c._id === country);
    // if (!found) {
    //     return <Text type="secondary">Country not found</Text>;
    // }
    // return <CountryDisplay country={found} />;
}
