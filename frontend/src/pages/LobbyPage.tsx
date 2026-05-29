import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { PageHeader } from "../components/PageHeader";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { useRoomState, useRoomStore } from "../state/roomStore";

const LOBBY_POLL_MS = 2000;

export function LobbyPage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, participantId, error, isLoading } = useRoomState();
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [startError, setStartError] = useState<string | null>(null);

  const isHost = Boolean(
    room && participantId && room.hostParticipantId === participantId
  );
  const canStart = Boolean(room && room.participants.length >= 2);

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
    }
  }, [navigate, room]);

  useEffect(() => {
    if (room?.status === "playing") {
      navigate("/game", { replace: true });
    }
  }, [navigate, room?.status]);

  useEffect(() => {
    if (!room || room.status !== "lobby") {
      return;
    }

    async function pollRoom() {
      try {
        setRefreshError(null);
        await roomStore.fetchRoom();
      } catch (caughtError) {
        setRefreshError(
          caughtError instanceof Error ? caughtError.message : "Unable to refresh room"
        );
      }
    }

    const intervalId = window.setInterval(pollRoom, LOBBY_POLL_MS);
    return () => {
      window.clearInterval(intervalId);
    };
  }, [room?.code, room?.status, roomStore]);

  async function handleRefresh() {
    try {
      setRefreshError(null);
      await roomStore.fetchRoom();
    } catch (caughtError) {
      setRefreshError(caughtError instanceof Error ? caughtError.message : "Unable to refresh room");
    }
  }

  async function handleStart() {
    try {
      setStartError(null);
      const updatedRoom = await roomStore.startGame();
      if (updatedRoom.status === "playing") {
        navigate("/game");
      }
    } catch (caughtError) {
      setStartError(caughtError instanceof Error ? caughtError.message : "Unable to start game");
    }
  }

  if (!room) {
    return null;
  }

  const statusMessage =
    error ?? refreshError ?? startError ?? "Waiting for the host to start the game.";

  return (
    <section className="panel placeholder-page">
      <div className="lobby-header">
        <PageHeader
          kicker="Waiting for players"
          title="Lobby"
          description="Share the room code with friends so they can join your game."
        />
        <RoomCodeBadge code={room.code} />
      </div>

      <div className="summary-grid">
        <Card title="Participants">
          {room.participants.length === 0 ? (
            <p>No participants are connected to this room yet.</p>
          ) : (
            <ul className="player-list">
              {room.participants.map((participant) => (
                <li key={participant.id}>
                  <span>{participant.name}</span>
                  <span className="player-list__meta">
                    {participant.isHost ? "host" : "joined"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Status">
          <p
            className="status-line"
            style={{
              backgroundColor: isLoading ? "#fef3c7" : "#e0e7ff",
              color: isLoading ? "#b45309" : "#3730a3"
            }}
          >
            {isLoading ? "Refreshing players..." : "Ready to play"}
          </p>
          <p style={{ marginTop: "8px" }}>{statusMessage}</p>
        </Card>
      </div>

      <div className="button-row button-row--spread">
        <button className="button button--secondary" disabled={isLoading} onClick={handleRefresh}>
          {isLoading ? "Refreshing..." : "Refresh Room"}
        </button>
        {isHost ? (
          <div className="lobby-start">
            <button
              className="button button--primary"
              disabled={isLoading || !canStart}
              onClick={handleStart}
            >
              Start Game
            </button>
            {!canStart ? (
              <p className="form__error" style={{ marginTop: "8px" }}>
                At least two players are required to start.
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
