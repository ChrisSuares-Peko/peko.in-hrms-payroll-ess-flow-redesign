export interface WhitelabelColors {
    primary: string;
    primaryRgb: string;
    primaryHover: string;
    primaryActive: string;
    cta: string;
    ctaHover: string;
    ctaActive: string;
    secondary: string;
    secondaryRgb: string;
    surface: string;
    surfaceRgb: string;
    surfaceSoft: string;
    muted: string;
    border: string;
    borderSoft: string;
}

export interface WhitelabelLogoProps {
    width: number;
    height?: number;
}

export interface Whitelabel {
    key: string;
    name: string;
    isPartner: boolean;
    showPoweredByPeko: boolean;
    colors: WhitelabelColors;
    logo?: string;
    favIcon?: string;
    logoProps: WhitelabelLogoProps;
}
