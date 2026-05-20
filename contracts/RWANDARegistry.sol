// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title RWANDARegistry
 * @notice On-chain registry for RWA Trust Score records
 * @dev Records trust score analyses for Real World Asset tokens
 */
contract RWANDARegistry {
    struct TrustRecord {
        string projectId;
        uint256 trustScore;
        string grade;
        string status;
        string analysisHash;  // IPFS hash of full analysis
        uint256 timestamp;
        address analyst;
    }

    // Project ID => array of records
    mapping(string => TrustRecord[]) public projectRecords;

    // All project IDs that have records
    string[] public registeredProjects;
    mapping(string => bool) public isRegistered;

    // Events
    event TrustRecordAdded(
        string indexed projectId,
        uint256 trustScore,
        string grade,
        string status,
        string analysisHash,
        address indexed analyst,
        uint256 timestamp
    );

    /**
     * @notice Record a new trust score analysis
     * @param projectId Unique identifier for the project (e.g., "tether-usdt")
     * @param trustScore The computed trust score (0-100)
     * @param grade Letter grade (e.g., "A", "B+", "C")
     * @param status Status category (HEALTHY, CAUTION, WARNING, CRITICAL)
     * @param analysisHash IPFS hash of the complete analysis JSON
     */
    function recordTrustScore(
        string calldata projectId,
        uint256 trustScore,
        string calldata grade,
        string calldata status,
        string calldata analysisHash
    ) external {
        require(bytes(projectId).length > 0, "Invalid project ID");
        require(trustScore <= 100, "Trust score must be 0-100");
        require(bytes(analysisHash).length > 0, "Analysis hash required");

        TrustRecord memory record = TrustRecord({
            projectId: projectId,
            trustScore: trustScore,
            grade: grade,
            status: status,
            analysisHash: analysisHash,
            timestamp: block.timestamp,
            analyst: msg.sender
        });

        projectRecords[projectId].push(record);

        if (!isRegistered[projectId]) {
            registeredProjects.push(projectId);
            isRegistered[projectId] = true;
        }

        emit TrustRecordAdded(
            projectId,
            trustScore,
            grade,
            status,
            analysisHash,
            msg.sender,
            block.timestamp
        );
    }

    /**
     * @notice Get the latest trust record for a project
     * @param projectId The project identifier
     * @return The most recent TrustRecord
     */
    function getLatestRecord(string calldata projectId)
        external
        view
        returns (TrustRecord memory)
    {
        TrustRecord[] storage records = projectRecords[projectId];
        require(records.length > 0, "No records found");
        return records[records.length - 1];
    }

    /**
     * @notice Get all trust records for a project
     * @param projectId The project identifier
     * @return Array of all TrustRecords
     */
    function getAllRecords(string calldata projectId)
        external
        view
        returns (TrustRecord[] memory)
    {
        return projectRecords[projectId];
    }

    /**
     * @notice Get the number of records for a project
     * @param projectId The project identifier
     * @return Number of records
     */
    function getRecordCount(string calldata projectId)
        external
        view
        returns (uint256)
    {
        return projectRecords[projectId].length;
    }

    /**
     * @notice Get all registered project IDs
     * @return Array of project IDs
     */
    function getRegisteredProjects()
        external
        view
        returns (string[] memory)
    {
        return registeredProjects;
    }
}
