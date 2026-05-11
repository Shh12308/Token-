import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { faSearch, faFilter, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const API_BASE = process.env.REACT_APP_API_URL || 'https://blockvault-backend-production.up.railway.app/api';

const NFTBrowsePage = () => {
  const navigate = useNavigate();
  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNFTs();
  }, []);

  const fetchNFTs = async () => {
    try {
      const res = await axios.get(`${API_BASE}/nft/listings`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
      });
      setNfts(res.data.listings || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-container-gold">
      <header className="top-header-gold">
        <div className="header-left" onClick={() => navigate('/app')}>
          <FontAwesomeIcon icon={faArrowLeft} /> Back
        </div>
        <div className="header-right">
           <FontAwesomeIcon icon={faFilter} />
        </div>
      </header>

      <main className="main-scroll-area-gold">
        <div className="search-bar-gold">
          <FontAwesomeIcon icon={faSearch} />
          <input 
            type="text" 
            placeholder="Search collections or items..."
            className="input-gold"
            style={{ background: 'transparent', border: 'none' }}
          />
        </div>

        {loading ? (
          <div className="text-center p-4">Loading NFTs...</div>
        ) : (
          <div className="nft-grid-gold">
            {nfts.map((nft) => (
              <div className="nft-card-gold" key={nft.id} onClick={() => alert(`Buy NFT ID: ${nft.id}`)}>
                {/* Mock Image - backend should provide nftItem.image */}
                <div className="nft-img-gold" style={{backgroundImage: `url(https://picsum.photos/seed/${nft.id}/200/200)`}}></div>
                <div className="nft-info-gold">
                   <div className="nft-title-gold">Collection #{nft.collectionId?.substring(0,4)}</div>
                   <div className="nft-price-gold">{nft.price} ETH</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <nav className="bottom-nav-gold">
        <div className={`nav-item-gold ${window.location.pathname.includes('browse') ? 'active' : ''}`} onClick={() => navigate('/app/nft-market')}><span>Browse</span></div>
      </nav>
    </div>
  );
};

export default NFTBrowsePage;
