import * as Yup from 'yup';

export const clonePermissionSchema = Yup.object().shape({
    fromPartnerId: Yup.mixed()
        .required('Please select a partner to clone from')
        .test(
            'from-partner-selected',
            'Please select a partner to clone from',
            value => value === 'default' || (value !== null && value !== undefined && value !== '')
        ),
    toPartnerId: Yup.number()
        .typeError('Please select a partner to clone to')
        .required('Please select a partner to clone to')
        .test(
            'different-partner',
            'Source and target partner must be different',
            function isDifferent(value) {
                const { fromPartnerId } = this.parent;
                if (fromPartnerId === 'default' || value === undefined) return true;
                return String(fromPartnerId) !== String(value);
            }
        ),
});
