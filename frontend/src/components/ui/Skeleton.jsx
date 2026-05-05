import React from 'react';
import { cn } from '../../lib/utils';

const Skeleton = ({ className, ...props }) => {
    return (
        <div
            className={cn(
                "animate-pulse rounded-md bg-surface-2/80",
                className
            )}
            {...props}
        />
    );
};

export const CourseCardSkeleton = () => (
    <div className="glass-card flex flex-col gap-3 p-0 overflow-hidden">
        <Skeleton className="aspect-video w-full rounded-none" />
        <div className="p-4 space-y-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <div className="flex justify-between items-center">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-16" />
            </div>
        </div>
    </div>
);

export const StatCardSkeleton = () => (
    <div className="glass-card p-4 flex flex-col gap-2">
        <div className="flex items-center gap-2">
            <Skeleton className="w-8 h-8 rounded-lg" />
            <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-8 w-24 mt-1" />
    </div>
);

export default Skeleton;
