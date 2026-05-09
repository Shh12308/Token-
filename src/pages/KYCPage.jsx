import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';

// 🔥 CHANGE THIS TO YOUR BACKEND
const API_BASE_URL = 'https://blockvault-backend-production.up.railway.app';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});

const KYCPage = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const [status, setStatus] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const onSubmit = async (data) => {
    setStatus('Uploading...');
    setErrorMessage('');

    try {
      const formData = new FormData();

      // text fields
      formData.append('fullName', data.fullName);
      formData.append('dob', data.dob);

      // file fields (MUST MATCH BACKEND)
      formData.append('idDocument', data.idDocument[0]);
      formData.append('proofOfAddress', data.proofOfAddress[0]);
      formData.append('selfie', data.selfie[0]);

      const response = await api.post('/api/kyc/upload', formData);

      if (response.data.success) {
        setStatus('KYC submitted successfully! Waiting for verification.');
      } else {
        setStatus('Failed to submit KYC.');
        setErrorMessage(response.data.message || 'Unknown error.');
      }
    } catch (error) {
      console.error(error);
      setStatus('Error submitting KYC.');
      setErrorMessage(
        error.response?.data?.message ||
          error.message ||
          'Network error'
      );
    }
  };

  return (
    <div className="kyc-page">
      <h1>KYC Verification</h1>
      <p>Please provide your identity information to complete verification.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="kyc-form">
        <label>
          Full Name
          <input
            type="text"
            {...register('fullName', { required: 'Full name is required' })}
          />
          {errors.fullName && (
            <span className="error">{errors.fullName.message}</span>
          )}
        </label>

        <label>
          Date of Birth
          <input
            type="date"
            {...register('dob', { required: 'Date of birth is required' })}
          />
          {errors.dob && (
            <span className="error">{errors.dob.message}</span>
          )}
        </label>

        <label>
          ID Document
          <input
            type="file"
            accept="image/*,application/pdf"
            {...register('idDocument', { required: 'ID document required' })}
          />
          {errors.idDocument && (
            <span className="error">{errors.idDocument.message}</span>
          )}
        </label>

        <label>
          Proof of Address
          <input
            type="file"
            accept="image/*,application/pdf"
            {...register('proofOfAddress', {
              required: 'Proof of address required',
            })}
          />
          {errors.proofOfAddress && (
            <span className="error">
              {errors.proofOfAddress.message}
            </span>
          )}
        </label>

        <label>
          Selfie
          <input
            type="file"
            accept="image/*"
            {...register('selfie', { required: 'Selfie required' })}
          />
          {errors.selfie && (
            <span className="error">{errors.selfie.message}</span>
          )}
        </label>

        <button type="submit">Submit KYC</button>
      </form>

      {status && <p className="status">{status}</p>}
      {errorMessage && <p className="error">{errorMessage}</p>}
    </div>
  );
};

export default KYCPage;
