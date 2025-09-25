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

  // Buffer ICE
  const iceCandidateBufferRef = useRef<IceCandidate[]>([]);
  const remoteDescriptionSetRef = useRef<boolean>(false);
  const isCallerRef = useRef<boolean>(false);

  // ICE servers
  const iceServers = useMemo(() => ({
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
    ],
  }), []);

  // Track fallback
  const createSilentAudioTrack = useCallback(() => {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const dst = ctx.createMediaStreamDestination();
    oscillator.connect(dst);
    oscillator.start();
    return dst.stream.getAudioTracks()[0];
  }, []);

  const createBlackVideoTrack = useCallback(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('No Camera', canvas.width / 2, canvas.height / 2);
    return canvas.captureStream(15).getVideoTracks()[0];
  }, []);

  const checkWebRTCSupport = useCallback(() => {
    const isLocal = ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname);
    if (!isLocal && window.location.protocol !== 'https:') {
      setState(p => ({ ...p, error: 'WebRTC yêu cầu HTTPS' }));
      return false;
    }
    if (!(navigator.mediaDevices && window.RTCPeerConnection)) {
      setState(p => ({ ...p, error: 'WebRTC không được hỗ trợ' }));
      return false;
    }
    return true;
  }, []);

  const checkMediaDevices = useCallback(async () => {
    try {
      if (!checkWebRTCSupport()) return { hasAudio: false, hasVideo: false };
      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasAudio = devices.some(d => d.kind === 'audioinput');
      const hasVideo = devices.some(d => d.kind === 'videoinput');
      setState(p => ({
        ...p,
        deviceStatus: {
          hasAudio,
          hasVideo,
          permissionGranted: devices.some(d => d.label !== ''),
        },
        isNoDeviceMode: !hasAudio && !hasVideo,
      }));
      return { hasAudio, hasVideo };
    } catch (e) {
      console.warn('Lỗi checkMediaDevices', e);
      setState(p => ({ ...p, isNoDeviceMode: true }));
      return { hasAudio: false, hasVideo: false };
    }
  }, [checkWebRTCSupport]);

  const initializePeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection(iceServers);
    peerConnectionRef.current = pc;

    pc.ontrack = (e) => {
      const [remoteStream] = e.streams;
      if (remoteStream) {
        setState(p => ({ ...p, remoteStream }));
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
          remoteVideoRef.current.play().catch(() => {});
        }
      }
    };
    return pc;
  }, [iceServers]);

  const startMediaStream = useCallback(async (callType: 'audio' | 'video') => {
    const { hasAudio, hasVideo } = await checkMediaDevices();
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: hasAudio,
        video: callType === 'video' && hasVideo,
      });
    } catch {
      stream = new MediaStream();
    }
    if (stream.getAudioTracks().length === 0 && (callType === 'audio' || callType === 'video')) {
      stream.addTrack(createSilentAudioTrack());
    }
    if (stream.getVideoTracks().length === 0 && callType === 'video') {
      stream.addTrack(createBlackVideoTrack());
    }
    setState(p => ({
      ...p,
      localStream: stream,
      callType,
      isAudioEnabled: stream.getAudioTracks().length > 0,
      isVideoEnabled: stream.getVideoTracks().length > 0,
    }));
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
      localVideoRef.current.muted = true;
      localVideoRef.current.play().catch(() => {});
    }
    return stream;
  }, [checkMediaDevices, createSilentAudioTrack, createBlackVideoTrack]);

  const createOffer = useCallback(async (callType: 'audio' | 'video', conversationId: string): Promise<CallOffer | null> => {
    const pc = initializePeerConnection();
    const stream = await startMediaStream(callType);
    isCallerRef.current = true;
    remoteDescriptionSetRef.current = false;
    iceCandidateBufferRef.current = [];
    stream.getTracks().forEach(t => pc.addTrack(t, stream));
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    setState(p => ({ ...p, isCallActive: true }));
    return {
      conversationId,
      sdp: offer.sdp || '',
      type: 'offer',
      callType,
      callId: '',
    } as CallOffer;
  }, [initializePeerConnection, startMediaStream]);

  const createAnswer = useCallback(async (offer: CallOffer): Promise<CallAnswer | null> => {
    const pc = initializePeerConnection();
    const stream = await startMediaStream(offer.callType);
    isCallerRef.current = false;
    remoteDescriptionSetRef.current = false;
    iceCandidateBufferRef.current = [];
    stream.getTracks().forEach(t => pc.addTrack(t, stream));
    await pc.setRemoteDescription({ type: 'offer', sdp: offer.sdp });
    remoteDescriptionSetRef.current = true;
    for (const c of iceCandidateBufferRef.current) {
      await pc.addIceCandidate({ candidate: c.candidate, sdpMid: c.sdpMid, sdpMLineIndex: c.sdpMLineIndex });
    }
    iceCandidateBufferRef.current = [];
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    setState(p => ({ ...p, isCallActive: true }));
    return {
      conversationId: offer.conversationId,
      sdp: answer.sdp || '',
      type: 'answer',
      callId: offer.callId,
    };
  }, [initializePeerConnection, startMediaStream]);

  const handleAnswer = useCallback(async (answer: CallAnswer) => {
    if (peerConnectionRef.current) {
      await peerConnectionRef.current.setRemoteDescription({ type: 'answer', sdp: answer.sdp });
      remoteDescriptionSetRef.current = true;
      for (const c of iceCandidateBufferRef.current) {
        await peerConnectionRef.current.addIceCandidate({
          candidate: c.candidate,
          sdpMid: c.sdpMid,
          sdpMLineIndex: c.sdpMLineIndex,
        });
      }
      iceCandidateBufferRef.current = [];
    }
  }, []);

  const handleIceCandidate = useCallback(async (candidate: IceCandidate) => {
    if (!peerConnectionRef.current) return;
    if (!remoteDescriptionSetRef.current) {
      iceCandidateBufferRef.current.push(candidate);
      return;
    }
    await peerConnectionRef.current.addIceCandidate({
      candidate: candidate.candidate,
      sdpMid: candidate.sdpMid,
      sdpMLineIndex: candidate.sdpMLineIndex,
    });
  }, []);

  const toggleVideo = useCallback(() => {
    const track = state.localStream?.getVideoTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setState(p => ({ ...p, isVideoEnabled: track.enabled }));
    }
  }, [state.localStream]);

  const toggleAudio = useCallback(() => {
    const track = state.localStream?.getAudioTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setState(p => ({ ...p, isAudioEnabled: track.enabled }));
    }
  }, [state.localStream]);

  const endCall = useCallback(() => {
    state.localStream?.getTracks().forEach(t => t.stop());
    peerConnectionRef.current?.close();
    peerConnectionRef.current = null;
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
      deviceStatus: { hasAudio: false, hasVideo: false, permissionGranted: false },
      isNoDeviceMode: false,
      canProceedWithoutDevices: true,
    });
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
  }, [state.localStream]);

  const setupIceCandidateHandling = useCallback(
    (onIceCandidate: (c: IceCandidate) => void, callId: string, fromUserId: string, conversationId: string) => {
      if (peerConnectionRef.current) {
        peerConnectionRef.current.onicecandidate = (e) => {
          if (e.candidate) {
            onIceCandidate({
              conversationId,
              candidate: e.candidate.candidate,
              sdpMid: e.candidate.sdpMid || '',
              sdpMLineIndex: e.candidate.sdpMLineIndex || 0,
              callId,
            });
          }
        };
      }
    }, []
  );

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
