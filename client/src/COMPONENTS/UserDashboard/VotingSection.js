import React from "react";

const VotingIcon = ({ className = "w-4 h-4" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
);

export default function VotingSection() {
    return (
        <div className="text-center py-12 lg:py-20">
            <div className="max-w-md mx-auto px-4">
                <div className="mb-6 flex justify-center">
                    <VotingIcon className="w-12 h-12 lg:w-16 lg:h-16 text-indigo-600" />
                </div>
                <h2 className="text-xl lg:text-2xl font-semibold text-slate-800 mb-4">Voting System</h2>
                <p className="text-slate-600 mb-6 lg:mb-8 text-sm lg:text-base">
                    The voting system will be available soon. You'll be able to participate in democratic processes using your verified digital identity.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 lg:p-6">
                    <p className="text-blue-800 font-medium text-sm lg:text-base">🚧 Coming Soon</p>
                    <p className="text-blue-700 text-xs lg:text-sm mt-1">
                        Secure, transparent, and verifiable voting powered by blockchain technology.
                    </p>
                </div>
            </div>
        </div>
    );
}