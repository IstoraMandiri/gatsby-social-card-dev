import React from "react";

// import the default card, or override with custom
// todo make everything configurable

export default function SocialCards({ data }) {
  // only render the social card if URL param is set
  if (typeof window === "undefined" || !window.location.search.includes("generateSocialCard")) {
    return null;
  }
  return (
    <>
    {/* TODO reset css? */}
    <div
      id="gatsby-social-card"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: 1200,
        height: 630,
        zIndex: 999,
        background: "grey",
        overflow: "hidden",
      }}
    >
      <pre>
        <code>{JSON.stringify({ socialCard: window.location.pathname, data }, null, 2)}</code>
      </pre>
    </div>
    <div style={{ height: 640 }}></div>
    </>
  );
}
