import React from 'react';
import { WebRTCState } from '../../hooks/useWebRTC';

interface CallModalProps {
  isOpen: boolean;
  callState: WebRTCState;
  localVideoRef: React.RefObject<HTMLVideoElement | null>;
  remoteVideoRef: React.RefObject<HTMLVideoElement | null>;
  onToggleVideo: () => void;
  onToggleAudio: () => void;
  onEndCall: () => void;
  participantName?: string;
}

export const CallModal: React.FC<CallModalProps> = ({
  isOpen,
  callState,
  localVideoRef,
  remoteVideoRef,
  onToggleVideo,
  onToggleAudio,
  onEndCall,
  participantName,
}) => {
  if (!isOpen) return null;

  const showVideoPlaceholder = callState.callType === 'video' && (!callState.remoteStream || callState.isNoDeviceMode);

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Error/Warning display */}
      {callState.error && (
        <div className="bg-yellow-500 text-white p-3 text-center">
          <span className="text-sm">{callState.error}</span>
        </div>
      )}

      {/* No device mode warning */}
      {callState.isNoDeviceMode && (
        <div className="bg-blue-500 text-white p-2 text-center">
          <span className="text-xs">🔇 Cuộc gọi không có thiết bị âm thanh/video</span>
        </div>
      )}

      {/* Video area */}
      <div className="flex-1 relative">
        {/* Remote video or placeholder */}
        {showVideoPlaceholder ? (
          <div className="w-full h-full bg-gray-800 flex flex-col items-center justify-center">
            {/* Avatar placeholder */}
            <div className="w-32 h-32 bg-gray-600 rounded-full flex items-center justify-center mb-4">
              <span className="text-4xl text-white font-bold">
                {(participantName || 'U').charAt(0).toUpperCase()}
              </span>
            </div>
            <h2 className="text-white text-xl font-semibold mb-2">
              {participantName || 'Unknown'}
            </h2>
            <p className="text-gray-300 text-sm">
              {callState.isCallActive ? '🟢 Đang kết nối...' : '🟡 Đang gọi...'}
            </p>
            {callState.isNoDeviceMode && (
              <p className="text-yellow-300 text-xs mt-2">
                Không có camera/microphone
              </p>
            )}
          </div>
        ) : (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover bg-gray-900"
          />
        )}
        
        {/* Local video - Picture in picture */}
        {callState.callType === 'video' && (
          <div className="absolute top-4 right-4 w-32 h-24 bg-gray-800 rounded-lg overflow-hidden">
            {callState.deviceStatus.hasVideo && callState.localStream ? (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                <span className="text-white text-xs">No Camera</span>
              </div>
            )}
          </div>
        )}

        {/* Participant info */}
        <div className="absolute top-4 left-4">
          <h2 className="text-white text-xl font-semibold">
            {participantName || 'Unknown'}
          </h2>
          <p className="text-gray-300 text-sm">
            {callState.callType === 'video' ? 'Video call' : 'Voice call'}
            {callState.isNoDeviceMode && ' (No devices)'}
          </p>
        </div>

        {/* Connection status */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
          <div className="bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
            {callState.isCallActive ? '🟢 Connected' : '🟡 Connecting...'}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-gray-900 p-6">
        <div className="flex justify-center space-x-6">
          {/* Toggle Audio */}
          <button
            onClick={onToggleAudio}
            disabled={!callState.deviceStatus.hasAudio}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
              !callState.deviceStatus.hasAudio 
                ? 'bg-gray-600 cursor-not-allowed' 
                : callState.isAudioEnabled 
                  ? 'bg-gray-700 hover:bg-gray-600' 
                  : 'bg-red-500 hover:bg-red-600'
            }`}
            title={
              !callState.deviceStatus.hasAudio 
                ? 'Không có microphone' 
                : callState.isAudioEnabled 
                  ? 'Tắt microphone' 
                  : 'Bật microphone'
            }
          >
            {!callState.deviceStatus.hasAudio ? (
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
              </svg>
            ) : callState.isAudioEnabled ? (
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            )}
          </button>

          {/* Toggle Video - Only show for video calls */}
          {callState.callType === 'video' && (
            <button
              onClick={onToggleVideo}
              disabled={!callState.deviceStatus.hasVideo}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                !callState.deviceStatus.hasVideo 
                  ? 'bg-gray-600 cursor-not-allowed' 
                  : callState.isVideoEnabled 
                    ? 'bg-gray-700 hover:bg-gray-600' 
                    : 'bg-red-500 hover:bg-red-600'
              }`}
              title={
                !callState.deviceStatus.hasVideo 
                  ? 'Không có camera' 
                  : callState.isVideoEnabled 
                    ? 'Tắt camera' 
                    : 'Bật camera'
              }
            >
              {!callState.deviceStatus.hasVideo ? (
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                </svg>
              ) : callState.isVideoEnabled ? (
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                </svg>
              )}
            </button>
          )}

          {/* End Call */}
          <button
            onClick={onEndCall}
            className="w-12 h-12 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors"
            title="Kết thúc cuộc gọi"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 3l18 18" />
            </svg>
          </button>
        </div>

        {/* Device status */}
        <div className="mt-4 text-center text-gray-400 text-sm">
          Audio: {callState.deviceStatus.hasAudio ? '✅' : '❌'} | 
          Video: {callState.deviceStatus.hasVideo ? '✅' : '❌'} | 
          Permission: {callState.deviceStatus.permissionGranted ? '✅' : '❌'}
          {callState.isNoDeviceMode && ' | 🔇 No Device Mode'}
        </div>
      </div>
    </div>
  );
};