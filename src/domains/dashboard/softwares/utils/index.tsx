export const questions = [
    {
        questionId: 'monthly_budget',
        questionText: 'What is your monthly budget? (in USD)',
        questionType: 'integer',
        isRequired: true,
        validation: { min: 0 },
    },
    {
        questionId: 'industry',
        questionText: 'What industry do you belong to?',
        questionType: 'string',
        isRequired: true,
    },
    {
        questionId: 'company_size',
        questionText: 'What is your company size?',
        questionType: 'integer',
        isRequired: true,
        validation: { min: 1 },
    },
    {
        questionId: 'purchase_likelihood',
        questionText: 'How likely are you to purchase a software solution in the next 3 months?',
        questionType: 'select',
        isRequired: false,
        options: ['not_likely', 'somewhat_likely', 'very_likely'],
    },
];

export const sortList = [
    { label: 'Name', value: 'name' },
    { label: 'Rating', value: 'rating' },
];
