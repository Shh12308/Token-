// src/pages/KYCPage.jsx
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';

const KYCPage = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [status, setStatus] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const onSubmit = async (data) => {
    setStatus('Uploading...');
    setErrorMessage('');

    try {
      // Send data to your backend for KYC processing
      const formData = new FormData();
      formData.append('fullName', data.fullName);
      formData.append('dob', data.dob);
      formData.append('document', data.document[0]); // File upload

      const response = await axios.post('/api/kyc', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data.success) {
        setStatus('KYC submitted successfully! Waiting for verification.');
      } else {
        setStatus('Failed to submit KYC.');
        setErrorMessage(response.data.message || 'Unknown error.');
      }
    } catch (error) {
      console.error(error);
      setStatus('Error submitting KYC.');
      setErrorMessage(error.response?.data?.message || error.message);
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
          {errors.fullName && <span className="error">{errors.fullName.message}</span>}
        </label>

        <label>
          Date of Birth
          <input
            type="date"
            {...register('dob', { required: 'Date of birth is required' })}
          />
          {errors.dob && <span className="error">{errors.dob.message}</span>}
        </label>

        <label>
          Government ID (Passport / Driver License)
          <input
            type="file"
            accept="image/*,application/pdf"
            {...register('document', { required: 'Document is required' })}
          />
          {errors.document && <span className="error">{errors.document.message}</span>}
        </label>

        <button type="submit">Submit KYC</button>
      </form>

      {status && <p className="status">{status}</p>}
      {errorMessage && <p className="error">{errorMessage}</p>}
    </div>
  );
};

export default KYCPage;
