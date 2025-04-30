// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

interface IDayGlimpseNFT {
    function mintDayGlimpseNFT(
        address minter,
        address profile,
        bytes calldata storageHash,
        uint256 timestamp,
        bool force,
        bytes memory data
    ) external returns (bytes32 tokenId);

    function getTokenId(
        address user,
        address profile,
        uint256 timestamp
    ) external pure returns (bytes32);
}

contract DayGlimpse {
    uint256 public constant EXPIRATION_TIME = 24 hours;

    struct DayGlimpseData {
        bytes storageHash;
        uint256 timestamp;
        bool isPrivate;
        bool isActive;
    }

    mapping(address => DayGlimpseData) private profileToDayGlimpse;

    address public nftContractAddress;

    address public owner;
    modifier onlyOwner() {
        require(msg.sender == owner, "DayGlimpse: Caller is not the owner");
        _;
    }

    event DayGlimpseCreated(address indexed profile, uint256 timestamp);
    event DayGlimpseDeleted(address indexed profile);
    event DayGlimpseExpired(address indexed profile);
    event NFTContractSet(address indexed nftContract);
    event DayGlimpseNFTMinted(
        address indexed minter,
        address indexed profile,
        uint256 timestamp,
        bytes32 tokenId
    );

    constructor() {
        owner = msg.sender;
    }

    function setNFTContract(address _nftContractAddress) external onlyOwner {
        nftContractAddress = _nftContractAddress;
        emit NFTContractSet(_nftContractAddress);
    }

    function setDayGlimpse(
        bytes calldata _storageHash,
        bool _isPrivate
    ) external {
        if (profileToDayGlimpse[msg.sender].isActive) {
            delete profileToDayGlimpse[msg.sender];
        }

        profileToDayGlimpse[msg.sender] = DayGlimpseData({
            storageHash: _storageHash,
            timestamp: block.timestamp,
            isPrivate: _isPrivate,
            isActive: true
        });

        emit DayGlimpseCreated(msg.sender, block.timestamp);
    }

    function getDayGlimpse(
        address _profile
    ) external view returns (DayGlimpseData memory) {
        DayGlimpseData storage data = profileToDayGlimpse[_profile];
        require(data.isActive, "DayGlimpse: No active data for this profile");
        require(
            block.timestamp <= data.timestamp + EXPIRATION_TIME,
            "DayGlimpse: Content has expired"
        );

        return data;
    }

    function mintNFT(
        address _profile,
        bool _force,
        bytes memory _data
    ) external returns (bytes32) {
        require(
            nftContractAddress != address(0),
            "DayGlimpse: NFT contract not set"
        );

        DayGlimpseData storage data = profileToDayGlimpse[_profile];

        require(data.isActive, "DayGlimpse: No active data for this profile");

        require(
            block.timestamp <= data.timestamp + EXPIRATION_TIME,
            "DayGlimpse: Content has expired"
        );

        require(
            !data.isPrivate,
            "DayGlimpse: Cannot mint from private DayGlimpse"
        );

        bytes32 tokenId = IDayGlimpseNFT(nftContractAddress).mintDayGlimpseNFT(
            msg.sender,
            _profile,
            data.storageHash,
            data.timestamp,
            _force,
            _data
        );

        emit DayGlimpseNFTMinted(msg.sender, _profile, data.timestamp, tokenId);

        return tokenId;
    }

    function markExpired(address _profile) external {
        DayGlimpseData storage data = profileToDayGlimpse[_profile];
        require(data.isActive, "DayGlimpse: No active data for this profile");
        require(
            block.timestamp > data.timestamp + EXPIRATION_TIME,
            "DayGlimpse: Content is not expired yet"
        );

        data.isActive = false;

        emit DayGlimpseExpired(_profile);
    }

    function deleteDayGlimpse() external {
        require(
            profileToDayGlimpse[msg.sender].isActive,
            "DayGlimpse: No active data to delete"
        );

        delete profileToDayGlimpse[msg.sender];
        emit DayGlimpseDeleted(msg.sender);
    }

    function isExpired(address _profile) public view returns (bool) {
        DayGlimpseData storage data = profileToDayGlimpse[_profile];
        if (!data.isActive) {
            return false;
        }
        return block.timestamp > data.timestamp + EXPIRATION_TIME;
    }
}
