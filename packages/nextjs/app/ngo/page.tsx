"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const NGOPage = () => {
  const router = useRouter();

  useEffect(() => {
    // Redirect to NGO Dashboard
    router.push("/ngo-dashboard");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="loading loading-spinner loading-lg"></div>
        <p className="mt-4">Redirecting to NGO Dashboard...</p>
      </div>
    </div>
  );
};

export default NGOPage;