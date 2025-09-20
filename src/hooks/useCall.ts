import { useState, useRef, useCallback, useEffect } from 'react';
import { useWebRTC } from './useWebRTC';
import { useSocket, CallOffer, CallAnswer, IceCandidate, CallEvent } from './useSocket';

export function useCall(currentUserId: string) {
  // State management
  const [incomingCall, setIncomingCall] = useState<CallOffer | null>(null);
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [currentCallId, setCurrentCallId] = useState<string>('');
  const [participantName, setParticipantName] = useState<string>('');

  // WebRTC hook
  const webRTC = useWebRTC();

  // Refs for state access in callbacks
  const stateRef = useRef({
    currentCallId,
    webRTC,
  });

  // Update refs when state changes
  useEffect(() => {
    stateRef.current = {
      currentCallId,
      webRTC,
    };
  }, [currentCallId, webRTC]);

  /**
   * Generate unique call ID
   */
  const generateCallId = useCallback(() => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `call_${timestamp}_${random}`;
  }, []);

  /**
   * Get current user info for caller
   */
  const getCurrentUserInfo = useCallback(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        return {
          username: user.username || user.name || 'Unknown',
          firstName: user.firstName || user.first_name || '',
          lastName: user.lastName || user.last_name || '',
          avatar: user.avatar || user.profilePicture || '',
          displayName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || 'Unknown User',
        };
      }
    } catch (error) {
      console.error('Error getting user info:', error);
    }
    
    return {
      username: 'Unknown',
      firstName: '',
      lastName: '',
      avatar: '',
      displayName: 'Unknown User',
    };
  }, []);

  /**
   * End call internally
   */
  const endCallInternal = useCallback(() => {
    console.log('📞 Ending call:', currentCallId);
    
    const socket = socketRef.current;
    if (socket?.connected && currentCallId) {
      socket.emit('call-event', {
        callId: currentCallId,
        callerId: currentUserId,
        calleeId: '',
        event: 'end',
        reason: 'Call ended by user',
      });
    }

    webRTC.endCall();
    setIsCallModalOpen(false);
    setIncomingCall(null);
    setCurrentCallId('');
    setParticipantName('');
  }, [currentCallId, currentUserId, webRTC]);

  // Separate socket instance for calls
  const socketRef = useSocket(
    undefined, // no message handler
    useCallback((callOffer: CallOffer) => {
      console.log('📞 Incoming call received:', callOffer);
      
      // Validate incoming call
      if (!callOffer.callerId || !callOffer.calleeId || callOffer.calleeId !== currentUserId) {
        console.warn('❌ Invalid incoming call:', callOffer);
        return;
      }
      
      setIncomingCall(callOffer);
    }, [currentUserId]),
    
    // Handle call-answered properly
    useCallback((callAnswer: CallAnswer) => {
      console.log('📞 Call answered received:', callAnswer);
      
      const { currentCallId, webRTC } = stateRef.current;
      if (callAnswer.callId === currentCallId) {
        console.log('✅ Processing call answer for current call');
        webRTC.handleAnswer(callAnswer);
      } else {
        console.warn('⚠️ Call answer for different call ID:', {
          received: callAnswer.callId,
          current: currentCallId
        });
      }
    }, []),
    
    // Buffer ICE candidates until remote description is set
    useCallback((iceCandidate: IceCandidate) => {
      console.log('🧊 ICE candidate for call:', iceCandidate);
      
      const { currentCallId, webRTC } = stateRef.current;
      if (iceCandidate.callId === currentCallId) {
        // **REMOVE: setTimeout delay**
        webRTC.handleIceCandidate(iceCandidate);
      }
    }, []),
    
    useCallback((callEvent: CallEvent) => {
      console.log('📞 Call status received:', callEvent);
      
      const { currentCallId } = stateRef.current;
      if (callEvent.callId === currentCallId) {
        switch (callEvent.event) {
          case 'reject':
            alert('Cuộc gọi bị từ chối');
            endCallInternal();
            break;
          case 'busy':
            alert('Người dùng đang bận');
            endCallInternal();
            break;
          case 'offline':
            alert('Người dùng không trực tuyến');
            endCallInternal();
            break;
          case 'end':
            endCallInternal();
            break;
        }
      }
    }, [endCallInternal]),
    
    useCallback((callEvent: CallEvent) => {
      console.log('📞 Call ended received:', callEvent);
      
      const { currentCallId } = stateRef.current;
      if (callEvent.callId === currentCallId) {
        endCallInternal();
      }
    }, [endCallInternal])
  );

  /**
   * Start a call
   */
  const startCall = useCallback(async (
    targetUserId: string,
    callType: 'audio' | 'video',
    participantName?: string
  ) => {
    console.log('🚀 Starting call:', { 
      currentUserId, 
      targetUserId, 
      callType, 
      participantName 
    });

    try {
      // Check socket connection
      const socket = socketRef.current;
      if (!socket?.connected) {
        console.error('❌ Socket not connected');
        alert('Kết nối mạng không ổn định. Vui lòng thử lại.');
        return;
      }

      console.log('🔌 Socket status:', {
        connected: socket.connected,
        id: socket.id,
        auth: socket.auth,
      });

      if (currentUserId === 'default-user-id') {
        console.error('❌ Invalid current user ID');
        alert('Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.');
        return;
      }

      // Validate inputs
      if (!targetUserId || targetUserId === currentUserId) {
        console.error('❌ Invalid target user ID');
        alert('Không thể gọi cho chính mình');
        return;
      }

      const offer = await webRTC.createOffer(callType);
      if (!offer) {
        console.error('❌ Failed to create offer');
        alert('Không thể tạo cuộc gọi. Vui lòng kiểm tra camera/microphone.');
        return;
      }

      const callId = generateCallId();
      setCurrentCallId(callId);

      // Get current user info for caller info
      const currentUserInfo = getCurrentUserInfo();

      const callData: CallOffer = {
        ...offer,
        callerId: currentUserId,
        calleeId: targetUserId,
        callId: callId,
        callerInfo: currentUserInfo,
      };

      console.log('📤 Sending call offer with caller info:', callData);

      // Setup answer handler before sending offer
      let answerReceived = false;
      const answerHandler = (answer: any) => {
        console.log('✅ Call answer event received:', answer);
        answerReceived = true;
      };
      
      socket.once('call-answered', answerHandler);

      // Setup ICE candidate handling
      webRTC.setupIceCandidateHandling(
        (candidate) => {
          console.log('📤 Sending ICE candidate:', candidate);
          if (socket.connected) {
            socket.emit('ice-candidate', candidate);
          }
        },
        callId,
        currentUserId,
        targetUserId
      );

      // Send offer
      socket.emit('call-offer', callData);
      console.log('✅ Call offer sent successfully');

      // Increase timeout and check for answer
      const timeoutId = setTimeout(() => {
        if (!answerReceived && !webRTC.state.isCallActive) {
          console.warn('⏰ Call timeout - no response after 60s');
          alert('Không có phản hồi từ người nhận. Có thể họ không online.');
          socket.off('call-answered', answerHandler);
          endCallInternal();
        }
      }, 60000); // Increase to 60 seconds

      // Clear timeout when call is answered
      socket.once('call-answered', () => {
        clearTimeout(timeoutId);
      });

      setParticipantName(participantName || targetUserId);
      setIsCallModalOpen(true);

    } catch (error) {
      console.error('❌ Error starting call:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert('Không thể bắt đầu cuộc gọi: ' + errorMessage);
    }
  }, [currentUserId, webRTC, socketRef, generateCallId, endCallInternal, getCurrentUserInfo]);

  /**
   * Accept incoming call
   */
  const acceptCall = useCallback(async () => {
    if (!incomingCall) return;

    try {
      const answer = await webRTC.createAnswer(incomingCall);
      if (!answer) {
        console.error('❌ Failed to create answer');
        return;
      }

      const socket = socketRef.current;
      if (socket?.connected) {
        socket.emit('call-answer', answer);
        
        // Setup ICE candidate handling for callee
        webRTC.setupIceCandidateHandling(
          (candidate) => {
            console.log('📤 Sending ICE candidate (callee):', candidate);
            if (socket.connected) {
              socket.emit('ice-candidate', candidate);
            }
          },
          incomingCall.callId,
          currentUserId,
          incomingCall.callerId
        );
      }

      setCurrentCallId(incomingCall.callId);
      setParticipantName(incomingCall.callerInfo?.displayName || 'Unknown Caller');
      setIsCallModalOpen(true);
      setIncomingCall(null);
      
    } catch (error) {
      console.error('❌ Error accepting call:', error);
      rejectCall();
    }
  }, [incomingCall, webRTC, socketRef, currentUserId]);

  /**
   * Reject incoming call
   */
  const rejectCall = useCallback(() => {
    if (!incomingCall) return;

    const socket = socketRef.current;
    if (socket?.connected) {
      socket.emit('call-event', {
        callId: incomingCall.callId,
        callerId: incomingCall.callerId,
        calleeId: currentUserId,
        event: 'reject',
        reason: 'Call rejected by user',
      });
    }

    setIncomingCall(null);
  }, [incomingCall, socketRef, currentUserId]);

  /**
   * End current call
   */
  const endCall = useCallback(() => {
    endCallInternal();
  }, [endCallInternal]);

  // **FIXED: Debug localStorage properly**
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('=== localStorage Debug ===');
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key || '');
        console.log(`${key}:`, value);
      }
    }
  }, []);

  // Early return if no valid user ID
  if (!currentUserId || currentUserId === 'default-user-id') {
    console.warn('⚠️ useCall disabled: Invalid user ID');
    return {
      webRTC: { state: {} } as any,
      incomingCall: null,
      isCallModalOpen: false,
      participantName: '',
      startCall: () => {
        alert('Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.');
      },
      acceptCall: () => {},
      rejectCall: () => {},
      endCall: () => {},
      currentCallId: '',
    };
  }

  return {
    webRTC,
    incomingCall,
    isCallModalOpen,
    participantName,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    currentCallId,
  };
}