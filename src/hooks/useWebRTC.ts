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
  
  // THÊM: Bộ đệm ICE candidate
  const iceCandidateBufferRef = useRef<IceCandidate[]>([]);
  const remoteDescriptionSetRef = useRef<boolean>(false);
  const isCallerRef = useRef<boolean>(false);

  // Cấu hình máy chủ ICE
  const iceServers = useMemo(() => ({
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
    ],
  }), []);

  /**
   * Tạo track âm thanh im lặng cho cuộc gọi không có microphone
   */
  const createSilentAudioTrack = useCallback(() => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    gainNode.gain.value = 0; // Im lặng
    oscillator.frequency.value = 440;
    oscillator.start();
    
    // Tạo MediaStream từ audio context
    const destination = audioContext.createMediaStreamDestination();
    gainNode.connect(destination);
    
    return destination.stream.getAudioTracks()[0];
  }, []);

  /**
   * Tạo track video đen cho cuộc gọi không có camera
   */
  const createBlackVideoTrack = useCallback(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Thêm text overlay
    ctx.fillStyle = 'white';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Không có Camera', canvas.width / 2, canvas.height / 2);
    
    const stream = canvas.captureStream(15); // 15fps
    return stream.getVideoTracks()[0];
  }, []);

  /**
   * Kiểm tra hỗ trợ WebRTC
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

      // Thử lấy danh sách thiết bị trước
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioDevices = devices.filter(device => device.kind === 'audioinput');
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        
        const hasAudio = audioDevices.length > 0;
        const hasVideo = videoDevices.length > 0;
        
        console.log('🎧 Thiết bị có sẵn:', {
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
        console.warn('Không thể liệt kê thiết bị:', enumerateError);
        
        // Fallback: thử lấy media để kiểm tra tính khả dụng
        try {
          const tempStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
          tempStream.getTracks().forEach(track => track.stop());
          return { hasAudio: true, hasVideo: true };
        } catch (mediaError) {
          console.warn('Không có thiết bị media nào khả dụng:', mediaError);
          setState(prev => ({
            ...prev,
            deviceStatus: { hasAudio: false, hasVideo: false, permissionGranted: false },
            isNoDeviceMode: true,
          }));
          return { hasAudio: false, hasVideo: false };
        }
      }
    } catch (error) {
      console.error('Kiểm tra thiết bị thất bại:', error);
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

    // CẢI THIỆN: Xử lý track tốt hơn
    peerConnection.ontrack = (event) => {
      console.log('🎥 Nhận track từ xa:', {
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
          // BẮT BUỘC play cho audio/video
          remoteVideoRef.current.play().catch(e => console.warn('Phát video từ xa thất bại:', e));
        }
      }
    };

    // THÊM: Theo dõi trạng thái kết nối
    peerConnection.onconnectionstatechange = () => {
      console.log('🔗 Trạng thái kết nối:', peerConnection.connectionState);
    };

    peerConnection.oniceconnectionstatechange = () => {
      console.log('🧊 Trạng thái kết nối ICE:', peerConnection.iceConnectionState);
    };

    return peerConnection;
  }, [iceServers]);

  /**
   * CẢI THIỆN: Media stream với ràng buộc tốt hơn
   */
  const startMediaStream = useCallback(async (callType: 'audio' | 'video') => {
    try {
      if (!checkWebRTCSupport()) {
        throw new Error('WebRTC không được hỗ trợ trong trình duyệt này.');
      }

      setState(prev => ({ ...prev, error: null }));
      const { hasAudio, hasVideo } = await checkMediaDevices();
      
      console.log('🎯 Tình trạng thiết bị:', { hasAudio, hasVideo, callType });

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
          console.log('✅ Lấy stream media thật thành công:', {
            audioTracks: stream.getAudioTracks().length,
            videoTracks: stream.getVideoTracks().length,
            tracks: stream.getTracks().map(t => ({
              kind: t.kind,
              enabled: t.enabled,
              readyState: t.readyState
            }))
          });
          
        } catch (realMediaError) {
          console.warn('Media thật thất bại, tạo stream tổng hợp:', realMediaError);
          stream = new MediaStream();
        }
      } else {
        console.log('Không có thiết bị nào khả dụng, tạo stream tổng hợp');
        stream = new MediaStream();
      }

      // Thêm track tổng hợp nếu cần
      const audioTracks = stream.getAudioTracks();
      const videoTracks = stream.getVideoTracks();

      if (audioTracks.length === 0 && (callType === 'audio' || callType === 'video')) {
        console.log('Thêm track âm thanh tổng hợp');
        try {
          const silentTrack = createSilentAudioTrack();
          stream.addTrack(silentTrack);
        } catch (audioError) {
          console.warn('Tạo track âm thanh im lặng thất bại:', audioError);
        }
      }

      if (videoTracks.length === 0 && callType === 'video') {
        console.log('Thêm track video tổng hợp');
        try {
          const blackTrack = createBlackVideoTrack();
          stream.addTrack(blackTrack);
        } catch (videoError) {
          console.warn('Tạo track video đen thất bại:', videoError);
        }
      }

      const finalAudioTracks = stream.getAudioTracks();
      const finalVideoTracks = stream.getVideoTracks();
      
      console.log('🎬 Track stream cuối cùng:', {
        audioTracks: finalAudioTracks.length,
        videoTracks: finalVideoTracks.length,
        isNoDeviceMode: !hasAudio && !hasVideo,
        // THÊM: Thông tin track chi tiết hơn
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
        localVideoRef.current.muted = true; // Tránh echo
        localVideoRef.current.play().catch(e => console.warn('Phát video local thất bại:', e));
      }

      return stream;

    } catch (error) {
      console.error('Lỗi trong startMediaStream:', error);
      
      try {
        console.log('Tạo stream tổng hợp khẩn cấp');
        const emergencyStream = new MediaStream();
        
        try {
          const silentTrack = createSilentAudioTrack();
          emergencyStream.addTrack(silentTrack);
        } catch (e) {
          console.warn('Thêm track im lặng vào stream khẩn cấp thất bại:', e);
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
        console.error('Tạo stream khẩn cấp thất bại:', emergencyError);
        const errorMessage = 'Không thể khởi tạo cuộc gọi. Vui lòng thử lại.';
        setState(prev => ({ ...prev, error: errorMessage }));
        throw new Error(errorMessage);
      }
    }
  }, [checkMediaDevices, createSilentAudioTrack, createBlackVideoTrack, checkWebRTCSupport]);

  /**
   * SỬA: Tạo offer cho cuộc gọi video
   */
  const createOffer = useCallback(async (callType: 'audio' | 'video'): Promise<CallOffer | null> => {
    try {
      console.log('📞 Tạo offer cho:', callType);
      
      const peerConnection = initializePeerConnection();
      const stream = await startMediaStream(callType);

      // Đánh dấu là người gọi
      isCallerRef.current = true;
      remoteDescriptionSetRef.current = false;
      iceCandidateBufferRef.current = [];

      // Thêm track đúng cách
      stream.getTracks().forEach(track => {
        console.log('➕ Thêm track vào peer connection:', {
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
      console.log('✅ Tạo offer và đặt local description thành công');

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
      console.error('❌ Lỗi tạo offer:', error);
      return null;
    }
  }, [initializePeerConnection, startMediaStream]);

  /**
   * SỬA: Tạo answer với thiết lập đúng
   */
  const createAnswer = useCallback(async (offer: CallOffer): Promise<CallAnswer | null> => {
    try {
      console.log('📞 Tạo answer cho offer:', offer.callType);
      
      const peerConnection = initializePeerConnection();
      const stream = await startMediaStream(offer.callType);

      // Đánh dấu là người nhận
      isCallerRef.current = false;
      remoteDescriptionSetRef.current = false;
      iceCandidateBufferRef.current = [];

      // Thêm track trước
      stream.getTracks().forEach(track => {
        console.log('➕ Thêm track vào peer connection (callee):', {
          kind: track.kind,
          enabled: track.enabled,
          readyState: track.readyState
        });
        peerConnection.addTrack(track, stream);
      });

      // Đặt remote description
      await peerConnection.setRemoteDescription({
        type: 'offer',
        sdp: offer.sdp,
      });
      
      console.log('✅ Đặt remote description thành công (callee)');
      remoteDescriptionSetRef.current = true;

      // Xử lý ICE candidate đã buffer
      if (iceCandidateBufferRef.current.length > 0) {
        console.log(`🧊 Xử lý ${iceCandidateBufferRef.current.length} ICE candidate đã buffer`);
        for (const candidate of iceCandidateBufferRef.current) {
          try {
            await peerConnection.addIceCandidate({
              candidate: candidate.candidate,
              sdpMid: candidate.sdpMid,
              sdpMLineIndex: candidate.sdpMLineIndex,
            });
          } catch (iceError) {
            console.warn('Thêm ICE candidate đã buffer thất bại:', iceError);
          }
        }
        iceCandidateBufferRef.current = [];
      }

      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      console.log('✅ Tạo answer và đặt local description thành công');

      setState(prev => ({ ...prev, isCallActive: true }));

      return {
        callerId: offer.callerId,
        calleeId: offer.calleeId,
        sdp: answer.sdp || '',
        type: 'answer',
        callId: offer.callId,
      };
    } catch (error) {
      console.error('❌ Lỗi tạo answer:', error);
      return null;
    }
  }, [initializePeerConnection, startMediaStream]);

  /**
   * SỬA: Xử lý answer với việc xử lý ICE candidate
   */
  const handleAnswer = useCallback(async (answer: CallAnswer) => {
    try {
      console.log('📞 Xử lý answer:', answer);
      
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription({
          type: 'answer',
          sdp: answer.sdp,
        });
        
        console.log('✅ Đặt remote description thành công (caller)');
        remoteDescriptionSetRef.current = true;
        
        // Xử lý ICE candidate đã buffer
        if (iceCandidateBufferRef.current.length > 0) {
          console.log(`🧊 Xử lý ${iceCandidateBufferRef.current.length} ICE candidate đã buffer`);
          
          for (const candidate of iceCandidateBufferRef.current) {
            try {
              await peerConnectionRef.current.addIceCandidate({
                candidate: candidate.candidate,
                sdpMid: candidate.sdpMid,
                sdpMLineIndex: candidate.sdpMLineIndex,
              });
              console.log('✅ Thêm ICE candidate đã buffer thành công');
            } catch (iceError) {
              console.error('❌ Lỗi thêm ICE candidate đã buffer:', iceError);
            }
          }
          
          // Xóa buffer
          iceCandidateBufferRef.current = [];
        }
      }
    } catch (error) {
      console.error('❌ Lỗi xử lý answer:', error);
    }
  }, []);

  /**
   * SỬA: Xử lý ICE candidate với buffer
   */
  const handleIceCandidate = useCallback(async (candidate: IceCandidate) => {
    try {
      if (!peerConnectionRef.current) {
        console.warn('⚠️ Không có peer connection cho ICE candidate');
        return;
      }

      // Buffer ICE candidate nếu remote description chưa được đặt
      if (!remoteDescriptionSetRef.current) {
        console.log('🧊 Buffer ICE candidate (remote description chưa được đặt)');
        iceCandidateBufferRef.current.push(candidate);
        return;
      }

      // Thêm ICE candidate ngay lập tức nếu remote description đã được đặt
      await peerConnectionRef.current.addIceCandidate({
        candidate: candidate.candidate,
        sdpMid: candidate.sdpMid,
        sdpMLineIndex: candidate.sdpMLineIndex,
      });
      
      console.log('✅ Thêm ICE candidate thành công');
      
    } catch (error) {
      console.error('❌ Lỗi xử lý ICE candidate:', error);
    }
  }, []);

  /**
   * Bật/tắt video (chỉ hoạt động nếu thiết bị khả dụng)
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
   * Bật/tắt audio (chỉ hoạt động nếu thiết bị khả dụng)
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
   * SỬA: Kết thúc cuộc gọi với dọn dẹp đúng cách
   */
  const endCall = useCallback(() => {
    if (state.localStream) {
      state.localStream.getTracks().forEach(track => track.stop());
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    // Reset tất cả refs
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
          console.log('🧊 ICE candidate được tạo:', {
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