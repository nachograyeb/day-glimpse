import { expect } from "chai";
import { ethers } from "hardhat";
import { ContractFactory } from "ethers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("DayGlimpse", function () {
  let dayGlimpse: any;
  let mockNFTContract: any;
  let owner: HardhatEthersSigner;
  let user1: HardhatEthersSigner;
  let user2: HardhatEthersSigner;
  let user3: HardhatEthersSigner;
  let users: HardhatEthersSigner[];

  const testStorageHash = ethers.toUtf8Bytes("ipfs://QmTest123");
  const isPrivate = false;

  beforeEach(async function () {
    [owner, user1, user2, user3, ...users] = await ethers.getSigners();

    const MockNFTFactory = await ethers.getContractFactory("MockDayGlimpseNFT");
    mockNFTContract = await MockNFTFactory.deploy();

    const DayGlimpseFactory: ContractFactory = await ethers.getContractFactory("DayGlimpse");
    dayGlimpse = await DayGlimpseFactory.deploy();
  });

  describe("Owner functions", function () {
    it("Should set the NFT contract address", async function () {
      await dayGlimpse.connect(owner).setNFTContract(mockNFTContract.target);

      expect(await dayGlimpse.nftContractAddress()).to.equal(mockNFTContract.target);

      const filter = dayGlimpse.filters.NFTContractSet;
      const events = await dayGlimpse.queryFilter(filter);
      expect(events.length).to.equal(1);
      expect(events[0].args[0]).to.equal(mockNFTContract.target);
    });

    it("Should fail when non-owner tries to set NFT contract", async function () {
      await expect(
        dayGlimpse.connect(user1).setNFTContract(mockNFTContract.target)
      ).to.be.revertedWith("DayGlimpse: Caller is not the owner");
    });
  });

  describe("setDayGlimpse", function () {
    it("Should set a new day glimpse", async function () {
      await dayGlimpse.connect(user1).setDayGlimpse(testStorageHash, isPrivate);

      const filter = dayGlimpse.filters.DayGlimpseCreated;
      const events = await dayGlimpse.queryFilter(filter);
      expect(events.length).to.equal(1);
      expect(events[0].args[0]).to.equal(user1.address);
    });

    it("Should replace an existing day glimpse", async function () {
      await dayGlimpse.connect(owner).setNFTContract(mockNFTContract.target);
      await dayGlimpse.connect(user1).setDayGlimpse(testStorageHash, isPrivate);

      const newStorageHash = ethers.toUtf8Bytes("ipfs://QmNewTest456");
      await dayGlimpse.connect(user1).setDayGlimpse(newStorageHash, true);

      const filter = dayGlimpse.filters.DayGlimpseCreated;
      const events = await dayGlimpse.queryFilter(filter);
      expect(events.length).to.equal(2);

      const glimpse = await dayGlimpse.connect(user1).getDayGlimpse(user1.address);
      expect(ethers.toUtf8String(glimpse.storageHash)).to.equal("ipfs://QmNewTest456");
      expect(glimpse.isPrivate).to.equal(true);
    });
  });

  describe("getDayGlimpse", function () {
    beforeEach(async function () {
      await dayGlimpse.connect(owner).setNFTContract(mockNFTContract.target);
      await dayGlimpse.connect(user1).setDayGlimpse(testStorageHash, isPrivate);
    });

    it("Should get an active day glimpse", async function () {
      const glimpse = await dayGlimpse.connect(user2).getDayGlimpse(user1.address);
      expect(ethers.toUtf8String(glimpse.storageHash)).to.equal("ipfs://QmTest123");
      expect(glimpse.isPrivate).to.equal(isPrivate);
      expect(glimpse.isActive).to.equal(true);
    });

    it("Should fail when getting a non-existent day glimpse", async function () {
      await expect(
        dayGlimpse.connect(user1).getDayGlimpse(user2.address)
      ).to.be.revertedWith("DayGlimpse: No active data for this profile");
    });

    it("Should fail when getting an expired day glimpse", async function () {
      await time.increase(25 * 60 * 60);

      await expect(
        dayGlimpse.connect(user2).getDayGlimpse(user1.address)
      ).to.be.revertedWith("DayGlimpse: Content has expired");
    });

    it("Should allow profile owner to access their private glimpse", async function () {
      await dayGlimpse.connect(user1).setDayGlimpse(testStorageHash, true);

      const glimpse = await dayGlimpse.connect(user1).getDayGlimpse(user1.address);
      expect(ethers.toUtf8String(glimpse.storageHash)).to.equal("ipfs://QmTest123");
      expect(glimpse.isPrivate).to.equal(true);
    });

    it("Should prevent non-close friends from accessing private glimpses", async function () {
      await dayGlimpse.connect(user1).setDayGlimpse(testStorageHash, true);

      await expect(
        dayGlimpse.connect(user2).getDayGlimpse(user1.address)
      ).to.be.revertedWith("DayGlimpse: This content is only available to close friends");
    });

    it("Should allow close friends to access private glimpses", async function () {
      await dayGlimpse.connect(user1).setDayGlimpse(testStorageHash, true);
      await dayGlimpse.connect(user2).setDayGlimpse(testStorageHash, false);

      const tokenId = ethers.keccak256(ethers.solidityPacked(
        ["address", "address", "uint256"],
        [user3.address, user1.address, Math.floor(Date.now() / 1000)]
      ));

      await mockNFTContract.setTokenIdsOf(user3.address, [tokenId]);

      await mockNFTContract.setDayGlimpseDataForToken(
        tokenId,
        testStorageHash,
        user1.address,
        Math.floor(Date.now() / 1000)
      );

      // User3 should now be able to access user1's private glimpse as a close friend
      const glimpse = await dayGlimpse.connect(user3).getDayGlimpse(user1.address);
      expect(ethers.toUtf8String(glimpse.storageHash)).to.equal("ipfs://QmTest123");
      expect(glimpse.isPrivate).to.equal(true);
    });
  });

  describe("markExpired", function () {
    beforeEach(async function () {
      await dayGlimpse.connect(user1).setDayGlimpse(testStorageHash, isPrivate);
    });

    it("Should fail to mark as expired when not expired yet", async function () {
      await expect(
        dayGlimpse.connect(user2).markExpired(user1.address)
      ).to.be.revertedWith("DayGlimpse: Content is not expired yet");
    });

    it("Should mark as expired after 24 hours", async function () {
      await time.increase(25 * 60 * 60);

      await dayGlimpse.connect(user2).markExpired(user1.address);

      const filter = dayGlimpse.filters.DayGlimpseExpired;
      const events = await dayGlimpse.queryFilter(filter);
      expect(events.length).to.equal(1);
      expect(events[0].args[0]).to.equal(user1.address);

      await expect(
        dayGlimpse.connect(user2).getDayGlimpse(user1.address)
      ).to.be.revertedWith("DayGlimpse: No active data for this profile");
    });

    it("Should fail to mark already inactive data as expired", async function () {
      await time.increase(25 * 60 * 60);
      await dayGlimpse.connect(user2).markExpired(user1.address);

      await expect(
        dayGlimpse.connect(user2).markExpired(user1.address)
      ).to.be.revertedWith("DayGlimpse: No active data for this profile");
    });
  });

  describe("deleteDayGlimpse", function () {
    beforeEach(async function () {
      await dayGlimpse.connect(user1).setDayGlimpse(testStorageHash, isPrivate);
    });

    it("Should allow owner to delete their day glimpse", async function () {
      await dayGlimpse.connect(user1).deleteDayGlimpse();

      const filter = dayGlimpse.filters.DayGlimpseDeleted;
      const events = await dayGlimpse.queryFilter(filter);
      expect(events.length).to.equal(1);

      await expect(
        dayGlimpse.connect(user2).getDayGlimpse(user1.address)
      ).to.be.revertedWith("DayGlimpse: No active data for this profile");
    });

    it("Should fail when non-owner tries to delete", async function () {
      await expect(
        dayGlimpse.connect(user2).deleteDayGlimpse()
      ).to.be.revertedWith("DayGlimpse: No active data to delete");
    });
  });

  describe("isExpired", function () {
    beforeEach(async function () {
      await dayGlimpse.connect(user1).setDayGlimpse(testStorageHash, isPrivate);
    });

    it("Should return false when content is not expired", async function () {
      const expired = await dayGlimpse.isExpired(user1.address);
      expect(expired).to.equal(false);
    });

    it("Should return true when content is expired", async function () {
      await time.increase(25 * 60 * 60);

      const expired = await dayGlimpse.isExpired(user1.address);
      expect(expired).to.equal(true);
    });

    it("Should return false for inactive content", async function () {
      await dayGlimpse.connect(user1).deleteDayGlimpse();

      const expired = await dayGlimpse.isExpired(user1.address);
      expect(expired).to.equal(false);
    });
  });

  describe("mintNFT", function () {
    beforeEach(async function () {
      await dayGlimpse.connect(user1).setDayGlimpse(testStorageHash, isPrivate);

      await dayGlimpse.connect(owner).setNFTContract(mockNFTContract.target);
    });

    it("Should fail to mint when NFT contract is not set", async function () {
      const DayGlimpseFactory = await ethers.getContractFactory("DayGlimpse");
      const newDayGlimpse = await DayGlimpseFactory.deploy();

      await newDayGlimpse.connect(user1).setDayGlimpse(testStorageHash, false);

      await expect(
        newDayGlimpse.connect(user2).mintNFT(user1.address, false, "0x")
      ).to.be.revertedWith("DayGlimpse: NFT contract not set");
    });

    it("Should fail to mint when glimpse is private", async function () {
      await dayGlimpse.connect(user1).setDayGlimpse(testStorageHash, true);

      await expect(
        dayGlimpse.connect(user2).mintNFT(user1.address, false, "0x")
      ).to.be.revertedWith("DayGlimpse: Cannot mint from private DayGlimpse");
    });

    it("Should fail to mint when content is expired", async function () {
      await dayGlimpse.connect(user1).setDayGlimpse(testStorageHash, false);

      await time.increase(25 * 60 * 60);

      await expect(
        dayGlimpse.connect(user2).mintNFT(user1.address, false, "0x")
      ).to.be.revertedWith("DayGlimpse: Content has expired");
    });

    it("Should mint NFT successfully", async function () {
      await dayGlimpse.connect(user1).setDayGlimpse(testStorageHash, false);

      const mockTokenId = ethers.keccak256(ethers.toUtf8Bytes("mockTokenId"));
      await mockNFTContract.setMockTokenId(mockTokenId);

      const tx = await dayGlimpse.connect(user2).mintNFT(user1.address, false, "0x");

      expect(await mockNFTContract.lastMinter()).to.equal(user2.address);
      expect(await mockNFTContract.lastProfile()).to.equal(user1.address);

      const filter = dayGlimpse.filters.DayGlimpseNFTMinted;
      const events = await dayGlimpse.queryFilter(filter);
      expect(events.length).to.equal(1);
      expect(events[0].args[0]).to.equal(user2.address);
      expect(events[0].args[1]).to.equal(user1.address);
      expect(events[0].args[3]).to.equal(mockTokenId);
    });
  });

  describe("Close friend functionality", function () {
    beforeEach(async function () {
      await dayGlimpse.connect(owner).setNFTContract(mockNFTContract.target);
      await dayGlimpse.connect(user1).setDayGlimpse(testStorageHash, false);
    });

    it("Should establish close friend relationship after minting NFT", async function () {
      const mockTokenId = ethers.keccak256(ethers.toUtf8Bytes("mockTokenId"));

      await mockNFTContract.setMockTokenId(mockTokenId);

      await dayGlimpse.connect(user2).mintNFT(user1.address, false, "0x");

      await mockNFTContract.setTokenIdsOf(user2.address, [mockTokenId]);

      await mockNFTContract.setDayGlimpseDataForToken(
        mockTokenId,
        testStorageHash,
        user1.address,
        Math.floor(Date.now() / 1000)
      );

      await dayGlimpse.connect(user1).setDayGlimpse(
        ethers.toUtf8Bytes("ipfs://QmPrivateContent"),
        true
      );

      // User2 should be able to access user1's private glimpse as a close friend
      const glimpse = await dayGlimpse.connect(user2).getDayGlimpse(user1.address);
      expect(glimpse.isPrivate).to.equal(true);
      expect(ethers.toUtf8String(glimpse.storageHash)).to.equal("ipfs://QmPrivateContent");
    });

    it("Should check all NFTs for close friend relationship", async function () {
      const tokenId1 = ethers.keccak256(ethers.toUtf8Bytes("tokenId1"));
      const tokenId2 = ethers.keccak256(ethers.toUtf8Bytes("tokenId2"));
      const tokenId3 = ethers.keccak256(ethers.toUtf8Bytes("tokenId3"));

      await mockNFTContract.setTokenIdsOf(user2.address, [tokenId1, tokenId2, tokenId3]);

      await mockNFTContract.setDayGlimpseDataForToken(
        tokenId1,
        testStorageHash,
        user3.address,
        Math.floor(Date.now() / 1000)
      );

      await mockNFTContract.setDayGlimpseDataForToken(
        tokenId2,
        testStorageHash,
        user1.address,
        Math.floor(Date.now() / 1000)
      );

      await mockNFTContract.setDayGlimpseDataForToken(
        tokenId3,
        testStorageHash,
        owner.address,
        Math.floor(Date.now() / 1000)
      );

      await dayGlimpse.connect(user1).setDayGlimpse(
        ethers.toUtf8Bytes("ipfs://QmPrivateContent"),
        true
      );

      // User2 should be able to access user1's private glimpse since one of their tokens is from user1
      const glimpse = await dayGlimpse.connect(user2).getDayGlimpse(user1.address);
      expect(glimpse.isPrivate).to.equal(true);
      expect(ethers.toUtf8String(glimpse.storageHash)).to.equal("ipfs://QmPrivateContent");
    });
  });
});
