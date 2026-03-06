import React, { useState } from 'react';

// Example networks array
// Each network should have a `name` and `icon` (React component from lucide-react)
const networks = [
  { name: 'Ethereum', icon: require('lucide-react').Home }, 
  { name: 'Polygon', icon: require('lucide-react').Wallet },
  // Add more networks here...
];

const NetworkSelector = () => {
  const [selectedNetwork, setSelectedNetwork] = useState(networks[0].name);

  const currentNetwork = networks.find(net => net.name === selectedNetwork);

  const handleNetworkChange = (event) => {
    setSelectedNetwork(event.target.value);
  };

  return (
    <div className="network-selector">
      {/* Render icon safely */}
      <span className="network-icon">
        {currentNetwork?.icon ? <currentNetwork.icon /> : '🔗'}
      </span>

      <select
        value={selectedNetwork}
        onChange={handleNetworkChange}
        className="network-dropdown"
      >
        {networks.map(net => (
          <option key={net.name} value={net.name}>
            {net.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default NetworkSelector;
