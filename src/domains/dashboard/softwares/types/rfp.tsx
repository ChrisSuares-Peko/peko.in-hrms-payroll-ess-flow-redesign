// /* ================= REQUEST ================= */

// import { IProductCard } from './product';

// export interface IFindQuestionsRequestPayload {
//     userId: number;
//     userType: string;
//     parentCategory: string;
// }

// /* ================= RESPONSE ================= */

// export interface IFindQuestionsResponse {
//     questions: IQuestion[];
// }

// /* ================= QUESTION TYPES ================= */

// export type QuestionTarget = 'general_details' | 'specialised_details';

// export type AnswerType = 'singleChoice' | 'multipleChoices';

// export interface IQuestionOption {
//     detail: string;
//     value: string;
// }

// export interface IQuestionAnswer {
//     type: AnswerType;
//     key: string;
//     options: IQuestionOption[];
// }

// export interface IQuestion {
//     question: string;
//     answers: IQuestionAnswer[];
//     target: QuestionTarget;
// }

// /* ================= ANSWERS STATE ================= */

// export type AnswerValue = string | string[];

// export interface AnswerEntry {
//     question: string;
//     answer: AnswerValue;
//     target: QuestionTarget;
//     type: AnswerType;
// }

// export type AnswerMap = Record<string, AnswerEntry>;

// /* ================= FINAL PAYLOAD ================= */

// export interface FinalPayload {
//     softwareCategory: string;
//     generalQuestions: {
//         question: string;
//         answer: AnswerValue;
//     }[];
//     specializedQuestions: {
//         question: string;
//         answer: AnswerValue;
//     }[];
// }
// export interface IGetRecommandationRequestPayload {
//     userId: number;
//     userType: string;
//     body: FinalPayload;
// }

// export interface IGetRecommandationResponse {
//     items: IProductCard[];
// }

/* ================= REQUEST ================= */

import { IProductCard } from './product';

export interface IFindQuestionsRequestPayload {
    userId: number;
    userType: string;
    parentCategory: string;
}

/* ================= RESPONSE ================= */

export interface IFindGeneralQuestionsResponse {
    generalQuestions: IQuestion[];
}

export interface IFindCategoryQuestionsResponse {
    categoryQuestions: IQuestion[];
}

/* ================= QUESTION TYPES ================= */
export type AnswerType =
    | 'singleChoice'
    | 'multipleChoices'
    | 'blockRadioCard'
    | 'inlineTextCard'
    | 'multiSelectorDropDown';

export interface IFollowUpQuestion {
    label: string;
    key: string;
    type: AnswerType;
    placeholder?: string;
    options: IQuestionOption[];
}
export interface IQuestionOption {
    label: string;
    value: string;
    followUp?: IFollowUpQuestion;
}

export interface IQuestion {
    question: string;
    key: string;
    type: AnswerType;
    options: IQuestionOption[];
}

export interface IGeneralQuestions {
    generalQuestions: IQuestion[];
}

export interface IFollowUpAnswer {
    question: string;
    answer: string | string[];
}

export interface IQuestionAnswerPayload {
    question: string;
    answer: string | string[];
    followUp?: IFollowUpAnswer;
}

/* ================= ANSWERS STATE ================= */

export type AnswerValue = string | string[];

export interface AnswerEntry {
    question: string;
    answer: string[];
    followUp?: {
        question: string;
        answer: string[];
    };
}

export type AnswerMap = Record<string, AnswerEntry>;

/* ================= FINAL PAYLOAD ================= */

export interface FinalPayloadQuestion {
    question: string;
    answer: string | string[];
    followUp?: {
        question: string;
        answer: string | string[];
    };
}

export type FinalPayload = {
    softwareCategory: string;
    generalQuestions: Record<string, FinalPayloadQuestion>;
    specializedQuestions: Record<string, FinalPayloadQuestion>;
};

/* ================= SUBMIT ANSWER REQUEST ================= */

export interface ISubmitAnswersRequestPayload {
    userId: number;
    userType: string;
    body: FinalPayload;
}

/* ================= SUBMIT ANSWER RESPONSE ================= */

export interface ISubmitAnswersResponse {
    toolkitId: string;
}

/* ================= RECOMMENDATION REQUEST ================= */

export interface IGetRecommandationRequestPayload {
    userId: number;
    userType: string;
    toolkitId: string;
}

/* ================= RECOMMENDATION RESPONSE ================= */

export interface IGetRecommandationResponse {
    items: IProductCard[];
    status: string;
}
