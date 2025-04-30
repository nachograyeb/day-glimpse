import { expect } from "chai";
import { ethers } from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { DayGlimpse, DayGlimpseNFT } from "../typechain-types";
import { time } from "@nomicfoundation/hardhat-network-helpers";

const _LSP4_TOKEN_NAME_KEY = "0xdeba1e292f8ba88238e10ab3c7f88bd4be4fac56cad5194b6ecceaf653468af1";
const _LSP4_TOKEN_SYMBOL_KEY = "0x2f0a68ab07768e01943a599e73362a0e17a63a72e94dd2e384d2c1d4db932756";
const _LSP4_TOKEN_TYPE_KEY = "0xe0261fa95db2eb3b5439bd033cda66d56b96f92f243a8228fd87550ed7bdfdb3";
const _LSP4_TOKEN_TYPE_NFT = "0x0000000000000000000000000000000000000000000000000000000000000001";

const _LSP8_TOKENID_FORMAT_KEY = "0xf675e9361af1c1664c1868cfa3eb97672d6b1a513aa5b81dec34c9ee330e818d";
const _LSP8_TOKENID_FORMAT_NUMBER = "0x0000000000000000000000000000000000000000000000000000000000000000";
const _LSP8_TOKENID_FORMAT_HASH = "0x0000000000000000000000000000000000000000000000000000000000000004";

describe("DayGlimpseNFT", function () {
  let dayGlimpse: DayGlimpse;
  let dayGlimpseNFT: DayGlimpseNFT;
  let owner: HardhatEthersSigner;
  let user1: HardhatEthersSigner;
  let user2: HardhatEthersSigner;
  let user3: HardhatEthersSigner;
  let users: HardhatEthersSigner[];

  const NFT_NAME = "DayGlimpse NFT";
  const NFT_SYMBOL = "DGNFT";
  const testStorageHash = ethers.toUtf8Bytes("ipfs://QmTest123");
  const privateStorageHash = ethers.toUtf8Bytes("ipfs://QmPrivateContent");

  beforeEach(async function () {
    [owner, user1, user2, user3, ...users] = await ethers.getSigners();

    const DayGlimpseFactory = await ethers.getContractFactory("DayGlimpse");
    dayGlimpse = await DayGlimpseFactory.deploy() as DayGlimpse;

    const DayGlimpseNFTFactory = await ethers.getContractFactory("DayGlimpseNFT");
    dayGlimpseNFT = await DayGlimpseNFTFactory.deploy(
      NFT_NAME,
      NFT_SYMBOL,
      owner.address,
      dayGlimpse.target
    ) as DayGlimpseNFT;

    await dayGlimpse.connect(owner).setNFTContract(dayGlimpseNFT.target);
  });

  describe("Constructor", function () {
    it("Should correctly set the DayGlimpse contract address", async function () {
      expect(await dayGlimpseNFT.dayGlimpseContract()).to.equal(dayGlimpse.target);
    });

    it("Should set the correct name and symbol in ERC725Y data", async function () {
      const nameData = await dayGlimpseNFT["getData(bytes32)"](_LSP4_TOKEN_NAME_KEY);
      const symbolData = await dayGlimpseNFT["getData(bytes32)"](_LSP4_TOKEN_SYMBOL_KEY);

      const name = ethers.toUtf8String(nameData);
      const symbol = ethers.toUtf8String(symbolData);

      expect(name).to.equal(NFT_NAME);
      expect(symbol).to.equal(NFT_SYMBOL);
    });

    it("Should set the owner as the correct controller", async function () {
      try {
        const ownerAddress = await dayGlimpseNFT.owner();
        expect(ownerAddress).to.equal(owner.address);
      } catch (error) {
        const OWNER_KEY = "0x5ef83ad9559033e6e941db7d7c495acdce616347d28e90c7ce47cbfcfcad3bc5";
        const ownerData = await dayGlimpseNFT["getData(bytes32)"](OWNER_KEY);

        const ownerAddress = ethers.getAddress("0x" + ownerData.slice(26));
        expect(ownerAddress.toLowerCase()).to.equal(owner.address.toLowerCase());
      }
    });

    it("Should set the correct token type and format", async function () {
      const tokenType = await dayGlimpseNFT["getData(bytes32)"](_LSP4_TOKEN_TYPE_KEY);
      const tokenIdFormat = await dayGlimpseNFT["getData(bytes32)"](_LSP8_TOKENID_FORMAT_KEY);

      expect(
        tokenIdFormat === _LSP8_TOKENID_FORMAT_HASH || tokenIdFormat === _LSP8_TOKENID_FORMAT_NUMBER
      ).to.be.true;

      expect(tokenType).to.equal(_LSP4_TOKEN_TYPE_NFT);
    });
  });

  describe("getTokenId", function () {
    it("Should correctly calculate token ID based on user, profile, and timestamp", async function () {
      const fakeTimestamp = BigInt(Math.floor(Date.now() / 1000));

      const expectedTokenId = ethers.keccak256(
        ethers.solidityPacked(
          ["address", "address", "uint256"],
          [user1.address, user2.address, fakeTimestamp]
        )
      );

      const calculatedTokenId = await dayGlimpseNFT.getTokenId(
        user1.address,
        user2.address,
        fakeTimestamp
      );

      expect(calculatedTokenId).to.equal(expectedTokenId);
    });
  });

  describe("mintDayGlimpseNFT", function () {
    it("Should only allow the DayGlimpse contract to mint NFTs", async function () {
      const timestamp = BigInt(Math.floor(Date.now() / 1000));

      await expect(
        dayGlimpseNFT.connect(user1).mintDayGlimpseNFT(
          user1.address,
          user2.address,
          testStorageHash,
          timestamp,
          true,
          "0x"
        )
      ).to.be.revertedWith("DayGlimpseNFT: Caller is not the DayGlimpse contract");
    });

    it("Should mint an NFT when called through the DayGlimpse contract", async function () {
      await dayGlimpse.connect(user1).setDayGlimpse(testStorageHash, false);

      const tx = await dayGlimpse.connect(user2).mintNFT(user1.address, true, "0x");
      const receipt = await tx.wait();

      let tokenId;
      if (receipt && receipt.logs) {
        const eventInterface = new ethers.Interface([
          "event DayGlimpseNFTMinted(address indexed minter, address indexed profile, uint256 timestamp, bytes32 tokenId)"
        ]);

        for (const log of receipt.logs) {
          try {
            const parsedLog = eventInterface.parseLog({
              topics: log.topics as string[],
              data: log.data
            });

            if (parsedLog && parsedLog.name === "DayGlimpseNFTMinted") {
              tokenId = parsedLog.args.tokenId;
              break;
            }
          } catch (e) {
            console.log("Not the event we're looking for");
          }
        }
      }

      expect(tokenId).to.not.be.undefined;

      expect(await dayGlimpseNFT.tokenOwnerOf(tokenId)).to.equal(user2.address);
    });

    it("Should store the correct metadata for the minted token", async function () {
      await dayGlimpse.connect(user1).setDayGlimpse(testStorageHash, false);

      const tx = await dayGlimpse.connect(user2).mintNFT(user1.address, true, "0x");
      const receipt = await tx.wait();

      let tokenId;
      let eventTimestamp;
      if (receipt && receipt.logs) {
        const eventInterface = new ethers.Interface([
          "event DayGlimpseNFTMinted(address indexed minter, address indexed profile, uint256 timestamp, bytes32 tokenId)"
        ]);

        for (const log of receipt.logs) {
          try {
            const parsedLog = eventInterface.parseLog({
              topics: log.topics as string[],
              data: log.data
            });

            if (parsedLog && parsedLog.name === "DayGlimpseNFTMinted") {
              tokenId = parsedLog.args.tokenId;
              eventTimestamp = parsedLog.args.timestamp;
              break;
            }
          } catch (e) {
            console.log("Not the event we're looking for");
          }
        }
      }

      const metadataKey = ethers.keccak256(ethers.toUtf8Bytes("DayGlimpseMetadata"));

      const dataKey = ethers.zeroPadValue(metadataKey, 32);
      const rawMetadata = await dayGlimpseNFT["getDataForTokenId(bytes32,bytes32)"](tokenId, dataKey);

      const decodedMetadata = ethers.AbiCoder.defaultAbiCoder().decode(
        ["bytes", "address", "uint256"],
        rawMetadata
      );

      expect(ethers.toUtf8String(decodedMetadata[0])).to.equal(ethers.toUtf8String(testStorageHash));
      expect(decodedMetadata[1]).to.equal(user1.address);
      expect(decodedMetadata[2]).to.equal(eventTimestamp);
    });

    it("Should emit DayGlimpseNFTMinted event with correct parameters", async function () {
      await dayGlimpse.connect(user1).setDayGlimpse(testStorageHash, false);

      const blockNumBefore = await ethers.provider.getBlockNumber();
      const blockBefore = await ethers.provider.getBlock(blockNumBefore);

      const tx = await dayGlimpse.connect(user2).mintNFT(user1.address, true, "0x");
      const receipt = await tx.wait();

      if (receipt && receipt.logs) {
        const eventInterface = new ethers.Interface([
          "event DayGlimpseNFTMinted(address indexed minter, address indexed profile, uint256 timestamp, bytes32 tokenId)"
        ]);

        let foundEvent = false;

        for (const log of receipt.logs) {
          try {
            const parsedLog = eventInterface.parseLog({
              topics: log.topics as string[],
              data: log.data
            });

            if (parsedLog && parsedLog.name === "DayGlimpseNFTMinted") {
              foundEvent = true;
              expect(parsedLog.args.minter).to.equal(user2.address);
              expect(parsedLog.args.profile).to.equal(user1.address);

              const expectedTokenId = ethers.keccak256(
                ethers.solidityPacked(
                  ["address", "address", "uint256"],
                  [user2.address, user1.address, parsedLog.args.timestamp]
                )
              );

              expect(parsedLog.args.tokenId).to.equal(expectedTokenId);
              break;
            }
          } catch (e) {
            console.log("Not the event we're looking for");
          }
        }

        expect(foundEvent).to.be.true;
      }
    });

    it("Should emit LSP8-related events", async function () {
      await dayGlimpse.connect(user1).setDayGlimpse(testStorageHash, false);

      const tx = await dayGlimpse.connect(user2).mintNFT(user1.address, true, "0x");
      const receipt = await tx.wait();

      if (receipt && receipt.logs) {
        let foundNFTContractEvent = false;

        for (const log of receipt.logs) {
          if (log.address.toLowerCase() === dayGlimpseNFT.target.toLowerCase()) {
            foundNFTContractEvent = true;
            break;
          }
        }

        expect(foundNFTContractEvent).to.be.true;
      }
    });
  });

  describe("getDayGlimpseDataForToken", function () {
    it("Should return correct data for a minted token", async function () {
      await dayGlimpse.connect(user1).setDayGlimpse(testStorageHash, false);
      const tx = await dayGlimpse.connect(user2).mintNFT(user1.address, true, "0x");
      const receipt = await tx.wait();

      let tokenId;
      if (receipt && receipt.logs) {
        const eventInterface = new ethers.Interface([
          "event DayGlimpseNFTMinted(address indexed minter, address indexed profile, uint256 timestamp, bytes32 tokenId)"
        ]);

        for (const log of receipt.logs) {
          try {
            const parsedLog = eventInterface.parseLog({
              topics: log.topics as string[],
              data: log.data
            });

            if (parsedLog && parsedLog.name === "DayGlimpseNFTMinted") {
              tokenId = parsedLog.args.tokenId;
              break;
            }
          } catch (e) {
            console.log("Not the event we're looking for");
          }
        }
      }

      const [storageHash, profile, timestamp] = await dayGlimpseNFT.getDayGlimpseDataForToken(tokenId);

      expect(ethers.toUtf8String(storageHash)).to.equal(ethers.toUtf8String(testStorageHash));
      expect(profile).to.equal(user1.address);
      expect(timestamp).to.be.gt(0);
    });
  });

  describe("Integration with DayGlimpse", function () {
    it("Should fail to mint when content is private", async function () {
      await dayGlimpse.connect(user1).setDayGlimpse(testStorageHash, true);

      await expect(
        dayGlimpse.connect(user2).mintNFT(user1.address, true, "0x")
      ).to.be.revertedWith("DayGlimpse: Cannot mint from private DayGlimpse");
    });

    it("Should allow mints from the same glimpse for different users, but not the same user", async function () {
      await dayGlimpse.connect(user1).setDayGlimpse(testStorageHash, false);
      await dayGlimpse.connect(user2).mintNFT(user1.address, true, "0x");

      await expect(
        dayGlimpse.connect(user3).mintNFT(user1.address, true, "0x")
      ).not.to.be.reverted;

      await expect(
        dayGlimpse.connect(user2).mintNFT(user1.address, true, "0x")
      ).to.be.reverted;
    });
  });

  describe("Close Friends Functionality", function () {
    it("Should establish close friend relationship after minting NFT", async function () {
      await dayGlimpse.connect(user1).setDayGlimpse(testStorageHash, false);

      await dayGlimpse.connect(user2).mintNFT(user1.address, true, "0x");


      await dayGlimpse.connect(user1).setDayGlimpse(privateStorageHash, true);

      const glimpse = await dayGlimpse.connect(user2).getDayGlimpse(user1.address);

      expect(glimpse.isPrivate).to.equal(true);
      expect(ethers.toUtf8String(glimpse.storageHash)).to.equal(ethers.toUtf8String(privateStorageHash));
    });

    it("Should prevent non-close friends from accessing private content", async function () {
      await dayGlimpse.connect(user1).setDayGlimpse(testStorageHash, false);

      await dayGlimpse.connect(user2).mintNFT(user1.address, true, "0x");


      await dayGlimpse.connect(user1).setDayGlimpse(privateStorageHash, true);

      await expect(
        dayGlimpse.connect(user3).getDayGlimpse(user1.address)
      ).to.be.revertedWith("DayGlimpse: This content is only available to close friends");
    });

    it("Should handle multiple token ownership correctly", async function () {
      await dayGlimpse.connect(user1).setDayGlimpse(testStorageHash, false);
      await dayGlimpse.connect(user2).setDayGlimpse(ethers.toUtf8Bytes("ipfs://User2Content"), false);

      await dayGlimpse.connect(user3).mintNFT(user1.address, true, "0x");
      await dayGlimpse.connect(user3).mintNFT(user2.address, true, "0x");

      await dayGlimpse.connect(user1).setDayGlimpse(privateStorageHash, true);
      await dayGlimpse.connect(user2).setDayGlimpse(ethers.toUtf8Bytes("ipfs://User2PrivateContent"), true);

      const glimpse1 = await dayGlimpse.connect(user3).getDayGlimpse(user1.address);
      const glimpse2 = await dayGlimpse.connect(user3).getDayGlimpse(user2.address);

      expect(glimpse1.isPrivate).to.equal(true);
      expect(glimpse2.isPrivate).to.equal(true);
    });

    it("Should allow profile owner to always access their own private glimpse", async function () {
      await dayGlimpse.connect(user1).setDayGlimpse(privateStorageHash, true);

      const glimpse = await dayGlimpse.connect(user1).getDayGlimpse(user1.address);

      expect(glimpse.isPrivate).to.equal(true);
      expect(ethers.toUtf8String(glimpse.storageHash)).to.equal(ethers.toUtf8String(privateStorageHash));
    });

    it("Should maintain close friend access after glimpse expires", async function () {
      await dayGlimpse.connect(user1).setDayGlimpse(testStorageHash, false);

      await dayGlimpse.connect(user2).mintNFT(user1.address, true, "0x");

      await dayGlimpse.connect(user1).setDayGlimpse(privateStorageHash, true);

      await time.increase(25 * 60 * 60); // 25 hours

      expect(await dayGlimpse.isExpired(user1.address)).to.equal(true);

      await expect(
        dayGlimpse.connect(user2).getDayGlimpse(user1.address)
      ).to.be.revertedWith("DayGlimpse: Content has expired");

      await dayGlimpse.connect(user1).setDayGlimpse(privateStorageHash, true);

      const glimpse = await dayGlimpse.connect(user2).getDayGlimpse(user1.address);

      expect(glimpse.isPrivate).to.equal(true);
      expect(ethers.toUtf8String(glimpse.storageHash)).to.equal(ethers.toUtf8String(privateStorageHash));
    });
  });

  describe("Edge cases", function () {
    it("Should handle expired glimpses", async function () {
      await dayGlimpse.connect(user1).setDayGlimpse(testStorageHash, false);

      await ethers.provider.send("evm_increaseTime", [25 * 60 * 60]);
      await ethers.provider.send("evm_mine", []);

      await expect(
        dayGlimpse.connect(user2).mintNFT(user1.address, true, "0x")
      ).to.be.revertedWith("DayGlimpse: Content has expired");
    });

    it("Should handle non-existent glimpses", async function () {
      await expect(
        dayGlimpse.connect(user2).mintNFT(user1.address, true, "0x")
      ).to.be.revertedWith("DayGlimpse: No active data for this profile");
    });
  });
});
