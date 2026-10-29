export type dashboardResponse = {
    counters: counter;
    projects: Project[];
};
export type singleViewResponse = {
    success: boolean;
    data: Project;
};
export type selectProjectResponse = {
    projectOptions: projectOptions[];
};
export type questionsResponse = {
    data: {
        answerSheet: {};
        questionSheet: [];
    };
};

export type projectOptions = {
    id: number;
    name: string;
};
export type projectListingResponse = {
    success: boolean;
    data: Project[];
    count: number;
    totalPages: number;
};
export type neutrilizeResponse = {
    success: boolean;
    data: Project;
    calculatedRate: number;
    co2FootPrint: string;
    usdToInr: number;
};

export type SingleProjectPayload = {
    userId: number;
    userType: string;
    projectId: string | undefined | number;
};
export type AllProjectPayload = {
    userId: number;
    userType: string;
    page: number;
    searchQuery: string;
    itemsPerPage: number;
};

export type Project = {
    id: number;
    name: string;
    description: string | null;
    working: string | null;
    logo: string;
    country: string;
    countryCode: string;
    latLng: string | null;
    city: string;
    address: string;
    goal: string;
    body: {
        html: string | TrustedHTML;
    };
    status: boolean;
    createdAt: string;
    updatedAt: string;
    categoryId: number;
    vendorId: number;
    category: {
        name: string;
        logo: string;
    };
    rate: {
        priceToSMB: any;
        priceToIndividual: any;
        priceToPartner: any;
    };
    packages: {
        id: number;
        name: string;
        description: string;
        amount: any;
        credits: any;
        logo: string;
        status: boolean;
        createdAt: string;
        updatedAt: string;
        projectId: number;
    }[];
    photos: {
        projectImageUrl: string;
        imageField: string;
    }[];
    vendor: {
        id: number;
        vendorName: string;
        type: string;
        isActive: boolean;
        apiUrl: string;
        healthUrl: string;
        country: string | null;
        optional1: string;
        optional2: string;
        optional3: string;
        optional4: string;
        optional5: string;
        optional6: string;
        currency: string | null;
        createdAt: string;
        updatedAt: string;
    };
    ProjectGoalsAssociation: {
        id: number;
        name: string;
        logo: string;
        status: boolean;
        createdAt: string;
        updatedAt: string;
        ProjectGoals: {
            projectId: number;
            goalId: number;
            createdAt: string;
            updatedAt: string;
        };
    }[];
};

export type counter = {
    communityOffset: number;
    projectsInvested: number;
    totalProjects: number;
    userOffset: any;
    co2FootPrint: any;
};

export type filterState = {
    page: number;
    searchQuery: string;
    itemsPerPage: number;
};

export type transactionListingPayload = {
    userId: number;
    userType: string;
    from: string;
    to: string;
    searchText: string;
    sort: string;
    page: number;
    itemsPerPage: number;
    filter: string;
};

export type transactionListingResponse = {
    success: boolean;
    count: number;
    data: tableData[];
    totalPages: number;
    usdToAed: number;
};

export type tableData = {
    transactionDate: string;
    transactionId: string;
    projectName: string;
    creditPurchased: string;
    amount: any;
    status: string;
};

export type transactionType = {
    id: number;
    transactionId: string;
    transactionDate: string;
    transactionType: string;
    amount: any;
    rate: null | number;
    units: null | number;
    co2Offset: string;
    advisorCashback: string;
    partnerCashback: string;
    remarks: string;
    status: string;
    userId: string;
    providerId: string;
    creditPurchased: string;
    certificateNo: number;
    createdAt: string;
    updatedAt: string;
    packageId: null | number;
    projectId: number;
    credentialId: number;
    orderId: number;
    inventoryHistoryId: null | number;
    project: {
        id: number;
        name: string;
        description: string;
        working: string;
        logo: string;
        country: string;
        countryCode: string;
        latLng: string;
        city: string;
        address: string;
        goal: null | string;
        body: null | string;
        status: boolean;
        createdAt: string;
        updatedAt: string;
        categoryId: number;
        vendorId: number;
    };
    inventoryHistory: null | any; // Update this with the correct type if known
};

export type filtersState = {
    searchQuery: string;
    sort: string;
    page: number;
    itemsPerPage: number;
    filter: string;
    from: string;
    to: string;
};

export type InitialValues = {
    searchQuery: string;
    category: string;
    sort: 'ASC' | 'DESC';
    page: number;
    itemsPerPage: number;
    filter: string;
    from: string;
    to: string;
};

export type paymentData = {
    amount: string;
    amountInInr: string;
    co2Offset: string;
    credits: string;
    selectedPackage: {
        id: any;
    };
    selectedProject: {
        id: string | number | undefined;
    };
    projectName: string | undefined;
};

export type Option = {
    id: number;
    title: string;
    units: Unit[];
};

export type Unit = {
    map(
        arg0: (unit: any, i: any) => import('react/jsx-runtime').JSX.Element
    ): import('react').ReactNode;
    id: number;
    EF: number;
    unit: string;
};

export type question = {
    id: number;
    options: Option[];
    question: string;
    toolTip: string;
};

export type Category = {
    id: number;
    category: string;
    questions: question[];
};

export type QuestionnaireProps = {
    questionSheet: Category[] | undefined;
};

export type Answer = {
    selectedUnitId: number | null;
    value: any;
};

export type AnswerSheet = {
    [categoryID: number]: {
        category: string;
        type: string;
        answers: [
            {
                [questionID: number]: {
                    [optionId: number]: Answer;
                };
            },
        ];
    };
};

export type GroupedByCategory = {
    category: string;
    totalCo2Usage: number;
};

export type resultChart = {
    totalCo2Usage: string;
    groupedByCategory: GroupedByCategory[];
};

export type AnswersResponse = {
    success: boolean;
    data: resultChart;
};

export type balanceResponse = {
    success: boolean;
    data: {};
};

export type ValidateAnswers = {
    [categoryID: number]: boolean;
};

export type balanceQuery = {
    amount: number;
    projectId: number;
    credits: number;
};
