import React, { useEffect, useRef } from 'react';
import { Upload, CheckCircle } from 'lucide-react';

const WIDGET_SRC = 'https://upload-widget.cloudinary.com/global/all.js';

// The widget script is no longer in index.html, so pull it in the first time
// this component mounts. Resolves immediately if it is already on the page.
const loadWidgetScript = () => new Promise((resolve, reject) => {
    if (window.cloudinary) return resolve();
    const existing = document.querySelector(`script[src="${WIDGET_SRC}"]`);
    if (existing) {
        existing.addEventListener('load', resolve);
        existing.addEventListener('error', reject);
        return;
    }
    const script = document.createElement('script');
    script.src = WIDGET_SRC;
    script.async = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
});

const CloudinaryUpload = ({ onUploadSuccess, currentUrl }) => {
    const widgetRef = useRef();

    useEffect(() => {
        let cancelled = false;
        loadWidgetScript().then(() => {
            if (cancelled) return;
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
        }).catch(() => {
            console.error('[CloudinaryUpload] Failed to load the upload widget script.');
        });
        return () => { cancelled = true; };
    }, [onUploadSuccess]);

    return (
        <div className="flex flex-col gap-2">
            <button
                type="button"
                onClick={() => widgetRef.current?.open()}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-clay-sm border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 transition-all font-semibold text-sm"
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
