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

        return mockTokenId;
    }

    function getTokenId(
        address user,
        address profile,
        uint256 timestamp
    ) external pure override returns (bytes32) {
        return keccak256(abi.encodePacked(user, profile, timestamp));
    }
}
