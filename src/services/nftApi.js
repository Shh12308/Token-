const ALCHEMY_API_KEY = import.meta.env.VITE_ALCHEMY_API_KEY;

export async function getNFTs(ownerAddress) {
  try {
    if (!ALCHEMY_API_KEY) {
      throw new Error("Missing Alchemy API key");
    }

    const url = `https://eth-mainnet.g.alchemy.com/nft/v3/${ALCHEMY_API_KEY}/getNFTsForOwner?owner=${ownerAddress}`;

    const res = await fetch(url);

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Alchemy error: ${text}`);
    }

    const data = await res.json();

    const nfts = data.ownedNfts || [];

    return nfts.map((nft) => ({
      id: nft.tokenId,
      name: nft.name || nft.contract.address,
      image:
        nft.image?.cachedUrl ||
        nft.image?.pngUrl ||
        "https://via.placeholder.com/200",
      contract: nft.contract.address,
    }));
  } catch (err) {
    console.error("getNFTs error:", err);
    return [];
  }
}
