import React from 'react';
import { cn } from '../../lib/utils';

export const Skeleton = ({ className, ...props }) => {
    return (
        <div
            className={cn(
                "animate-pulse dark:bg-neutral-800 bg-neutral-300 rounded-lg",
                className
            )}
            {...props}
        />
    );
};

export const CourseCardSkeleton = () => (
    <div className="glass-card flex flex-col gap-4 p-4 overflow-hidden animate-pulse">
        <div className="w-full aspect-video dark:bg-neutral-800 bg-neutral-300 rounded-xl" />
        <div className="w-full flex flex-col items-start justify-start gap-3">
            <div className="w-full dark:bg-neutral-800 bg-neutral-300 h-4 rounded-lg" />
            <div className="w-2/3 dark:bg-neutral-800 bg-neutral-300 h-4 rounded-lg" />
            <div className="flex justify-between items-center w-full mt-2">
                <div className="w-16 dark:bg-neutral-800 bg-neutral-300 h-3 rounded-lg" />
                <div className="w-16 dark:bg-neutral-800 bg-neutral-300 h-3 rounded-lg" />
            </div>
        </div>
    </div>
);

export const StatCardSkeleton = () => (
    <div className="glass-card flex w-full h-24 items-center gap-4 animate-pulse p-4">
        <div className="rounded-full h-12 aspect-square dark:bg-neutral-800 bg-neutral-300" />
        <div className="w-full flex flex-col items-start justify-center gap-3">
            <div className="w-full dark:bg-neutral-800 bg-neutral-300 h-4 rounded-lg" />
            <div className="w-2/3 dark:bg-neutral-800 bg-neutral-300 h-4 rounded-lg" />
        </div>
    </div>
);

export default Skeleton;
