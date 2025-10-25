"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatEther } from "viem";
import { useScaffoldReadContract, useScaffoldContract } from "~~/hooks/scaffold-eth";

export default function Home() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const { data: nextCampaignId } = useScaffoldReadContract({
    contractName: "ProofOfImpact",
    functionName: "nextCampaignId",
  });

  const { data: contract } = useScaffoldContract({
    contractName: "ProofOfImpact",
  });

  useEffect(() => {
    const fetchCampaigns = async () => {
      if (!nextCampaignId || !contract) {
        setLoading(false);
        return;
      }

      const totalCampaigns = Number(nextCampaignId) - 1;
      const campaignPromises = [];

      for (let i = 1; i <= totalCampaigns; i++) {
        campaignPromises.push(
          contract.read.getCampaignInfo([BigInt(i)])
            .then((data: any) => {
              const [ngoAddress, title, targetAmount, amountRaised, fundsReleased, nextMilestoneIndex, completed, impactNftCounter, milestoneCount] = data;
              return {
                id: i,
                ngoAddress,
                title,
                targetAmount: formatEther(targetAmount),
                amountRaised: formatEther(amountRaised),
                fundsReleased: formatEther(fundsReleased),
                nextMilestoneIndex: Number(nextMilestoneIndex),
                completed,
                impactNftCounter: Number(impactNftCounter),
                milestoneCount: Number(milestoneCount),
              };
            })
            .catch(() => null)
        );
      }

      const results = await Promise.all(campaignPromises);
      setCampaigns(results.filter(c => c !== null));
      setLoading(false);
    };

    fetchCampaigns();
  }, [nextCampaignId, contract]);

  const totalRaised = campaigns.reduce((sum, c) => sum + parseFloat(c?.amountRaised || "0"), 0);
  const completedCount = campaigns.filter(c => c?.completed).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg"></div>
          <p className="mt-4">Loading campaigns...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Proof-of-Impact Donations
        </h1>
        <p className="text-xl text-base-content/70 max-w-2xl mx-auto">
          Donate with confidence. Every milestone is verified before funds are released.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="card bg-base-200 shadow-xl">
          <div className="card-body text-center">
            <div className="text-4xl mb-2">🎯</div>
            <h3 className="text-3xl font-bold">{campaigns.length}</h3>
            <p className="text-base-content/60">Active Campaigns</p>
          </div>
        </div>
        <div className="card bg-base-200 shadow-xl">
          <div className="card-body text-center">
            <div className="text-4xl mb-2">💰</div>
            <h3 className="text-3xl font-bold">{totalRaised.toFixed(4)} ETH</h3>
            <p className="text-base-content/60">Total Raised</p>
          </div>
        </div>
        <div className="card bg-base-200 shadow-xl">
          <div className="card-body text-center">
            <div className="text-4xl mb-2">✅</div>
            <h3 className="text-3xl font-bold">{completedCount}</h3>
            <p className="text-base-content/60">Completed</p>
          </div>
        </div>
      </div>

      {/* Campaigns Grid */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold">Browse Campaigns</h2>
          <Link href="/admin" className="btn btn-primary btn-sm">
            + Create Campaign
          </Link>
        </div>
        
        {campaigns.length === 0 ? (
          <div className="card bg-base-200 shadow-xl">
            <div className="card-body text-center py-12">
              <div className="text-6xl mb-4">🌱</div>
              <h3 className="text-2xl font-bold mb-2">No campaigns yet</h3>
              <p className="text-base-content/60 mb-4">Be the first to create a campaign!</p>
              <Link href="/admin" className="btn btn-primary">
                Create First Campaign
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((campaign) => (
              <CampaignCard key={campaign.id} campaign={campaign} />
            ))}
          </div>
        )}
      </div>

      {/* How It Works */}
      <div className="card bg-primary text-primary-content shadow-xl mt-12">
        <div className="card-body">
          <h2 className="card-title text-3xl justify-center mb-6">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-5xl mb-3">🎯</div>
              <h3 className="font-bold text-lg mb-2">1. Choose Campaign</h3>
              <p className="text-sm opacity-90">Browse verified campaigns with clear milestones</p>
            </div>
            <div className="text-center">
              <div className="text-5xl mb-3">💰</div>
              <h3 className="font-bold text-lg mb-2">2. Donate Safely</h3>
              <p className="text-sm opacity-90">Funds held in smart contract escrow</p>
            </div>
            <div className="text-center">
              <div className="text-5xl mb-3">📸</div>
              <h3 className="font-bold text-lg mb-2">3. NGO Proves Work</h3>
              <p className="text-sm opacity-90">Photos, receipts & documentation uploaded</p>
            </div>
            <div className="text-center">
              <div className="text-5xl mb-3">✅</div>
              <h3 className="font-bold text-lg mb-2">4. Verified Release</h3>
              <p className="text-sm opacity-90">Oracle verifies & releases funds to NGO</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CampaignCard({ campaign }: { campaign: any }) {
  const progress = (parseFloat(campaign.amountRaised) / parseFloat(campaign.targetAmount)) * 100;
  const isFullyFunded = progress >= 100;

  return (
    <Link href={`/campaign/${campaign.id}`}>
      <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 cursor-pointer h-full">
        <div className="card-body">
          <div className="flex justify-between items-start mb-2">
            <h2 className="card-title text-lg">{campaign.title}</h2>
            {campaign.completed && (
              <div className="badge badge-success gap-1 badge-sm">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-3 h-3 stroke-current">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                Done
              </div>
            )}
          </div>

          <div className="text-sm text-base-content/60 mb-3">
            {campaign.milestoneCount} milestones • {campaign.impactNftCounter} donors
          </div>

          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="font-semibold">{parseFloat(campaign.amountRaised).toFixed(4)} ETH</span>
              <span className="text-base-content/60">of {parseFloat(campaign.targetAmount).toFixed(4)} ETH</span>
            </div>
            <progress 
              className={`progress w-full ${isFullyFunded ? 'progress-success' : 'progress-primary'}`} 
              value={Math.min(progress, 100)} 
              max="100"
            ></progress>
            <p className="text-xs text-base-content/60 mt-1">
              {progress.toFixed(1)}% funded {isFullyFunded && "🎉"}
            </p>
          </div>

          <div className="card-actions justify-between items-center mt-auto">
            <div className="text-xs text-base-content/60">
              Milestone {campaign.nextMilestoneIndex + 1}/{campaign.milestoneCount}
            </div>
            <button className="btn btn-primary btn-sm">
              View Details →
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}