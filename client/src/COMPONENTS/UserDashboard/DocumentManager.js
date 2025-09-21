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

const EyeIcon = ({ className = "w-4 h-4" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
);

const DownloadIcon = ({ className = "w-4 h-4" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);

const TrashIcon = ({ className = "w-4 h-4" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

const BlockchainIcon = ({ className = "w-4 h-4" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
    </svg>
);

const EncryptedIcon = ({ className = "w-4 h-4" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
);

const VerifyIcon = ({ className = "w-4 h-4" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const CheckIcon = ({ className = "w-4 h-4" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
);

const ClockIcon = ({ className = "w-4 h-4" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const XIcon = ({ className = "w-4 h-4" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const SpinnerIcon = ({ className = "w-4 h-4" }) => (
    <svg className={`${className} animate-spin`} fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
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
    
    // Modal states
    const [showNameModal, setShowNameModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showLoadingModal, setShowLoadingModal] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [customFileName, setCustomFileName] = useState('');
    const [viewingDocument, setViewingDocument] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [loadingMessage, setLoadingMessage] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [documentToDelete, setDocumentToDelete] = useState(null);
    const [modalType, setModalType] = useState(''); // 'upload', 'download', 'delete', etc.

    // Helper function to remove extension from display name
    const getDisplayName = (fileName) => {
        const nameParts = fileName.split('.');
        if (nameParts.length > 1) {
            nameParts.pop(); // Remove extension
            return nameParts.join('.');
        }
        return fileName;
    };

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

    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Extract file name without extension for editing
        const nameParts = file.name.split('.');
        const extension = nameParts.length > 1 ? nameParts.pop() : '';
        const nameWithoutExt = nameParts.join('.');

        setSelectedFile(file);
        setCustomFileName(nameWithoutExt); // Set name without extension for user to edit
        setShowNameModal(true);
        
        // Reset the input
        event.target.value = '';
    };

    const handleFileUpload = async () => {
        if (!selectedFile || !customFileName.trim()) return;

        setUploading(true);
        setShowNameModal(false);
        setLoadingMessage('Uploading and encrypting document...');
        setShowLoadingModal(true);
        
        try {
            // Get file extension
            const nameParts = selectedFile.name.split('.');
            const extension = nameParts.length > 1 ? nameParts.pop() : '';
            const finalFileName = extension ? `${customFileName.trim()}.${extension}` : customFileName.trim();

            const formData = new FormData();
            formData.append('document', selectedFile, finalFileName);
            formData.append('customName', finalFileName);

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
                setShowLoadingModal(false);
                setModalType('upload');
                setSuccessMessage(`Document "${getDisplayName(finalFileName)}" uploaded successfully!`);
                setShowSuccessModal(true);
                fetchDocuments(); // Refresh documents list
            } else {
                const error = await response.json();
                setShowLoadingModal(false);
                setModalType('upload');
                setSuccessMessage(`Upload failed: ${error.message}`);
                setShowSuccessModal(true);
            }
        } catch (error) {
            console.error('Error uploading document:', error);
            setShowLoadingModal(false);
            setModalType('upload');
            setSuccessMessage('Upload failed. Please try again.');
            setShowSuccessModal(true);
        } finally {
            setUploading(false);
            setSelectedFile(null);
            setCustomFileName('');
        }
    };

    const downloadDocument = async (documentId, fileName) => {
        try {
            const token = localStorage.getItem('authToken');
            console.log(`📥 Downloading document: ${fileName}`);
            
            // Show loading modal for blockchain documents
            const doc = documents.find(d => d._id === documentId);
            const isBlockchain = doc?.blockchainData?.blockchainStored;
            
            if (isBlockchain) {
                setLoadingMessage('Decrypting and downloading document...');
                setShowLoadingModal(true);
            }
            
            const response = await fetch(`http://localhost:5000/api/auth/download-document/${documentId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                console.log(`✅ Download completed: ${fileName}`);
                
                if (isBlockchain) {
                    setShowLoadingModal(false);
                    setModalType('download');
                    setSuccessMessage(`Document "${getDisplayName(fileName)}" downloaded successfully!`);
                    setShowSuccessModal(true);
                }
            } else {
                const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
                console.error('Download failed:', errorData.message);
                setShowLoadingModal(false);
                setModalType('download');
                setSuccessMessage(`Failed to download document: ${errorData.message}`);
                setShowSuccessModal(true);
            }
        } catch (error) {
            console.error('Error downloading document:', error);
            setShowLoadingModal(false);
            setModalType('download');
            setSuccessMessage(`Download failed: ${error.message}`);
            setShowSuccessModal(true);
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
                const contentType = response.headers.get('content-type');
                
                if (contentType && contentType.includes('application/json')) {
                    // Blockchain document - show information in modal
                    const data = await response.json();
                    setViewingDocument({
                        type: 'blockchain',
                        data: data
                    });
                } else {
                    // Regular document - show in modal
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const doc = documents.find(d => d._id === documentId);
                    setViewingDocument({
                        type: 'file',
                        url: url,
                        fileName: doc?.fileName || 'Document'
                    });
                }
                setShowViewModal(true);
            } else {
                const errorData = await response.json();
                alert(`Failed to view document: ${errorData.message}`);
            }
        } catch (error) {
            console.error('Error viewing document:', error);
            alert('Failed to view document');
        }
    };

    const handleDeleteClick = (documentId, fileName) => {
        setDocumentToDelete({ id: documentId, name: fileName });
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        if (!documentToDelete) return;
        
        setShowDeleteConfirm(false);
        setDeleting(true);
        setLoadingMessage(`Deleting "${getDisplayName(documentToDelete.name)}"...`);
        setShowLoadingModal(true);
        
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`http://localhost:5000/api/auth/delete-document/${documentToDelete.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                setShowLoadingModal(false);
                setModalType('delete');
                setSuccessMessage(`Document "${getDisplayName(documentToDelete.name)}" deleted successfully!`);
                setShowSuccessModal(true);
                fetchDocuments(); // Refresh documents list
            } else {
                const error = await response.json();
                setShowLoadingModal(false);
                setModalType('delete');
                setSuccessMessage(`Delete failed: ${error.message}`);
                setShowSuccessModal(true);
            }
        } catch (error) {
            console.error('Error deleting document:', error);
            setShowLoadingModal(false);
            setModalType('delete');
            setSuccessMessage('Delete failed. Please try again.');
            setShowSuccessModal(true);
        } finally {
            setDeleting(false);
            setDocumentToDelete(null);
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
                            onChange={handleFileSelect}
                            disabled={uploading}
                        />
                    </label>
                </div>

                {/* Uploaded Documents */}
                <div className="border rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium text-slate-700">Uploaded Documents</h3>
                        {documents.length > 0 && (
                            <span className="text-xs lg:text-sm text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full flex items-center gap-1">
                                <CheckIcon className="w-3 h-3" />
                                {documents.filter(doc => doc.verified).length} Verified
                            </span>
                        )}
                    </div>
                    
                    {documents.length === 0 ? (
                        <p className="text-slate-500 text-center py-8">No documents uploaded yet</p>
                    ) : (
                        <div className="grid gap-3">
                        {documents.map((doc) => {
                            const { icon: IconComponent, bgColor, iconColor } = getDocumentIcon(doc.type);
                            const isBlockchainStored = doc.blockchainData?.blockchainStored;
                            
                            return (
                                <div key={doc._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg bg-slate-50 gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 ${bgColor} rounded-lg flex items-center justify-center flex-shrink-0`}>
                                            <IconComponent className={`w-5 h-5 ${iconColor}`} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-medium text-slate-800 text-sm lg:text-base">{getDisplayName(doc.fileName)}</p>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="text-xs lg:text-sm text-slate-500">
                                                    Uploaded: {new Date(doc.uploadDate).toLocaleDateString()}
                                                </p>
                                                {doc.verified && (
                                                    <span className="text-xs text-emerald-600 flex items-center gap-1">
                                                        <CheckIcon className="w-3 h-3" />
                                                        Verified
                                                    </span>
                                                )}
                                                {isBlockchainStored && (
                                                    <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full flex items-center gap-1">
                                                        <BlockchainIcon className="w-3 h-3" />
                                                        Blockchain
                                                    </span>
                                                )}
                                                {doc.blockchainData?.transactionHash && (
                                                    <span className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded-full flex items-center gap-1">
                                                        <EncryptedIcon className="w-3 h-3" />
                                                        Encrypted
                                                    </span>
                                                )}
                                            </div>
                                            {isBlockchainStored && doc.blockchainData.ipfsHash && (
                                                <p className="text-xs text-slate-400 mt-1">
                                                    IPFS: {doc.blockchainData.ipfsHash.substring(0, 12)}...
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-2 sm:flex-shrink-0">
                                        <button 
                                            onClick={() => viewDocument(doc._id)}
                                            className="px-3 py-1 text-xs lg:text-sm border rounded-lg hover:bg-white transition-colors flex items-center gap-1"
                                        >
                                            <EyeIcon className="w-3 h-3" />
                                            View
                                        </button>
                                        <button 
                                            onClick={() => downloadDocument(doc._id, doc.fileName)}
                                            className="px-3 py-1 text-xs lg:text-sm border rounded-lg hover:bg-white transition-colors flex items-center gap-1"
                                        >
                                            {isBlockchainStored ? (
                                                <>
                                                    <EncryptedIcon className="w-3 h-3" />
                                                    Decrypt & Download
                                                </>
                                            ) : (
                                                <>
                                                    <DownloadIcon className="w-3 h-3" />
                                                    Download
                                                </>
                                            )}
                                        </button>
                                        {isBlockchainStored && doc.blockchainData.transactionHash && (
                                            <button 
                                                onClick={() => window.open(`https://amoy.polygonscan.com/tx/${doc.blockchainData.transactionHash}`, '_blank')}
                                                className="px-3 py-1 text-xs lg:text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1"
                                                title="View on blockchain explorer"
                                            >
                                                <VerifyIcon className="w-3 h-3" />
                                                Verify
                                            </button>
                                        )}
                                        <button 
                                            onClick={() => handleDeleteClick(doc._id, doc.fileName)}
                                            className="px-3 py-1 text-xs lg:text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-1"
                                            disabled={deleting}
                                            title="Delete document"
                                        >
                                            <TrashIcon className="w-3 h-3" />
                                            Delete
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
                            <span className={`text-xs lg:text-sm font-medium flex items-center gap-1 ${
                                verificationStatus.documentAuthenticity ? 'text-emerald-600' : 'text-amber-600'
                            }`}>
                                {verificationStatus.documentAuthenticity ? (
                                    <>
                                        <CheckIcon className="w-3 h-3" />
                                        Verified
                                    </>
                                ) : (
                                    <>
                                        <ClockIcon className="w-3 h-3" />
                                        Pending
                                    </>
                                )}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs lg:text-sm text-slate-600">Face Match</span>
                            <span className={`text-xs lg:text-sm font-medium flex items-center gap-1 ${
                                verificationStatus.faceMatch ? 'text-emerald-600' : 'text-amber-600'
                            }`}>
                                {verificationStatus.faceMatch ? (
                                    <>
                                        <CheckIcon className="w-3 h-3" />
                                        Matched
                                    </>
                                ) : (
                                    <>
                                        <ClockIcon className="w-3 h-3" />
                                        Pending
                                    </>
                                )}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs lg:text-sm text-slate-600">Liveness Check</span>
                            <span className={`text-xs lg:text-sm font-medium flex items-center gap-1 ${
                                verificationStatus.livenessCheck ? 'text-emerald-600' : 'text-amber-600'
                            }`}>
                                {verificationStatus.livenessCheck ? (
                                    <>
                                        <CheckIcon className="w-3 h-3" />
                                        Passed
                                    </>
                                ) : (
                                    <>
                                        <ClockIcon className="w-3 h-3" />
                                        Pending
                                    </>
                                )}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* File Name Modal */}
            {showNameModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
                        <div className="p-6">
                            <h3 className="text-lg font-semibold text-slate-800 mb-4">Name Your Document</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Document Name
                                    </label>
                                    <input
                                        type="text"
                                        value={customFileName}
                                        onChange={(e) => setCustomFileName(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder="Enter document name"
                                        autoFocus
                                    />
                                </div>
                                <div className="text-xs text-slate-500">
                                    <strong>Selected file:</strong> {selectedFile?.name}
                                </div>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => {
                                        setShowNameModal(false);
                                        setSelectedFile(null);
                                        setCustomFileName('');
                                    }}
                                    className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleFileUpload}
                                    disabled={!customFileName.trim() || uploading}
                                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {uploading ? 'Uploading...' : 'Upload'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* View Document Modal */}
            {showViewModal && viewingDocument && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h3 className="text-lg font-semibold text-slate-800">
                                {viewingDocument.type === 'blockchain' ? 'Document Information' : viewingDocument.fileName}
                            </h3>
                            <button
                                onClick={() => {
                                    setShowViewModal(false);
                                    setViewingDocument(null);
                                    if (viewingDocument.url) {
                                        window.URL.revokeObjectURL(viewingDocument.url);
                                    }
                                }}
                                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                            >
                                <XIcon className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                            {viewingDocument.type === 'blockchain' ? (
                                <div className="space-y-4">
                                    <div className="bg-slate-50 rounded-lg p-4">
                                        <h4 className="font-medium text-slate-800 mb-2 flex items-center gap-2">
                                            <DocumentIcon className="w-4 h-4" />
                                            Document Information
                                        </h4>
                                        <div className="space-y-2 text-sm">
                                            <div><strong>File:</strong> {viewingDocument.data.document.fileName}</div>
                                            <div><strong>Status:</strong> {viewingDocument.data.message}</div>
                                            <div className="flex items-center gap-2">
                                                <strong>Transaction:</strong>
                                                <code className="bg-slate-200 px-2 py-1 rounded text-xs">
                                                    {viewingDocument.data.document.blockchain.transactionHash}
                                                </code>
                                                <button
                                                    onClick={() => window.open(`https://amoy.polygonscan.com/tx/${viewingDocument.data.document.blockchain.transactionHash}`, '_blank')}
                                                    className="text-blue-600 hover:text-blue-800"
                                                    title="View on blockchain"
                                                >
                                                    <VerifyIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-blue-50 rounded-lg p-4">
                                        <p className="text-sm text-blue-800 flex items-start gap-2">
                                            <EncryptedIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                            <span>{viewingDocument.data.note}</span>
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center">
                                    <img 
                                        src={viewingDocument.url} 
                                        alt={viewingDocument.fileName}
                                        className="max-w-full max-h-[60vh] object-contain mx-auto rounded-lg shadow-sm"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.nextSibling.style.display = 'block';
                                        }}
                                    />
                                    <div className="hidden text-slate-500 py-8">
                                        <DocumentIcon className="w-12 h-12 mx-auto mb-2 text-slate-400" />
                                        <p>Preview not available</p>
                                        <p className="text-sm mt-1">Use download to view this document</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Loading Modal */}
            {showLoadingModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
                        <div className="p-6 text-center">
                            <div className="mb-4">
                                <SpinnerIcon className="w-12 h-12 mx-auto text-indigo-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-800 mb-2">Please Wait</h3>
                            <p className="text-slate-600">{loadingMessage}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Success/Error Modal */}
            {showSuccessModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
                        <div className="p-6">
                            <div className="flex items-center mb-4">
                                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                                    <CheckIcon className="w-5 h-5 text-green-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-800">
                                    {modalType === 'upload' ? 'Upload' : 
                                     modalType === 'download' ? 'Download' : 
                                     modalType === 'delete' ? 'Delete' : 'Success'}
                                </h3>
                            </div>
                            <p className="text-slate-600 mb-6">{successMessage}</p>
                            <div className="flex justify-end">
                                <button
                                    onClick={() => setShowSuccessModal(false)}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                                >
                                    OK
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && documentToDelete && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
                        <div className="p-6">
                            <div className="flex items-center mb-4">
                                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                                    <TrashIcon className="w-5 h-5 text-red-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-800">Confirm Delete</h3>
                            </div>
                            <p className="text-slate-600 mb-2">
                                Are you sure you want to delete <strong>"{getDisplayName(documentToDelete.name)}"</strong>?
                            </p>
                            <p className="text-sm text-red-600 mb-6">
                                <strong>This action cannot be undone.</strong>
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setShowDeleteConfirm(false);
                                        setDocumentToDelete(null);
                                    }}
                                    className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                >
                                    Delete Permanently
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}