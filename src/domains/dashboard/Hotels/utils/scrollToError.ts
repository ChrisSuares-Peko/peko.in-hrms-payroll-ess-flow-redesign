const scrollToError = (errors: any) => {
    const errorKeys = Object.keys(errors);
    for (let i = 0; i < errorKeys.length; i += 1) {
        const key = errorKeys[i];
        const field: HTMLInputElement | null = document.querySelector(`input[name="${key}"]`);
        if (field) {
            field.scrollIntoView({ behavior: 'smooth', block: 'center' });
            field.focus();
            break; // stop after focusing the first found field
        }
    }
};

export const scrollToGuestsError = (errors: any, passengerIndex: number) => {
    const errorKeys = Object.keys(errors);
    const form = document.querySelector(`#hotelUserDetailsForm-${passengerIndex}`);
    if (!form) return;

    for (let i = 0; i < errorKeys.length; i += 1) {
        const key = errorKeys[i];
        const field = form.querySelector<HTMLInputElement>(`input[name="${key}"]`);
        if (field) {
            field.scrollIntoView({ behavior: 'smooth', block: 'center' });
            field.focus();
            break; // stop after focusing the first found field
        }
    }
};

export default scrollToError;
