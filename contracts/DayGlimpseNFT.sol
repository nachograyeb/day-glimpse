// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {LSP8Mintable} from "@lukso/lsp8-contracts/contracts/presets/LSP8Mintable.sol";
import {_LSP8_TOKENID_FORMAT_NUMBER} from "@lukso/lsp8-contracts/contracts/LSP8Constants.sol";
import {_LSP4_TOKEN_TYPE_NFT} from "@lukso/lsp4-contracts/contracts/LSP4Constants.sol";
import "./DayGlimpse.sol";

contract DayGlimpseNFT is LSP8Mintable {
    address public immutable dayGlimpseContract;

    event DayGlimpseNFTMinted(
        address indexed minter,
        address indexed profile,
        uint256 timestamp,
        bytes32 tokenId
    );

    modifier onlyDayGlimpseContract() {
        require(
            msg.sender == dayGlimpseContract,
            "DayGlimpseNFT: Caller is not the DayGlimpse contract"
        );
        _;
    }

    constructor(
        string memory name,
        string memory symbol,
        address newOwner,
        address dayGlimpseAddress
    )
        LSP8Mintable(
            name,
            symbol,
            newOwner,
            _LSP4_TOKEN_TYPE_NFT,
            _LSP8_TOKENID_FORMAT_NUMBER
        )
    {
        dayGlimpseContract = dayGlimpseAddress;
    }

    function mintDayGlimpseNFT(
        address minter,
        address profile,
        bytes calldata storageHash,
        uint256 timestamp,
        bool force,
        bytes memory data
    ) external onlyDayGlimpseContract returns (bytes32 tokenId) {
        tokenId = getTokenId(minter, profile, timestamp);

        bytes memory tokenData = abi.encode(storageHash, profile, timestamp);

        _setDataForTokenId(
            tokenId,
            bytes32(uint256(keccak256("DayGlimpseMetadata"))),
            tokenData
        );

        _mint(minter, tokenId, force, data);

        emit DayGlimpseNFTMinted(minter, profile, timestamp, tokenId);

        return tokenId;
    }

    function getTokenId(
        address user,
        address profile,
        uint256 timestamp
    ) public pure returns (bytes32) {
        return bytes32(keccak256(abi.encodePacked(user, profile, timestamp)));
    }

    function getDayGlimpseDataForToken(
        bytes32 tokenId
    )
        external
        view
        returns (bytes memory storageHash, address profile, uint256 timestamp)
    {
        bytes memory data = getDataForTokenId(
            tokenId,
            bytes32(uint256(keccak256("DayGlimpseMetadata")))
        );
        (storageHash, profile, timestamp) = abi.decode(
            data,
            (bytes, address, uint256)
        );
        return (storageHash, profile, timestamp);
    }
}
