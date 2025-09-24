import { useState, useRef, useCallback, useEffect } from 'react';
import { useWebRTC } from './useWebRTC';
import { useSocket, CallOffer, CallAnswer, IceCandidate, CallEvent } from './useSocket';

export function useCall(currentUserId: string) {
  // Quản lý state
  const [incomingCall, setIncomingCall] = useState<CallOffer | null>(null);
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [currentCallId, setCurrentCallId] = useState<string>('');
  const [participantName, setParticipantName] = useState<string>('');

  // Hook WebRTC
  const webRTC = useWebRTC();

  // Refs để truy cập state trong callbacks
  const stateRef = useRef({
    currentCallId,
    webRTC,
  });

  // Cập nhật refs khi state thay đổi
  useEffect(() => {
    stateRef.current = {
      currentCallId,
      webRTC,
    };
  }, [currentCallId, webRTC]);

  /**
   * Tạo ID cuộc gọi duy nhất
   */
  const generateCallId = useCallback(() => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `call_${timestamp}_${random}`;
  }, []);

  /**
   * Lấy thông tin người dùng hiện tại cho người gọi
   */
  const getCurrentUserInfo = useCallback(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        return {
          username: user.username || user.name || 'Không xác định',
          firstName: user.firstName || user.first_name || '',
          lastName: user.lastName || user.last_name || '',
          avatar: user.avatar || user.profilePicture || '',
          displayName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || 'Người dùng không xác định',
        };
      }
    } catch (error) {
      console.error('Lỗi khi lấy thông tin người dùng:', error);
    }
    
    return {
      username: 'Không xác định',
      firstName: '',
      lastName: '',
      avatar: '',
      displayName: 'Người dùng không xác định',
    };
  }, []);

  /**
   * Kết thúc cuộc gọi nội bộ
   */
  const endCallInternal = useCallback(() => {
    console.log('📞 Kết thúc cuộc gọi:', currentCallId);
    
    const socket = socketRef.current;
    if (socket?.connected && currentCallId) {
      socket.emit('call-event', {
        callId: currentCallId,
        callerId: currentUserId,
        calleeId: '',
        event: 'end',
        reason: 'Cuộc gọi bị kết thúc bởi người dùng',
      });
    }

    webRTC.endCall();
    setIsCallModalOpen(false);
    setIncomingCall(null);
    setCurrentCallId('');
    setParticipantName('');
  }, [currentCallId, currentUserId, webRTC]);

  // Socket instance riêng cho các cuộc gọi
  const socketRef = useSocket(
    undefined, // không có message handler
    useCallback((callOffer: CallOffer) => {
      console.log('📞 Nhận cuộc gọi đến:', callOffer);
      
      // Xác thực cuộc gọi đến
      if (!callOffer.callerId || !callOffer.calleeId || callOffer.calleeId !== currentUserId) {
        console.warn('❌ Cuộc gọi đến không hợp lệ:', callOffer);
        return;
      }
      
      setIncomingCall(callOffer);
    }, [currentUserId]),
    
    // Xử lý call-answered đúng cách
    useCallback((callAnswer: CallAnswer) => {
      console.log('📞 Nhận phản hồi cuộc gọi:', callAnswer);
      
      const { currentCallId, webRTC } = stateRef.current;
      if (callAnswer.callId === currentCallId) {
        console.log('✅ Xử lý phản hồi cuộc gọi cho cuộc gọi hiện tại');
        webRTC.handleAnswer(callAnswer);
      } else {
        console.warn('⚠️ Phản hồi cuộc gọi cho ID khác:', {
          received: callAnswer.callId,
          current: currentCallId
        });
      }
    }, []),
    
    // Buffer ICE candidates cho đến khi remote description được thiết lập
    useCallback((iceCandidate: IceCandidate) => {
      console.log('🧊 ICE candidate cho cuộc gọi:', iceCandidate);
      
      const { currentCallId, webRTC } = stateRef.current;
      if (iceCandidate.callId === currentCallId) {
        // **ĐÃ XÓA: setTimeout delay**
        webRTC.handleIceCandidate(iceCandidate);
      }
    }, []),
    
    useCallback((callEvent: CallEvent) => {
      console.log('📞 Nhận trạng thái cuộc gọi:', callEvent);
      
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
      console.log('📞 Nhận thông báo kết thúc cuộc gọi:', callEvent);
      
      const { currentCallId } = stateRef.current;
      if (callEvent.callId === currentCallId) {
        endCallInternal();
      }
    }, [endCallInternal])
  );

  /**
   * Bắt đầu cuộc gọi
   */
  const startCall = useCallback(async (
    targetUserId: string,
    callType: 'audio' | 'video',
    participantName?: string
  ) => {
    console.log('🚀 Bắt đầu cuộc gọi:', { 
      currentUserId, 
      targetUserId, 
      callType, 
      participantName 
    });

    try {
      // Kiểm tra kết nối socket
      const socket = socketRef.current;
      if (!socket?.connected) {
        console.error('❌ Socket không kết nối');
        alert('Kết nối mạng không ổn định. Vui lòng thử lại.');
        return;
      }

      console.log('🔌 Trạng thái socket:', {
        connected: socket.connected,
        id: socket.id,
        auth: socket.auth,
      });

      if (currentUserId === 'default-user-id') {
        console.error('❌ ID người dùng hiện tại không hợp lệ');
        alert('Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.');
        return;
      }

      // Xác thực đầu vào
      if (!targetUserId || targetUserId === currentUserId) {
        console.error('❌ ID người dùng đích không hợp lệ');
        alert('Không thể gọi cho chính mình');
        return;
      }

      const offer = await webRTC.createOffer(callType);
      if (!offer) {
        console.error('❌ Không thể tạo offer');
        alert('Không thể tạo cuộc gọi. Vui lòng kiểm tra camera/microphone.');
        return;
      }

      const callId = generateCallId();
      setCurrentCallId(callId);

      // Lấy thông tin người dùng hiện tại cho thông tin người gọi
      const currentUserInfo = getCurrentUserInfo();

      const callData: CallOffer = {
        ...offer,
        callerId: currentUserId,
        calleeId: targetUserId,
        callId: callId,
        callerInfo: currentUserInfo,
      };

      console.log('📤 Gửi offer cuộc gọi với thông tin người gọi:', callData);

      // Thiết lập answer handler trước khi gửi offer
      let answerReceived = false;
      const answerHandler = (answer: any) => {
        console.log('✅ Nhận sự kiện phản hồi cuộc gọi:', answer);
        answerReceived = true;
      };
      
      socket.once('call-answered', answerHandler);

      // Thiết lập xử lý ICE candidate
      webRTC.setupIceCandidateHandling(
        (candidate) => {
          console.log('📤 Gửi ICE candidate:', candidate);
          if (socket.connected) {
            socket.emit('ice-candidate', candidate);
          }
        },
        callId,
        currentUserId,
        targetUserId
      );

      // Gửi offer
      socket.emit('call-offer', callData);
      console.log('✅ Gửi offer cuộc gọi thành công');

      // Tăng timeout và kiểm tra phản hồi
      const timeoutId = setTimeout(() => {
        if (!answerReceived && !webRTC.state.isCallActive) {
          console.warn('⏰ Hết thời gian cuộc gọi - không có phản hồi sau 60s');
          alert('Không có phản hồi từ người nhận. Có thể họ không online.');
          socket.off('call-answered', answerHandler);
          endCallInternal();
        }
      }, 60000); // Tăng lên 60 giây

      // Xóa timeout khi cuộc gọi được trả lời
      socket.once('call-answered', () => {
        clearTimeout(timeoutId);
      });

      setParticipantName(participantName || targetUserId);
      setIsCallModalOpen(true);

    } catch (error) {
      console.error('❌ Lỗi khi bắt đầu cuộc gọi:', error);
      const errorMessage = error instanceof Error ? error.message : 'Lỗi không xác định';
      alert('Không thể bắt đầu cuộc gọi: ' + errorMessage);
    }
  }, [currentUserId, webRTC, socketRef, generateCallId, endCallInternal, getCurrentUserInfo]);

  /**
   * Chấp nhận cuộc gọi đến
   */
  const acceptCall = useCallback(async () => {
    if (!incomingCall) return;

    try {
      const answer = await webRTC.createAnswer(incomingCall);
      if (!answer) {
        console.error('❌ Không thể tạo answer');
        return;
      }

      const socket = socketRef.current;
      if (socket?.connected) {
        socket.emit('call-answer', answer);
        
        // Thiết lập xử lý ICE candidate cho người nhận
        webRTC.setupIceCandidateHandling(
          (candidate) => {
            console.log('📤 Gửi ICE candidate (callee):', candidate);
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
      setParticipantName(incomingCall.callerInfo?.displayName || 'Người gọi không xác định');
      setIsCallModalOpen(true);
      setIncomingCall(null);
      
    } catch (error) {
      console.error('❌ Lỗi khi chấp nhận cuộc gọi:', error);
      rejectCall();
    }
  }, [incomingCall, webRTC, socketRef, currentUserId]);

  /**
   * Từ chối cuộc gọi đến
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
        reason: 'Cuộc gọi bị từ chối bởi người dùng',
      });
    }

    setIncomingCall(null);
  }, [incomingCall, socketRef, currentUserId]);

  /**
   * Kết thúc cuộc gọi hiện tại
   */
  const endCall = useCallback(() => {
    endCallInternal();
  }, [endCallInternal]);

  // **ĐÃ SỬA: Debug localStorage đúng cách**
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('=== Debug localStorage ===');
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key || '');
        console.log(`${key}:`, value);
      }
    }
  }, []);

  // Thoát sớm nếu không có ID người dùng hợp lệ
  if (!currentUserId || currentUserId === 'default-user-id') {
    console.warn('⚠️ useCall bị vô hiệu hóa: ID người dùng không hợp lệ');
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