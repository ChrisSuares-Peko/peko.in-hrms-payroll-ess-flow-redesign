// import dayjs from "dayjs";

// import { IForm } from "../types/forms";

// export const generateInitialValues = (form: IForm, reduxValues: any) => {
//     const values: any = { pages: {} };

//     form.pages.forEach((page: { _id: string | number; sections: any[]; }) => {
//         values.pages[page._id] = {};

//         // 🔍 find matching page from reduxValues
//         const reduxPage = reduxValues?.pages?.find(
//             (p: any) => p.page === page._id
//         );

//         page.sections.forEach((section: { _id: string | number; fields: any[]; }) => {
//             values.pages[page._id][section._id] = {};

//             // 🔍 find matching section
//             const reduxSection = reduxPage?.sections?.find(
//                 (s: any) => s.section === section._id
//             );

//             // 🔍 flatten fields from instances
//             const reduxFields =
//                 reduxSection?.instances?.[0]?.fields ?? [];

//             section.fields.forEach((field: { name: string | number; type: string; default_value: string | boolean | never[] | null | undefined; }) => {
//                 const reduxField = reduxFields.find(
//                     (f: any) => f.name === field.name
//                 );

//                 if (reduxField && reduxField.value !== undefined) {
//                     values.pages[page._id][section._id][field.name] =
//                         reduxField.value;
//                 } else if (field.type === 'date' && field.default_value) {
//                     values.pages[page._id][section._id][field.name] =
//                         dayjs(field.default_value).format('YYYY-MM-DD');
//                 } else {
//                     values.pages[page._id][section._id][field.name] =
//                         field.default_value ?? getDefaultValue(field.type);
//                 }
//             });
//         });
//     });

//     return values;
// };

// const getDefaultValue = (type: string) => {
//     switch (type) {
//         case 'text':
//         case 'textarea':
//         case 'email':
//         case 'radio':
//             return '';
//         case 'number':
//             return undefined;
//         case 'checkbox':
//             return false;
//         case 'date':
//         case 'file':
//         case 'image':
//             return null;
//         case 'select':
//             return [];
//         default:
//             return '';
//     }
// };
