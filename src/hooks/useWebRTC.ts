import { useRef, useState, useCallback, useMemo } from 'react';
import { CallOffer, CallAnswer, IceCandidate } from './useSocket';

export interface WebRTCState {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isCallActive: boolean;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  callType: 'audio' | 'video';
  error: string | null;
  deviceStatus: {
    hasAudio: boolean;
    hasVideo: boolean;
    permissionGranted: boolean;
  };
  isNoDeviceMode: boolean;
  canProceedWithoutDevices: boolean;
}

export function useWebRTC() {
  const [state, setState] = useState<WebRTCState>({
    localStream: null,
    remoteStream: null,
    isCallActive: false,
    isVideoEnabled: false,
    isAudioEnabled: false,
    callType: 'audio',
    error: null,
    deviceStatus: {
      hasAudio: false,
      hasVideo: false,
      permissionGranted: false,
    },
    isNoDeviceMode: false,
    canProceedWithoutDevices: true,
  });

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null!);
  const remoteVideoRef = useRef<HTMLVideoElement>(null!);
  
  // **ADD: ICE candidate buffering**
  const iceCandidateBufferRef = useRef<IceCandidate[]>([]);
  const remoteDescriptionSetRef = useRef<boolean>(false);
  const isCallerRef = useRef<boolean>(false);

  // ICE servers configuration
  const iceServers = useMemo(() => ({
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
    ],
  }), []);

  /**
   * Create silent audio track for calls without microphone
   */
  const createSilentAudioTrack = useCallback(() => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    gainNode.gain.value = 0; // Silent
    oscillator.frequency.value = 440;
    oscillator.start();
    
    // Create MediaStream from audio context
    const destination = audioContext.createMediaStreamDestination();
    gainNode.connect(destination);
    
    return destination.stream.getAudioTracks()[0];
  }, []);

  /**
   * Create black video track for calls without camera
   */
  const createBlackVideoTrack = useCallback(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add text overlay
    ctx.fillStyle = 'white';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('No Camera', canvas.width / 2, canvas.height / 2);
    
    const stream = canvas.captureStream(15); // 15fps
    return stream.getVideoTracks()[0];
  }, []);

  /**
   * Kiểm tra WebRTC support
   */
  const checkWebRTCSupport = useCallback(() => {
    const isLocalhost = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1' ||
                       window.location.hostname === '[::1]';
    
    const isHTTPS = window.location.protocol === 'https:';
    
    if (!isLocalhost && !isHTTPS) {
      const errorMessage = 'WebRTC yêu cầu HTTPS. Vui lòng truy cập trang web qua HTTPS.';
      setState(prev => ({ ...prev, error: errorMessage }));
      return false;
    }

    const isSupported = !!(
      navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === 'function' &&
      window.RTCPeerConnection
    );

    if (!isSupported) {
      const errorMessage = 'WebRTC không được hỗ trợ. Vui lòng cập nhật trình duyệt.';
      setState(prev => ({ ...prev, error: errorMessage }));
      return false;
    }

    return true;
  }, []);

  /**
   * Kiểm tra thiết bị media có sẵn
   */
  const checkMediaDevices = useCallback(async () => {
    try {
      if (!checkWebRTCSupport()) {
        return { hasAudio: false, hasVideo: false };
      }

      // Try to get device list first
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioDevices = devices.filter(device => device.kind === 'audioinput');
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        
        const hasAudio = audioDevices.length > 0;
        const hasVideo = videoDevices.length > 0;
        
        console.log('🎧 Available devices:', {
          audioDevices: audioDevices.length,
          videoDevices: videoDevices.length,
        });

        setState(prev => ({
          ...prev,
          deviceStatus: {
            hasAudio,
            hasVideo,
            permissionGranted: audioDevices.some(d => d.label !== '') || videoDevices.some(d => d.label !== ''),
          },
          isNoDeviceMode: !hasAudio && !hasVideo,
        }));

        return { hasAudio, hasVideo };
      } catch (enumerateError) {
        console.warn('Cannot enumerate devices:', enumerateError);
        
        // Fallback: try to get media to check availability
        try {
          const tempStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
          tempStream.getTracks().forEach(track => track.stop());
          return { hasAudio: true, hasVideo: true };
        } catch (mediaError) {
          console.warn('No media devices available:', mediaError);
          setState(prev => ({
            ...prev,
            deviceStatus: { hasAudio: false, hasVideo: false, permissionGranted: false },
            isNoDeviceMode: true,
          }));
          return { hasAudio: false, hasVideo: false };
        }
      }
    } catch (error) {
      console.error('Device check failed:', error);
      setState(prev => ({
        ...prev,
        deviceStatus: { hasAudio: false, hasVideo: false, permissionGranted: false },
        isNoDeviceMode: true,
      }));
      return { hasAudio: false, hasVideo: false };
    }
  }, [checkWebRTCSupport]);

  /**
   * Khởi tạo peer connection
   */
  const initializePeerConnection = useCallback(() => {
    if (!window.RTCPeerConnection) {
      throw new Error('WebRTC không được hỗ trợ trong trình duyệt này');
    }

    const peerConnection = new RTCPeerConnection(iceServers);
    peerConnectionRef.current = peerConnection;

    // **IMPROVED: Better track handling**
    peerConnection.ontrack = (event) => {
      console.log('🎥 Remote track received:', {
        kind: event.track.kind,
        enabled: event.track.enabled,
        readyState: event.track.readyState,
        streams: event.streams.length
      });
      
      const [remoteStream] = event.streams;
      if (remoteStream) {
        setState(prev => ({ ...prev, remoteStream }));
        
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
          // **Force play for audio/video**
          remoteVideoRef.current.play().catch(e => console.warn('Remote video play failed:', e));
        }
      }
    };

    // **ADD: Connection state monitoring**
    peerConnection.onconnectionstatechange = () => {
      console.log('🔗 Connection state:', peerConnection.connectionState);
    };

    peerConnection.oniceconnectionstatechange = () => {
      console.log('🧊 ICE connection state:', peerConnection.iceConnectionState);
    };

    return peerConnection;
  }, [iceServers]);

  /**
   * **IMPROVED: Media stream with better constraints**
   */
  const startMediaStream = useCallback(async (callType: 'audio' | 'video') => {
    try {
      if (!checkWebRTCSupport()) {
        throw new Error('WebRTC không được hỗ trợ trong trình duyệt này.');
      }

      setState(prev => ({ ...prev, error: null }));
      const { hasAudio, hasVideo } = await checkMediaDevices();
      
      console.log('🎯 Device availability:', { hasAudio, hasVideo, callType });

      let stream: MediaStream;

      if (hasAudio || hasVideo) {
        try {
          const constraints: MediaStreamConstraints = {
            audio: hasAudio ? {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
              sampleRate: 44100,
            } : false,
            video: (callType === 'video' && hasVideo) ? {
              width: { min: 320, ideal: 640, max: 1280 },
              height: { min: 240, ideal: 480, max: 720 },
              frameRate: { ideal: 30, max: 30 },
              facingMode: 'user'
            } : false
          };

          stream = await navigator.mediaDevices.getUserMedia(constraints);
          console.log('✅ Real media stream obtained:', {
            audioTracks: stream.getAudioTracks().length,
            videoTracks: stream.getVideoTracks().length,
            tracks: stream.getTracks().map(t => ({
              kind: t.kind,
              enabled: t.enabled,
              readyState: t.readyState
            }))
          });
          
        } catch (realMediaError) {
          console.warn('Real media failed, creating synthetic stream:', realMediaError);
          stream = new MediaStream();
        }
      } else {
        console.log('No devices available, creating synthetic stream');
        stream = new MediaStream();
      }

      // Add synthetic tracks if needed
      const audioTracks = stream.getAudioTracks();
      const videoTracks = stream.getVideoTracks();

      if (audioTracks.length === 0 && (callType === 'audio' || callType === 'video')) {
        console.log('Adding synthetic audio track');
        try {
          const silentTrack = createSilentAudioTrack();
          stream.addTrack(silentTrack);
        } catch (audioError) {
          console.warn('Failed to create silent audio track:', audioError);
        }
      }

      if (videoTracks.length === 0 && callType === 'video') {
        console.log('Adding synthetic video track');
        try {
          const blackTrack = createBlackVideoTrack();
          stream.addTrack(blackTrack);
        } catch (videoError) {
          console.warn('Failed to create black video track:', videoError);
        }
      }

      const finalAudioTracks = stream.getAudioTracks();
      const finalVideoTracks = stream.getVideoTracks();
      
      console.log('🎬 Final stream tracks:', {
        audioTracks: finalAudioTracks.length,
        videoTracks: finalVideoTracks.length,
        isNoDeviceMode: !hasAudio && !hasVideo,
        // **ADD: More detailed track info**
        trackDetails: stream.getTracks().map(t => ({
          kind: t.kind,
          enabled: t.enabled,
          readyState: t.readyState,
          label: t.label,
          muted: t.muted
        }))
      });

      setState(prev => ({ 
        ...prev, 
        localStream: stream, 
        callType: finalVideoTracks.length > 0 ? 'video' : 'audio',
        isVideoEnabled: finalVideoTracks.length > 0 && hasVideo,
        isAudioEnabled: finalAudioTracks.length > 0 && hasAudio,
        error: null,
        isNoDeviceMode: !hasAudio && !hasVideo,
      }));

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.muted = true; // Prevent echo
        localVideoRef.current.play().catch(e => console.warn('Local video play failed:', e));
      }

      return stream;

    } catch (error) {
      console.error('Error in startMediaStream:', error);
      
      try {
        console.log('Creating emergency synthetic stream');
        const emergencyStream = new MediaStream();
        
        try {
          const silentTrack = createSilentAudioTrack();
          emergencyStream.addTrack(silentTrack);
        } catch (e) {
          console.warn('Failed to add silent track to emergency stream:', e);
        }

        setState(prev => ({ 
          ...prev, 
          localStream: emergencyStream,
          callType: 'audio',
          isVideoEnabled: false,
          isAudioEnabled: false,
          error: 'Cuộc gọi không có âm thanh/video (thiết bị không khả dụng)',
          isNoDeviceMode: true,
        }));

        return emergencyStream;
      } catch (emergencyError) {
        console.error('Emergency stream creation failed:', emergencyError);
        const errorMessage = 'Không thể khởi tạo cuộc gọi. Vui lòng thử lại.';
        setState(prev => ({ ...prev, error: errorMessage }));
        throw new Error(errorMessage);
      }
    }
  }, [checkMediaDevices, createSilentAudioTrack, createBlackVideoTrack, checkWebRTCSupport]);

  /**
   * **FIXED: Create offer with proper setup**
   */
  const createOffer = useCallback(async (callType: 'audio' | 'video'): Promise<CallOffer | null> => {
    try {
      console.log('📞 Creating offer for:', callType);
      
      const peerConnection = initializePeerConnection();
      const stream = await startMediaStream(callType);

      // **Mark as caller**
      isCallerRef.current = true;
      remoteDescriptionSetRef.current = false;
      iceCandidateBufferRef.current = [];

      // **Add tracks properly**
      stream.getTracks().forEach(track => {
        console.log('➕ Adding track to peer connection:', {
          kind: track.kind,
          enabled: track.enabled,
          readyState: track.readyState
        });
        peerConnection.addTrack(track, stream);
      });

      const offer = await peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: callType === 'video'
      });
      
      await peerConnection.setLocalDescription(offer);
      console.log('✅ Offer created and local description set');

      setState(prev => ({ ...prev, isCallActive: true }));

      return {
        callerId: '',
        calleeId: '',
        sdp: offer.sdp || '',
        type: 'offer',
        callType,
        callId: '',
      };
    } catch (error) {
      console.error('❌ Error creating offer:', error);
      return null;
    }
  }, [initializePeerConnection, startMediaStream]);

  /**
   * **FIXED: Create answer with proper setup**
   */
  const createAnswer = useCallback(async (offer: CallOffer): Promise<CallAnswer | null> => {
    try {
      console.log('📞 Creating answer for offer:', offer.callType);
      
      const peerConnection = initializePeerConnection();
      const stream = await startMediaStream(offer.callType);

      // **Mark as callee**
      isCallerRef.current = false;
      remoteDescriptionSetRef.current = false;
      iceCandidateBufferRef.current = [];

      // **Add tracks first**
      stream.getTracks().forEach(track => {
        console.log('➕ Adding track to peer connection (callee):', {
          kind: track.kind,
          enabled: track.enabled,
          readyState: track.readyState
        });
        peerConnection.addTrack(track, stream);
      });

      // **Set remote description**
      await peerConnection.setRemoteDescription({
        type: 'offer',
        sdp: offer.sdp,
      });
      
      console.log('✅ Remote description set (callee)');
      remoteDescriptionSetRef.current = true;

      // **Process buffered ICE candidates**
      if (iceCandidateBufferRef.current.length > 0) {
        console.log(`🧊 Processing ${iceCandidateBufferRef.current.length} buffered ICE candidates`);
        for (const candidate of iceCandidateBufferRef.current) {
          try {
            await peerConnection.addIceCandidate({
              candidate: candidate.candidate,
              sdpMid: candidate.sdpMid,
              sdpMLineIndex: candidate.sdpMLineIndex,
            });
          } catch (iceError) {
            console.warn('Failed to add buffered ICE candidate:', iceError);
          }
        }
        iceCandidateBufferRef.current = [];
      }

      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      console.log('✅ Answer created and local description set');

      setState(prev => ({ ...prev, isCallActive: true }));

      return {
        callerId: offer.callerId,
        calleeId: offer.calleeId,
        sdp: answer.sdp || '',
        type: 'answer',
        callId: offer.callId,
      };
    } catch (error) {
      console.error('❌ Error creating answer:', error);
      return null;
    }
  }, [initializePeerConnection, startMediaStream]);

  /**
   * **FIXED: Handle answer with ICE candidate processing**
   */
  const handleAnswer = useCallback(async (answer: CallAnswer) => {
    try {
      console.log('📞 Processing answer:', answer);
      
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription({
          type: 'answer',
          sdp: answer.sdp,
        });
        
        console.log('✅ Remote description set successfully (caller)');
        remoteDescriptionSetRef.current = true;
        
        // **Process buffered ICE candidates**
        if (iceCandidateBufferRef.current.length > 0) {
          console.log(`🧊 Processing ${iceCandidateBufferRef.current.length} buffered ICE candidates`);
          
          for (const candidate of iceCandidateBufferRef.current) {
            try {
              await peerConnectionRef.current.addIceCandidate({
                candidate: candidate.candidate,
                sdpMid: candidate.sdpMid,
                sdpMLineIndex: candidate.sdpMLineIndex,
              });
              console.log('✅ Buffered ICE candidate added');
            } catch (iceError) {
              console.error('❌ Error adding buffered ICE candidate:', iceError);
            }
          }
          
          // Clear buffer
          iceCandidateBufferRef.current = [];
        }
      }
    } catch (error) {
      console.error('❌ Error handling answer:', error);
    }
  }, []);

  /**
   * **FIXED: Handle ICE candidate with buffering**
   */
  const handleIceCandidate = useCallback(async (candidate: IceCandidate) => {
    try {
      if (!peerConnectionRef.current) {
        console.warn('⚠️ No peer connection for ICE candidate');
        return;
      }

      // **Buffer ICE candidates if remote description not set yet**
      if (!remoteDescriptionSetRef.current) {
        console.log('🧊 Buffering ICE candidate (remote description not set yet)');
        iceCandidateBufferRef.current.push(candidate);
        return;
      }

      // **Add ICE candidate immediately if remote description is set**
      await peerConnectionRef.current.addIceCandidate({
        candidate: candidate.candidate,
        sdpMid: candidate.sdpMid,
        sdpMLineIndex: candidate.sdpMLineIndex,
      });
      
      console.log('✅ ICE candidate added successfully');
      
    } catch (error) {
      console.error('❌ Error handling ICE candidate:', error);
    }
  }, []);

  /**
   * Toggle video (only works if device is available)
   */
  const toggleVideo = useCallback(() => {
    if (state.localStream && state.deviceStatus.hasVideo) {
      const videoTrack = state.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setState(prev => ({ ...prev, isVideoEnabled: videoTrack.enabled }));
      }
    }
  }, [state.localStream, state.deviceStatus.hasVideo]);

  /**
   * Toggle audio (only works if device is available)
   */
  const toggleAudio = useCallback(() => {
    if (state.localStream && state.deviceStatus.hasAudio) {
      const audioTrack = state.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setState(prev => ({ ...prev, isAudioEnabled: audioTrack.enabled }));
      }
    }
  }, [state.localStream, state.deviceStatus.hasAudio]);

  /**
   * **FIXED: End call with proper cleanup**
   */
  const endCall = useCallback(() => {
    if (state.localStream) {
      state.localStream.getTracks().forEach(track => track.stop());
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    // **Reset all refs**
    iceCandidateBufferRef.current = [];
    remoteDescriptionSetRef.current = false;
    isCallerRef.current = false;

    setState({
      localStream: null,
      remoteStream: null,
      isCallActive: false,
      isVideoEnabled: false,
      isAudioEnabled: false,
      callType: 'audio',
      error: null,
      deviceStatus: {
        hasAudio: false,
        hasVideo: false,
        permissionGranted: false,
      },
      isNoDeviceMode: false,
      canProceedWithoutDevices: true,
    });

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
  }, [state.localStream]);

  const setupIceCandidateHandling = useCallback((onIceCandidate: (candidate: IceCandidate) => void, callId: string, fromUserId: string, toUserId: string) => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.onicecandidate = (event) => {
        if (event.candidate) {
          console.log('🧊 ICE candidate generated:', {
            candidate: event.candidate.candidate.substring(0, 50) + '...',
            sdpMid: event.candidate.sdpMid,
            sdpMLineIndex: event.candidate.sdpMLineIndex
          });
          
          onIceCandidate({
            candidate: event.candidate.candidate,
            sdpMid: event.candidate.sdpMid || '',
            sdpMLineIndex: event.candidate.sdpMLineIndex || 0,
            callId,
            fromUserId,
            toUserId,
          });
        }
      };
    }
  }, []);

  return {
    state,
    localVideoRef,
    remoteVideoRef,
    createOffer,
    createAnswer,
    handleAnswer,
    handleIceCandidate,
    toggleVideo,
    toggleAudio,
    endCall,
    setupIceCandidateHandling,
    checkMediaDevices,
    checkWebRTCSupport,
  };
}