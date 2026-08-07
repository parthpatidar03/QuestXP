import React from 'react';
import { cn } from '../../lib/utils';

export const Skeleton = ({ className, ...props }) => {
    return (
        <div
            className={cn("skeleton animate-pulse", className)}
            {...props}
        />
    );
};

export const CourseCardSkeleton = () => (
    <div className="clay rounded-clay-lg flex flex-col gap-4 p-4 overflow-hidden animate-pulse">
        <div className="w-full aspect-video clay-sunk rounded-clay" />
        <div className="w-full flex flex-col items-start justify-start gap-3">
            <div className="w-full clay-sunk-sm h-4 rounded-full" />
            <div className="w-2/3 clay-sunk-sm h-4 rounded-full" />
            <div className="flex justify-between items-center w-full mt-2">
                <div className="w-16 clay-sunk-sm h-3 rounded-full" />
                <div className="w-16 clay-sunk-sm h-3 rounded-full" />
            </div>
        </div>
    </div>
);

export const StatCardSkeleton = () => (
    <div className="clay rounded-clay-lg flex w-full h-28 items-center gap-4 animate-pulse p-5">
        <div className="clay-sunk rounded-clay h-12 aspect-square shrink-0" />
        <div className="w-full flex flex-col items-start justify-center gap-3">
            <div className="w-full clay-sunk-sm h-4 rounded-full" />
            <div className="w-2/3 clay-sunk-sm h-4 rounded-full" />
        </div>
    </div>
);

export default Skeleton;
