"use client";

import { useState, useEffect } from "react";
import { formatEther } from "viem";
import { useScaffoldReadContract, useScaffoldWriteContract, useDeployedContractInfo } from "~~/hooks/scaffold-eth";
import { useAccount, usePublicClient } from "wagmi";

export default function OraclePage() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const [pendingVerifications, setPendingVerifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { data: isOracle } = useScaffoldReadContract({
    contractName: "ProofOfImpact",
    functionName: "isOracle",
    args: [address!],
    enabled: !!address,
  });

  const { data: nextCampaignId } = useScaffoldReadContract({
    contractName: "ProofOfImpact",
    functionName: "nextCampaignId",
  });

  const { data: deployedContractData } = useDeployedContractInfo("ProofOfImpact");

  const totalCampaigns = nextCampaignId ? Number(nextCampaignId) - 1 : 0;

  // Fetch all campaigns and find pending verifications
  useEffect(() => {
    if (!publicClient || !deployedContractData || !nextCampaignId) {
      setIsLoading(false);
      return;
    }

    const fetchPendingVerifications = async () => {
      setIsLoading(true);
      const pending: any[] = [];

      try {
        const totalCampaigns = Number(nextCampaignId) - 1;

        // Fetch all campaign info in parallel
        const campaignPromises = Array.from({ length: totalCampaigns }, (_, i) => {
          const campaignId = BigInt(i + 1);
          return Promise.all([
            publicClient.readContract({
              address: deployedContractData.address,
              abi: deployedContractData.abi,
              functionName: "getCampaignInfo",
              args: [campaignId],
            }),
            publicClient.readContract({
              address: deployedContractData.address,
              abi: deployedContractData.abi,
              functionName: "getAllMilestones",
              args: [campaignId],
            }),
          ]).catch(() => [null, null]);
        });

        const results = await Promise.all(campaignPromises);

        results.forEach(([infoData, milestonesData], index) => {
          if (!infoData || !milestonesData) return;

          const campaignId = index + 1;
          const [ngoAddress, title, targetAmount, amountRaised, fundsReleased, nextMilestoneIndex, completed] = infoData as any;
          const [descriptions, requiredAmounts, isProofSubmittedArray, isVerifiedArray, proofUris] = milestonesData as any;

          // Check if current milestone has proof submitted but not verified
          const currentIndex = Number(nextMilestoneIndex);
          if (!completed && currentIndex < descriptions.length) {
            if (isProofSubmittedArray[currentIndex] && !isVerifiedArray[currentIndex]) {
              pending.push({
                campaignId: BigInt(campaignId),
                campaignTitle: title,
                ngoAddress,
                milestoneIndex: currentIndex,
                milestoneDescription: descriptions[currentIndex],
                milestoneAmount: formatEther(requiredAmounts[currentIndex]),
                proofUri: proofUris[currentIndex],
                amountRaised: formatEther(amountRaised),
                fundsReleased: formatEther(fundsReleased),
              });
            }
          }
        });

        setPendingVerifications(pending);
      } catch (error) {
        console.error("Error fetching pending verifications:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPendingVerifications();
  }, [nextCampaignId, publicClient, deployedContractData]);

  const { writeContractAsync: verifyMilestone, isPending: isVerifying } = useScaffoldWriteContract("ProofOfImpact");

  const handleVerify = async (campaignId: bigint, milestoneIndex: number) => {
    try {
      await verifyMilestone({
        functionName: "verifyMilestoneAndRelease",
        args: [campaignId, BigInt(milestoneIndex)],
      });
      alert("Milestone verified and funds released! 🎉");
      
      // Refresh pending verifications after successful verification
      // Trigger re-fetch by updating a dependency or manually refetching
    } catch (error: any) {
      console.error("Verification failed:", error);
      alert("Verification failed: " + (error.message || "Unknown error"));
    }
  };

  if (!address) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="alert alert-warning">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>Please connect your wallet to access the Oracle dashboard.</span>
        </div>
      </div>
    );
  }

  if (isOracle === false) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="alert alert-error">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Access denied. Only designated Oracles can verify milestones.</span>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">Oracle Dashboard</h1>
        <div className="flex flex-col justify-center items-center p-8 gap-4">
          <span className="loading loading-spinner loading-lg"></span>
          <span className="text-base-content/60">Loading pending verifications...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-4xl font-bold mb-2">Oracle Dashboard</h1>
      <p className="text-base-content/60 mb-8">Verify milestone completion and release funds</p>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card bg-primary text-primary-content shadow-xl">
          <div className="card-body text-center">
            <div className="text-4xl mb-2">⏳</div>
            <h3 className="text-3xl font-bold">{pendingVerifications.length}</h3>
            <p className="opacity-90">Pending Verifications</p>
          </div>
        </div>
        <div className="card bg-base-200 shadow-xl">
          <div className="card-body text-center">
            <div className="text-4xl mb-2">✅</div>
            <h3 className="text-3xl font-bold">{totalCampaigns}</h3>
            <p className="text-base-content/60">Total Campaigns</p>
          </div>
        </div>
        <div className="card bg-base-200 shadow-xl">
          <div className="card-body text-center">
            <div className="text-4xl mb-2">🔐</div>
            <h3 className="text-3xl font-bold">Oracle</h3>
            <p className="text-base-content/60">Your Role</p>
          </div>
        </div>
      </div>

      {/* Pending Verifications */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-2xl mb-4">Pending Milestone Verifications</h2>

          {pendingVerifications.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">✨</div>
              <h3 className="text-2xl font-bold mb-2">All caught up!</h3>
              <p className="text-base-content/60">No pending verifications at the moment.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingVerifications.map((item, index) => (
                <VerificationCard
                  key={`${item.campaignId}-${item.milestoneIndex}-${index}`}
                  item={item}
                  onVerify={handleVerify}
                  isVerifying={isVerifying}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="card bg-base-100 shadow-xl mt-6">
        <div className="card-body">
          <h3 className="card-title">Oracle Responsibilities</h3>
          <div className="space-y-2 text-sm">
            <div className="flex gap-3">
              <div className="font-bold text-primary">1.</div>
              <div>
                <p className="font-semibold mb-1">Review Submitted Proof</p>
                <p className="text-base-content/70">Carefully examine all uploaded documentation (receipts, photos, reports)</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="font-bold text-primary">2.</div>
              <div>
                <p className="font-semibold mb-1">Verify Milestone Completion</p>
                <p className="text-base-content/70">Ensure the work described in the milestone has been completed as specified</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="font-bold text-primary">3.</div>
              <div>
                <p className="font-semibold mb-1">Release Funds</p>
                <p className="text-base-content/70">Once verified, approve to release the milestone funds to the NGO</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function VerificationCard({ item, onVerify, isVerifying }: any) {
  const [showProof, setShowProof] = useState(false);

  const availableEscrow = parseFloat(item.amountRaised) - parseFloat(item.fundsReleased);

  return (
    <div className="card bg-base-200">
      <div className="card-body">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="font-bold text-lg mb-1">{item.campaignTitle}</h3>
            <p className="text-sm text-base-content/60 mb-3">
              NGO: {item.ngoAddress.slice(0, 6)}...{item.ngoAddress.slice(-4)}
            </p>
           
            <div className="bg-base-100 p-3 rounded-lg mb-3">
              <div className="text-xs text-base-content/60 mb-1">Milestone {item.milestoneIndex + 1}</div>
              <p className="font-semibold">{item.milestoneDescription}</p>
              <div className="flex gap-4 mt-2 text-sm">
                <div>
                  <span className="text-base-content/60">Amount: </span>
                  <span className="font-bold">{parseFloat(item.milestoneAmount).toFixed(4)} ETH</span>
                </div>
                <div>
                  <span className="text-base-content/60">Available: </span>
                  <span className="font-bold">{availableEscrow.toFixed(4)} ETH</span>
                </div>
              </div>
            </div>

            {/* Proof Preview */}
            <div className="mb-3">
              <button
                className="btn btn-sm btn-ghost"
                onClick={() => setShowProof(!showProof)}
              >
                {showProof ? "Hide" : "Show"} Proof 📄
              </button>
             
              {showProof && (
                <div className="mt-2 p-3 bg-base-100 rounded-lg">
                  <p className="text-xs text-base-content/60 mb-1">Proof URI:</p>
                  <p className="text-sm font-mono break-all mb-2">{item.proofUri}</p>
                  <a
                    href={item.proofUri.startsWith('http') ? item.proofUri : `https://ipfs.io/ipfs/${item.proofUri}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-xs btn-outline"
                  >
                    Open Proof ↗
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="card-actions justify-end">
          <button
            className="btn btn-success"
            onClick={() => onVerify(item.campaignId, item.milestoneIndex)}
            disabled={isVerifying}
          >
            {isVerifying ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                Verifying...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Verify & Release Funds
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}


