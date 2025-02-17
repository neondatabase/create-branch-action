import { Branch, createApiClient } from '@neondatabase/api-client';
interface CreateResponse {
    databaseURL: string;
    databaseURLPooled: string;
    databaseHost: string;
    databaseHostPooled: string;
    password: string;
    branchId: string;
    createdBranch: boolean;
}
export declare function create(apiKey: string, apiHost: string, projectId: string, usePrisma: boolean, database: string, role: string, schemaOnly: boolean, sslMode: string, suspendTimeout: number, branchName?: string, parentBranch?: string): Promise<CreateResponse>;
export declare function getBranch(client: ReturnType<typeof createApiClient>, projectId: string, branchIdentifier: string): Promise<Branch | undefined>;
interface GetOrCreateBranchParams {
    branchName?: string;
    projectId: string;
    schemaOnly: boolean;
    parentBranch?: string;
    suspendTimeout: number;
}
type GetOrCreateBranchResponse = Branch & {
    created: boolean;
};
export declare function getOrCreateBranch(client: ReturnType<typeof createApiClient>, params: GetOrCreateBranchParams): Promise<GetOrCreateBranchResponse>;
export declare function createBranch(client: ReturnType<typeof createApiClient>, params: GetOrCreateBranchParams): Promise<Branch>;
interface ConnectionInfoResponse {
    databaseUrl: string;
    databaseUrlPooled: string;
    databaseHost: string;
    databaseHostPooled: string;
    password: string;
}
interface GetConnectionInfoParams {
    branchId: string;
    projectId: string;
    usePrisma: boolean;
    sslMode: string;
    database: string;
    role: string;
}
export declare function getConnectionInfo(client: ReturnType<typeof createApiClient>, params: GetConnectionInfoParams): Promise<ConnectionInfoResponse>;
export {};
