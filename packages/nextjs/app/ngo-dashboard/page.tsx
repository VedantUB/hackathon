"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useScaffoldReadContract, useScaffoldWriteContract, useDeployedContractInfo } from "~~/hooks/scaffold-eth";
import { useAccount } from "wagmi";
import { usePublicClient } from "wagmi";

export default function NGODashboard() {
  const searchParams = useSearchParams();
  const campaignParam = searchParams.get("campaign");
  const { address } = useAccount();
  const publicClient = usePublicClient();

  const [selectedCampaignId, setSelectedCampaignId] = useState<bigint | null>(
    campaignParam ? BigInt(campaignParam) : null
  );
  const [proofUri, setProofUri] = useState("");
  const [myCampaigns, setMyCampaigns] = useState<any[]>([]);
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(true);

  const { data: nextCampaignId } = useScaffoldReadContract({
    contractName: "ProofOfImpact",
    functionName: "nextCampaignId",
  });

  const { data: deployedContractData } = useDeployedContractInfo("ProofOfImpact");

  // Fetch all campaigns and filter for this NGO
  useEffect(() => {
    if (!address || !nextCampaignId || !publicClient || !deployedContractData) {
      setIsLoadingCampaigns(false);
      return;
    }

    const totalCampaigns = Number(nextCampaignId) - 1;
    if (totalCampaigns === 0) {
      setIsLoadingCampaigns(false);
      setMyCampaigns([]);
      return;
    }

    const fetchMyCampaigns = async () => {
      setIsLoadingCampaigns(true);
      const campaigns: any[] = [];

      try {
        // Fetch all campaigns in parallel
        const campaignPromises = Array.from({ length: totalCampaigns }, (_, i) => {
          const campaignId = BigInt(i + 1);
          return publicClient.readContract({
            address: deployedContractData.address,
            abi: deployedContractData.abi,
            functionName: "getCampaignInfo",
            args: [campaignId],
          }).catch((err) => {
            console.error(`Error fetching campaign ${campaignId}:`, err);
            return null;
          });
        });

        const results = await Promise.all(campaignPromises);

        results.forEach((data, index) => {
          if (!data) return;
          const [ngoAddress, title, targetAmount, amountRaised, fundsReleased, nextMilestoneIndex, completed, impactNftCounter, milestoneCount] = data as any;
          
          // Only include campaigns where current user is the NGO
          if (ngoAddress.toLowerCase() === address.toLowerCase()) {
            campaigns.push({
              id: BigInt(index + 1),
              title,
              targetAmount,
              amountRaised,
              fundsReleased,
              nextMilestoneIndex: Number(nextMilestoneIndex),
              completed,
              impactNftCounter: Number(impactNftCounter),
              milestoneCount: Number(milestoneCount),
            });
          }
        });

        console.log(`Found ${campaigns.length} campaigns for address ${address}`);
        setMyCampaigns(campaigns);
        
        // Auto-select first campaign if none selected
        if (!selectedCampaignId && campaigns.length > 0) {
          setSelectedCampaignId(campaigns[0].id);
        }
      } catch (error) {
        console.error("Error fetching campaigns:", error);
      } finally {
        setIsLoadingCampaigns(false);
      }
    };

    fetchMyCampaigns();
  }, [nextCampaignId, address, publicClient, deployedContractData, selectedCampaignId]);

  const { data: selectedCampaignInfo } = useScaffoldReadContract({
    contractName: "ProofOfImpact",
    functionName: "getCampaignInfo",
    args: [selectedCampaignId || 0n],
  });

  const { data: milestonesData } = useScaffoldReadContract({
    contractName: "ProofOfImpact",
    functionName: "getAllMilestones",
    args: [selectedCampaignId || 0n],
  });

  const { writeContractAsync: submitProof, isPending: isSubmitting } = useScaffoldWriteContract("ProofOfImpact");

  if (!address) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="alert alert-warning">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>Please connect your wallet to access the NGO dashboard.</span>
        </div>
      </div>
    );
  }

  if (isLoadingCampaigns) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">NGO Dashboard</h1>
        <div className="flex flex-col justify-center items-center p-8 gap-4">
          <span className="loading loading-spinner loading-lg"></span>
          <span className="text-base-content/60">Loading your campaigns...</span>
          <span className="text-sm text-base-content/40">Total campaigns to check: {nextCampaignId ? Number(nextCampaignId) - 1 : 0}</span>
        </div>
      </div>
    );
  }

  if (myCampaigns.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">NGO Dashboard</h1>
        <div className="alert alert-info">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <div>
            <p className="font-semibold">No campaigns found for your address</p>
            <p className="text-sm mt-2 font-mono bg-base-200 p-2 rounded">{address}</p>
            <p className="text-sm mt-3">
              {nextCampaignId && Number(nextCampaignId) > 1 
                ? `Checked ${Number(nextCampaignId) - 1} campaign(s), but none matched your address.`
                : "No campaigns have been created yet."}
            </p>
            <p className="text-sm mt-2">Make sure you're connected with the correct wallet that was used when creating the campaign.</p>
          </div>
        </div>
      </div>
    );
  }

  const currentMilestone = milestonesData && selectedCampaignInfo ? {
    index: Number(selectedCampaignInfo[5]), // nextMilestoneIndex
    description: milestonesData[0][Number(selectedCampaignInfo[5])],
    isProofSubmitted: milestonesData[2][Number(selectedCampaignInfo[5])],
    isVerified: milestonesData[3][Number(selectedCampaignInfo[5])],
  } : null;

  const handleSubmitProof = async () => {
    if (!selectedCampaignId || !proofUri) {
      alert("Please enter a proof URI (IPFS hash or URL)");
      return;
    }

    try {
      await submitProof({
        functionName: "submitProof",
        args: [selectedCampaignId, proofUri],
      });
      alert("Proof submitted successfully! 🎉 Waiting for Oracle verification.");
      setProofUri("");
    } catch (error: any) {
      console.error("Proof submission failed:", error);
      alert("Failed to submit proof: " + (error.message || "Unknown error"));
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-4xl font-bold mb-2">NGO Dashboard</h1>
      <p className="text-base-content/60 mb-8">Submit proof for completed milestones</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Campaign Selector */}
        <div className="lg:col-span-1">
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title text-lg">Your Campaigns ({myCampaigns.length})</h2>
              <div className="space-y-2">
                {myCampaigns.map((campaign) => (
                  <button
                    key={campaign.id.toString()}
                    className={`btn btn-block justify-start ${
                      selectedCampaignId === campaign.id ? "btn-primary" : "btn-ghost"
                    }`}
                    onClick={() => setSelectedCampaignId(campaign.id)}
                  >
                    <div className="text-left flex-1">
                      <div className="font-bold text-sm">{campaign.title}</div>
                      <div className="text-xs opacity-70">
                        Milestone {campaign.nextMilestoneIndex + 1}/{campaign.milestoneCount}
                      </div>
                    </div>
                    {campaign.completed && (
                      <div className="badge badge-success badge-sm">✓</div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Proof Submission */}
        <div className="lg:col-span-2">
          {selectedCampaignInfo && currentMilestone && (
            <>
              <div className="card bg-base-100 shadow-xl mb-6">
                <div className="card-body">
                  <h2 className="card-title">
                    {myCampaigns.find(c => c.id === selectedCampaignId)?.title}
                  </h2>
                  
                  {selectedCampaignInfo[6] ? ( // completed
                    <div className="alert alert-success">
                      <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>🎉 All milestones completed! This campaign is done.</span>
                    </div>
                  ) : (
                    <>
                      <div className="bg-base-200 p-4 rounded-lg mb-4">
                        <div className="text-sm text-base-content/60 mb-1">Current Milestone</div>
                        <h3 className="font-bold text-lg mb-2">
                          Milestone {currentMilestone.index + 1}: {currentMilestone.description}
                        </h3>
                        
                        {currentMilestone.isVerified ? (
                          <div className="badge badge-success gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Verified & Funded
                          </div>
                        ) : currentMilestone.isProofSubmitted ? (
                          <div className="badge badge-warning gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Pending Oracle Verification
                          </div>
                        ) : (
                          <div className="badge badge-primary">Ready to Submit Proof</div>
                        )}
                      </div>

                      {!currentMilestone.isProofSubmitted && (
                        <div className="form-control w-full">
                          <label className="label">
                            <span className="label-text font-semibold">Submit Proof of Completion</span>
                          </label>
                          <textarea
                            className="textarea textarea-bordered h-24"
                            placeholder="Enter IPFS hash (e.g., QmXxxx...) or URL to proof documents (receipts, photos, reports)"
                            value={proofUri}
                            onChange={(e) => setProofUri(e.target.value)}
                          ></textarea>
                          <label className="label">
                            <span className="label-text-alt">Upload your proof documents to IPFS and paste the hash or link here</span>
                          </label>

                          <button
                            className="btn btn-primary mt-4"
                            onClick={handleSubmitProof}
                            disabled={isSubmitting || !proofUri}
                          >
                            {isSubmitting ? (
                              <>
                                <span className="loading loading-spinner"></span>
                                Submitting...
                              </>
                            ) : (
                              "Submit Proof 📤"
                            )}
                          </button>
                        </div>
                      )}

                      {currentMilestone.isProofSubmitted && !currentMilestone.isVerified && (
                        <div className="alert alert-info">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                          </svg>
                          <span>Proof submitted! Waiting for Oracle to verify and release funds.</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* IPFS Upload Guide */}
              <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                  <h3 className="card-title text-lg">📚 How to Upload Proof</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex gap-3">
                      <div className="font-bold text-primary">1.</div>
                      <div>
                        <p className="font-semibold mb-1">Gather Your Evidence</p>
                        <p className="text-base-content/70">Collect receipts, photos, invoices, or documents proving milestone completion</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="font-bold text-primary">2.</div>
                      <div>
                        <p className="font-semibold mb-1">Upload to IPFS</p>
                        <p className="text-base-content/70">Use services like:</p>
                        <ul className="list-disc list-inside ml-4 mt-1 text-base-content/60">
                          <li><a href="https://www.pinata.cloud" target="_blank" rel="noopener noreferrer" className="link">Pinata</a> (recommended)</li>
                          <li><a href="https://nft.storage" target="_blank" rel="noopener noreferrer" className="link">NFT.Storage</a></li>
                          <li><a href="https://web3.storage" target="_blank" rel="noopener noreferrer" className="link">Web3.Storage</a></li>
                        </ul>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="font-bold text-primary">3.</div>
                      <div>
                        <p className="font-semibold mb-1">Copy the IPFS Hash</p>
                        <p className="text-base-content/70">It will look like: <code className="bg-base-200 px-2 py-1 rounded">QmXxxx...</code></p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="font-bold text-primary">4.</div>
                      <div>
                        <p className="font-semibold mb-1">Paste & Submit</p>
                        <p className="text-base-content/70">Paste the hash above and click "Submit Proof"</p>
                      </div>
                    </div>
                  </div>

                  <div className="divider">OR</div>

                  <div className="alert">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-info shrink-0 w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <div className="text-sm">
                      <p className="font-semibold">For testing purposes</p>
                      <p>You can also paste any URL (e.g., Google Drive link) as proof</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

