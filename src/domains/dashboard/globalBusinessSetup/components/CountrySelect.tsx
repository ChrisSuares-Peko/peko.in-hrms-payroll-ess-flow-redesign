// import { useMemo, useState } from 'react';

// import { Select, Avatar, Form } from 'antd';

// import { useCountries } from '../hooks/useCountries';
// import { Country } from '../types/globalBusinessSetup';

// const { Option } = Select;

// interface CountrySelectProps {
//     name?: string;
//     formik?: any; // <-- Formik form bag
//     onCountryChange?: (country: Country | null) => void;
//     filterQuery?: string;
//     placeholder?: string;
//     value?: string;
//     onChange?: (value: string) => void;
//     disabled?: boolean;
//     className?: string;
//     style?: React.CSSProperties;
// }

// //
// // --------------------------------------------------
// // Standalone version (no Formik)
// // --------------------------------------------------
// const BasicCountrySelect = ({
//     onCountryChange,
//     placeholder = 'Select country',
//     value,
//     onChange,
//     ...props
// }: CountrySelectProps) => {
//     const { countries, loading } = useCountries();

//     const [query, setQuery] = useState('');

//     const filtered = useMemo(() => {
//         if (!query.trim()) return countries;
//         return countries.filter(c => c.name.toLowerCase().includes(query.toLowerCase()));
//     }, [query, countries]);

//     return (
//         <Select
//             showSearch
//             allowClear
//             value={value}
//             placeholder={placeholder}
//             loading={loading}
//             onSearch={val => setQuery(val)}
//             filterOption={false} // we handle filtering manually
//             onChange={val => {
//                 const selectedCountry = countries.find(c => c._id === val) || null;

//                 onCountryChange?.(selectedCountry);
//                 onChange?.(val);
//             }}
//             {...props}
//         >
//             {filtered.map(country => (
//                 <Option key={country._id} value={country._id}>
//                     <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
//                         <Avatar src={country.logo} size={24} shape="square" />
//                         {country.name}
//                     </div>
//                 </Option>
//             ))}
//         </Select>
//     );
// };

// //
// // --------------------------------------------------
// // Formik Version
// // --------------------------------------------------
// const FormikCountrySelect = ({
//     name,
//     formik,
//     onCountryChange,
//     filterQuery = 'is_active=true',
//     placeholder = 'Select country',
//     ...props
// }: CountrySelectProps) => {
//     const fieldValue = name ? formik.values[name] : undefined;
//     const error = name && formik.touched[name] && formik.errors[name];

//     return (
//         <Form.Item label="Country" validateStatus={error ? 'error' : ''} help={error}>
//             <BasicCountrySelect
//                 {...props}
//                 filterQuery={filterQuery}
//                 value={fieldValue}
//                 onChange={val => formik.setFieldValue(name, val)}
//                 onCountryChange={onCountryChange}
//                 placeholder={placeholder}
//             />
//         </Form.Item>
//     );
// };

// //
// // --------------------------------------------------
// // Smart Export
// // --------------------------------------------------
// const CountrySelect = ({ formik, name, ...props }: CountrySelectProps) => {
//     if (formik && name) {
//         return <FormikCountrySelect formik={formik} name={name} {...props} />;
//     }

//     return <BasicCountrySelect {...props} />;
// };

// export default CountrySelect;
