// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/// @title Simple Voting Contract (MG3012 - Assignment 3)
/// @notice One account = one vote. Only the owner can add candidates or close voting.
contract SmartContract {
    struct Candidate {
        uint256 id;
        string name;
        uint256 voteCount;
    }

    address public owner;
    bool public votingOpen;
    uint256 public candidatesCount;

    mapping(uint256 => Candidate) public candidates;
    mapping(address => bool) public hasVoted;

    event CandidateAdded(uint256 indexed id, string name);
    event Voted(address indexed voter, uint256 indexed candidateId);
    event VotingStatusChanged(bool open);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    constructor() {
        owner = msg.sender;
        votingOpen = true;
        _addCandidate("Alice");
        _addCandidate("Bob");
    }

    function addCandidate(string calldata _name) external onlyOwner {
        require(bytes(_name).length > 0, "Name required");
        _addCandidate(_name);
    }

    function vote(uint256 _candidateId) external {
        require(votingOpen, "Voting is closed");
        require(!hasVoted[msg.sender], "Already voted");
        require(_candidateId > 0 && _candidateId <= candidatesCount, "Invalid candidate");

        hasVoted[msg.sender] = true;
        candidates[_candidateId].voteCount += 1;
        emit Voted(msg.sender, _candidateId);
    }

    function setVotingOpen(bool _open) external onlyOwner {
        votingOpen = _open;
        emit VotingStatusChanged(_open);
    }

    function _addCandidate(string memory _name) internal {
        candidatesCount += 1;
        candidates[candidatesCount] = Candidate(candidatesCount, _name, 0);
        emit CandidateAdded(candidatesCount, _name);
    }
}
