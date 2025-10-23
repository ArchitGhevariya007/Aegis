import React, { useState, useEffect } from 'react';
import { votingAPI } from '../../services/api';
import { Play, StopCircle, RotateCcw, BarChart3, Users, TrendingUp, Clock, Vote } from 'lucide-react';
import { SuccessModal, ConfirmModal } from '../common/Modal';

const VotingPanel = () => {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);

  useEffect(() => {
    fetchResults();
    const interval = setInterval(fetchResults, 5000); // Auto-refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchResults = async () => {
    try {
      const response = await votingAPI.getResults();
      setResults(response.results);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching voting results:', error);
      setLoading(false);
    }
  };

  const handleStartVoting = async () => {
    setActionLoading(true);
    try {
      const response = await votingAPI.startVoting();
      setSuccessMessage(response.message);
      setShowSuccessModal(true);
      fetchResults();
    } catch (error) {
      alert(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleStopVoting = async () => {
    setActionLoading(true);
    try {
      const response = await votingAPI.stopVoting();
      setSuccessMessage(response.message);
      setShowSuccessModal(true);
      fetchResults();
    } catch (error) {
      alert(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetVoting = async () => {
    setShowResetModal(false);
    setActionLoading(true);
    try {
      const response = await votingAPI.resetVoting();
      setSuccessMessage(response.message);
      setShowSuccessModal(true);
      fetchResults();
    } catch (error) {
      alert(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const maxVotes = Math.max(...results.parties.map(p => p.votes), 1);

  return (
    <>
      <div className="p-6 bg-white rounded-2xl shadow w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Vote className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{results.title}</h2>
              <p className="text-sm text-slate-500">{results.description}</p>
            </div>
          </div>
          <div className={`px-4 py-2 rounded-lg font-semibold ${
            results.isActive 
              ? 'bg-green-100 text-green-700 border border-green-300' 
              : 'bg-slate-100 text-slate-700 border border-slate-300'
          }`}>
            {results.isActive ? '🟢 Active' : '⚫ Inactive'}
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="p-5 border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-indigo-900 mb-1">Total Votes</p>
                <p className="text-3xl font-bold text-indigo-600">{results.totalVotes}</p>
              </div>
              <div className="p-3 bg-indigo-100 rounded-xl">
                <BarChart3 className="w-7 h-7 text-indigo-700" />
              </div>
            </div>
          </div>

          <div className="p-5 border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-900 mb-1">Total Voters</p>
                <p className="text-3xl font-bold text-purple-600">{results.voterCount}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-xl">
                <Users className="w-7 h-7 text-purple-700" />
              </div>
            </div>
          </div>

          <div className="p-5 border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-900 mb-1">Blockchain Verified</p>
                <p className="text-3xl font-bold text-amber-600">{results.blockchainVerifiedCount || 0}</p>
                <p className="text-xs text-amber-700 mt-1">
                  {results.voterCount > 0 
                    ? `${((results.blockchainVerifiedCount || 0) / results.voterCount * 100).toFixed(1)}%`
                    : '0%'
                  }
                </p>
              </div>
              <div className="p-3 bg-amber-100 rounded-xl">
                <span className="text-2xl">🔗</span>
              </div>
            </div>
          </div>

          <div className="p-5 border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-900 mb-1">Leading Party</p>
                <p className="text-lg font-bold text-green-600">
                  {results.parties.length > 0 
                    ? results.parties.reduce((max, p) => p.votes > max.votes ? p : max, results.parties[0]).name
                    : 'N/A'
                  }
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <TrendingUp className="w-7 h-7 text-green-700" />
              </div>
            </div>
          </div>
        </div>

        {/* Control Section */}
        <div className={`mb-6 overflow-hidden rounded-xl border-2 ${results.isActive ? 'border-green-300 bg-green-50' : 'border-slate-200 bg-slate-50'}`}>
          <div className="p-5">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${results.isActive ? 'bg-green-100' : 'bg-slate-100'}`}>
                  {results.isActive ? (
                    <StopCircle className="w-6 h-6 text-green-600" />
                  ) : (
                    <Play className="w-6 h-6 text-slate-600" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 mb-1">Voting Control</h3>
                  <p className="text-sm text-slate-600">
                    {results.isActive 
                      ? 'Voting is currently active. Users can submit their votes.' 
                      : 'Start voting to allow users to participate in the election'}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                {!results.isActive ? (
                  <button
                    onClick={handleStartVoting}
                    disabled={actionLoading}
                    className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    <Play className="w-4 h-4" />
                    Start Voting
                  </button>
                ) : (
                  <button
                    onClick={handleStopVoting}
                    disabled={actionLoading}
                    className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    <StopCircle className="w-4 h-4" />
                    Stop Voting
                  </button>
                )}

                <button
                  onClick={() => setShowResetModal(true)}
                  disabled={actionLoading || results.isActive}
                  className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset
                </button>

                <button
                  onClick={fetchResults}
                  disabled={actionLoading}
                  className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                  <RotateCcw className="w-4 h-4" />
                  Refresh
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Voting Results */}
        <div className="mb-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            Voting Results
          </h3>

          <div className="space-y-4">
            {results.parties.map((party) => (
              <div key={party.id} className="border-2 border-slate-200 bg-slate-50 rounded-xl p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{party.logo}</span>
                    <div>
                      <h4 className="text-base font-bold text-slate-900">{party.name}</h4>
                      <p className="text-xs text-slate-500">Party ID: {party.id}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold" style={{ color: party.color }}>
                      {party.votes}
                    </div>
                    <div className="text-sm text-slate-600 font-semibold">
                      {party.percentage}%
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${(party.votes / maxVotes) * 100}%`,
                      backgroundColor: party.color
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Voters */}
        {results.recentVotes && results.recentVotes.length > 0 && (
          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-600" />
              Recent Voters
            </h3>

            <div className="overflow-x-auto border-2 border-slate-200 rounded-xl">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Voter Email
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Face Verified
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Blockchain
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {results.recentVotes.map((vote, index) => (
                    <tr key={index} className="hover:bg-slate-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-900">
                        {vote.email}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">
                        {new Date(vote.timestamp).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          vote.faceVerified 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {vote.faceVerified ? '✓ Verified' : '✗ Not Verified'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {vote.blockchainVerified ? (
                          <div className="group relative">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-amber-100 text-amber-800 cursor-help">
                              🔗 Verified
                            </span>
                            {vote.transactionHash && (
                              <div className="hidden group-hover:block absolute z-10 bg-gray-900 text-white text-xs rounded px-2 py-1 mt-1 whitespace-nowrap">
                                {vote.transactionHash.substring(0, 20)}...
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-slate-100 text-slate-600">
                            Not Stored
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Time Information */}
        {(results.startTime || results.endTime) && (
          <div className="mt-6 bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-900">
                {results.startTime && (
                  <p className="mb-1">
                    <span className="font-semibold">Started:</span>{' '}
                    {new Date(results.startTime).toLocaleString()}
                  </p>
                )}
                {results.endTime && (
                  <p>
                    <span className="font-semibold">Ended:</span>{' '}
                    {new Date(results.endTime).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        message={successMessage}
      />

      {/* Reset Confirmation Modal */}
      <ConfirmModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        onConfirm={handleResetVoting}
        title="Reset Voting Session"
        message="Are you sure you want to reset all voting data? This action cannot be undone and will delete all votes and voter records."
        confirmText="Reset All Data"
        type="danger"
      />
    </>
  );
};

export default VotingPanel;
