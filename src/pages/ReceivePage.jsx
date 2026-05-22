import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Copy, Check, ExternalLink } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import BottomNav from "../components/BottomNav";
import { getSessionWallet } from "../utils/session";

const CHAINS = {
  ethereum: { name: "Ethereum", explorer: "https://etherscan.io" },
  polygon: { name: "Polygon", explorer: "https://polygonscan.com" },
  bsc: { name: "BNB Chain", explorer: "https://bscscan.com" },
  arbitrum: { name: "Arbitrum", explorer: "https://arbiscan.io" },
  base: { name: "Base", explorer: "https://basescan.org" },
};

const ReceivePage = () => {
  const navigate = useNavigate();

  const [address, setAddress] = useState("");
  const [copied, setCopied] = useState(false);
  const [selectedChain, setSelectedChain] = useState("ethereum");

  /* ── Load wallet ───────────────── */
  useEffect(() => {
    const activeWallet = getSessionWallet();

    if (activeWallet?.address) {
      setAddress(activeWallet.address);
    } else {
      const storedAddress = localStorage.getItem("walletAddress");
      if (storedAddress) setAddress(storedAddress);
    }
  }, []);

  /* ── Copy logic ───────────────── */
  const handleCopy = () => {
    if (!address) return;

    navigator.clipboard
      .writeText(address)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {
        const textArea = document.createElement("textarea");
        textArea.value = address;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);

        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
  };

  return (
    <div className="dashboard-container-gold">
      {/* HEADER */}
      <header className="top-header-gold">
        <div
          className="header-left flex items-center gap-2 cursor-pointer"
          onClick={() => navigate("/app")}
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </div>

        <div className="header-center">
          <h2>Receive Assets</h2>
        </div>
      </header>

      {/* MAIN */}
      <main
        className="main-scroll-area-gold"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div
          className="card receive-card-gold"
          style={{ textAlign: "center" }}
        >
          {/* NETWORK SELECT */}
          <div
            className="input-group"
            style={{ textAlign: "left", marginBottom: 24 }}
          >
            <label className="label-gold">Select Network</label>
            <select
              className="input-gold"
              value={selectedChain}
              onChange={(e) => setSelectedChain(e.target.value)}
            >
              {Object.keys(CHAINS).map((key) => (
                <option key={key} value={key}>
                  {CHAINS[key].name}
                </option>
              ))}
            </select>
          </div>

          {/* QR CODE */}
          <div
            style={{
              background: "#ffffff",
              padding: "24px",
              borderRadius: "16px",
              display: "inline-block",
              marginBottom: "24px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            }}
          >
            {address ? (
              <QRCodeSVG
                value={address}
                size={180}
                bgColor="#ffffff"
                fgColor="#000000"
              />
            ) : (
              <div
                style={{
                  width: 180,
                  height: 180,
                  background: "#eee",
                  borderRadius: 8,
                }}
              />
            )}
          </div>

          <p
            style={{
              color: "var(--text-muted)",
              fontSize: 14,
              marginBottom: 12,
            }}
          >
            Only send {CHAINS[selectedChain].name} assets to this address.
          </p>

          {/* ADDRESS */}
          <div
            style={{
              padding: "16px",
              background: "var(--bg-input)",
              border: "1px solid var(--border-color)",
              borderRadius: "12px",
              fontFamily: "monospace",
              wordBreak: "break-all",
              fontSize: "14px",
              marginBottom: "16px",
            }}
          >
            {address || "Loading address..."}
          </div>

          {/* COPY BUTTON */}
          <button
            className="btn-primary flex items-center justify-center gap-2"
            onClick={handleCopy}
            disabled={!address}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy Address
              </>
            )}
          </button>

          {/* EXPLORER BUTTON */}
          {address && (
            <button
              className="btn-secondary flex items-center justify-center gap-2 mt-3"
              onClick={() =>
                window.open(
                  `${CHAINS[selectedChain].explorer}/address/${address}`,
                  "_blank"
                )
              }
            >
              <ExternalLink className="w-4 h-4" />
              View on Explorer
            </button>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default ReceivePage;
