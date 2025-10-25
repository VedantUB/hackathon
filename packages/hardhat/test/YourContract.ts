import { expect } from "chai";
import { ethers } from "hardhat";
import { ProofOfImpact } from "../typechain-types";
import { parseEther } from "ethers";

describe("ProofOfImpact", function () {
  let proofOfImpact: ProofOfImpact;
  let owner: any;
  let ngo: any;
  let donor: any;
  let oracle: any;

  before(async () => {
    [owner, ngo, donor, oracle] = await ethers.getSigners();
    const proofOfImpactFactory = await ethers.getContractFactory("ProofOfImpact");
    proofOfImpact = (await proofOfImpactFactory.deploy()) as ProofOfImpact;
    await proofOfImpact.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct owner", async function () {
      expect(await proofOfImpact.owner()).to.equal(owner.address);
    });

    it("Should start with campaign ID 1", async function () {
      expect(await proofOfImpact.nextCampaignId()).to.equal(1);
    });
  });

  describe("Campaign Creation", function () {
    it("Should allow owner to create a campaign", async function () {
      const title = "Test Campaign";
      const descriptions = ["Milestone 1", "Milestone 2"];
      const amounts = [parseEther("1"), parseEther("2")];

      await expect(
        proofOfImpact.createCampaign(ngo.address, title, descriptions, amounts)
      ).to.emit(proofOfImpact, "CampaignCreated");

      expect(await proofOfImpact.nextCampaignId()).to.equal(2);
    });
  });

  describe("Donations", function () {
    it("Should accept donations", async function () {
      const campaignId = 1n;
      const donationAmount = parseEther("0.5");

      await expect(
        proofOfImpact.connect(donor).donate(campaignId, { value: donationAmount })
      ).to.emit(proofOfImpact, "DonationReceived");
    });
  });

  describe("Oracle Management", function () {
    it("Should allow owner to add oracle", async function () {
      await proofOfImpact.setOracle(oracle.address, true);
      expect(await proofOfImpact.isOracle(oracle.address)).to.be.true;
    });

    it("Should allow owner to remove oracle", async function () {
      await proofOfImpact.setOracle(oracle.address, false);
      expect(await proofOfImpact.isOracle(oracle.address)).to.be.false;
    });
  });
});
