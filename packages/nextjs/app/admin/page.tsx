"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { parseEther } from "viem";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { useAccount } from "wagmi";

export default function AdminPage() {
  const router = useRouter();
  const { address } = useAccount();
  
  const [ngoAddress, setNgoAddress] = useState("");
  const [campaignTitle, setCampaignTitle] = useState("");
  const [milestones, setMilestones] = useState([
    { description: "", amount: "" }
  ]);

  // Check if user is owner
  const { data: owner } = useScaffoldReadContract({
    contractName: "ProofOfImpact",
    functionName: "owner",
  });

  const isOwner = address?.toLowerCase() === owner?.toLowerCase();

  // Write contract for creating campaign
  const { writeContractAsync: createCampaign, isPending: isCreating } = useScaffoldWriteContract("ProofOfImpact");

  const addMilestone = () => {
    setMilestones([...milestones, { description: "", amount: "" }]);
  };

  const removeMilestone = (index: number) => {
    if (milestones.length > 1) {
      setMilestones(milestones.filter((_, i) => i !== index));
    }
  };

  const updateMilestone = (index: number, field: "description" | "amount", value: string) => {
    const updated = [...milestones];
    updated[index][field] = value;
    setMilestones(updated);
  };

  const handleCreateCampaign = async () => {
    // Validation
    if (!ngoAddress || !campaignTitle) {
      alert("Please fill in NGO address and campaign title");
      return;
    }

    if (!ngoAddress.startsWith("0x") || ngoAddress.length !== 42) {
      alert("Invalid NGO address format");
      return;
    }

    const hasEmptyFields = milestones.some(m => !m.description || !m.amount || parseFloat(m.amount) <= 0);
    if (hasEmptyFields) {
      alert("Please fill in all milestone descriptions and amounts");
      return;
    }

    try {
      const descriptions = milestones.map(m => m.description);
      const amounts = milestones.map(m => parseEther(m.amount));

      await createCampaign({
        functionName: "createCampaign",
        args: [ngoAddress as `0x${string}`, campaignTitle, descriptions, amounts],
      });

      alert("Campaign created successfully! 🎉");
      
      // Reset form
      setNgoAddress("");
      setCampaignTitle("");
      setMilestones([{ description: "", amount: "" }]);
      
      // Redirect to home
      router.push("/");
    } catch (error: any) {
      console.error("Campaign creation failed:", error);
      alert("Failed to create campaign: " + (error.message || "Unknown error"));
    }
  };

  if (!address) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="alert alert-warning">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>Please connect your wallet to access the admin panel.</span>
        </div>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="alert alert-error">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Access denied. Only the contract owner can create campaigns.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
      <p className="text-base-content/60 mb-8">Create and manage campaigns</p>

      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-2xl mb-4">Create New Campaign</h2>

          {/* NGO Address */}
          <div className="form-control w-full">
            <label className="label">
              <span className="label-text font-semibold">NGO Wallet Address</span>
            </label>
            <input
              type="text"
              placeholder="0x..."
              className="input input-bordered w-full"
              value={ngoAddress}
              onChange={(e) => setNgoAddress(e.target.value)}
            />
            <label className="label">
              <span className="label-text-alt">The wallet that will receive released funds</span>
            </label>
          </div>

          {/* Campaign Title */}
          <div className="form-control w-full mt-4">
            <label className="label">
              <span className="label-text font-semibold">Campaign Title</span>
            </label>
            <input
              type="text"
              placeholder="Build School in Rural Village"
              className="input input-bordered w-full"
              value={campaignTitle}
              onChange={(e) => setCampaignTitle(e.target.value)}
            />
          </div>

          {/* Milestones */}
          <div className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <label className="label-text font-semibold text-lg">Milestones</label>
              <button className="btn btn-sm btn-primary" onClick={addMilestone}>
                + Add Milestone
              </button>
            </div>

            <div className="space-y-4">
              {milestones.map((milestone, index) => (
                <div key={index} className="card bg-base-200">
                  <div className="card-body p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-bold">Milestone {index + 1}</h3>
                      {milestones.length > 1 && (
                        <button
                          className="btn btn-ghost btn-xs text-error"
                          onClick={() => removeMilestone(index)}
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Description</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Purchase building materials"
                        className="input input-bordered input-sm"
                        value={milestone.description}
                        onChange={(e) => updateMilestone(index, "description", e.target.value)}
                      />
                    </div>

                    <div className="form-control mt-2">
                      <label className="label">
                        <span className="label-text">Required Amount (ETH)</span>
                      </label>
                      <input
                        type="number"
                        step="0.001"
                        min="0"
                        placeholder="2.5"
                        className="input input-bordered input-sm"
                        value={milestone.amount}
                        onChange={(e) => updateMilestone(index, "amount", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="alert alert-info mt-6">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <div>
              <div className="font-bold">Campaign Summary</div>
              <div className="text-sm">
                {milestones.length} milestones • Total target: {" "}
                {milestones.reduce((sum, m) => sum + (parseFloat(m.amount) || 0), 0).toFixed(4)} ETH
              </div>
            </div>
          </div>

          {/* Create Button */}
          <div className="card-actions justify-end mt-6">
            <button
              className="btn btn-primary btn-lg"
              onClick={handleCreateCampaign}
              disabled={isCreating}
            >
              {isCreating ? (
                <>
                  <span className="loading loading-spinner"></span>
                  Creating Campaign...
                </>
              ) : (
                <>
                  Create Campaign 🚀
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Oracle Management */}
      <OracleManagement />
    </div>
  );
}

function OracleManagement() {
  const [oracleAddress, setOracleAddress] = useState("");
  const { address } = useAccount();

  const { data: isCurrentOracle } = useScaffoldReadContract({
    contractName: "ProofOfImpact",
    functionName: "isOracle",
    args: [address!],
  });

  const { writeContractAsync: setOracle, isPending: isSettingOracle } = useScaffoldWriteContract("ProofOfImpact");

  const handleSetOracle = async (status: boolean) => {
    if (!oracleAddress || !oracleAddress.startsWith("0x") || oracleAddress.length !== 42) {
      alert("Invalid oracle address");
      return;
    }

    try {
      await setOracle({
        functionName: "setOracle",
        args: [oracleAddress as `0x${string}`, status],
      });
      alert(`Oracle ${status ? "added" : "removed"} successfully!`);
      setOracleAddress("");
    } catch (error: any) {
      alert("Failed: " + (error.message || "Unknown error"));
    }
  };

  return (
    <div className="card bg-base-100 shadow-xl mt-6">
      <div className="card-body">
        <h2 className="card-title">Oracle Management</h2>
        <p className="text-sm text-base-content/60 mb-4">
          Oracles can verify milestones and release funds. Your address is {isCurrentOracle ? "already" : "not"} an oracle.
        </p>

        <div className="form-control">
          <label className="label">
            <span className="label-text">Oracle Address</span>
          </label>
          <input
            type="text"
            placeholder="0x..."
            className="input input-bordered"
            value={oracleAddress}
            onChange={(e) => setOracleAddress(e.target.value)}
          />
        </div>

        <div className="flex gap-2 mt-4">
          <button
            className="btn btn-success flex-1"
            onClick={() => handleSetOracle(true)}
            disabled={isSettingOracle}
          >
            Add Oracle
          </button>
          <button
            className="btn btn-error flex-1"
            onClick={() => handleSetOracle(false)}
            disabled={isSettingOracle}
          >
            Remove Oracle
          </button>
        </div>
      </div>
    </div>
  );
}