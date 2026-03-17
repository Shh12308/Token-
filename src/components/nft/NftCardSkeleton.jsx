// src/components/nft/NftCardSkeleton.jsx
import React from 'react';

const NftCardSkeleton = () => {
  return (
    <div className="bg-gray-200 dark:bg-gray-700 rounded-lg p-4 animate-pulse">
      <div className="w-full h-40 bg-gray-300 dark:bg-gray-600 rounded mb-4"></div>
      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
    </div>
  );
};

export default NftCardSkeleton;
