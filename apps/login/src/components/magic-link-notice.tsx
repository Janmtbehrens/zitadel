"use client";
import { useEffect, useState } from "react";

export function MagicLinkNotice() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (document.cookie.split("; ").some((c) => c.startsWith("magic_link_invalid="))) {
      document.cookie = "magic_link_invalid=; path=/; max-age=0";
      setShow(true);
      const timer = setTimeout(() => setShow(false), 24000);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!show) return null;
  return (
    <div
      role="alert"
      style={{
        position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 1000,
        padding: "12px 20px", borderRadius: 8, background: "#323232", color: "#fff",
        boxShadow: "0 2px 8px rgba(0,0,0,.3)",
      }}
    >
      This sign-in link is invalid or has expired.
    </div>
  );
}
