// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

contract DayGlimpse {
    uint256 public constant EXPIRATION_TIME = 24 hours;

    struct DayGlimpseData {
        bytes storageHash;
        uint256 timestamp;
        bool isPrivate;
        bool isActive;
    }

    mapping(address => DayGlimpseData) private profileToDayGlimpse;

    event DayGlimpseCreated(address indexed profile, uint256 timestamp);
    event DayGlimpseDeleted(address indexed profile);
    event DayGlimpseExpired(address indexed profile);

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

    function testFunc() external pure returns (string memory) {
        return "Test function";
    }
}
