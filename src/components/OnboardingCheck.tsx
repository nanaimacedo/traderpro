"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

export function OnboardingCheck({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (pathname === "/onboarding") {
      setChecked(true);
      return;
    }

    fetch("/api/profile/check")
      .then((res) => res.json())
      .then((data) => {
        if (!data.onboarded) {
          router.replace("/onboarding");
        } else {
          setChecked(true);
        }
      })
      .catch(() => setChecked(true));
  }, [pathname, router]);

  if (!checked && pathname !== "/onboarding") {
    return null;
  }

  return <>{children}</>;
}
