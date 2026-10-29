export type SuccessGenericResponse<T> = {
    status: boolean;
    message: string;
    responseCode: string;
    data: T;
};

export type ErrorGenericResponse = {
    status: boolean;
    message: string;
    responseCode: string;
    data: {};
};
