"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAccount } from "wagmi";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

export default function Navigation() {
  const pathname = usePathname();
  const { address } = useAccount();

  const { data: owner } = useScaffoldReadContract({
    contractName: "ProofOfImpact",
    functionName: "owner",
  });

  const { data: isOracle } = useScaffoldReadContract({
    contractName: "ProofOfImpact",
    functionName: "isOracle",
    args: [address!],
    enabled: !!address,
  });

  const isOwner = address?.toLowerCase() === owner?.toLowerCase();

  const navLinks = [
    { href: "/", label: "Campaigns", icon: "🎯", show: true },
    { href: "/admin", label: "Admin", icon: "⚙️", show: isOwner },
    { href: "/ngo-dashboard", label: "NGO", icon: "🏢", show: true },
    { href: "/oracle", label: "Oracle", icon: "✅", show: isOracle },
  ];

  return (
    <div className="navbar bg-base-100 shadow-lg px-4 sticky top-0 z-50">
      <div className="flex-1">
        <Link href="/" className="btn btn-ghost normal-case text-xl">
          <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent font-bold">
            Proof-of-Impact
          </span>
        </Link>
      </div>
      
      <div className="flex-none">
        <ul className="menu menu-horizontal px-1 gap-1">
          {navLinks
            .filter(link => link.show)
            .map(link => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={pathname === link.href ? "active" : ""}
                >
                  <span className="text-lg">{link.icon}</span>
                  <span className="hidden md:inline">{link.label}</span>
                </Link>
              </li>
            ))}
          
          {/* Debug Link */}
          <li>
            <Link href="/debug" className={pathname === "/debug" ? "active" : ""}>
              <span className="text-lg">🔧</span>
              <span className="hidden md:inline">Debug</span>
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}