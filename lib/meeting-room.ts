import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "./supabase";

export type Participant = { id: string; name: string; isHost: boolean; mic: boolean; camera: boolean };
export type RoomEvent = { type: string; from: string; to?: string; payload?: unknown };
type Handlers = { onEvent: (event: RoomEvent) => void; onPresence: (people: Participant[]) => void; onStatus: (connected: boolean) => void };

export class MeetingRoom {
  readonly clientId = crypto.randomUUID();
  private channel: RealtimeChannel | null = null;
  private localChannel: BroadcastChannel | null = null;
  constructor(private roomId: string, private person: Omit<Participant, "id">, private handlers: Handlers) {}

  async connect() {
    if (!supabase) return this.connectLocal();
    const topic = `skillvelop-meet:${this.roomId}`;
    this.channel = supabase.channel(topic, { config: { broadcast: { self: false }, presence: { key: this.clientId } } });
    this.channel
      .on("broadcast", { event: "room-event" }, ({ payload }) => this.receive(payload as RoomEvent))
      .on("presence", { event: "sync" }, () => {
        const state = this.channel?.presenceState<Participant>() ?? {};
        const people = Object.values(state).flat().map((p) => ({ ...p, id: p.id || "unknown" }));
        this.handlers.onPresence(people);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await this.channel?.track({ ...this.person, id: this.clientId });
          this.handlers.onStatus(true);
          this.send("peer-join", { person: { ...this.person, id: this.clientId } });
        }
      });
  }

  private connectLocal() {
    this.localChannel = new BroadcastChannel(`skillvelop-meet:${this.roomId}`);
    this.localChannel.onmessage = (event) => this.receive(event.data as RoomEvent);
    this.handlers.onPresence([{ ...this.person, id: this.clientId }]);
    this.handlers.onStatus(true);
  }

  private receive(event: RoomEvent) { if (!event.to || event.to === this.clientId) this.handlers.onEvent(event); }
  send(type: string, payload?: unknown, to?: string) {
    const event: RoomEvent = { type, from: this.clientId, to, payload };
    if (this.channel) void this.channel.send({ type: "broadcast", event: "room-event", payload: event });
    else this.localChannel?.postMessage(event);
  }
  async update(person: Partial<Participant>) { this.person = { ...this.person, ...person }; await this.channel?.track({ ...this.person, id: this.clientId }); }
  async disconnect() {
    this.send("peer-leave"); this.localChannel?.close(); this.localChannel = null;
    if (this.channel && supabase) { await this.channel.untrack(); await supabase.removeChannel(this.channel); this.channel = null; }
    this.handlers.onStatus(false);
  }
}
