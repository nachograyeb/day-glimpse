import { expect } from "chai";
import { ethers } from "hardhat";
import { ContractFactory } from "ethers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("DayGlimpse", function () {
  let dayGlimpse: any;
  let mockNFTContract: any;
  let mockFollowerSystem: any;
  let owner: HardhatEthersSigner;
  let user1: HardhatEthersSigner;
  let user2: HardhatEthersSigner;
  let user3: HardhatEthersSigner;
  let users: HardhatEthersSigner[];

  const testStorageHash = ethers.toUtf8Bytes("ipfs://QmTest123");
  const isPrivate = false;

  beforeEach(async function () {
    [owner, user1, user2, user3, ...users] = await ethers.getSigners();

    // Deploy mock NFT contract
    const MockNFTFactory = await ethers.getContractFactory("MockDayGlimpseNFT");
    mockNFTContract = await MockNFTFactory.deploy();

    // Deploy mock follower system
    const MockFollowerSystemFactory = await ethers.getContractFactory("MockLSP26FollowerSystem");
    mockFollowerSystem = await MockFollowerSystemFactory.deploy();

    // Deploy DayGlimpse contract
    const DayGlimpseFactory: ContractFactory = await ethers.getContractFactory("DayGlimpse");
    dayGlimpse = await DayGlimpseFactory.deploy();

    // Set NFT contract in DayGlimpse
    await dayGlimpse.connect(owner).setNFTContract(mockNFTContract.target);

    // Set Follower System contract in DayGlimpse
    await dayGlimpse.connect(owner).setFollowerSystemContract(mockFollowerSystem.target);
  });

  describe("Owner functions", function () {
    it("Should set the NFT contract address", async function () {
      // Since we set it in beforeEach, we'll reset and test again
      const DayGlimpseFactory = await ethers.getContractFactory("DayGlimpse");
      const newDayGlimpse = await DayGlimpseFactory.deploy();

      await newDayGlimpse.connect(owner).setNFTContract(mockNFTContract.target);

      expect(await newDayGlimpse.nftContractAddress()).to.equal(mockNFTContract.target);

      const filter = newDayGlimpse.filters.NFTContractSet;
      const events = await newDayGlimpse.queryFilter(filter);
      expect(events.length).to.equal(1);
      expect(events[0].args[0]).to.equal(mockNFTContract.target);
    });

    it("Should fail when non-owner tries to set NFT contract", async function () {
      const DayGlimpseFactory = await ethers.getContractFactory("DayGlimpse");
      const newDayGlimpse = await DayGlimpseFactory.deploy();

      await expect(
        newDayGlimpse.connect(user1).setNFTContract(mockNFTContract.target)
      ).to.be.revertedWith("DayGlimpse: Caller is not the owner");
    });

    it("Should set the follower system contract address", async function () {
      const DayGlimpseFactory = await ethers.getContractFactory("DayGlimpse");
      const newDayGlimpse = await DayGlimpseFactory.deploy();

      await newDayGlimpse.connect(owner).setFollowerSystemContract(mockFollowerSystem.target);

      // Note: followerSystemAddress is private in the contract
      // We can test its functionality instead of direct access

      // Setup mutual followers 
      await mockFollowerSystem.setMutualFollowers(user1.address, user2.address);

      // Set a glimpse
      await newDayGlimpse.connect(user1).setDayGlimpse(testStorageHash, false);

      // Set NFT contract too
      await newDayGlimpse.connect(owner).setNFTContract(mockNFTContract.target);

      // Now user2 should be able to mint because they're mutual followers
      const mockTokenId = ethers.keccak256(ethers.toUtf8Bytes("mockTokenId"));
      await mockNFTContract.setMockTokenId(mockTokenId);

      // If this doesn't revert, it proves the follower system was properly set
      await expect(
        newDayGlimpse.connect(user2).mintNFT(user1.address, true, "0x")
      ).not.to.be.reverted;
    });

    it("Should fail when non-owner tries to set follower system contract", async function () {
      const DayGlimpseFactory = await ethers.getContractFactory("DayGlimpse");
      const newDayGlimpse = await DayGlimpseFactory.deploy();

      await expect(
        newDayGlimpse.connect(user1).setFollowerSystemContract(mockFollowerSystem.target)
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
      // Setup
      await mockFollowerSystem.setMutualFollowers(user1.address, user2.address);

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
      // Make sure the mock follower system is set correctly for all tests
      await mockFollowerSystem.setMutualFollowers(user1.address, user2.address);
      await mockFollowerSystem.setMutualFollowers(user1.address, user3.address);
    });

    it("Should fail to mint when NFT contract is not set", async function () {
      const DayGlimpseFactory = await ethers.getContractFactory("DayGlimpse");
      const newDayGlimpse = await DayGlimpseFactory.deploy();

      await newDayGlimpse.connect(user1).setDayGlimpse(testStorageHash, false);

      // Set follower system so that's not the reason for failing
      await newDayGlimpse.connect(owner).setFollowerSystemContract(mockFollowerSystem.target);

      await expect(
        newDayGlimpse.connect(user2).mintNFT(user1.address, false, "0x")
      ).to.be.revertedWith("DayGlimpse: NFT contract not set");
    });

    it("Should fail to mint when users are not mutual followers", async function () {
      // Reset follower status
      await mockFollowerSystem.setFollowStatus(user1.address, user2.address, false);
      await mockFollowerSystem.setFollowStatus(user2.address, user1.address, false);

      await dayGlimpse.connect(user1).setDayGlimpse(testStorageHash, false);

      await expect(
        dayGlimpse.connect(user2).mintNFT(user1.address, false, "0x")
      ).to.be.revertedWith("DayGlimpse: must be mutual followers");
    });

    it("Should fail if only one user follows the other", async function () {
      // Set one-way follow relationship
      await mockFollowerSystem.setFollowStatus(user1.address, user2.address, false);
      await mockFollowerSystem.setFollowStatus(user2.address, user1.address, true);

      await dayGlimpse.connect(user1).setDayGlimpse(testStorageHash, false);

      await expect(
        dayGlimpse.connect(user2).mintNFT(user1.address, false, "0x")
      ).to.be.revertedWith("DayGlimpse: must be mutual followers");
    });

    it("Should allow self-minting without follower check", async function () {
      // Even without followers, the profile owner should be able to mint from their own glimpse
      await dayGlimpse.connect(user1).setDayGlimpse(testStorageHash, false);

      const mockTokenId = ethers.keccak256(ethers.toUtf8Bytes("mockTokenId"));
      await mockNFTContract.setMockTokenId(mockTokenId);

      // User1 mints from their own glimpse - should succeed
      await expect(
        dayGlimpse.connect(user1).mintNFT(user1.address, false, "0x")
      ).not.to.be.reverted;
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

    it("Should mint NFT successfully when users are mutual followers", async function () {
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
      // Set up mutual followers for minting
      await mockFollowerSystem.setMutualFollowers(user1.address, user2.address);
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

  describe("areMutualFollowers", function () {
    beforeEach(async function () {
      // Reset follower statuses
      await mockFollowerSystem.setFollowStatus(user1.address, user2.address, false);
      await mockFollowerSystem.setFollowStatus(user2.address, user1.address, false);
      await mockFollowerSystem.setFollowStatus(user1.address, user3.address, false);
      await mockFollowerSystem.setFollowStatus(user3.address, user1.address, false);
    });

    it("Should return true for self", async function () {
      const areMutual = await dayGlimpse.areMutualFollowers(user1.address, user1.address);
      expect(areMutual).to.equal(true);
    });

    it("Should return true when users are mutual followers", async function () {
      await mockFollowerSystem.setMutualFollowers(user1.address, user2.address);

      const areMutual = await dayGlimpse.areMutualFollowers(user1.address, user2.address);
      expect(areMutual).to.equal(true);
    });

    it("Should return false when users are not following each other", async function () {
      const areMutual = await dayGlimpse.areMutualFollowers(user1.address, user3.address);
      expect(areMutual).to.equal(false);
    });

    it("Should return false when only one user follows the other", async function () {
      // Set one-way follow relationship
      await mockFollowerSystem.setFollowStatus(user1.address, user3.address, true);

      const areMutual = await dayGlimpse.areMutualFollowers(user1.address, user3.address);
      expect(areMutual).to.equal(false);
    });

    it("Should return false with different one-way relationship", async function () {
      // Set other one-way follow relationship
      await mockFollowerSystem.setFollowStatus(user3.address, user1.address, true);

      const areMutual = await dayGlimpse.areMutualFollowers(user1.address, user3.address);
      expect(areMutual).to.equal(false);
    });
  });
});
