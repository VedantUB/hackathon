"use client"; // <-- ADD THIS LINE

import { useState } from "react";
import Head from "next/head";
import { useAccount } from "wagmi";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

const NGOPage = () => {
  const { address: connectedAddress } = useAccount();
  const [proofURL, setProofURL] = useState("");

  // --- CONTRACT READS ---
  const { data: ngoWallet } = useScaffoldReadContract({
    contractName: "Campaign",
    functionName: "ngoWallet",
  });

  const { data: proofURI } = useScaffoldReadContract({
    contractName: "Campaign",
    functionName: "proofOfImpactURI",
  });

  // --- CONTRACT WRITES ---
  const { writeContractAsync: submitProof, isPending: isSubmitting } = useScaffoldWriteContract({
    contractName: "Campaign",
    functionName: "submitProof",
  });

  // --- ACCESS CONTROL ---
  const isNGO = connectedAddress && connectedAddress === ngoWallet;

  // --- HANDLERS ---
  const handleSubmitProofOnChain = async () => {
    if (!proofURL || !proofURL.startsWith("http")) {
      notification.error("Please enter a valid URL (https://...)");
      return;
    }
    try {
      await submitProof({ args: [proofURL] });
      notification.success("Proof submitted on-chain!");
      setProofURL("");
    } catch (e) {
      console.error("Error submitting proof:", e);
      notification.error("On-chain submission failed.");
    }
  };

  // --- RENDER ---
  const renderContent = () => {
    if (!isNGO) {
      return (
        <div className="text-center text-error">
          <h2 className="text-2xl font-bold">Access Denied</h2>
          <p>This page is only for the registered NGO wallet.</p>
        </div>
      );
    }

    if (proofURI && proofURI.length > 0) {
      return (
        <div className="text-center text-success">
          <h2 className="text-2xl font-bold">✅ Proof Already Submitted!</h2>
          <p className="mt-4">Your proof is on-chain and awaiting verification.</p>
          <a
            href={proofURI}
            target="_blank"
            rel="noopener noreferrer"
            className="link link-primary font-mono break-all mt-2"
          >
            {proofURI}
          </a>
        </div>
      );
    }

    return (
      <>
        <h2 className="card-title text-2xl">Submit Proof of Work</h2>
        <p>1. Upload your proof (receipt, photo) to a service like Imgur or Postimages.</p>
        <p>2. Paste the direct image link below.</p>

        <div className="form-control w-full mt-4">
          <label className="label">
            <span className="label-text">Proof URL</span>
          </label>
          <input
            type="text"
            placeholder="https://i.postimg.cc/..."
            className="input input-bordered w-full"
            value={proofURL}
            onChange={e => setProofURL(e.target.value)}
          />
        </div>

        <button className="btn btn-secondary w-full mt-6" onClick={handleSubmitProofOnChain} disabled={isSubmitting}>
          {isSubmitting ? <span className="loading loading-spinner"></span> : "Submit Proof On-Chain"}
        </button>
      </>
    );
  };

  return (
    <>
      <Head>
        <title>NGO Portal</title>
      </Head>
      <div className="flex items-center flex-col flex-grow pt-10">
        <div className="px-5">
          <h1 className="text-center text-4xl font-bold">NGO Admin Portal</h1>
        </div>

        <div className="flex-grow bg-base-300 w-full mt-8 px-8 py-12">
          <div className="max-w-xl mx-auto">
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">{renderContent()}</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default NGOPage;