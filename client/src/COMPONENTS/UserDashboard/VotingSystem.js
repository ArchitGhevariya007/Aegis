import React, { useState, useEffect, useRef } from 'react';
import { votingAPI } from '../../services/api';
import { Camera, CheckCircle, AlertCircle, Vote, Shield, Clock, Users, X } from 'lucide-react';
import { SuccessModal } from '../common/Modal';

const VotingSystem = () => {
  const [votingStatus, setVotingStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedParty, setSelectedParty] = useState(null);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [faceVerified, setFaceVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [error, setError] = useState('');

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    fetchVotingStatus();
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const fetchVotingStatus = async () => {
    try {
      const response = await votingAPI.getStatus();
      setVotingStatus(response.voting);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching voting status:', error);
      setError('Failed to load voting information');
      setLoading(false);
    }
  };

  const startCamera = async () => {
    try {
      setShowCameraModal(true);
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        
        // Wait for video to be ready
        await new Promise((resolve) => {
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play();
            resolve();
          };
        });
      }
      
      setError('');
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Failed to access camera. Please ensure camera permissions are granted.');
      setShowCameraModal(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setShowCameraModal(false);
  };

  const captureAndVerify = async () => {
    if (!canvasRef.current || !videoRef.current) {
      setError('Camera not ready. Please try again.');
      return;
    }

    setVerifying(true);
    setError('');

    try {
      const canvas = canvasRef.current;
      const video = videoRef.current;

      // Check if video is ready
      if (video.readyState !== video.HAVE_ENOUGH_DATA) {
        setError('Video not ready. Please wait a moment and try again.');
        setVerifying(false);
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      
      // Flip the image back to normal (since we mirrored it for display)
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform

      const imageData = canvas.toDataURL('image/jpeg', 0.95).split(',')[1];

      if (!imageData) {
        setError('Failed to capture image. Please try again.');
        setVerifying(false);
        return;
      }

      console.log('Captured image data:');
      console.log('- Length:', imageData.length);
      console.log('- First 50 chars:', imageData.substring(0, 50));
      console.log('- Type:', typeof imageData);

      const response = await votingAPI.verifyFace(imageData);

      if (response.verified) {
        setFaceVerified(true);
        setSuccessMessage(`Face verified successfully! Similarity: ${(response.similarity * 100).toFixed(1)}%`);
        setShowSuccessModal(true);
        stopCamera();
      } else {
        setError(response.message || 'Face verification failed. Please try again.');
      }
    } catch (error) {
      console.error('Face verification error:', error);
      setError(error.message || 'Face verification failed');
    } finally {
      setVerifying(false);
    }
  };

  const handleVoteSubmit = async () => {
    if (!selectedParty || !faceVerified) {
      setError('Please select a party and verify your face before voting');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await votingAPI.castVote(selectedParty, faceVerified);
      
      // Build success message with blockchain info
      let message = response.message;
      if (response.blockchainVerified && response.transactionHash) {
        message += `\n\n🔗 Blockchain Verified!\nTransaction: ${response.transactionHash.substring(0, 20)}...`;
      }
      
      setSuccessMessage(message);
      setShowSuccessModal(true);
      
      // Refresh status to show user has voted
      setTimeout(() => {
        fetchVotingStatus();
      }, 2000);
    } catch (error) {
      console.error('Vote submission error:', error);
      setError(error.message || 'Failed to submit vote');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // If there's no voting status data
  if (!votingStatus) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-900">{error || 'Failed to load voting information'}</p>
        </div>
      </div>
    );
  }

  // If voting is not active
  if (!votingStatus.isActive) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="bg-white rounded-lg shadow-md p-12">
          <div className="flex justify-center mb-6">
            <div className="bg-indigo-100 p-6 rounded-full">
              <Vote className="w-16 h-16 text-indigo-600" />
            </div>
          </div>
          
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Voting System
          </h2>
          
          <p className="text-gray-600 text-lg mb-6">
            No active voting session is currently in progress.
            You can submit your vote when voting becomes available.
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <p className="text-indigo-700 font-semibold mb-2">ℹ️ Not Available</p>
            <p className="text-sm text-blue-900">
              The voting system will be activated by administrators when elections are scheduled.
              Secure, transparent, and verifiable voting powered by blockchain technology.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // If user has already voted
  if (votingStatus.hasVoted) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="bg-white rounded-lg shadow-md p-12">
          <div className="flex justify-center mb-6">
            <div className="bg-green-100 p-6 rounded-full">
              <CheckCircle className="w-16 h-16 text-green-600" />
            </div>
          </div>
          
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Vote Submitted Successfully!
          </h2>
          
          <p className="text-gray-600 text-lg mb-6">
            Thank you for participating in the democratic process.
            Your vote has been securely recorded.
          </p>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center justify-center gap-2 text-green-700 font-semibold mb-2">
              <Shield className="w-5 h-5" />
              Blockchain Verified
            </div>
            <p className="text-sm text-green-900">
              Your vote is encrypted and stored securely on the blockchain.
              You cannot vote again in this session.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Voting interface
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mb-2">
          <Vote className="w-7 h-7 text-indigo-600" />
          {votingStatus.title}
        </h2>
        <p className="text-gray-600">{votingStatus.description}</p>
        
        {votingStatus.startTime && (
          <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
            <Clock className="w-4 h-4" />
            Started: {new Date(votingStatus.startTime).toLocaleString()}
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <p className="text-red-900 text-sm">{error}</p>
        </div>
      )}

      {/* Face Verification Section */}
      {!faceVerified && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Shield className="w-6 h-6 text-indigo-600" />
            Step 1: Verify Your Identity
          </h3>
          
          <p className="text-gray-600 mb-6">
            For security purposes, we need to verify your identity by comparing your live photo
            with your registered ID document.
          </p>

          <button
            onClick={startCamera}
            className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Camera className="w-5 h-5" />
            Start Face Verification
          </button>
        </div>
      )}

      {/* Party Selection */}
      {faceVerified && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-600" />
            Step 2: Select Your Party
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {votingStatus.parties.map((party) => (
              <button
                key={party.id}
                onClick={() => setSelectedParty(party.id)}
                className={`p-6 rounded-lg border-2 transition-all ${
                  selectedParty === party.id
                    ? 'border-indigo-600 bg-indigo-50 shadow-md'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow'
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className="text-5xl">{party.logo}</span>
                  <div className="text-left">
                    <h4 className="text-lg font-bold text-gray-900">{party.name}</h4>
                    <p className="text-sm text-gray-500">Party ID: {party.id}</p>
                  </div>
                  {selectedParty === party.id && (
                    <CheckCircle className="w-6 h-6 text-indigo-600 ml-auto" />
                  )}
                </div>
              </button>
            ))}
          </div>

          <button
            onClick={handleVoteSubmit}
            disabled={!selectedParty || submitting}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-4 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg font-semibold"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Submitting Vote...
              </>
            ) : (
              <>
                <Vote className="w-6 h-6" />
                Submit Vote
              </>
            )}
          </button>

          <p className="text-center text-sm text-gray-500 mt-4">
            Once submitted, your vote cannot be changed or cancelled.
          </p>
        </div>
      )}

      {/* Verification Status Banner */}
      {faceVerified && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-2 rounded-full">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-sm">
              <p className="font-semibold text-green-900">Identity Verified</p>
              <p className="text-green-700">You are authorized to cast your vote</p>
            </div>
          </div>
        </div>
      )}

      {/* Camera Modal */}
      {showCameraModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Camera className="w-6 h-6 text-indigo-600" />
                Face Verification
              </h3>
              <button
                onClick={stopCamera}
                disabled={verifying}
                className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <p className="text-gray-600 mb-4 text-center">
                Position your face within the camera frame and click capture when ready
              </p>

              <div className="relative bg-gray-900 rounded-lg overflow-hidden mb-4" style={{ aspectRatio: '4/3' }}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  style={{ transform: 'scaleX(-1)' }}
                />
                <canvas ref={canvasRef} className="hidden" />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={captureAndVerify}
                  disabled={verifying}
                  className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                >
                  {verifying ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Verifying...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Capture & Verify
                    </>
                  )}
                </button>
                
                <button
                  onClick={stopCamera}
                  disabled={verifying}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          if (votingStatus.hasVoted) {
            fetchVotingStatus();
          }
        }}
        message={successMessage}
      />
    </div>
  );
};

export default VotingSystem;
