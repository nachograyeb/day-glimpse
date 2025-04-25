// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

contract DayGlimpse {
    struct DayGlimpseData {
        bytes storageHash;
        uint256 timestamp;
        bool isPrivate;
        bool isActive;
    }
    mapping(address => DayGlimpseData) private profileToDayGlimpse;

    function setDayGlimpse(
        bytes calldata _storageHash,
        uint256 _timestamp,
        bool _isPrivate
    ) external {
        profileToDayGlimpse[msg.sender] = DayGlimpseData({
            storageHash: _storageHash,
            timestamp: _timestamp,
            isPrivate: _isPrivate,
            isActive: true
        });
    }

    function getDayGlimpse(
        address _profile
    ) external view returns (DayGlimpseData memory) {
        DayGlimpseData storage data = profileToDayGlimpse[_profile];
        require(data.isActive, "DayGlimpse: No active data for this profile");

        return data;
    }
}
