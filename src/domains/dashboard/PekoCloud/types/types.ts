export interface InfoCardProps {
    icon: string;
    title: string;
    value: number | undefined | string;
    isCurrency?: boolean;
    isPercentage?: boolean;
    bgColor: string;
}

export interface ReminderCardProps {
    icon: string;
    title: string;
    subTitle: number | undefined | string;
    date: string;
    type: string;
}

export interface ReminderCarouselProps {
    arr: ReminderCardProps[];
}

export interface CardProps {
    icon: string;
    title: string;
    link: string;
    isActive: boolean;
}

export interface TaskData {
    icon: string;
    title: string;
    date: string;
    isLoading?: boolean;
    type: string;
}
