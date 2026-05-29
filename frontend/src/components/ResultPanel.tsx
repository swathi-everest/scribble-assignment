import { Card } from "./Card";
import { useRoomState } from "../state/roomStore";

export function ResultPanel() {
  const { room } = useRoomState();
  const guesses = room?.guesses ?? [];

  return (
    <Card title="Activity">
      {guesses.length === 0 ? (
        <div className="placeholder-block" style={{ backgroundColor: "#f9fafb" }}>
          <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>Guesses will appear here.</p>
        </div>
      ) : (
        <ul className="guess-history">
          {guesses.map((guess) => (
            <li key={guess.id} className="guess-history__item">
              <span className="guess-history__name">{guess.participantName}</span>
              <span className="guess-history__text">{guess.text}</span>
              <span
                className={
                  guess.isCorrect ? "guess-history__outcome guess-history__outcome--correct" : "guess-history__outcome"
                }
              >
                {guess.isCorrect ? "Correct" : "Incorrect"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
