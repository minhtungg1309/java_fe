
import React from 'react';
import { CallOffer } from '../../hooks/useSocket';

interface IncomingCallModalProps {
  callOffer: CallOffer | null;
  onAccept: () => void;
  onReject: () => void;
}

export const IncomingCallModal: React.FC<IncomingCallModalProps> = ({
  callOffer,
  onAccept,
  onReject,
}) => {
  if (!callOffer) return null;
console.log('IncomingCallModal received offer:', callOffer)
  const callerName = callOffer.callerInfo?.displayName || 
                    callOffer.callerInfo?.username || 
                    callOffer.callerId || 
                    'ai đó';
  
  const callerAvatar = callOffer.callerInfo?.avatar;
  const callerFirstName = callOffer.callerInfo?.firstName;
  const callerLastName = callOffer.callerInfo?.lastName;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-999999">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 text-center">
        {/* Caller Avatar */}
        <div className="mb-4">
          {callerAvatar ? (
            <img
              src={callerAvatar}
              alt={callerName}
              className="w-24 h-24 rounded-full mx-auto object-cover border-4 border-blue-500"
            />
          ) : (
            <div className="w-24 h-24 rounded-full mx-auto bg-blue-500 flex items-center justify-center text-white text-2xl font-bold border-4 border-blue-600">
              {callerName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Caller Info */}
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          {callerName}
        </h2>
        
        {/* Show additional info if available */}
        {(callerFirstName || callerLastName) && (
          <p className="text-gray-500 text-sm mb-2">
            {callOffer.callerInfo?.username}
          </p>
        )}
        
        <p className="text-gray-600 mb-6">
          Cuộc gọi {callOffer.callType === 'video' ? 'video' : 'thoại'} đến
        </p>

        {/* Call Type Icon */}
        <div className="mb-6">
          {callOffer.callType === 'video' ? (
            <div className="flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span className="ml-2 text-blue-500 font-medium">Video Call</span>
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span className="ml-2 text-green-500 font-medium">Voice Call</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4">
          {/* Reject Button */}
          <button
            onClick={onReject}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Từ chối
          </button>

          {/* Accept Button */}
          <button
            onClick={onAccept}
            className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Trả lời
          </button>
        </div>

        {/* Ringing Animation */}
        <div className="absolute top-2 right-2">
          <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
        </div>
      </div>

      {/* Background Animation */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 animate-pulse"></div>
      </div>
    </div>
  );
};