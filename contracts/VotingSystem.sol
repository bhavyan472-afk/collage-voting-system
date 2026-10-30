// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/// @title VotingSystem
/// @notice Educational college election contract. NOT intended for legally binding elections.
/// @dev Lifecycle: Setup (owner registers candidates + voters) -> Active (eligible voters vote once)
///      -> Ended (results final). The lifecycle is one-way and cannot be restarted.
contract VotingSystem {
    // ---------------------------------------------------------------------
    // Types
    // ---------------------------------------------------------------------

    enum ElectionState {
        Setup,
        Active,
        Ended
    }

    struct Candidate {
        uint256 id;
        string name;
        string party;
        string symbol;
        string description;
        uint256 voteCount;
    }

    // ---------------------------------------------------------------------
    // Constants
    // ---------------------------------------------------------------------

    uint256 public constant MAX_CANDIDATES = 50;
    uint256 public constant MAX_VOTERS_PER_BATCH = 200;
    uint256 public constant MAX_NAME_LENGTH = 64;
    uint256 public constant MAX_SYMBOL_LENGTH = 32;
    uint256 public constant MAX_DESCRIPTION_LENGTH = 280;

    // ---------------------------------------------------------------------
    // Storage
    // ---------------------------------------------------------------------

    address public owner;
    string public electionName;
    ElectionState public state;
    uint64 public startedAt;
    uint64 public endedAt;
    uint256 public totalVotes;
    uint256 public eligibleVoterCount;

    Candidate[] private _candidates;
    mapping(address voter => bool) public isEligibleVoter;
    mapping(address voter => bool) public hasVoted;

    // ---------------------------------------------------------------------
    // Events
    // ---------------------------------------------------------------------

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event CandidateAdded(uint256 indexed candidateId, string name, string party);
    event VoterRegistered(address indexed voter);
    event VoterRemoved(address indexed voter);
    event ElectionStarted(uint256 timestamp);
    event ElectionEnded(uint256 timestamp, uint256 totalVotes);
    event VoteCast(address indexed voter, uint256 indexed candidateId);

    // ---------------------------------------------------------------------
    // Errors
    // ---------------------------------------------------------------------

    error NotOwner();
    error ZeroAddress();
    error InvalidState(ElectionState expected, ElectionState actual);
    error InvalidCandidate(uint256 candidateId);
    error NotEligible(address voter);
    error AlreadyVoted(address voter);
    error NoCandidates();
    error TooManyCandidates();
    error BatchTooLarge();
    error EmptyField(string field);
    error FieldTooLong(string field);

    // ---------------------------------------------------------------------
    // Modifiers
    // ---------------------------------------------------------------------

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier inState(ElectionState expected) {
        if (state != expected) revert InvalidState(expected, state);
        _;
    }

    // ---------------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------------

    constructor(string memory name_) {
        _validateText("electionName", name_, MAX_NAME_LENGTH, true);
        owner = msg.sender;
        electionName = name_;
        state = ElectionState.Setup;
        emit OwnershipTransferred(address(0), msg.sender);
    }

    // ---------------------------------------------------------------------
    // Admin: ownership
    // ---------------------------------------------------------------------

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddress();
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    // ---------------------------------------------------------------------
    // Admin: setup phase
    // ---------------------------------------------------------------------

    function addCandidate(
        string calldata name,
        string calldata party,
        string calldata symbol,
        string calldata description
    ) external onlyOwner inState(ElectionState.Setup) returns (uint256 candidateId) {
        if (_candidates.length >= MAX_CANDIDATES) revert TooManyCandidates();
        _validateText("name", name, MAX_NAME_LENGTH, true);
        _validateText("party", party, MAX_NAME_LENGTH, true);
        _validateText("symbol", symbol, MAX_SYMBOL_LENGTH, true);
        _validateText("description", description, MAX_DESCRIPTION_LENGTH, false);

        candidateId = _candidates.length;
        _candidates.push(
            Candidate({
                id: candidateId,
                name: name,
                party: party,
                symbol: symbol,
                description: description,
                voteCount: 0
            })
        );
        emit CandidateAdded(candidateId, name, party);
    }

    /// @notice Registers eligible voters. Allowed during Setup and Active so late registrations are possible.
    /// @dev Already-registered addresses are skipped silently so batches are idempotent.
    function registerVoters(address[] calldata voters) external onlyOwner {
        if (state == ElectionState.Ended) revert InvalidState(ElectionState.Active, state);
        if (voters.length > MAX_VOTERS_PER_BATCH) revert BatchTooLarge();

        for (uint256 i = 0; i < voters.length; ++i) {
            address voter = voters[i];
            if (voter == address(0)) revert ZeroAddress();
            if (isEligibleVoter[voter]) continue;
            isEligibleVoter[voter] = true;
            ++eligibleVoterCount;
            emit VoterRegistered(voter);
        }
    }

    /// @notice Removes a voter before the election starts (e.g. registered by mistake).
    function removeVoter(address voter) external onlyOwner inState(ElectionState.Setup) {
        if (!isEligibleVoter[voter]) revert NotEligible(voter);
        isEligibleVoter[voter] = false;
        --eligibleVoterCount;
        emit VoterRemoved(voter);
    }

    // ---------------------------------------------------------------------
    // Admin: lifecycle
    // ---------------------------------------------------------------------

    function startElection() external onlyOwner inState(ElectionState.Setup) {
        if (_candidates.length == 0) revert NoCandidates();
        state = ElectionState.Active;
        startedAt = uint64(block.timestamp);
        emit ElectionStarted(block.timestamp);
    }

    function endElection() external onlyOwner inState(ElectionState.Active) {
        state = ElectionState.Ended;
        endedAt = uint64(block.timestamp);
        emit ElectionEnded(block.timestamp, totalVotes);
    }

    // ---------------------------------------------------------------------
    // Voting
    // ---------------------------------------------------------------------

    function vote(uint256 candidateId) external inState(ElectionState.Active) {
        if (!isEligibleVoter[msg.sender]) revert NotEligible(msg.sender);
        if (hasVoted[msg.sender]) revert AlreadyVoted(msg.sender);
        if (candidateId >= _candidates.length) revert InvalidCandidate(candidateId);

        // Effects only — no external calls, so no reentrancy surface.
        hasVoted[msg.sender] = true;
        _candidates[candidateId].voteCount += 1;
        totalVotes += 1;

        emit VoteCast(msg.sender, candidateId);
    }

    // ---------------------------------------------------------------------
    // Public reads
    // ---------------------------------------------------------------------

    function candidateCount() external view returns (uint256) {
        return _candidates.length;
    }

    function getCandidate(uint256 candidateId) external view returns (Candidate memory) {
        if (candidateId >= _candidates.length) revert InvalidCandidate(candidateId);
        return _candidates[candidateId];
    }

    function getCandidates() external view returns (Candidate[] memory) {
        return _candidates;
    }

    /// @notice One-call summary for frontends.
    function getElectionInfo()
        external
        view
        returns (
            string memory name,
            ElectionState currentState,
            address admin,
            uint256 candidates,
            uint256 votes,
            uint256 eligibleVoters,
            uint64 startTime,
            uint64 endTime
        )
    {
        return (
            electionName,
            state,
            owner,
            _candidates.length,
            totalVotes,
            eligibleVoterCount,
            startedAt,
            endedAt
        );
    }

    function getVoterStatus(address voter) external view returns (bool eligible, bool voted) {
        return (isEligibleVoter[voter], hasVoted[voter]);
    }

    /// @notice Returns the leading candidate ids (more than one when tied). Empty if no votes yet.
    function getLeaders() external view returns (uint256[] memory leaderIds, uint256 topVotes) {
        uint256 count;
        for (uint256 i = 0; i < _candidates.length; ++i) {
            uint256 v = _candidates[i].voteCount;
            if (v > topVotes) {
                topVotes = v;
                count = 1;
            } else if (v == topVotes && v > 0) {
                ++count;
            }
        }
        leaderIds = new uint256[](count);
        if (count == 0) return (leaderIds, 0);
        uint256 j;
        for (uint256 i = 0; i < _candidates.length; ++i) {
            if (_candidates[i].voteCount == topVotes) leaderIds[j++] = i;
        }
    }

    // ---------------------------------------------------------------------
    // Internal
    // ---------------------------------------------------------------------

    function _validateText(string memory field, string memory value, uint256 maxLen, bool required) private pure {
        uint256 len = bytes(value).length;
        if (required && len == 0) revert EmptyField(field);
        if (len > maxLen) revert FieldTooLong(field);
    }
}
