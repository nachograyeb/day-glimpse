// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "../contracts/DayGlimpse.sol";

contract MockDayGlimpseNFT is IDayGlimpseNFT {
    bytes32 public mockTokenId;
    address public lastMinter;
    address public lastProfile;
    bytes public lastStorageHash;
    uint256 public lastTimestamp;
    bool public lastForce;
    bytes public lastData;

    // Mapping to store token data for getTokenDataForToken
    mapping(bytes32 => TokenData) private tokenData;
    // Mapping to store tokens owned by a user
    mapping(address => bytes32[]) private userTokens;

    struct TokenData {
        bytes storageHash;
        address profile;
        uint256 timestamp;
    }

    function setMockTokenId(bytes32 _tokenId) external {
        mockTokenId = _tokenId;
    }

    function mintDayGlimpseNFT(
        address minter,
        address profile,
        bytes calldata storageHash,
        uint256 timestamp,
        bool force,
        bytes memory data
    ) external override returns (bytes32 tokenId) {
        lastMinter = minter;
        lastProfile = profile;
        lastStorageHash = storageHash;
        lastTimestamp = timestamp;
        lastForce = force;
        lastData = data;

        tokenData[mockTokenId] = TokenData({
            storageHash: storageHash,
            profile: profile,
            timestamp: timestamp
        });

        userTokens[minter].push(mockTokenId);

        return mockTokenId;
    }

    function getTokenId(
        address user,
        address profile,
        uint256 timestamp
    ) external pure override returns (bytes32) {
        return keccak256(abi.encodePacked(user, profile, timestamp));
    }

    function getDayGlimpseDataForToken(
        bytes32 tokenId
    )
        external
        view
        override
        returns (bytes memory storageHash, address profile, uint256 timestamp)
    {
        TokenData storage data = tokenData[tokenId];
        return (data.storageHash, data.profile, data.timestamp);
    }

    function tokenIdsOf(
        address tokenOwner
    ) external view override returns (bytes32[] memory) {
        return userTokens[tokenOwner];
    }

    function setDayGlimpseDataForToken(
        bytes32 tokenId,
        bytes calldata storageHash,
        address profile,
        uint256 timestamp
    ) external {
        tokenData[tokenId] = TokenData({
            storageHash: storageHash,
            profile: profile,
            timestamp: timestamp
        });
    }

    function setTokenIdsOf(
        address tokenOwner,
        bytes32[] calldata tokenIds
    ) external {
        delete userTokens[tokenOwner];
        for (uint256 i = 0; i < tokenIds.length; i++) {
            userTokens[tokenOwner].push(tokenIds[i]);
        }
    }
}
