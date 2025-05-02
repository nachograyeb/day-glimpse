// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@lukso/lsp26-contracts/contracts/ILSP26FollowerSystem.sol";

contract MockLSP26FollowerSystem is ILSP26FollowerSystem {
    // Mock storage for follower relationships
    mapping(address => mapping(address => bool)) private _isFollowing;
    mapping(address => address[]) private _followers;
    mapping(address => address[]) private _following;

    // Functions to set mock data for testing
    function setFollowStatus(
        address follower,
        address followed,
        bool status
    ) external {
        _setFollowStatus(follower, followed, status);
    }

    function setMutualFollowers(address account1, address account2) external {
        _setFollowStatus(account1, account2, true);
        _setFollowStatus(account2, account1, true);
    }

    // Internal helper function
    function _setFollowStatus(
        address follower,
        address followed,
        bool status
    ) internal {
        _isFollowing[follower][followed] = status;

        if (status) {
            // Add to followers/following lists if not already there
            bool found = false;
            for (uint i = 0; i < _followers[followed].length; i++) {
                if (_followers[followed][i] == follower) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                _followers[followed].push(follower);
                _following[follower].push(followed);
            }
        } else {
            // Remove from followers/following lists
            for (uint i = 0; i < _followers[followed].length; i++) {
                if (_followers[followed][i] == follower) {
                    _followers[followed][i] = _followers[followed][
                        _followers[followed].length - 1
                    ];
                    _followers[followed].pop();
                    break;
                }
            }
            for (uint i = 0; i < _following[follower].length; i++) {
                if (_following[follower][i] == followed) {
                    _following[follower][i] = _following[follower][
                        _following[follower].length - 1
                    ];
                    _following[follower].pop();
                    break;
                }
            }
        }
    }

    // ILSP26FollowerSystem interface implementation
    function isFollowing(
        address follower,
        address followed
    ) external view override returns (bool) {
        return _isFollowing[follower][followed];
    }

    function follow(address followed) external override {
        _setFollowStatus(msg.sender, followed, true);
        emit Follow(msg.sender, followed);
    }

    function followBatch(address[] memory addresses) external override {
        for (uint i = 0; i < addresses.length; i++) {
            _setFollowStatus(msg.sender, addresses[i], true);
            emit Follow(msg.sender, addresses[i]);
        }
    }

    function unfollow(address followed) external override {
        _setFollowStatus(msg.sender, followed, false);
        emit Unfollow(msg.sender, followed);
    }

    function unfollowBatch(address[] memory addresses) external override {
        for (uint i = 0; i < addresses.length; i++) {
            _setFollowStatus(msg.sender, addresses[i], false);
            emit Unfollow(msg.sender, addresses[i]);
        }
    }

    function followerCount(
        address addr
    ) external view override returns (uint256) {
        return _followers[addr].length;
    }

    function followingCount(
        address addr
    ) external view override returns (uint256) {
        return _following[addr].length;
    }

    function getFollowsByIndex(
        address addr,
        uint256 startIndex,
        uint256 endIndex
    ) external view override returns (address[] memory) {
        require(startIndex < endIndex, "Invalid range");
        require(endIndex <= _following[addr].length, "End index out of bounds");

        address[] memory result = new address[](endIndex - startIndex);
        for (uint256 i = 0; i < result.length; i++) {
            result[i] = _following[addr][startIndex + i];
        }

        return result;
    }

    function getFollowersByIndex(
        address addr,
        uint256 startIndex,
        uint256 endIndex
    ) external view override returns (address[] memory) {
        require(startIndex < endIndex, "Invalid range");
        require(endIndex <= _followers[addr].length, "End index out of bounds");

        address[] memory result = new address[](endIndex - startIndex);
        for (uint256 i = 0; i < result.length; i++) {
            result[i] = _followers[addr][startIndex + i];
        }

        return result;
    }
}
