import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { DrawingCanvas } from "../components/DrawingCanvas";
import { GuessForm } from "../components/GuessForm";
import { ResultPanel } from "../components/ResultPanel";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { Scoreboard } from "../components/Scoreboard";
import { useRoomState, useRoomStore } from "../state/roomStore";

const GAME_POLL_MS = 2000;

export function GamePage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, participantId } = useRoomState();
  const [refreshError, setRefreshError] = useState<string | null>(null);

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
      return;
    }

    if (room.status !== "playing") {
      navigate("/lobby", { replace: true });
    }
  }, [navigate, room]);

  useEffect(() => {
    if (!room || room.status !== "playing") {
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

    const intervalId = window.setInterval(pollRoom, GAME_POLL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [room, room?.code, room?.status, roomStore]);

  if (!room || room.status !== "playing") {
    return null;
  }

  const viewer = room.participants.find((participant) => participant.id === participantId) ?? null;
  const drawer = room.participants.find((participant) => participant.id === room.drawerParticipantId);
  const isDrawer = viewer?.role === "drawer";
  const drawerLabel = isDrawer
    ? "You are drawing"
    : drawer
      ? `${drawer.name} is drawing`
      : "Waiting for drawer";

  const strokes = room.canvas?.strokes ?? [];

  return (
    <section className="panel game-page">
      <div className="game-page__header">
        <div className="game-page__header-left">
          <span className="section-kicker">Round 1</span>
          <h1 className="game-page__title">{isDrawer ? "Draw the Word!" : "Guess the Word!"}</h1>
          <p className="game-page__subtitle">{drawerLabel}</p>
        </div>
        <RoomCodeBadge code={room.code} />
      </div>

      {refreshError ? <p className="form__error">{refreshError}</p> : null}

      <div className="game-page__layout">
        <aside className="game-page__sidebar game-page__sidebar--left">
          <Scoreboard />
          <ResultPanel />
        </aside>

        <div className="game-page__main">
          {room.secretWord ? (
            <Card title="Word to draw">
              <p className="game-page__secret-word">{room.secretWord}</p>
            </Card>
          ) : null}

          <Card title="Canvas">
            <DrawingCanvas
              isDrawer={isDrawer}
              strokes={strokes}
              onStrokeComplete={async (stroke): Promise<void> => {
                await roomStore.appendStroke(stroke);
              }}
              onClear={async (): Promise<void> => {
                await roomStore.clearCanvas();
              }}
            />
          </Card>
        </div>

        <aside className="game-page__sidebar game-page__sidebar--right">
          <Card title="Player Info">
            <dl className="detail-list">
              <div>
                <dt>Name</dt>
                <dd>{viewer?.name ?? "Unknown player"}</dd>
              </div>
              <div>
                <dt>Role</dt>
                <dd>{viewer?.role === "drawer" ? "Drawer" : "Guesser"}</dd>
              </div>
            </dl>
          </Card>

          {!isDrawer ? (
            <Card title="Your Guess">
              <GuessForm />
            </Card>
          ) : null}
        </aside>
      </div>

      <div className="button-row">
        <button className="button button--secondary" onClick={() => navigate("/lobby")}>
          Exit Game
        </button>
      </div>
    </section>
  );
}
