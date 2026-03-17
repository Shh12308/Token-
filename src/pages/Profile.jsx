// src/pages/Profile.jsx
import React, { useState } from 'react';
import { FiEdit, FiUser, FiMail, FiLock, FiLogOut } from 'react-icons/fi';
import { useSelector } from 'react-redux';

const Profile = () => {
  const { walletAddress } = useSelector(state => state.wallet);
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState('CryptoBeanUser');
  const [email, setEmail] = useState('user@example.com');

  const handleSave = () => {
    setEditing(false);
    // Add logic to save updates (localforage / backend)
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 md:p-8">
      <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 shadow rounded-lg p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Profile</h1>
          <button
            className="flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
            onClick={() => setEditing(!editing)}
          >
            <FiEdit /> {editing ? 'Cancel' : 'Edit'}
          </button>
        </div>

        <div className="space-y-6">
          {/* Wallet Address */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <FiUser className="text-gray-500 dark:text-gray-300" size={24} />
              <span className="text-gray-700 dark:text-gray-200 font-mono">{walletAddress || 'No wallet connected'}</span>
            </div>
            <button
              className="mt-2 sm:mt-0 px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
              onClick={() => navigator.clipboard.writeText(walletAddress)}
            >
              Copy
            </button>
          </div>

          {/* Username */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <FiUser className="text-gray-500 dark:text-gray-300" size={24} />
              {editing ? (
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded w-full sm:w-64 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              ) : (
                <span className="text-gray-700 dark:text-gray-200">{username}</span>
              )}
            </div>
            {editing && (
              <button
                className="mt-2 sm:mt-0 px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                onClick={handleSave}
              >
                Save
              </button>
            )}
          </div>

          {/* Email */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <FiMail className="text-gray-500 dark:text-gray-300" size={24} />
              {editing ? (
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded w-full sm:w-64 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              ) : (
                <span className="text-gray-700 dark:text-gray-200">{email}</span>
              )}
            </div>
          </div>

          {/* Change Password */}
          <div className="flex items-center gap-4">
            <FiLock className="text-gray-500 dark:text-gray-300" size={24} />
            <button className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
              Change Password
            </button>
          </div>

          {/* Logout */}
          <div className="flex items-center gap-4">
            <FiLogOut className="text-gray-500 dark:text-gray-300" size={24} />
            <button className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600">
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
