import type { RoomEvent } from "./meeting-room";

type SignalSender = (type: string, payload?: unknown, to?: string) => void;
type RemoteUpdate = (streams: Map<string, MediaStream>) => void;
type Signal = { description?: RTCSessionDescriptionInit; candidate?: RTCIceCandidateInit };

export class WebRTCMesh {
  private peers = new Map<string, RTCPeerConnection>();
  private streams = new Map<string, MediaStream>();
  constructor(private localStream: MediaStream, private send: SignalSender, private update: RemoteUpdate) {}

  async handle(event: RoomEvent) {
    if (event.type === "peer-join") return this.offerTo(event.from);
    if (event.type === "peer-leave" || event.type === "host-remove") return this.remove(event.from);
    if (event.type !== "webrtc-signal") return;
    const signal = event.payload as Signal;
    const peer = this.getPeer(event.from);
    if (signal.description) {
      await peer.setRemoteDescription(signal.description);
      if (signal.description.type === "offer") {
        await peer.setLocalDescription(await peer.createAnswer());
        this.send("webrtc-signal", { description: peer.localDescription }, event.from);
      }
    }
    if (signal.candidate) await peer.addIceCandidate(signal.candidate).catch(() => undefined);
  }

  private getPeer(id: string) {
    const existing = this.peers.get(id); if (existing) return existing;
    const peer = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }, { urls: "stun:stun.cloudflare.com:3478" }] });
    this.localStream.getTracks().forEach((track) => peer.addTrack(track, this.localStream));
    peer.onicecandidate = ({ candidate }) => { if (candidate) this.send("webrtc-signal", { candidate: candidate.toJSON() }, id); };
    peer.ontrack = ({ streams }) => { if (streams[0]) { this.streams.set(id, streams[0]); this.update(new Map(this.streams)); } };
    peer.onconnectionstatechange = () => { if (["failed", "closed", "disconnected"].includes(peer.connectionState)) this.remove(id); };
    this.peers.set(id, peer); return peer;
  }

  private async offerTo(id: string) {
    const peer = this.getPeer(id); await peer.setLocalDescription(await peer.createOffer());
    this.send("webrtc-signal", { description: peer.localDescription }, id);
  }
  async replaceVideo(track: MediaStreamTrack) {
    await Promise.all([...this.peers.values()].map(async (peer) => { const sender = peer.getSenders().find((s) => s.track?.kind === "video"); if (sender) await sender.replaceTrack(track); }));
  }
  remove(id: string) { this.peers.get(id)?.close(); this.peers.delete(id); this.streams.delete(id); this.update(new Map(this.streams)); }
  close() { [...this.peers.keys()].forEach((id) => this.remove(id)); }
}
