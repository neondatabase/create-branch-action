export type PointInTime = {
    type: 'lsn' | 'timestamp';
    value: string;
};
export type BranchInput = {
    type: 'id' | 'name';
    value: string;
};
export type BranchComparisonInput = {
    compare: BranchInput;
    base?: BranchInput;
};
export declare function getPointInTime(timestamp?: string, lsn?: string): PointInTime | undefined;
export declare function getBranchInput(compareBranch: string, baseBranch?: string): BranchComparisonInput;
export declare function getBranchURL(projectId: string, branchId: string): string;
