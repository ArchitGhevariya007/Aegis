// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title SecureVotingContract
 * @dev Decentralized voting system with face verification and admin controls
 * @notice All votes are stored immutably on blockchain
 */
contract SecureVotingContract {
    
    // ============== State Variables ==============
    
    address public admin;
    bool public isActive;
    uint256 public sessionStartTime;
    uint256 public sessionEndTime;
    uint256 public totalVotes;
    
    // Party structure
    struct Party {
        string id;
        string name;
        string logo;
        string color;
        uint256 voteCount;
        bool exists;
    }
    
    // Vote record structure
    struct Vote {
        address voter;
        string partyId;
        uint256 timestamp;
        bool faceVerified;
        bytes32 voteHash;
        bool exists;
    }
    
    // Mappings
    mapping(string => Party) public parties;
    mapping(address => Vote) public votes;
    mapping(address => bool) public hasVoted;
    
    // Arrays for iteration
    string[] public partyIds;
    address[] public voters;
    
    // Events
    event VotingStarted(uint256 timestamp);
    event VotingStopped(uint256 timestamp);
    event VoteCast(address indexed voter, string partyId, bytes32 voteHash, uint256 timestamp);
    event PartyAdded(string id, string name);
    event VotingReset(uint256 timestamp);
    
    // ============== Modifiers ==============
    
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }
    
    modifier votingActive() {
        require(isActive, "Voting is not active");
        _;
    }
    
    modifier hasNotVoted() {
        require(!hasVoted[msg.sender], "Already voted");
        _;
    }
    
    // ============== Constructor ==============
    
    constructor() {
        admin = msg.sender;
        isActive = false;
        totalVotes = 0;
        
        // Initialize default parties
        _addParty("party1", "Progressive Alliance", unicode"🟦", "#3b82f6");
        _addParty("party2", "Democratic Unity", unicode"🟩", "#10b981");
        _addParty("party3", "People's Coalition", unicode"🟥", "#ef4444");
        _addParty("party4", "National Front", unicode"🟨", "#f59e0b");
    }
    
    // ============== Admin Functions ==============
    
    /**
     * @dev Start voting session
     */
    function startVoting() external onlyAdmin {
        require(!isActive, "Voting already active");
        isActive = true;
        sessionStartTime = block.timestamp;
        emit VotingStarted(block.timestamp);
    }
    
    /**
     * @dev Stop voting session
     */
    function stopVoting() external onlyAdmin {
        require(isActive, "Voting not active");
        isActive = false;
        sessionEndTime = block.timestamp;
        emit VotingStopped(block.timestamp);
    }
    
    /**
     * @dev Reset voting session (clear all votes)
     */
    function resetVoting() external onlyAdmin {
        // Clear all votes
        for (uint256 i = 0; i < voters.length; i++) {
            address voter = voters[i];
            delete votes[voter];
            delete hasVoted[voter];
        }
        
        // Reset party vote counts
        for (uint256 i = 0; i < partyIds.length; i++) {
            parties[partyIds[i]].voteCount = 0;
        }
        
        // Clear voters array
        delete voters;
        
        // Reset counters
        totalVotes = 0;
        isActive = false;
        sessionStartTime = 0;
        sessionEndTime = 0;
        
        emit VotingReset(block.timestamp);
    }
    
    /**
     * @dev Add a new party
     */
    function addParty(
        string memory _id,
        string memory _name,
        string memory _logo,
        string memory _color
    ) external onlyAdmin {
        _addParty(_id, _name, _logo, _color);
    }
    
    /**
     * @dev Internal function to add party
     */
    function _addParty(
        string memory _id,
        string memory _name,
        string memory _logo,
        string memory _color
    ) internal {
        require(!parties[_id].exists, "Party already exists");
        
        parties[_id] = Party({
            id: _id,
            name: _name,
            logo: _logo,
            color: _color,
            voteCount: 0,
            exists: true
        });
        
        partyIds.push(_id);
        emit PartyAdded(_id, _name);
    }
    
    /**
     * @dev Transfer admin rights
     */
    function transferAdmin(address newAdmin) external onlyAdmin {
        require(newAdmin != address(0), "Invalid address");
        admin = newAdmin;
    }
    
    // ============== Voting Functions ==============
    
    /**
     * @dev Cast a vote
     * @param _partyId ID of the party to vote for
     * @param _faceVerified Whether face verification was successful
     * @param _userHash Hash representing the user (for privacy)
     */
    function castVote(
        string memory _partyId,
        bool _faceVerified,
        bytes32 _userHash
    ) external votingActive hasNotVoted {
        require(parties[_partyId].exists, "Invalid party");
        require(_faceVerified, "Face verification required");
        
        // Create vote hash for verification
        bytes32 voteHash = keccak256(
            abi.encodePacked(
                msg.sender,
                _partyId,
                block.timestamp,
                _faceVerified,
                _userHash
            )
        );
        
        // Record vote
        votes[msg.sender] = Vote({
            voter: msg.sender,
            partyId: _partyId,
            timestamp: block.timestamp,
            faceVerified: _faceVerified,
            voteHash: voteHash,
            exists: true
        });
        
        // Mark as voted
        hasVoted[msg.sender] = true;
        voters.push(msg.sender);
        
        // Increment party vote count
        parties[_partyId].voteCount++;
        totalVotes++;
        
        emit VoteCast(msg.sender, _partyId, voteHash, block.timestamp);
    }
    
    /**
     * @dev Cast a vote on behalf of a user (admin only, for backend integration)
     * @param _voter Address of the voter
     * @param _partyId ID of the party to vote for
     * @param _faceVerified Whether face verification was successful
     * @param _userHash Hash representing the user (for privacy)
     */
    function castVoteFor(
        address _voter,
        string memory _partyId,
        bool _faceVerified,
        bytes32 _userHash
    ) external onlyAdmin votingActive {
        require(parties[_partyId].exists, "Invalid party");
        require(_faceVerified, "Face verification required");
        require(!hasVoted[_voter], "Already voted");
        
        // Create vote hash for verification
        bytes32 voteHash = keccak256(
            abi.encodePacked(
                _voter,
                _partyId,
                block.timestamp,
                _faceVerified,
                _userHash
            )
        );
        
        // Record vote
        votes[_voter] = Vote({
            voter: _voter,
            partyId: _partyId,
            timestamp: block.timestamp,
            faceVerified: _faceVerified,
            voteHash: voteHash,
            exists: true
        });
        
        // Mark as voted
        hasVoted[_voter] = true;
        voters.push(_voter);
        
        // Increment party vote count
        parties[_partyId].voteCount++;
        totalVotes++;
        
        emit VoteCast(_voter, _partyId, voteHash, block.timestamp);
    }
    
    // ============== View Functions ==============
    
    /**
     * @dev Get voting status
     */
    function getVotingStatus() external view returns (
        bool _isActive,
        uint256 _totalVotes,
        uint256 _startTime,
        uint256 _endTime,
        uint256 _partyCount
    ) {
        return (
            isActive,
            totalVotes,
            sessionStartTime,
            sessionEndTime,
            partyIds.length
        );
    }
    
    /**
     * @dev Get party details
     */
    function getParty(string memory _partyId) external view returns (
        string memory name,
        string memory logo,
        string memory color,
        uint256 voteCount
    ) {
        require(parties[_partyId].exists, "Party does not exist");
        Party memory party = parties[_partyId];
        return (party.name, party.logo, party.color, party.voteCount);
    }
    
    /**
     * @dev Get all party IDs
     */
    function getAllPartyIds() external view returns (string[] memory) {
        return partyIds;
    }
    
    /**
     * @dev Get all party results
     */
    function getAllResults() external view returns (
        string[] memory ids,
        string[] memory names,
        string[] memory logos,
        uint256[] memory voteCounts
    ) {
        uint256 count = partyIds.length;
        
        ids = new string[](count);
        names = new string[](count);
        logos = new string[](count);
        voteCounts = new uint256[](count);
        
        for (uint256 i = 0; i < count; i++) {
            string memory partyId = partyIds[i];
            Party memory party = parties[partyId];
            
            ids[i] = party.id;
            names[i] = party.name;
            logos[i] = party.logo;
            voteCounts[i] = party.voteCount;
        }
        
        return (ids, names, logos, voteCounts);
    }
    
    /**
     * @dev Check if address has voted
     */
    function hasUserVoted(address _voter) external view returns (bool) {
        return hasVoted[_voter];
    }
    
    /**
     * @dev Get vote details (only voter or admin can see)
     */
    function getVote(address _voter) external view returns (
        string memory partyId,
        uint256 timestamp,
        bool faceVerified,
        bytes32 voteHash
    ) {
        require(
            msg.sender == _voter || msg.sender == admin,
            "Unauthorized access"
        );
        require(votes[_voter].exists, "No vote found");
        
        Vote memory vote = votes[_voter];
        return (vote.partyId, vote.timestamp, vote.faceVerified, vote.voteHash);
    }
    
    /**
     * @dev Get total number of voters
     */
    function getVoterCount() external view returns (uint256) {
        return voters.length;
    }
    
    /**
     * @dev Verify vote hash
     */
    function verifyVote(
        address _voter,
        string memory _partyId,
        uint256 _timestamp,
        bool _faceVerified,
        bytes32 _userHash
    ) external view returns (bool) {
        require(votes[_voter].exists, "No vote found");
        
        bytes32 computedHash = keccak256(
            abi.encodePacked(
                _voter,
                _partyId,
                _timestamp,
                _faceVerified,
                _userHash
            )
        );
        
        return votes[_voter].voteHash == computedHash;
    }
}

