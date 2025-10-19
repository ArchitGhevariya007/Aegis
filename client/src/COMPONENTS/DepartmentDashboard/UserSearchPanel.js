import React, { useState } from 'react';
import { Search, User, FileText, AlertCircle, Loader2, X } from 'lucide-react';
import { storage } from '../../services/api';

export default function UserSearchPanel() {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [userDocuments, setUserDocuments] = useState([]);
    const [loadingDocument, setLoadingDocument] = useState(false);
    const [documentModal, setDocumentModal] = useState({ isOpen: false, url: null, fileName: null });

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        setLoading(true);
        setError(null);
        setSelectedUser(null);
        setUserDocuments([]);

        try {
            const token = storage.getToken();
            const response = await fetch(`http://localhost:5000/api/departments/search-users?query=${encodeURIComponent(searchQuery)}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setSearchResults(data.users);
            } else {
                const error = await response.json();
                setError(error.message || 'Failed to search users');
            }
        } catch (error) {
            setError('Failed to search users');
            console.error('Search error:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUserDetails = async (userId) => {
        try {
            const token = storage.getToken();
            const [userResponse, documentsResponse] = await Promise.all([
                fetch(`http://localhost:5000/api/departments/user-details/${userId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }),
                fetch(`http://localhost:5000/api/departments/user-documents/${userId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                })
            ]);

            if (userResponse.ok && documentsResponse.ok) {
                const userData = await userResponse.json();
                const documentsData = await documentsResponse.json();
                setSelectedUser(userData.user);
                setUserDocuments(documentsData.documents);
            } else {
                setError('Failed to fetch user details');
            }
        } catch (error) {
            setError('Failed to fetch user details');
            console.error('Fetch error:', error);
        }
    };

    const viewDocument = async (documentId) => {
        try {
            setError(null);
            setLoadingDocument(true);
            
            // Open modal with loading state
            setDocumentModal({ isOpen: true, url: null, fileName: 'Loading...', loading: true });
            
            const token = storage.getToken();
            const response = await fetch(`http://localhost:5000/api/departments/view-document/${documentId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const contentType = response.headers.get('content-type');
                
                // Check if response is JSON (error) or binary (file)
                if (contentType && contentType.includes('application/json')) {
                    const data = await response.json();
                    setError(data.message || 'Failed to view document');
                    setDocumentModal({ isOpen: false, url: null, fileName: null });
                } else {
                    // It's a file - get filename from content-disposition header
                    const contentDisposition = response.headers.get('content-disposition');
                    let filename = 'document';
                    
                    if (contentDisposition) {
                        // Try to extract filename from content-disposition header
                        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
                        if (filenameMatch && filenameMatch[1]) {
                            filename = filenameMatch[1].replace(/['"]/g, '');
                        }
                    }
                    
                    // If we still don't have a proper filename, try to get it from the document in the list
                    if (filename === 'document') {
                        const doc = userDocuments.find(d => d._id === documentId);
                        if (doc && doc.fileName) {
                            filename = doc.fileName;
                        }
                    }
                    
                    // Create blob URL for viewing in modal
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    
                    // Determine content type from blob or filename
                    let contentType = blob.type;
                    if (!contentType || contentType === 'application/octet-stream') {
                        // Try to determine from filename extension
                        const ext = filename.toLowerCase().split('.').pop();
                        const typeMap = {
                            'png': 'image/png',
                            'jpg': 'image/jpeg',
                            'jpeg': 'image/jpeg',
                            'gif': 'image/gif',
                            'webp': 'image/webp',
                            'svg': 'image/svg+xml',
                            'pdf': 'application/pdf'
                        };
                        contentType = typeMap[ext] || contentType;
                    }
                    
                    // Update modal with document
                    setDocumentModal({ 
                        isOpen: true, 
                        url: url, 
                        fileName: filename,
                        loading: false,
                        contentType: contentType
                    });
                }
            } else {
                // Try to get error message from response
                try {
                    const errorData = await response.json();
                    setError(errorData.message || 'Failed to view document');
                    console.error('Document error:', errorData);
                } catch (e) {
                    setError(`Failed to view document (Status: ${response.status})`);
                }
                setDocumentModal({ isOpen: false, url: null, fileName: null });
            }
        } catch (error) {
            setError('Failed to view document: ' + error.message);
            console.error('View document error:', error);
            setDocumentModal({ isOpen: false, url: null, fileName: null });
        } finally {
            setLoadingDocument(false);
        }
    };

    const closeDocumentModal = () => {
        if (documentModal.url) {
            window.URL.revokeObjectURL(documentModal.url);
        }
        setDocumentModal({ isOpen: false, url: null, fileName: null });
    };

    return (
        <div className="space-y-6">
            {/* Search Form */}
            <div className="bg-white shadow rounded-lg p-6">
                <form onSubmit={handleSearch} className="flex gap-4">
                    <div className="flex-1">
                        <label htmlFor="search" className="sr-only">
                            Search Users
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-slate-400" />
                            </div>
                            <input
                                type="text"
                                id="search"
                                className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="Search by name, email, or ID..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                        Search
                    </button>
                </form>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
                    <div className="flex items-center">
                        <AlertCircle className="h-5 w-5 text-red-400" />
                        <p className="ml-3 text-sm text-red-700">{error}</p>
                    </div>
                </div>
            )}

            {/* Search Results */}
            {searchResults && searchResults.length > 0 && !selectedUser && (
                <div className="bg-white shadow rounded-lg overflow-hidden">
                    <div className="p-6">
                        <h3 className="text-lg font-medium text-slate-900 mb-4">Search Results</h3>
                        <div className="space-y-4">
                            {searchResults.map((user) => (
                                <button
                                    key={user._id}
                                    onClick={() => fetchUserDetails(user._id)}
                                    className="w-full text-left p-4 rounded-lg border border-slate-200 hover:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    <div className="flex items-center">
                                        <User className="h-5 w-5 text-slate-400 mr-3" />
                                        <div>
                                            <p className="text-sm font-medium text-slate-900">{user.name}</p>
                                            <p className="text-sm text-slate-500">{user.email}</p>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* User Details */}
            {selectedUser && (
                <div className="bg-white shadow rounded-lg overflow-hidden">
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-indigo-100 rounded-full">
                                    <User className="w-8 h-8 text-indigo-600" />
                                </div>
                                <h3 className="text-lg font-medium text-slate-900">User Details</h3>
                            </div>
                            {/* <button
                                onClick={() => setSelectedUser(null)}
                                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                            >
                                Back to Search
                            </button> */}
                        </div>

                        {/* Personal Information */}
                        <div className="space-y-6">
                            {Object.keys(selectedUser).length === 0 ? (
                                <div className="text-center py-8">
                                    <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                                    <p className="text-slate-600">No information available to display</p>
                                    <p className="text-sm text-slate-500 mt-1">This department doesn't have permission to view any user data</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {Object.entries(selectedUser).map(([key, value]) => (
                                        key !== '_id' && (
                                            <div key={key} className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                                <p className="text-sm font-semibold text-slate-700 mb-1">
                                                    {key}
                                                </p>
                                                <p className="text-sm text-slate-900">{value || 'Not provided'}</p>
                                            </div>
                                        )
                                    ))}
                                </div>
                            )}

                            {/* Documents */}
                            {userDocuments.length > 0 && (
                                <div className="mt-8">
                                    <h4 className="text-lg font-medium text-slate-900 mb-4">Documents</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {userDocuments.map((doc) => (
                                            <div
                                                key={doc._id}
                                                className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
                                            >
                                                <div className="flex items-center">
                                                    <FileText className="h-5 w-5 text-slate-400 mr-3" />
                                                    <div>
                                                        <p className="text-sm font-medium text-slate-900">
                                                            {doc.fileName}
                                                        </p>
                                                        <p className="text-xs text-slate-500">
                                                            {new Date(doc.uploadDate).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => viewDocument(doc._id)}
                                                    disabled={loadingDocument}
                                                    className="px-3 py-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    View
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* No Results */}
            {searchResults && searchResults.length === 0 && (
                <div className="text-center py-12">
                    <User className="mx-auto h-12 w-12 text-slate-400" />
                    <h3 className="mt-2 text-sm font-medium text-slate-900">No users found</h3>
                    <p className="mt-1 text-sm text-slate-500">Try adjusting your search terms.</p>
                </div>
            )}

            {/* Document Viewer Modal */}
            {documentModal.isOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                        {/* Background overlay */}
                        <div 
                            className="fixed inset-0 transition-opacity bg-slate-500 bg-opacity-75"
                            onClick={closeDocumentModal}
                        ></div>

                        {/* Modal panel */}
                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full">
                            {/* Header */}
                            <div className="bg-white px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                                <h3 className="text-lg font-medium text-slate-900">
                                    {documentModal.fileName}
                                </h3>
                                <button
                                    onClick={closeDocumentModal}
                                    className="text-slate-400 hover:text-slate-500 focus:outline-none"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="bg-slate-50 px-4 py-6">
                                {documentModal.loading ? (
                                    <div className="flex flex-col items-center justify-center py-20">
                                        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
                                        <p className="text-lg font-medium text-slate-900">Retrieving document from blockchain...</p>
                                        <p className="text-sm text-slate-600 mt-2">This may take a few moments. Please wait.</p>
                                    </div>
                                ) : documentModal.url ? (
                                    <div className="bg-white rounded-lg shadow-inner" style={{ height: '70vh' }}>
                                        {documentModal.contentType?.startsWith('image/') ? (
                                            <img 
                                                src={documentModal.url} 
                                                alt={documentModal.fileName}
                                                className="w-full h-full object-contain"
                                            />
                                        ) : documentModal.contentType === 'application/pdf' ? (
                                            <iframe
                                                src={documentModal.url}
                                                className="w-full h-full"
                                                title={documentModal.fileName}
                                            />
                                        ) : (
                                            <div className="flex flex-col items-center justify-center h-full">
                                                <FileText className="w-16 h-16 text-slate-400 mb-4" />
                                                <p className="text-slate-600 mb-4">Preview not available for this file type</p>
                                                <a
                                                    href={documentModal.url}
                                                    download={documentModal.fileName}
                                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                                                >
                                                    Download File
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                ) : null}
                            </div>

                            {/* Footer */}
                            {!documentModal.loading && documentModal.url && (
                                <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 flex justify-end gap-3">
                                    <a
                                        href={documentModal.url}
                                        download={documentModal.fileName}
                                        className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                                    >
                                        Download
                                    </a>
                                    <button
                                        onClick={closeDocumentModal}
                                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                                    >
                                        Close
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
