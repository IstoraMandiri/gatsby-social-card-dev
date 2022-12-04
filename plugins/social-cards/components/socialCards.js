import React from "react";
import MD5 from "crypto-js/md5";
import { Helmet } from "react-helmet";

// import the default card, or override with custom
// todo make everything configurable

export default function SocialCards({ data }) {
  // only do work if if the URL param is set or we are generating static html
  if (typeof window !== "undefined" && !window.location.search.includes("generateSocialCard")) {
    return null;
  }
  // TODO default value
  // generate a cache key, based on inputs
  const hash = MD5(JSON.stringify(data)).toString();
  const imageUrl = `http://localhost:9000/static/social-card-${hash}.jpg`
  if (typeof window === "undefined") {
    return (
      <Helmet>
        <meta key="og:image" property="og:image" content={imageUrl} />
      </Helmet>
    );
  }
  // render the social card itself
  return (
    <>
    <div
      id="gatsby-social-card"
      data-hash={hash}
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
      {/* pass data to children instead of using default card */}
      <pre>
        <code>{JSON.stringify({ socialCard: window.location.pathname, data, hash }, null, 2)}</code>
      </pre>
    </div>
    <div style={{ height: 640 }}></div>
    </>
  );
}
