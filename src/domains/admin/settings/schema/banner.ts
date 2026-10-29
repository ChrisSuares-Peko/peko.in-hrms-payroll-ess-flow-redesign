import * as Yup from 'yup';

const banner = Yup.object().shape({
    deviceType: Yup.string().required('Please select the category'),
    bannerImage: Yup.string().required('Please upload the image'),
    bannerLink: Yup.string()
        .required('Please enter the banner link')
        .url('Banner link must be a valid URL.'),
    position: Yup.string().required('Please select a position'),
    bannerTitle: Yup.string().optional(),
    description: Yup.string().optional(),
    buttonText: Yup.string().optional(),
});

export default banner;
