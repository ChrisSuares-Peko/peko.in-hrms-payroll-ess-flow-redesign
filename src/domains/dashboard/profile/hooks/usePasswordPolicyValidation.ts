const usePasswordPolicyValidation = (passwordPolicy: any = {}) => {
    const validatePassword = (password: any) => {
        const errors = [];
        const { minLength, customBannedPasswords, enableBannedPasswords } = passwordPolicy;

        if ((passwordPolicy.level >= 1 && password.length === 0) || !password) {
            errors.push('Password cannot be empty.');
        }

        if (passwordPolicy.level >= 2 && password.length < minLength) {
            errors.push(`Password must be at least ${minLength} characters long.`);
        }

        if (passwordPolicy.level >= 3) {
            if (!/[a-z]/.test(password)) {
                errors.push('Password must contain at least one lowercase letter.');
            }
            if (!/[A-Z]/.test(password)) {
                errors.push('Password must contain at least one uppercase letter.');
            }
            if (!/[0-9]/.test(password)) {
                errors.push('Password must contain at least one number.');
            }
        }

        if (passwordPolicy.level >= 4 && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            errors.push('Password must contain at least one special character.');
        }

        if (passwordPolicy.level >= 5) {
            if (!password || /(.)\1{1,}/.test(password.toLowerCase())) {
                errors.push('Password cannot contain two or more consecutive repeated characters.');
            }
        }

        if (enableBannedPasswords && customBannedPasswords) {
            const bannedPasswords = passwordPolicy.customBannedPasswords
                .split(',')
                .map((p: any) => p.trim());

            if (bannedPasswords.includes(password)) {
                const formattedBannedPasswords = bannedPasswords
                    .map((p: any) => `"${p}"`)
                    .join(', ');
                errors.push(`The password ${formattedBannedPasswords} is not allowed.`);
            }
        }

        return errors;
    };

    return { validatePassword };
};

export default usePasswordPolicyValidation;
