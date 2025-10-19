import React, { useState, useEffect } from "react";
import { Shield, Download, Share2 } from "lucide-react";

export default function BlockchainDigitalID({ standalone = false }) {
    const [blockchainData, setBlockchainData] = useState({
        idHash: '',
        blockReference: '',
        lastUpdated: '',
        verified: false
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBlockchainData();
    }, []);

    const fetchBlockchainData = async () => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                setLoading(false);
                return;
            }

            const response = await fetch('http://localhost:5000/api/auth/blockchain-id', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setBlockchainData({
                    idHash: data.idHash || '',
                    blockReference: data.blockReference || '',
                    lastUpdated: data.lastUpdated ? new Date(data.lastUpdated).toLocaleDateString() : '',
                    verified: data.verified || false
                });
            } else {
                // Fallback to empty data if no blockchain data exists yet
                setBlockchainData({
                    idHash: '',
                    blockReference: '',
                    lastUpdated: '',
                    verified: false
                });
            }
        } catch (error) {
            console.error('Error fetching blockchain data:', error);
            // Fallback to empty data
            setBlockchainData({
                idHash: '',
                blockReference: '',
                lastUpdated: '',
                verified: false
            });
        } finally {
            setLoading(false);
        }
    };

    const downloadID = async () => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch('http://localhost:5000/api/auth/download-digital-id', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'digital-id.pdf';
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } else {
                const errorData = await response.json();
                alert(errorData.message || 'Digital ID not yet available for download');
            }
        } catch (error) {
            console.error('Error downloading digital ID:', error);
            alert('Download failed');
        }
    };

    const shareID = async () => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch('http://localhost:5000/api/auth/generate-share-link', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                navigator.clipboard.writeText(data.shareLink);
                alert('Share link copied to clipboard!');
            } else {
                alert('Failed to generate share link');
            }
        } catch (error) {
            console.error('Error generating share link:', error);
            alert('Share failed');
        }
    };


    if (loading) {
        return (
            <div className={`p-4 lg:p-6 bg-white rounded-2xl shadow ${standalone ? 'max-w-lg mx-auto' : ''}`}>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Blockchain Digital ID
                </h2>
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="text-slate-500 mt-2">Loading blockchain data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`p-4 lg:p-6 bg-white rounded-2xl shadow ${standalone ? 'max-w-lg mx-auto' : ''}`}>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Blockchain Digital ID
            </h2>
            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl p-4 lg:p-6 text-white relative">
                <div className="absolute top-3 right-3 lg:top-4 lg:right-4">
                    <Shield className="w-5 h-5 lg:w-6 lg:h-6" />
                </div>
                <h3 className="font-semibold text-base lg:text-lg">Digital Identity Card</h3>
                <p className="mt-2 text-xs lg:text-sm">
                    {blockchainData.verified ? 'Blockchain Verified' : 'Pending Verification'}
                </p>
                <div className="mt-3 lg:mt-4 space-y-1">
                    <p className="text-xs break-all">
                        <strong>ID Hash:</strong><br />
                        {blockchainData.idHash || 'Not generated yet'}
                    </p>
                    <p className="text-xs">
                        <strong>Blockchain Reference:</strong><br />
                        {blockchainData.blockReference || 'Not recorded yet'}
                    </p>
                    <p className="text-xs">
                        <strong>Last Updated:</strong><br />
                        {blockchainData.lastUpdated || 'Never'}
                    </p>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-4">
                <button 
                    onClick={downloadID}
                    disabled={!blockchainData.verified}
                    className={`flex-1 py-2 px-4 rounded-xl text-xs lg:text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                        blockchainData.verified 
                            ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                >
                    <Download className="w-4 h-4" />
                    Download ID
                </button>
                <button 
                    onClick={shareID}
                    disabled={!blockchainData.verified}
                    className={`flex-1 py-2 px-4 rounded-xl text-xs lg:text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                        blockchainData.verified 
                            ? 'border border-slate-300 hover:bg-slate-50' 
                            : 'border border-gray-200 text-gray-500 cursor-not-allowed'
                    }`}
                >
                    <Share2 className="w-4 h-4" />
                    Share ID
                </button>
            </div>
        </div>
    );
}