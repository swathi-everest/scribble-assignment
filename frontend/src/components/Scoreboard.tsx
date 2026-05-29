import { Card } from "./Card";
import { useRoomState } from "../state/roomStore";

export function Scoreboard() {
  const { room } = useRoomState();

  if (!room?.scores) {
    return (
      <Card title="Scoreboard">
        <div className="placeholder-block" style={{ backgroundColor: "#f9fafb" }}>
          <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>Scores will appear when the round starts.</p>
        </div>
      </Card>
    );
  }

  const rows = room.participants.map((participant) => ({
    id: participant.id,
    name: participant.name,
    score: room.scores?.[participant.id] ?? 0
  }));

  return (
    <Card title="Scoreboard">
      <ul className="scoreboard-list">
        {rows.map((row) => (
          <li key={row.id} className="scoreboard-list__row">
            <span>{row.name}</span>
            <strong>{row.score}</strong>
          </li>
        ))}
      </ul>
    </Card>
  );
}
