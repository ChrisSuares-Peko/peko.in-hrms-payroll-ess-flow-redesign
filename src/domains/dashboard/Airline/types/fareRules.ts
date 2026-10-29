type PassengerRuleKey = 'ADT' | 'CHD' | 'INF';

interface PassengerRules {
    isDateOfBirthMandatory: boolean;
    isIdTypeMandatory: boolean;
    isDocumentNumberMandatory: boolean;
    isIssuingCountryCodeMandatory: boolean;
    isResidenceCountryCodeMandatory: boolean;
    isDateOfIssueMandatory: boolean;
    isExpiryDateMandatory: boolean;
    isPANMandatory: boolean;
    isSeatMandatory: boolean;
    isMealMandatory: boolean;
    isBaggageMandatory: boolean;
    isOtherAncillaryMandatory: boolean;
    isAdditionalIdTypeMandatory: boolean;
    isAdditionalDocumentNumberMandatory: boolean;
    passengerKeys: PassengerRuleKey[];
}

interface BookingRules {
    passengerRules: PassengerRules[];
    isGSTMandatory: boolean;
    isLeadEmailAddressMandatory: boolean;
    isLeadPhoneNumberMandatory: boolean;
    onHoldSupported: boolean;
}

interface SubSection {
    subSectionNumber: string;
    subCode: string;
    subTitle: string;
    paragraph: string;
}

interface FareRule {
    fareBasis: string;
    subSection: SubSection[];
}

interface AmountInfo {
    amount: number;
    amountApplication: string;
    applicableFeeRemarks: { value: string }[];
}

interface PenaltyInfo {
    applicationCode: string;
    amounts: AmountInfo[];
}

interface Penalty {
    type: string;
    penaltyInfo: PenaltyInfo[];
    cancelFeeInd?: boolean;
}

interface BaggageAllowance {
    segmentKey: string;
    carryOnBaggage: {
        paxType: string;
        value: string;
        unit: string;
    };
    checkedInBaggage: {
        paxType: string;
        value: string;
        unit: string;
    };
}

interface MiniFareRule {
    fareBasis: string;
    paxType: string;
    penalties: Penalty[];
    baggageAllowance: BaggageAllowance[];
}

export interface IFareRulesData {
    bookingRules: BookingRules;
    fareRules: FareRule[];
    miniFareRules: MiniFareRule[];
}
export interface IFareRules {
    fareQuotes: AllFareQuote;
    fareRules: FareRules[];
}

export interface AllFareQuote {
    combined: FareQuotes;
    inbount: FareQuotes;
    outbount: FareQuotes;
}

export interface SegmentBaggage {
    FreeText: string;
    Unit: string;
    Value: string;
}

export interface FareSegmentDetail {
    CabinBaggage?: SegmentBaggage;
    CheckedInBaggage?: SegmentBaggage;
    FlightInfoIndex: string;
}

export interface FareQuotes {
    IsRefundable: boolean;
    IsPassportRequiredAtBook: boolean;
    IsPassportRequiredAtTicket: boolean;
    IsPassportFullDetailRequiredAtBook: boolean;
    IsPanRequiredAtBook: boolean;
    IsPanRequiredAtTicket: boolean;
    GSTAllowed: boolean;
    IsGSTMandatory: boolean;
    RequiredFieldValidators?: {
        IsMealRequired: boolean;
        IsSeatRequired: boolean;
    };
    FareBreakdown: {
        PassengerType: number;
        PassengerCount: number;
        BaseFare: number;
        Tax: number;
        YQTax: number;
        AdditionalTxnFeeOfrd: number;
        AdditionalTxnFeePub: number;
        SegmentDetails?: FareSegmentDetail[];
    }[];
    Fare: {
        Tax: number;
        BaseFare: number;
        PublishedFare: number;
        OtherCharges: number;
    };
}

export interface FareRules {
    Destination: string;
    Origin: string;
    FareRuleDetail: string;
}
