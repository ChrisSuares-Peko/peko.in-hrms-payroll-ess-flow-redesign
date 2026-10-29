export interface ConnectedApp {
    id: number;
    client_id: string;
    client_name: string;
    logo_uri?: string | null;
    scopes: string[];
    grantedAt: string;
}

export interface ConnectedAppsResponse {
    apps: ConnectedApp[];
}
