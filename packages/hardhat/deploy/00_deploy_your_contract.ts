import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

/**
 * Deploys the "ProofOfImpact" contract.
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployProofOfImpact: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  /*
    On localhost, the deployer account is the one that comes with Hardhat, which is already funded.
    When deploying to live networks (e.g `yarn deploy --network sepolia`), the deployer account
    should have sufficient balance to pay for the gas fees for contract creation.
  */
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  console.log("Deploying ProofOfImpact contract...");

  await deploy("ProofOfImpact", {
    from: deployer,
    // The ProofOfImpact contract constructor is empty, so no arguments are passed here.
    args: [],
    log: true,
    // autoMine: automatically mines the contract deployment transaction on local networks.
    autoMine: true,
  });

  // Get the deployed contract to interact with it after deploying.
  const proofOfImpact = await hre.ethers.getContract<Contract>("ProofOfImpact", deployer);

  // Example interaction: Check the owner that was set in the constructor.
  const ownerAddress = await proofOfImpact.owner();
  console.log("✅ ProofOfImpact deployed successfully.");
  console.log("👑 Contract Owner (Deployer):", ownerAddress);

  // Note: The original script called 'greeting()', which does not exist. We removed it.
};

export default deployProofOfImpact;

// Tags are useful if you have multiple deploy files and only want to run one of them.
deployProofOfImpact.tags = ["ProofOfImpact"];
