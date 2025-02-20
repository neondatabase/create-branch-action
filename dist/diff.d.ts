import { type Branch } from '@neondatabase/api-client';
import { BranchComparisonInput, PointInTime } from './utils.js';
export type BranchDiff = {
    sql: string;
    hash: string;
    compareBranch: Branch;
    baseBranch: Branch;
    database: string;
};
export type SummaryComment = {
    url?: string;
    operation: 'created' | 'updated' | 'noop' | 'deleted';
};
export declare function diff(projectId: string, compareBranchInput: BranchComparisonInput, apiKey: string, apiHost: string, database: string, pointInTime?: PointInTime): Promise<BranchDiff>;
export declare function summary(sql: string, hash: string, compareBranch: Branch, baseBranch: Branch, database: string, projectId: string): string;
export declare function upsertGitHubComment(token: string, diff: string, hash: string): Promise<SummaryComment>;
