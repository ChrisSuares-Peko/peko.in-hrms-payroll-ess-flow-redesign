import * as Yup from 'yup';

export const notificationSchema = Yup.object().shape({
    notificationTitle: Yup.string().trim().required('Please enter notification title')
     .min(3, 'Notification title must be at least 3 characters'),
    notificationBrief: Yup.string().trim().required('Please enter notification brief'),
    notificationCategory: Yup.string().trim().required('Please select category'),
    notificationTo: Yup.string().trim().required('Please select corporate'),
});
