import React, { useState, useEffect } from 'react';
import api from '../../../services/api';

const ProcessingStatus = ({ lectureId }) => {
    const [status, setStatus] = useState(null);

    useEffect(() => {
        let interval;
        const fetchStatus = async () => {
            try {
                // T029 [US2] Display Embedding Status
                const res = await api.get(`/api/doubts/${lectureId}/status`);
                setStatus(res.data);
                
                if (res.data.embeddingStatus === 'complete' || res.data.embeddingStatus === 'failed') {
                    clearInterval(interval);
                }
            } catch (err) {
                console.error(err);
            }
        };

        fetchStatus();
        interval = setInterval(fetchStatus, 3000);
        
        return () => clearInterval(interval);
    }, [lectureId]);

    if (!status) return <div>Loading status...</div>;

    return (
        <div className="bg-gray-800 p-4 rounded text-white text-sm">
            <h3 className="font-bold mb-2">AI Processing Status</h3>
            <div className="flex justify-between py-1">
                <span>Embedding:</span>
                <span className={status.embeddingStatus === 'complete' ? 'text-green-400' : 'text-yellow-400'}>
                    {status.embeddingStatus}
                </span>
            </div>
            {status.errorReason && (
                <div className="text-red-400 text-xs mt-1">Error: {status.errorReason}</div>
            )}
        </div>
    );
};

export default ProcessingStatus;
