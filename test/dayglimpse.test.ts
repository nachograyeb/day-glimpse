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
  let users: HardhatEthersSigner[];

  const EXPIRATION_TIME = 24 * 60 * 60; // 24 hours in seconds
  const testStorageHash = ethers.toUtf8Bytes("ipfs://QmTest123");
  const isPrivate = false;

  beforeEach(async function () {
    // Get signers
    [owner, user1, user2, ...users] = await ethers.getSigners();

    // Deploy mock NFT contract
    const MockNFTFactory = await ethers.getContractFactory("MockDayGlimpseNFT");
    mockNFTContract = await MockNFTFactory.deploy();

    // Deploy contract
    const DayGlimpseFactory: ContractFactory = await ethers.getContractFactory("DayGlimpse");
    dayGlimpse = await DayGlimpseFactory.deploy();
  });

  describe("Owner functions", function () {
    it("Should set the NFT contract address", async function () {
      await dayGlimpse.connect(owner).setNFTContract(mockNFTContract.target);

      expect(await dayGlimpse.nftContractAddress()).to.equal(mockNFTContract.target);

      // Check if an event was emitted
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
      // Set a day glimpse as user1
      await dayGlimpse.connect(user1).setDayGlimpse(testStorageHash, isPrivate);

      // Check if an event was emitted
      const filter = dayGlimpse.filters.DayGlimpseCreated;
      const events = await dayGlimpse.queryFilter(filter);
      expect(events.length).to.equal(1);
      expect(events[0].args[0]).to.equal(user1.address); // profile address
    });

    it("Should replace an existing day glimpse", async function () {
      // Set initial day glimpse
      await dayGlimpse.connect(user1).setDayGlimpse(testStorageHash, isPrivate);

      // Set a new day glimpse (should replace the first one)
      const newStorageHash = ethers.toUtf8Bytes("ipfs://QmNewTest456");
      await dayGlimpse.connect(user1).setDayGlimpse(newStorageHash, true);

      // Check if two events were emitted
      const filter = dayGlimpse.filters.DayGlimpseCreated;
      const events = await dayGlimpse.queryFilter(filter);
      expect(events.length).to.equal(2);

      // Get the glimpse and verify it's the new one
      const glimpse = await dayGlimpse.connect(user2).getDayGlimpse(user1.address);
      expect(ethers.toUtf8String(glimpse.storageHash)).to.equal("ipfs://QmNewTest456");
      expect(glimpse.isPrivate).to.equal(true);
    });
  });

  describe("getDayGlimpse", function () {
    beforeEach(async function () {
      // Set a day glimpse as user1 for testing
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
      // Increase time by 25 hours (past expiration)
      await time.increase(25 * 60 * 60);

      await expect(
        dayGlimpse.connect(user2).getDayGlimpse(user1.address)
      ).to.be.revertedWith("DayGlimpse: Content has expired");
    });
  });

  describe("markExpired", function () {
    beforeEach(async function () {
      // Set a day glimpse as user1 for testing
      await dayGlimpse.connect(user1).setDayGlimpse(testStorageHash, isPrivate);
    });

    it("Should fail to mark as expired when not expired yet", async function () {
      await expect(
        dayGlimpse.connect(user2).markExpired(user1.address)
      ).to.be.revertedWith("DayGlimpse: Content is not expired yet");
    });

    it("Should mark as expired after 24 hours", async function () {
      // Increase time by 25 hours (past expiration)
      await time.increase(25 * 60 * 60);

      // Mark as expired
      await dayGlimpse.connect(user2).markExpired(user1.address);

      // Verify an event was emitted
      const filter = dayGlimpse.filters.DayGlimpseExpired;
      const events = await dayGlimpse.queryFilter(filter);
      expect(events.length).to.equal(1);
      expect(events[0].args[0]).to.equal(user1.address);

      // Verify glimpse is no longer active
      await expect(
        dayGlimpse.connect(user2).getDayGlimpse(user1.address)
      ).to.be.revertedWith("DayGlimpse: No active data for this profile");
    });

    it("Should fail to mark already inactive data as expired", async function () {
      // Increase time and mark as expired
      await time.increase(25 * 60 * 60);
      await dayGlimpse.connect(user2).markExpired(user1.address);

      // Try to mark it again
      await expect(
        dayGlimpse.connect(user2).markExpired(user1.address)
      ).to.be.revertedWith("DayGlimpse: No active data for this profile");
    });
  });

  describe("deleteDayGlimpse", function () {
    beforeEach(async function () {
      // Set a day glimpse as user1 for testing
      await dayGlimpse.connect(user1).setDayGlimpse(testStorageHash, isPrivate);
    });

    it("Should allow owner to delete their day glimpse", async function () {
      await dayGlimpse.connect(user1).deleteDayGlimpse();

      // Verify an event was emitted
      const filter = dayGlimpse.filters.DayGlimpseDeleted;
      const events = await dayGlimpse.queryFilter(filter);
      expect(events.length).to.equal(1);

      // Verify glimpse is no longer active
      await expect(
        dayGlimpse.connect(user2).getDayGlimpse(user1.address)
      ).to.be.revertedWith("DayGlimpse: No active data for this profile");
    });

    it("Should fail when non-owner tries to delete", async function () {
      // user2 tries to delete user1's glimpse
      await expect(
        dayGlimpse.connect(user2).deleteDayGlimpse()
      ).to.be.revertedWith("DayGlimpse: No active data to delete");
    });
  });

  describe("isExpired", function () {
    beforeEach(async function () {
      // Set a day glimpse as user1 for testing
      await dayGlimpse.connect(user1).setDayGlimpse(testStorageHash, isPrivate);
    });

    it("Should return false when content is not expired", async function () {
      const expired = await dayGlimpse.isExpired(user1.address);
      expect(expired).to.equal(false);
    });

    it("Should return true when content is expired", async function () {
      // Increase time by 25 hours (past expiration)
      await time.increase(25 * 60 * 60);

      const expired = await dayGlimpse.isExpired(user1.address);
      expect(expired).to.equal(true);
    });

    it("Should return false for inactive content", async function () {
      // Delete the content
      await dayGlimpse.connect(user1).deleteDayGlimpse();

      const expired = await dayGlimpse.isExpired(user1.address);
      expect(expired).to.equal(false);
    });
  });

  describe("mintNFT", function () {
    beforeEach(async function () {
      // Set a day glimpse as user1 for testing
      await dayGlimpse.connect(user1).setDayGlimpse(testStorageHash, isPrivate);

      // Set the NFT contract
      await dayGlimpse.connect(owner).setNFTContract(mockNFTContract.target);
    });

    it("Should fail to mint when NFT contract is not set", async function () {
      // Deploy a new contract without setting the NFT contract
      const DayGlimpseFactory = await ethers.getContractFactory("DayGlimpse");
      const newDayGlimpse = await DayGlimpseFactory.deploy();

      // Set a day glimpse
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
      // Set a public glimpse
      await dayGlimpse.connect(user1).setDayGlimpse(testStorageHash, false);

      // Increase time by 25 hours (past expiration)
      await time.increase(25 * 60 * 60);

      await expect(
        dayGlimpse.connect(user2).mintNFT(user1.address, false, "0x")
      ).to.be.revertedWith("DayGlimpse: Content has expired");
    });

    it("Should mint NFT successfully", async function () {
      // Set a public glimpse
      await dayGlimpse.connect(user1).setDayGlimpse(testStorageHash, false);

      // Mock the NFT contract to return a tokenId
      const mockTokenId = ethers.keccak256(ethers.toUtf8Bytes("mockTokenId"));
      await mockNFTContract.setMockTokenId(mockTokenId);

      // Mint NFT
      const tx = await dayGlimpse.connect(user2).mintNFT(user1.address, false, "0x");

      // Check if token was minted correctly
      expect(await mockNFTContract.lastMinter()).to.equal(user2.address);
      expect(await mockNFTContract.lastProfile()).to.equal(user1.address);

      // Verify an event was emitted
      const filter = dayGlimpse.filters.DayGlimpseNFTMinted;
      const events = await dayGlimpse.queryFilter(filter);
      expect(events.length).to.equal(1);
      expect(events[0].args[0]).to.equal(user2.address); // minter
      expect(events[0].args[1]).to.equal(user1.address); // profile
      expect(events[0].args[3]).to.equal(mockTokenId); // tokenId
    });
  });
});
