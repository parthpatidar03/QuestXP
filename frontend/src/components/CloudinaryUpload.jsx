import React, { useEffect, useRef } from 'react';
import { Upload, CheckCircle } from 'lucide-react';

const CloudinaryUpload = ({ onUploadSuccess, currentUrl }) => {
    const widgetRef = useRef();

    useEffect(() => {
        // Initialize widget
        widgetRef.current = window.cloudinary.createUploadWidget(
            {
                cloudName: 'dqy5070px', // Replace with your cloud name
                uploadPreset: 'questxp_unsigned', // Replace with your unsigned preset
                sources: ['local', 'url', 'google_drive'],
                multiple: false,
                resourceType: 'video',
                clientAllowedFormats: ['mp4', 'mov', 'webm'],
                maxFileSize: 100000000, // 100MB
            },
            (error, result) => {
                if (!error && result && result.event === "success") {
                    console.log("Done! Here is the image info: ", result.info);
                    onUploadSuccess(result.info.secure_url);
                }
            }
        );
    }, [onUploadSuccess]);

    return (
        <div className="flex flex-col gap-2">
            <button
                type="button"
                onClick={() => widgetRef.current.open()}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 transition-all font-semibold text-sm"
            >
                <Upload className="w-4 h-4" />
                {currentUrl ? 'Change Video' : 'Upload Video to Cloudinary'}
            </button>
            {currentUrl && (
                <div className="flex items-center gap-2 text-[10px] text-success font-medium">
                    <CheckCircle className="w-3 h-3" />
                    Video ready for production delivery
                </div>
            )}
        </div>
    );
};

export default CloudinaryUpload;
