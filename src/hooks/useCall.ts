import { useState, useRef, useCallback, useEffect } from "react";
import { useWebRTC } from "./useWebRTC";
import {
  useSocket,
  CallOffer,
  CallAnswer,
  IceCandidate,
  CallEvent,
} from "./useSocket";

export function useCall(currentUserId: string) {
  console.log("🎯 useCall initialized with user ID:", currentUserId);

  // State chính
  const [incomingCall, setIncomingCall] = useState<CallOffer | null>(null);
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [currentCallId, setCurrentCallId] = useState("");
  const [conversationId, setConversationId] = useState("");
  const [participantName, setParticipantName] = useState("");

  // Hook WebRTC
  const webRTC = useWebRTC();

  // Ref giữ state mới nhất (dùng trong callback socket)
  const stateRef = useRef({
    currentCallId,
    conversationId,
    webRTC,
  });

  useEffect(() => {
    stateRef.current = {
      currentCallId,
      conversationId,
      webRTC,
    };
  }, [currentCallId, conversationId, webRTC]);

  // **CLEAN: Tạo callId duy nhất**
  const generateCallId = useCallback(() => {
    return `call_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }, []);

  // **CLEAN: Kết thúc cuộc gọi nội bộ - BỎ callerId**
  const endCallInternal = useCallback(() => {
    const { currentCallId, conversationId } = stateRef.current;
    console.log("📞 End call:", currentCallId);

    const socket = socketRef.current;
    if (socket?.connected && currentCallId && conversationId) {
      socket.emit("call-event", {
        callId: currentCallId,
        conversationId,
        // callerId: currentUserId, // **BỎ - backend tự set**
        event: "end",
        reason: "Người dùng kết thúc cuộc gọi",
      });
    }

    webRTC.endCall();
    setIsCallModalOpen(false);
    setIncomingCall(null);
    setCurrentCallId("");
    setConversationId("");
    setParticipantName("");
  }, [webRTC]); // **BỎ currentUserId dependency**

  // **CLEAN: Socket handlers**
  const socketRef = useSocket(
    undefined, // Chat message handler bỏ qua
    // Handle call-offer
    useCallback(
      (callOffer: CallOffer) => {
        console.log("📞 useCall: Nhận offer:", callOffer);
        console.log("📞 useCall: Current user ID:", currentUserId);
        console.log("📞 useCall: Caller ID:", callOffer.callerId);

        // **CLEAN: Simple validation**
        if (!callOffer.callerId || !callOffer.conversationId) {
          console.log("📞 useCall: Ignoring offer - missing required fields");
          return;
        }

        if (callOffer.callerId === currentUserId) {
          console.log("📞 useCall: Ignoring offer - self call");
          return;
        }

        console.log("📞 useCall: Setting incoming call...");
        setIncomingCall(callOffer);
      },
      [currentUserId]
    ),
    // Handle call-answer
    useCallback((callAnswer: CallAnswer) => {
      const { currentCallId, webRTC } = stateRef.current;
      if (callAnswer.callId === currentCallId) {
        webRTC.handleAnswer(callAnswer);
      }
    }, []),
    // Handle ice-candidate
    useCallback((iceCandidate: IceCandidate) => {
      const { currentCallId, webRTC } = stateRef.current;
      if (iceCandidate.callId === currentCallId) {
        webRTC.handleIceCandidate(iceCandidate);
      }
    }, []),
    // Handle call-event
    useCallback(
      (callEvent: CallEvent) => {
        const { currentCallId } = stateRef.current;
        if (callEvent.callId === currentCallId) {
          switch (callEvent.event) {
            case "reject":
              alert("Cuộc gọi bị từ chối");
              endCallInternal();
              break;
            case "busy":
              alert("Người dùng đang bận");
              endCallInternal();
              break;
            case "offline":
              alert("Người dùng không trực tuyến");
              endCallInternal();
              break;
            case "end":
              endCallInternal();
              break;
          }
        }
      },
      [endCallInternal]
    )
  );

  // **CLEAN: Bắt đầu cuộc gọi - chỉ cần conversationId**
  const startCall = useCallback(
    async (
      conversationId: string,
      callType: "audio" | "video",
      participantName?: string
    ) => {
      try {
        const socket = socketRef.current;
        if (!socket?.connected) {
          alert("Socket chưa kết nối");
          return;
        }

        const offer = await webRTC.createOffer(callType, conversationId);
        if (!offer) {
          alert("Không tạo được offer");
          return;
        }

        const callId = generateCallId();
        setCurrentCallId(callId);
        setConversationId(conversationId);

        // **CLEAN: Chỉ gửi minimal data**
        const callData: CallOffer = {
          ...offer,
          callId,
          callType,
          conversationId,
        };

        console.log("🔍 Sending call offer:", callData);
        socket.emit("call-offer", callData);

        // **CLEAN: ICE handling - bỏ fromUserId**
        webRTC.setupIceCandidateHandling(
          (candidate) => {
            if (socket.connected) {
              socket.emit("ice-candidate", {
                ...candidate,
                callId,
                conversationId,
              });
            }
          },
          callId,
          currentUserId,
          conversationId
        );

        setParticipantName(participantName || "Đang gọi...");
        setIsCallModalOpen(true);
      } catch (e) {
        console.error("❌ Start call error:", e);
      }
    },
    [webRTC, generateCallId]
  );

  // **CLEAN: Chấp nhận cuộc gọi - bỏ các userId fields**
  const acceptCall = useCallback(async () => {
    if (!incomingCall) return;
    
    try {
      const answer = await webRTC.createAnswer(incomingCall);
      const socket = socketRef.current;
      
      if (socket?.connected && answer) {
        // **CLEAN: Minimal answer data**
        const callAnswer: CallAnswer = {
          ...answer,
          callId: incomingCall.callId,
          conversationId: incomingCall.conversationId,
        };
        
        socket.emit("call-answer", callAnswer);

        // **CLEAN: ICE handling - bỏ fromUserId**
        webRTC.setupIceCandidateHandling(
          (candidate) => {
            if (socket.connected) {
              socket.emit("ice-candidate", {
                ...candidate,
                callId: incomingCall.callId,
                conversationId: incomingCall.conversationId,
              });
            }
          },
          incomingCall.callId,
          currentUserId,
          incomingCall.conversationId
        );
      }

      setCurrentCallId(incomingCall.callId);
      setConversationId(incomingCall.conversationId);
      setParticipantName(
        incomingCall.callerInfo?.displayName || "Người gọi không xác định"
      );
      setIsCallModalOpen(true);
      setIncomingCall(null);
    } catch (e) {
      console.error("❌ Accept call error:", e);
      rejectCall();
    }
  }, [incomingCall, webRTC, socketRef, currentUserId]);

  // **CLEAN: Từ chối cuộc gọi - bỏ các userId fields**
  const rejectCall = useCallback(() => {
    if (!incomingCall) return;
    
    const socket = socketRef.current;
    if (socket?.connected) {
      socket.emit("call-event", {
        callId: incomingCall.callId,
        conversationId: incomingCall.conversationId,
        // callerId: incomingCall.callerId, // **BỎ**
        // calleeId: currentUserId, // **BỎ**
        event: "reject",
      });
    }
    setIncomingCall(null);
  }, [incomingCall, socketRef]); // **BỎ currentUserId dependency**

  // **CLEAN: Kết thúc cuộc gọi**
  const endCall = useCallback(() => {
    endCallInternal();
  }, [endCallInternal]);

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
    conversationId,
  };
}
