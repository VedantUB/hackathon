"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { parseEther, formatEther } from "viem";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { useAccount } from "wagmi";

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = BigInt(params.id as string);
  const { address } = useAccount();
  
  const [donationAmount, setDonationAmount] = useState("");
  const [milestones, setMilestones] = useState<any[]>([]);

  // Read campaign data
  const { data: campaignInfo } = useScaffoldReadContract({
    contractName: "ProofOfImpact",
    functionName: "getCampaignInfo",
    args: [campaignId],
  });

  // Read all milestones
  const { data: milestonesData } = useScaffoldReadContract({
    contractName: "ProofOfImpact",
    functionName: "getAllMilestones",
    args: [campaignId],
  });

  // Write contract for donations
  const { writeContractAsync: donate, isPending: isDonating } = useScaffoldWriteContract("ProofOfImpact");

  useEffect(() => {
    if (milestonesData) {
      const [descriptions, requiredAmounts, isProofSubmittedArray, isVerifiedArray, proofUris] = milestonesData;
      const formattedMilestones = descriptions.map((desc: string, i: number) => ({
        description: desc,
        requiredAmount: formatEther(requiredAmounts[i]),
        isProofSubmitted: isProofSubmittedArray[i],
        isVerified: isVerifiedArray[i],
        proofUri: proofUris[i],
      }));
      setMilestones(formattedMilestones);
    }
  }, [milestonesData]);

  if (!campaignInfo) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  const [ngoAddress, title, targetAmount, amountRaised, fundsReleased, nextMilestoneIndex, completed, impactNftCounter] = campaignInfo;
  
  const campaign = {
    ngoAddress,
    title,
    targetAmount: formatEther(targetAmount),
    amountRaised: formatEther(amountRaised),
    fundsReleased: formatEther(fundsReleased),
    nextMilestoneIndex: Number(nextMilestoneIndex),
    completed,
    impactNftCounter: Number(impactNftCounter),
  };

  const progress = (parseFloat(campaign.amountRaised) / parseFloat(campaign.targetAmount)) * 100;
  const isNGO = address?.toLowerCase() === campaign.ngoAddress.toLowerCase();

  const handleDonate = async () => {
    if (!donationAmount || parseFloat(donationAmount) <= 0) {
      alert("Please enter a valid donation amount");
      return;
    }

    try {
      await donate({
        functionName: "donate",
        args: [campaignId],
        value: parseEther(donationAmount),
      });
      alert("Donation successful! 🎉");
      setDonationAmount("");
    } catch (error: any) {
      console.error("Donation failed:", error);
      alert("Donation failed: " + (error.message || "Unknown error"));
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Back Button */}
      <Link href="/" className="btn btn-ghost btn-sm mb-4">
        ← Back to Campaigns
      </Link>

      {/* Campaign Header */}
      <div className="card bg-base-100 shadow-xl mb-6">
        <div className="card-body">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-2">{campaign.title}</h1>
              <p className="text-sm text-base-content/60">
                NGO: {campaign.ngoAddress.slice(0, 6)}...{campaign.ngoAddress.slice(-4)}
              </p>
            </div>
            {campaign.completed && (
              <div className="badge badge-success badge-lg gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-4 h-4 stroke-current">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                Completed
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex justify-between text-lg mb-2">
              <span className="font-bold">{parseFloat(campaign.amountRaised).toFixed(4)} ETH</span>
              <span className="text-base-content/60">of {parseFloat(campaign.targetAmount).toFixed(4)} ETH</span>
            </div>
            <progress className="progress progress-primary w-full h-4" value={progress} max="100"></progress>
            <div className="flex justify-between text-sm mt-2">
              <span>{progress.toFixed(1)}% funded</span>
              <span>{campaign.impactNftCounter} donors</span>
            </div>
          </div>

          {/* Stats */}
          <div className="stats stats-vertical lg:stats-horizontal shadow mt-6">
            <div className="stat">
              <div className="stat-title">Funds Released</div>
              <div className="stat-value text-2xl">{parseFloat(campaign.fundsReleased).toFixed(4)} ETH</div>
            </div>
            <div className="stat">
              <div className="stat-title">Current Milestone</div>
              <div className="stat-value text-2xl">{campaign.nextMilestoneIndex + 1}/{milestones.length}</div>
            </div>
            <div className="stat">
              <div className="stat-title">In Escrow</div>
              <div className="stat-value text-2xl">
                {(parseFloat(campaign.amountRaised) - parseFloat(campaign.fundsReleased)).toFixed(4)} ETH
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Milestones */}
        <div className="lg:col-span-2">
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title text-2xl mb-4">Milestones</h2>
              <ul className="timeline timeline-vertical">
                {milestones.map((milestone, index) => (
                  <li key={index}>
                    <div className="timeline-start timeline-box">
                      <div className="font-bold mb-1">Milestone {index + 1}</div>
                      <p className="text-sm mb-2">{milestone.description}</p>
                      <div className="badge badge-outline">{parseFloat(milestone.requiredAmount).toFixed(4)} ETH</div>
                    </div>
                    <div className="timeline-middle">
                      {milestone.isVerified ? (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-success">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                        </svg>
                      ) : milestone.isProofSubmitted ? (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-warning">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
                        </svg>
                      ) : index === campaign.nextMilestoneIndex ? (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-primary">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-base-300">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <div className="timeline-end">
                      {milestone.isVerified && (
                        <div className="badge badge-success gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Verified & Funded
                        </div>
                      )}
                      {!milestone.isVerified && milestone.isProofSubmitted && (
                        <div className="badge badge-warning gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Pending Verification
                        </div>
                      )}
                      {!milestone.isProofSubmitted && index === campaign.nextMilestoneIndex && (
                        <div className="badge badge-primary gap-1">Active</div>
                      )}
                      {milestone.proofUri && (
                        <a 
                          href={milestone.proofUri.startsWith('http') ? milestone.proofUri : `https://ipfs.io/ipfs/${milestone.proofUri}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-xs btn-ghost mt-2"
                        >
                          View Proof 📄
                        </a>
                      )}
                    </div>
                    {index < milestones.length - 1 && <hr className="bg-primary" />}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Donation Panel */}
        <div className="lg:col-span-1">
          <div className="card bg-base-100 shadow-xl sticky top-4">
            <div className="card-body">
              <h2 className="card-title">Make a Donation</h2>
              
              {!campaign.completed ? (
                <>
                  <p className="text-sm text-base-content/60 mb-4">
                    Your donation will be held in escrow and released as milestones are verified.
                  </p>
                  
                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text">Amount (ETH)</span>
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      placeholder="0.1"
                      className="input input-bordered w-full"
                      value={donationAmount}
                      onChange={(e) => setDonationAmount(e.target.value)}
                    />
                  </div>

                  <button
                    className="btn btn-primary w-full mt-4"
                    onClick={handleDonate}
                    disabled={isDonating || !address}
                  >
                    {isDonating ? (
                      <>
                        <span className="loading loading-spinner"></span>
                        Processing...
                      </>
                    ) : !address ? (
                      "Connect Wallet"
                    ) : (
                      "Donate Now 💝"
                    )}
                  </button>

                  <div className="alert alert-info mt-4">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span className="text-xs">You'll receive a Proof-of-Impact NFT for your contribution!</span>
                  </div>
                </>
              ) : (
                <div className="alert alert-success">
                  <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>This campaign is completed! All milestones verified.</span>
                </div>
              )}

              {isNGO && (
                <div className="mt-4">
                  <div className="divider">NGO Actions</div>
                  <Link href={`/ngo-dashboard?campaign=${campaignId}`} className="btn btn-secondary w-full">
                    Submit Proof 📤
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}