import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { PageHeader } from "../components/PageHeader";
import { ResultPanel } from "../components/ResultPanel";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { Scoreboard } from "../components/Scoreboard";
import { useRoomState, useRoomStore } from "../state/roomStore";

const RESULT_POLL_MS = 2000;

export function ResultPage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, participantId } = useRoomState();
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const isHost = Boolean(
    room && participantId && room.hostParticipantId === participantId
  );

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
      return;
    }

    if (room.status === "lobby") {
      navigate("/lobby", { replace: true });
      return;
    }

    if (room.status === "playing") {
      navigate("/game", { replace: true });
    }
  }, [navigate, room, room?.status]);

  useEffect(() => {
    if (!room || room.status !== "result") {
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

    const intervalId = window.setInterval(pollRoom, RESULT_POLL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [room, room?.code, room?.status, roomStore]);

  async function handleRestart() {
    try {
      setActionError(null);
      const updatedRoom = await roomStore.restartRoom();
      if (updatedRoom.status === "lobby") {
        navigate("/lobby");
      }
    } catch (caughtError) {
      setActionError(caughtError instanceof Error ? caughtError.message : "Unable to restart game");
    }
  }

  if (!room || room.status !== "result") {
    return null;
  }

  return (
    <section className="panel game-page">
      <div className="game-page__header">
        <div className="game-page__header-left">
          <PageHeader
            kicker="Round complete"
            title="Results"
            description="Review the word, scores, and guess history before starting again."
          />
        </div>
        <RoomCodeBadge code={room.code} />
      </div>

      {refreshError ? <p className="form__error">{refreshError}</p> : null}
      {actionError ? <p className="form__error">{actionError}</p> : null}

      <div className="game-page__layout">
        <aside className="game-page__sidebar game-page__sidebar--left">
          <Scoreboard />
          <ResultPanel />
        </aside>

        <div className="game-page__main">
          {room.secretWord ? (
            <Card title="The word was">
              <p className="game-page__secret-word">{room.secretWord}</p>
            </Card>
          ) : null}
        </div>
      </div>

      <div className="button-row button-row--spread">
        {isHost ? (
          <button className="button button--primary" onClick={handleRestart}>
            Restart
          </button>
        ) : (
          <p className="status-line">Waiting for the host to restart the game.</p>
        )}
      </div>
    </section>
  );
}
