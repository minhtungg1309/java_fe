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
  console.log("🎯 Khởi tạo useCall với user ID:", currentUserId);

  // ====== TRẠNG THÁI ======
  const [incomingCall, setIncomingCall] = useState<CallOffer | null>(null);
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [currentCallId, setCurrentCallId] = useState("");
  const [conversationId, setConversationId] = useState("");
  const [participantName, setParticipantName] = useState("");

  // ====== HOOKS ======
  const webRTC = useWebRTC();

  // ====== REF VÀ EFFECTS ======
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

  // ====== UTILITY FUNCTIONS ======
  // Tạo callId duy nhất
  const generateCallId = useCallback(() => {
    return `call_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }, []);

  // ====== INTERNAL HANDLERS ======
  // Kết thúc cuộc gọi nội bộ
  const endCallInternal = useCallback(() => {
    const { currentCallId, conversationId } = stateRef.current;
    console.log("📞 Kết thúc cuộc gọi:", currentCallId);

    const socket = socketRef.current;
    if (socket?.connected && currentCallId && conversationId) {
      socket.emit("call-event", {
        callId: currentCallId,
        conversationId,
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
  }, [webRTC]);

  // ====== SOCKET SETUP ======
  // Socket handlers
  const socketRef = useSocket(
    undefined, // Bỏ qua handler tin nhắn chat
    // Xử lý call-offer (cuộc gọi đến)
    useCallback(
      (callOffer: CallOffer) => {
        console.log("📞 useCall: Nhận offer:", callOffer);
        console.log("📞 useCall: ID người dùng hiện tại:", currentUserId);
        console.log("📞 useCall: ID người gọi:", callOffer.callerId);

        // Kiểm tra hợp lệ
        if (!callOffer.callerId || !callOffer.conversationId) {
          console.log("📞 useCall: Bỏ qua offer - thiếu trường bắt buộc");
          return;
        }

        if (callOffer.callerId === currentUserId) {
          console.log("📞 useCall: Bỏ qua offer - tự gọi chính mình");
          return;
        }

        console.log("📞 useCall: Đặt cuộc gọi đến...");
        setIncomingCall(callOffer);
      },
      [currentUserId]
    ),
    // Xử lý call-answer (phản hồi cuộc gọi)
    useCallback((callAnswer: CallAnswer) => {
      const { currentCallId, webRTC } = stateRef.current;
      if (callAnswer.callId === currentCallId) {
        webRTC.handleAnswer(callAnswer);
      }
    }, []),
    // Xử lý ice-candidate (trao đổi ICE)
    useCallback((iceCandidate: IceCandidate) => {
      const { currentCallId, webRTC } = stateRef.current;
      if (iceCandidate.callId === currentCallId) {
        webRTC.handleIceCandidate(iceCandidate);
      }
    }, []),
    // Xử lý call-event (trạng thái cuộc gọi)
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

  // ====== PUBLIC METHODS ======
  // Bắt đầu cuộc gọi
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

        // Chỉ gửi dữ liệu tối thiểu
        const callData: CallOffer = {
          ...offer,
          callId,
          callType,
          conversationId,
        };
        socket.emit("call-offer", callData);
        console.log("⬆️ FE emit call-offer:", callData);

        // Xử lý ICE candidates
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
        console.error("❌ Lỗi bắt đầu cuộc gọi:", e);
      }
    },
    [webRTC, generateCallId]
  );

  // Chấp nhận cuộc gọi
  const acceptCall = useCallback(async () => {
    if (!incomingCall) return;
    
    try {
      const answer = await webRTC.createAnswer(incomingCall);
      const socket = socketRef.current;
      
      if (socket?.connected && answer) {
        // Dữ liệu answer tối thiểu
        const callAnswer: CallAnswer = {
          ...answer,
          callId: incomingCall.callId,
          conversationId: incomingCall.conversationId,
        };
        
        socket.emit("call-answer", callAnswer);

        // Xử lý ICE candidates
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
      console.error("❌ Lỗi chấp nhận cuộc gọi:", e);
      rejectCall();
    }
  }, [incomingCall, webRTC, socketRef, currentUserId]);

  // Từ chối cuộc gọi
  const rejectCall = useCallback(() => {
    if (!incomingCall) return;
    
    const socket = socketRef.current;
    if (socket?.connected) {
      socket.emit("call-event", {
        callId: incomingCall.callId,
        conversationId: incomingCall.conversationId,
        event: "reject",
      });
    }
    setIncomingCall(null);
  }, [incomingCall, socketRef]);

  // Kết thúc cuộc gọi
  const endCall = useCallback(() => {
    endCallInternal();
  }, [endCallInternal]);

  // ====== RETURN ======
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
