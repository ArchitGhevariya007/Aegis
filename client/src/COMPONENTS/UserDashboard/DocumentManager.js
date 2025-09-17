import React, { useState, useEffect } from "react";
import { authAPI } from "../../services/api";

const DocumentIcon = ({ className = "w-4 h-4" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);

const CameraIcon = ({ className = "w-4 h-4" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const IdCardIcon = ({ className = "w-4 h-4" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
    </svg>
);

const UploadIcon = ({ className = "w-4 h-4" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
    </svg>
);

export default function DocumentManager() {
    const [documents, setDocuments] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [verificationStatus, setVerificationStatus] = useState({
        documentAuthenticity: false,
        faceMatch: false,
        livenessCheck: false
    });

    useEffect(() => {
        fetchDocuments();
        fetchVerificationStatus();
    }, []);

    const fetchDocuments = async () => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) return;

            const response = await fetch('http://localhost:5000/api/auth/user-documents', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setDocuments(data.documents || []);
            }
        } catch (error) {
            console.error('Error fetching documents:', error);
        }
    };

    const fetchVerificationStatus = async () => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) return;

            const response = await fetch('http://localhost:5000/api/auth/verification-status', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setVerificationStatus(data.status || {
                    documentAuthenticity: false,
                    faceMatch: false,
                    livenessCheck: false
                });
            }
        } catch (error) {
            console.error('Error fetching verification status:', error);
        }
    };

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('document', file);

            const token = localStorage.getItem('authToken');
            const response = await fetch('http://localhost:5000/api/auth/upload-document', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (response.ok) {
                const data = await response.json();
                alert('Document uploaded successfully!');
                fetchDocuments(); // Refresh documents list
            } else {
                const error = await response.json();
                alert(`Upload failed: ${error.message}`);
            }
        } catch (error) {
            console.error('Error uploading document:', error);
            alert('Upload failed. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const downloadDocument = async (documentId, fileName) => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`http://localhost:5000/api/auth/download-document/${documentId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } else {
                alert('Failed to download document');
            }
        } catch (error) {
            console.error('Error downloading document:', error);
            alert('Download failed');
        }
    };

    const viewDocument = async (documentId) => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`http://localhost:5000/api/auth/view-document/${documentId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                window.open(url, '_blank');
            } else {
                alert('Failed to view document');
            }
        } catch (error) {
            console.error('Error viewing document:', error);
            alert('View failed');
        }
    };

    const getDocumentIcon = (type) => {
        switch (type) {
            case 'id_document':
                return { icon: IdCardIcon, bgColor: "bg-blue-100", iconColor: "text-blue-600" };
            case 'id_face':
                return { icon: CameraIcon, bgColor: "bg-green-100", iconColor: "text-green-600" };
            case 'live_face':
                return { icon: CameraIcon, bgColor: "bg-purple-100", iconColor: "text-purple-600" };
            default:
                return { icon: DocumentIcon, bgColor: "bg-gray-100", iconColor: "text-gray-600" };
        }
    };

    return (
        <div className="p-4 lg:p-6 bg-white rounded-2xl shadow">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <DocumentIcon className="w-5 h-5" />
                Document Manager
            </h2>
            
            <div className="space-y-4 lg:space-y-6">
                {/* Upload New Document */}
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-indigo-400 transition-colors">
                    <UploadIcon className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                    <p className="text-slate-600 mb-4">Upload additional documents</p>
                    <label className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg cursor-pointer hover:bg-indigo-700 transition-colors">
                        <UploadIcon className="w-4 h-4" />
                        {uploading ? 'Uploading...' : 'Choose File'}
                        <input
                            type="file"
                            className="hidden"
                            accept="image/*,.pdf"
                            onChange={handleFileUpload}
                            disabled={uploading}
                        />
                    </label>
                </div>

                {/* Uploaded Documents */}
                <div className="border rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium text-slate-700">Uploaded Documents</h3>
                        {documents.length > 0 && (
                            <span className="text-xs lg:text-sm text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                                ✓ {documents.filter(doc => doc.verified).length} Verified
                            </span>
                        )}
                    </div>
                    
                    {documents.length === 0 ? (
                        <p className="text-slate-500 text-center py-8">No documents uploaded yet</p>
                    ) : (
                        <div className="grid gap-3">
                            {documents.map((doc) => {
                                const { icon: IconComponent, bgColor, iconColor } = getDocumentIcon(doc.type);
                                return (
                                    <div key={doc._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg bg-slate-50 gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 ${bgColor} rounded-lg flex items-center justify-center flex-shrink-0`}>
                                                <IconComponent className={`w-5 h-5 ${iconColor}`} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-medium text-slate-800 text-sm lg:text-base">{doc.fileName}</p>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-xs lg:text-sm text-slate-500">
                                                        Uploaded: {new Date(doc.uploadDate).toLocaleDateString()}
                                                    </p>
                                                    {doc.verified && (
                                                        <span className="text-xs text-emerald-600">✓ Verified</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 sm:flex-shrink-0">
                                            <button 
                                                onClick={() => viewDocument(doc._id)}
                                                className="px-3 py-1 text-xs lg:text-sm border rounded-lg hover:bg-white transition-colors"
                                            >
                                                View
                                            </button>
                                            <button 
                                                onClick={() => downloadDocument(doc._id, doc.fileName)}
                                                className="px-3 py-1 text-xs lg:text-sm border rounded-lg hover:bg-white transition-colors"
                                            >
                                                Download
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Verification Status */}
                <div className="border rounded-xl p-4">
                    <h3 className="font-medium text-slate-700 mb-3">Verification Status</h3>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-xs lg:text-sm text-slate-600">Document Authenticity</span>
                            <span className={`text-xs lg:text-sm font-medium ${
                                verificationStatus.documentAuthenticity ? 'text-emerald-600' : 'text-amber-600'
                            }`}>
                                {verificationStatus.documentAuthenticity ? '✓ Verified' : '⏳ Pending'}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs lg:text-sm text-slate-600">Face Match</span>
                            <span className={`text-xs lg:text-sm font-medium ${
                                verificationStatus.faceMatch ? 'text-emerald-600' : 'text-amber-600'
                            }`}>
                                {verificationStatus.faceMatch ? '✓ Matched' : '⏳ Pending'}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs lg:text-sm text-slate-600">Liveness Check</span>
                            <span className={`text-xs lg:text-sm font-medium ${
                                verificationStatus.livenessCheck ? 'text-emerald-600' : 'text-amber-600'
                            }`}>
                                {verificationStatus.livenessCheck ? '✓ Passed' : '⏳ Pending'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}