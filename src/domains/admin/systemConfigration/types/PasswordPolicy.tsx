export type PasswordPolicyResponse = {
    data: {
        id: number;
        level: number;
        minLength: number;
        minPasswordAge: number;
        maxPasswordAge: number;
        minChangeChars: number;
        prohibitPasswordReuse: boolean;
        prohibitPasswordReuseTimes: number | null;
        maxInvalidLoginAttempts?: number;
        lockEffectivePeriod?: number;
        lockoutTimespan?: number;
        enableBannedPasswords?: boolean;
        customBannedPasswords?: string;
        preventPersonalDataInPassword?: boolean;
        createdAt: string;
        updatedAt: string;
    }[];
};
export type PasswordPolicy = {
    id?: number;
    level: number;
    minLength: number;
    minPasswordAge: number;
    maxPasswordAge: number;
    minChangeChars: number;
    prohibitPasswordReuse?: boolean;
    prohibitPasswordReuseTimes?: number | null;
    maxInvalidLoginAttempts?: number;
    lockEffectivePeriod?: number;
    lockoutTimespan?: number;
    enableBannedPasswords?: boolean;
    customBannedPasswords?: string;
    preventPersonalDataInPassword?: boolean;
    createdAt?: string;
    updatedAt?: string;
};

export type updatePasswordPolicy = {
    id?: number;
    level?: number;
    minLength?: number;
    minPasswordAge?: number;
    maxPasswordAge?: number;
    minChangeChars?: number;
    prohibitPasswordReuse?: boolean;
    prohibitPasswordReuseTimes?: number | null;
    maxInvalidLoginAttempts?: number;
    lockEffectivePeriod?: number;
    lockoutTimespan?: number;
    enableBannedPasswords?: boolean;
    customBannedPasswords?: string;
    preventPersonalDataInPassword?: boolean;
};
export type RolePermissionAccessData = {
    view?: boolean;
    write?: boolean;
    update?: boolean;
};
