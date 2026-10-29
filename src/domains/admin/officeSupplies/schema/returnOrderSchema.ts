import * as Yup from 'yup';

export const returnOrderSchema = () => {
    const schema = Yup.object().shape({
        returnStatus: Yup.string()
            .oneOf(
                ['Return Rejected', 'Return Initiated', 'Return Completed'],
                'Please select a valid return status'
            )
            .required('Return status is required.'),

        returnPickUpDate: Yup.string()
            .test(
                'is-required-when-return-initiated',
                'Return pick-up date is required when return status is "Return Initiated".',
                function validateReturnPickupRequired(value) {
                    const { returnStatus } = this.parent;
                    if (returnStatus === 'Return Initiated') {
                        return !!value; // Return true if returnPickUpDate is present
                    }
                    return true; // No need to validate if returnStatus is not "Return Initiated"
                }
            )
            .test(
                'is-not-empty-when-required',
                'Return pick-up date cannot be empty when return status is "Return Initiated".',
                function validateReturnPickupNotEmpty(value) {
                    const { returnStatus } = this.parent;
                    if (returnStatus === 'Return Initiated') {
                        return value !== ''; // Check that it's not an empty string
                    }
                    return true; // No need to validate if returnStatus is not "Return Initiated"
                }
            )
            .nullable()
            .notRequired(), // Allows null or empty string if return status is not "Return Initiated"
    });

    return schema;
};
