"use client";
// REWRITE THIS WHOLE LOGIC AND FIX BUGS 
import { UseSocket } from "@/hooks/useSocket";
import { useEffect, useRef, useState } from "react";

import { Mic, MicOff, Video, VideoOff, Monitor, Phone } from "lucide-react";
import { CustomButton } from "@/components/ui/custombutton";
import { useRouter } from "next/navigation";

export default function CallClient({ roomId, WsToken }: { roomId: string, WsToken: string }) {

    const { socket, isConnected } = UseSocket(WsToken);

    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const pcRef = useRef<RTCPeerConnection | null>(null);
    const hasJoinedRef = useRef(false); // Tracking if user has already joined
    const hasSetupWebRTC = useRef(false); // Track if WebRTC has been initialized
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [isMicOn, setIsMicOn] = useState(false);
    const [isVideoOn, setIsVideoOn] = useState(false);
    const router = useRouter();

    if (!WsToken) return null;

    useEffect(() => {
        if (!socket || !isConnected) return;

        // Only join once per socket connection
        if (!hasJoinedRef.current) {
            console.log("Joining room:", roomId);
            socket.send(JSON.stringify({
                type: "join-room",
                roomId,
            }));
            hasJoinedRef.current = true;
        }

        // Only setup WebRTC once
        if (!hasSetupWebRTC.current) {
            console.log("Setting up WebRTC...");
            setupWebRTC();
            hasSetupWebRTC.current = true;
        }

        const cleanup = setupSocketListeners();

        return () => {
            console.log("Cleaning up CallClient useEffect");
            cleanup(); // Clean up socket listeners
            // Don't close peer connection here - only when leaving call
            hasJoinedRef.current = false; // Reset on cleanup
        };
    }, [socket, isConnected, roomId]);


    const setupWebRTC = async () => {
        const pc = new RTCPeerConnection({
            iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        });

        pcRef.current = pc;

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socket?.send(JSON.stringify({
                    type: "ice-candidate",
                    roomId,
                    payload: event.candidate,
                }));
            }
        };

        pc.ontrack = (event) => {
            console.log("Received remote track:", event.track.kind, event.streams);
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = event.streams[0];
                console.log("Set remote video srcObject");
            }
        };
    };

    const toggleVideo = async () => {

        if (isVideoOn) {
            // Remove video tracks from peer connection
            const senders = pcRef.current?.getSenders() || [];
            senders.forEach(sender => {
                if (sender.track?.kind === "video") {
                    pcRef.current?.removeTrack(sender);
                }
            });

            // Stop and remove from local stream
            localStream?.getVideoTracks().forEach(t => {
                t.stop();
                localStream?.removeTrack(t);
            });
            setIsVideoOn(false);

            // Update video element
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = localStream;
            }

            // Renegotiate to update remote peer
            await renegotiate();
            return;
        }

        // TURN ON
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            await attachTracks(stream, "video");
        } catch (err) {
            console.log("Video blocked/denied", err);
        }
    };


    const toggleMic = async () => {
        if (isMicOn) {
            // Remove audio tracks from peer connection
            const senders = pcRef.current?.getSenders() || [];
            senders.forEach(sender => {
                if (sender.track?.kind === "audio") {
                    pcRef.current?.removeTrack(sender);
                }
            });

            // Stop and remove from local stream
            localStream?.getAudioTracks().forEach(t => {
                t.stop();
                localStream?.removeTrack(t);
            });
            setIsMicOn(false);

            // Renegotiate to update remote peer
            await renegotiate();
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            await attachTracks(stream, "audio");
        } catch (err) {
            console.log("Mic blocked/denied", err);
        }
    };


    const attachTracks = async (stream: MediaStream, type: "video" | "audio") => {
        let finalStream = localStream;

        if (!finalStream) {
            finalStream = new MediaStream();
        }

        // Add new track to combined stream
        stream.getTracks().forEach(track => finalStream!.addTrack(track));

        // Update state with the final stream
        setLocalStream(finalStream);

        // Display on UI
        if (localVideoRef.current) localVideoRef.current.srcObject = finalStream;

        // Add to peer connection
        stream.getTracks().forEach(track => {
            pcRef.current?.addTrack(track, finalStream!);
        });

        if (type === "video") setIsVideoOn(true);
        if (type === "audio") setIsMicOn(true);

        // Renegotiate to send new tracks to remote peer
        await renegotiate();
    };

    const renegotiate = async () => {
        const pc = pcRef.current;
        if (!pc || !socket) {
            console.log("Cannot renegotiate: missing peer connection or socket");
            return;
        }

        if (pc.signalingState !== "stable") {
            console.log("Cannot renegotiate: signaling state is", pc.signalingState);
            return;
        }

        try {
            console.log("Renegotiating connection...");
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            socket.send(JSON.stringify({
                type: "offer",
                roomId,
                payload: offer,
            }));
            console.log("Renegotiation offer sent");
        } catch (err) {
            console.error("Renegotiation failed:", err);
        }
    };


    const startCall = async () => {
        const pc = pcRef.current;
        if (!pc) return;

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socket?.send(JSON.stringify({
            type: "offer",
            roomId,
            payload: offer,
        }));
    };


    //Recheck this
    const setupSocketListeners = () => {

        const messageHandler = async (event: MessageEvent) => {
            const data = JSON.parse(event.data);
            const pc = pcRef.current;
            if (!pc) return;

            if (data.type === "user-joined") {
                console.log("New participant entered. Auto starting call (offer)...");
                startCall();
                return;
            }

            if (data.type === "offer") {
                await pc.setRemoteDescription(data.payload);
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);

                socket!.send(JSON.stringify({
                    type: "answer",
                    roomId,
                    payload: answer,
                }));
            }

            if (data.type === "answer") {
                await pc.setRemoteDescription(data.payload);
            }

            if (data.type === "ice-candidate") {
                try {
                    await pc.addIceCandidate(data.payload);
                } catch (err) {
                    console.log("ICE error", err);
                }
            }
        };

        socket!.onmessage = messageHandler;

        // Return cleanup function
        return () => {
            if (socket) {
                socket.onmessage = null;
            }
        };
    };

    function leaveCall() {

        console.log("Leaving call");

        if (socket && isConnected) {
            socket.send(JSON.stringify({
                type: "leave-room",
                roomId,
            }));
        }

        //Stop local tracks
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            setLocalStream(null);
        }

        // Stop remote tracks
        if (remoteVideoRef.current?.srcObject) {
            const remoteStream = remoteVideoRef.current.srcObject as MediaStream;
            remoteStream.getTracks().forEach(track => track.stop());
            remoteVideoRef.current.srcObject = null;
        }

        // Clear video elements
        if (localVideoRef.current) localVideoRef.current.srcObject = null;

        // Close peer connection
        if (pcRef.current) {
            pcRef.current.getSenders().forEach(sender => pcRef.current?.removeTrack(sender));
            pcRef.current.close();
            pcRef.current = null;
        }

        // Reset UI toggles
        setIsMicOn(false);
        setIsVideoOn(false);

        router.push("/me");
    }


    return (
        <div className="min-h-screen flex flex-col bg-background">
            <main className="flex-1 flex flex-col p-4 md:p-8">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">

                    {/* Local Video */}
                    <div className="relative bg-card rounded-lg overflow-hidden border border-border aspect-video flex items-center justify-center">
                        <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                        <div className="absolute bottom-4 left-4 bg-background/80 px-3 py-1 rounded-md">
                            <span>You</span>
                        </div>
                    </div>

                    {/* Remote Video */}
                    <div className="relative bg-card rounded-lg overflow-hidden border border-border aspect-video flex items-center justify-center">
                        <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
                        <div className="absolute bottom-4 left-4 bg-background/80 px-3 py-1 rounded-md">
                            <span>Remote</span>
                        </div>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-4 pb-8 ">
                    <CustomButton variant={isMicOn ? "secondary" : "destructive"} onClick={toggleMic} className="rounded-full w-14 h-14" >
                        {isMicOn ? <Mic /> : <MicOff />}
                    </CustomButton>

                    <CustomButton variant={isVideoOn ? "secondary" : "destructive"} onClick={toggleVideo} className="rounded-full w-14 h-14">
                        {isVideoOn ? <Video /> : <VideoOff />}
                    </CustomButton>

                    <CustomButton className="rounded-full w-14 h-14 bg-green-500 text-white">
                        <Monitor />
                    </CustomButton>

                    <CustomButton variant="destructive" className="rounded-full w-14 h-14 " onClick={() => leaveCall()}>
                        <Phone className="rotate-135" />

                    </CustomButton>
                </div>
            </main>
        </div>
    );
}
