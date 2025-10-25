// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title ProofOfImpact
 * @dev A smart contract that holds donations in escrow and releases funds to an NGO
 * based on verifiable proof of milestone completion by a designated Oracle.
 * Donors receive a conceptual "Proof-of-Impact" NFT (tracked by a simple counter).
 */
contract ProofOfImpact {

    // --- STATE VARIABLES ---

    address public owner;
    uint256 public nextCampaignId = 1;
    mapping(address => bool) public isOracle;

    struct Milestone {
        string description;
        uint256 requiredAmount;
        bool isProofSubmitted;
        bool isVerified;
        string proofUri;
    }

    struct Campaign {
        address payable ngoAddress;
        string title;
        uint256 targetAmount;
        uint256 amountRaised;
        uint256 fundsReleased;
        Milestone[] milestones;
        uint256 nextMilestoneIndex;
        bool completed;
        uint256 impactNftCounter;
    }

    mapping(uint256 => Campaign) public campaigns;

    // --- EVENTS ---

    event CampaignCreated(uint256 campaignId, address indexed ngo, uint256 target);
    event DonationReceived(uint256 campaignId, address indexed donor, uint256 amount);
    event ProofSubmitted(uint256 campaignId, uint256 milestoneIndex, string proofUri);
    event MilestoneVerifiedAndFundsReleased(uint256 campaignId, uint256 milestoneIndex, uint256 amountReleased);
    event ImpactNftMinted(uint256 campaignId, address indexed donor, uint256 tokenId);

    // --- MODIFIERS ---

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the platform owner can call this function.");
        _;
    }

    modifier onlyOracle() {
        require(isOracle[msg.sender], "Only a designated Oracle can call this function.");
        _;
    }

    modifier onlyNGO(uint256 _campaignId) {
        require(campaigns[_campaignId].ngoAddress == msg.sender, "Only the campaign's NGO can call this function.");
        _;
    }

    // --- CONSTRUCTOR & RECEIVE FALLBACK ---

    constructor() {
        owner = msg.sender;
        isOracle[msg.sender] = true;
    }
    
    receive() external payable {
        revert("Use the 'donate' function to contribute to a campaign.");
    }

    // --- ORACLE MANAGEMENT ---

    function setOracle(address _oracleAddress, bool _status) public onlyOwner {
        isOracle[_oracleAddress] = _status;
    }

    // --- CAMPAIGN MANAGEMENT ---

    function createCampaign(
        address payable _ngoAddress,
        string memory _title,
        string[] memory _milestoneDescriptions,
        uint256[] memory _milestoneAmounts
    ) public onlyOwner returns (uint256) {
        require(_milestoneDescriptions.length == _milestoneAmounts.length, "Milestone arrays must be same length.");
        require(_milestoneDescriptions.length > 0, "Campaign must have at least one milestone.");

        uint256 totalTarget = 0;
        Milestone[] memory newMilestones = new Milestone[](_milestoneDescriptions.length);
        
        for (uint i = 0; i < _milestoneDescriptions.length; i++) {
            require(_milestoneAmounts[i] > 0, "Milestone amount must be greater than zero.");
            newMilestones[i] = Milestone({
                description: _milestoneDescriptions[i],
                requiredAmount: _milestoneAmounts[i],
                isProofSubmitted: false,
                isVerified: false,
                proofUri: ""
            });
            totalTarget += _milestoneAmounts[i];
        }

        uint256 newCampaignId = nextCampaignId;
        Campaign storage campaign = campaigns[newCampaignId];

        campaign.ngoAddress = _ngoAddress;
        campaign.title = _title;
        campaign.targetAmount = totalTarget;
        campaign.amountRaised = 0;
        campaign.fundsReleased = 0;
        campaign.nextMilestoneIndex = 0;
        campaign.completed = false;
        campaign.impactNftCounter = 0;

        for (uint i = 0; i < newMilestones.length; i++) {
            campaign.milestones.push(newMilestones[i]);
        }

        emit CampaignCreated(newCampaignId, _ngoAddress, totalTarget);
        nextCampaignId++;
        return newCampaignId;
    }

    // --- DONATION LOGIC ---

    function donate(uint256 _campaignId) public payable {
        Campaign storage campaign = campaigns[_campaignId];
        require(campaign.ngoAddress != address(0), "Campaign does not exist.");
        require(msg.value > 0, "Donation amount must be greater than zero.");
        require(!campaign.completed, "Campaign is already completed.");

        campaign.amountRaised += msg.value;
        campaign.impactNftCounter++;
        
        emit ImpactNftMinted(_campaignId, msg.sender, campaign.impactNftCounter);
        emit DonationReceived(_campaignId, msg.sender, msg.value);
    }

    // --- PROOF & VERIFICATION LOGIC ---

    function submitProof(uint256 _campaignId, string memory _proofUri) public onlyNGO(_campaignId) {
        Campaign storage campaign = campaigns[_campaignId];
        uint256 index = campaign.nextMilestoneIndex;

        require(!campaign.completed, "Campaign is already completed.");
        require(index < campaign.milestones.length, "No next milestone to submit proof for.");
        require(campaign.milestones[index].requiredAmount <= campaign.amountRaised - campaign.fundsReleased, "Not enough funds in escrow for this milestone.");
        require(!campaign.milestones[index].isProofSubmitted, "Proof for this milestone already submitted.");

        campaign.milestones[index].isProofSubmitted = true;
        campaign.milestones[index].proofUri = _proofUri;

        emit ProofSubmitted(_campaignId, index, _proofUri);
    }

    function verifyMilestoneAndRelease(uint256 _campaignId, uint256 _milestoneIndex) public onlyOracle {
        Campaign storage campaign = campaigns[_campaignId];
        Milestone storage milestone = campaign.milestones[_milestoneIndex];

        require(campaign.ngoAddress != address(0), "Campaign does not exist.");
        require(!milestone.isVerified, "Milestone is already verified.");
        require(milestone.isProofSubmitted, "Proof must be submitted before verification.");
        require(_milestoneIndex == campaign.nextMilestoneIndex, "Verification must be for the next sequential milestone.");

        milestone.isVerified = true;
        uint256 amountToRelease = milestone.requiredAmount;
        campaign.fundsReleased += amountToRelease;

        (bool success, ) = campaign.ngoAddress.call{value: amountToRelease}("");
        require(success, "Fund transfer failed to NGO.");

        campaign.nextMilestoneIndex++;

        if (campaign.nextMilestoneIndex == campaign.milestones.length) {
            campaign.completed = true;
            uint256 remainingFunds = address(this).balance - (campaign.amountRaised - campaign.fundsReleased);
            if (remainingFunds > 0) {
                 (success, ) = campaign.ngoAddress.call{value: remainingFunds}("");
                 require(success, "Remaining fund transfer failed.");
                 campaign.fundsReleased += remainingFunds;
            }
        }

        emit MilestoneVerifiedAndFundsReleased(_campaignId, _milestoneIndex, amountToRelease);
    }

    function emergencyWithdraw(address payable _recipient, uint256 _amount) public onlyOwner {
        require(_amount <= address(this).balance, "Insufficient balance.");
        (bool success, ) = _recipient.call{value: _amount}("");
        require(success, "Withdrawal failed.");
    }

    // --- VIEW FUNCTIONS FOR FRONTEND ---

    /**
     * @dev Get campaign details (without milestones array which can't be returned directly)
     */
    function getCampaignInfo(uint256 _campaignId) public view returns (
        address ngoAddress,
        string memory title,
        uint256 targetAmount,
        uint256 amountRaised,
        uint256 fundsReleased,
        uint256 nextMilestoneIndex,
        bool completed,
        uint256 impactNftCounter,
        uint256 milestoneCount
    ) {
        Campaign storage c = campaigns[_campaignId];
        return (
            c.ngoAddress,
            c.title,
            c.targetAmount,
            c.amountRaised,
            c.fundsReleased,
            c.nextMilestoneIndex,
            c.completed,
            c.impactNftCounter,
            c.milestones.length
        );
    }

    /**
     * @dev Get a specific milestone's details
     */
    function getMilestone(uint256 _campaignId, uint256 _milestoneIndex) public view returns (
        string memory description,
        uint256 requiredAmount,
        bool isProofSubmitted,
        bool isVerified,
        string memory proofUri
    ) {
        require(_milestoneIndex < campaigns[_campaignId].milestones.length, "Milestone index out of bounds.");
        Milestone storage m = campaigns[_campaignId].milestones[_milestoneIndex];
        return (m.description, m.requiredAmount, m.isProofSubmitted, m.isVerified, m.proofUri);
    }

    /**
     * @dev Get all milestones for a campaign
     */
    function getAllMilestones(uint256 _campaignId) public view returns (
        string[] memory descriptions,
        uint256[] memory requiredAmounts,
        bool[] memory isProofSubmittedArray,
        bool[] memory isVerifiedArray,
        string[] memory proofUris
    ) {
        Campaign storage campaign = campaigns[_campaignId];
        uint256 length = campaign.milestones.length;
        
        descriptions = new string[](length);
        requiredAmounts = new uint256[](length);
        isProofSubmittedArray = new bool[](length);
        isVerifiedArray = new bool[](length);
        proofUris = new string[](length);
        
        for (uint256 i = 0; i < length; i++) {
            Milestone storage m = campaign.milestones[i];
            descriptions[i] = m.description;
            requiredAmounts[i] = m.requiredAmount;
            isProofSubmittedArray[i] = m.isProofSubmitted;
            isVerifiedArray[i] = m.isVerified;
            proofUris[i] = m.proofUri;
        }
        
        return (descriptions, requiredAmounts, isProofSubmittedArray, isVerifiedArray, proofUris);
    }
}