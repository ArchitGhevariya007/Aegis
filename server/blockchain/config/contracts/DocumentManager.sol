// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title DocumentManager
 * @dev Smart contract for managing encrypted documents on blockchain
 * @author Aegis Digital Identity System
 */
contract DocumentManager {
    
    struct Document {
        string documentHash;      // SHA256 hash of original document
        string ipfsHash;         // IPFS hash where encrypted document is stored
        string encryptionKey;    // Encrypted key for document decryption
        address owner;           // Document owner
        uint256 timestamp;       // When document was stored
        bool exists;            // Whether document exists
    }
    
    struct AccessPermission {
        bool canAccess;         // Whether user can access document
        uint256 grantedAt;      // When access was granted
        address grantedBy;      // Who granted the access
    }
    
    // State variables
    mapping(uint256 => Document) private documents;
    mapping(address => uint256[]) private userDocuments;
    mapping(uint256 => mapping(address => AccessPermission)) private documentPermissions;
    
    uint256 private nextDocumentId = 1;
    address public owner;
    
    // Events
    event DocumentStored(
        uint256 indexed documentId,
        address indexed owner,
        string documentHash,
        string ipfsHash,
        uint256 timestamp
    );
    
    event DocumentAccessed(
        uint256 indexed documentId,
        address indexed accessor,
        uint256 timestamp
    );
    
    event PermissionGranted(
        uint256 indexed documentId,
        address indexed owner,
        address indexed grantee,
        uint256 timestamp
    );
    
    event PermissionRevoked(
        uint256 indexed documentId,
        address indexed owner,
        address indexed grantee,
        uint256 timestamp
    );
    
    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only contract owner can call this function");
        _;
    }
    
    modifier onlyDocumentOwner(uint256 _documentId) {
        require(documents[_documentId].exists, "Document does not exist");
        require(documents[_documentId].owner == msg.sender, "Only document owner can call this function");
        _;
    }
    
    modifier documentExists(uint256 _documentId) {
        require(documents[_documentId].exists, "Document does not exist");
        _;
    }
    
    modifier hasDocumentAccess(uint256 _documentId) {
        require(documents[_documentId].exists, "Document does not exist");
        require(
            documents[_documentId].owner == msg.sender || 
            documentPermissions[_documentId][msg.sender].canAccess,
            "Access denied"
        );
        _;
    }
    
    constructor() {
        owner = msg.sender;
    }
    
    /**
     * @dev Store a new document on the blockchain
     * @param _documentHash SHA256 hash of the original document
     * @param _ipfsHash IPFS hash where encrypted document is stored
     * @param _encryptionKey Encryption key for document decryption
     * @param _documentOwner Owner of the document
     * @return documentId The ID of the stored document
     */
    function storeDocument(
        string memory _documentHash,
        string memory _ipfsHash,
        string memory _encryptionKey,
        address _documentOwner
    ) public returns (uint256) {
        require(bytes(_documentHash).length > 0, "Document hash cannot be empty");
        require(bytes(_ipfsHash).length > 0, "IPFS hash cannot be empty");
        require(bytes(_encryptionKey).length > 0, "Encryption key cannot be empty");
        require(_documentOwner != address(0), "Invalid document owner address");
        
        uint256 documentId = nextDocumentId;
        nextDocumentId++;
        
        documents[documentId] = Document({
            documentHash: _documentHash,
            ipfsHash: _ipfsHash,
            encryptionKey: _encryptionKey,
            owner: _documentOwner,
            timestamp: block.timestamp,
            exists: true
        });
        
        userDocuments[_documentOwner].push(documentId);
        
        emit DocumentStored(
            documentId,
            _documentOwner,
            _documentHash,
            _ipfsHash,
            block.timestamp
        );
        
        return documentId;
    }
    
    /**
     * @dev Get document information
     * @param _documentId ID of the document
     * @return documentHash SHA256 hash of the document
     * @return ipfsHash IPFS hash of the encrypted document
     * @return encryptionKey Encryption key for decryption
     * @return documentOwner Owner of the document
     * @return timestamp When the document was stored
     */
    function getDocument(uint256 _documentId) 
        public 
        view 
        hasDocumentAccess(_documentId) 
        returns (
            string memory documentHash,
            string memory ipfsHash,
            string memory encryptionKey,
            address documentOwner,
            uint256 timestamp
        ) 
    {
        Document memory doc = documents[_documentId];
        return (
            doc.documentHash,
            doc.ipfsHash,
            doc.encryptionKey,
            doc.owner,
            doc.timestamp
        );
    }
    
    /**
     * @dev Get all document IDs owned by a user
     * @param _owner Address of the document owner
     * @return Array of document IDs
     */
    function getUserDocuments(address _owner) public view returns (uint256[] memory) {
        return userDocuments[_owner];
    }
    
    /**
     * @dev Grant access permission to a user for a specific document
     * @param _documentId ID of the document
     * @param _user Address of the user to grant access
     * @param _canAccess Whether to grant or revoke access
     */
    function setDocumentPermission(
        uint256 _documentId,
        address _user,
        bool _canAccess
    ) public onlyDocumentOwner(_documentId) {
        require(_user != address(0), "Invalid user address");
        require(_user != documents[_documentId].owner, "Cannot set permission for document owner");
        
        documentPermissions[_documentId][_user] = AccessPermission({
            canAccess: _canAccess,
            grantedAt: block.timestamp,
            grantedBy: msg.sender
        });
        
        if (_canAccess) {
            emit PermissionGranted(_documentId, msg.sender, _user, block.timestamp);
        } else {
            emit PermissionRevoked(_documentId, msg.sender, _user, block.timestamp);
        }
    }
    
    /**
     * @dev Check if a user has access to a document
     * @param _documentId ID of the document
     * @param _user Address of the user
     * @return Whether the user has access
     */
    function hasAccess(uint256 _documentId, address _user) 
        public 
        view 
        documentExists(_documentId) 
        returns (bool) 
    {
        return documents[_documentId].owner == _user || 
               documentPermissions[_documentId][_user].canAccess;
    }
    
    /**
     * @dev Get access permission details
     * @param _documentId ID of the document
     * @param _user Address of the user
     * @return canAccess Whether user can access
     * @return grantedAt When access was granted
     * @return grantedBy Who granted the access
     */
    function getAccessPermission(uint256 _documentId, address _user) 
        public 
        view 
        documentExists(_documentId) 
        returns (bool canAccess, uint256 grantedAt, address grantedBy) 
    {
        AccessPermission memory permission = documentPermissions[_documentId][_user];
        return (permission.canAccess, permission.grantedAt, permission.grantedBy);
    }
    
    /**
     * @dev Record document access for audit trail
     * @param _documentId ID of the document being accessed
     */
    function recordAccess(uint256 _documentId) public hasDocumentAccess(_documentId) {
        emit DocumentAccessed(_documentId, msg.sender, block.timestamp);
    }
    
    /**
     * @dev Verify document integrity by comparing hashes
     * @param _documentId ID of the document
     * @param _providedHash Hash to verify against
     * @return Whether the hashes match
     */
    function verifyDocumentIntegrity(uint256 _documentId, string memory _providedHash) 
        public 
        view 
        hasDocumentAccess(_documentId) 
        returns (bool) 
    {
        return keccak256(abi.encodePacked(documents[_documentId].documentHash)) == 
               keccak256(abi.encodePacked(_providedHash));
    }
    
    /**
     * @dev Get total number of documents stored
     * @return Total document count
     */
    function getTotalDocuments() public view returns (uint256) {
        return nextDocumentId - 1;
    }
    
    /**
     * @dev Check if a document exists
     * @param _documentId ID of the document
     * @return Whether the document exists
     */
    function isDocumentExists(uint256 _documentId) public view returns (bool) {
        return documents[_documentId].exists;
    }
    
    /**
     * @dev Get document owner
     * @param _documentId ID of the document
     * @return Address of the document owner
     */
    function getDocumentOwner(uint256 _documentId) 
        public 
        view 
        documentExists(_documentId) 
        returns (address) 
    {
        return documents[_documentId].owner;
    }
    
    /**
     * @dev Emergency function to update contract owner (only current owner)
     * @param _newOwner Address of the new contract owner
     */
    function transferOwnership(address _newOwner) public onlyOwner {
        require(_newOwner != address(0), "Invalid new owner address");
        owner = _newOwner;
    }
    
    /**
     * @dev Get contract version
     * @return Contract version string
     */
    function getVersion() public pure returns (string memory) {
        return "1.0.0";
    }
}
