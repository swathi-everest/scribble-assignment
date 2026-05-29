import { useCallback, useEffect, useRef, useState } from "react";
import type { CanvasStroke } from "../services/api";

const STROKE_COLOR = "#000000";
const STROKE_WIDTH = 4;

interface DrawingCanvasProps {
  isDrawer: boolean;
  strokes: CanvasStroke[];
  onStrokeComplete: (stroke: CanvasStroke) => Promise<void>;
  onClear: () => Promise<void>;
}

function drawStroke(
  context: CanvasRenderingContext2D,
  stroke: CanvasStroke,
  width: number,
  height: number
) {
  if (stroke.points.length < 2) {
    return;
  }

  context.strokeStyle = stroke.color;
  context.lineWidth = stroke.lineWidth;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.beginPath();

  const [firstX, firstY] = stroke.points[0];
  context.moveTo(firstX * width, firstY * height);

  for (let index = 1; index < stroke.points.length; index += 1) {
    const [x, y] = stroke.points[index];
    context.lineTo(x * width, y * height);
  }

  context.stroke();
}

export function DrawingCanvas({ isDrawer, strokes, onStrokeComplete, onClear }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const activePointsRef = useRef<[number, number][]>([]);
  const isDrawingRef = useRef(false);
  const [localStrokes, setLocalStrokes] = useState<CanvasStroke[]>([]);
  const [canvasError, setCanvasError] = useState<string | null>(null);
  const [isClearing, setIsClearing] = useState(false);

  const displayStrokes = isDrawer ? [...strokes, ...localStrokes] : strokes;

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);

    for (const stroke of displayStrokes) {
      drawStroke(context, stroke, canvas.width, canvas.height);
    }
  }, [displayStrokes]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  useEffect(() => {
    if (!isDrawer) {
      setLocalStrokes([]);
    }
  }, [strokes, isDrawer]);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const resize = () => {
      const parent = canvas.parentElement;

      if (!parent) {
        return;
      }

      canvas.width = parent.clientWidth;
      canvas.height = 500;
      redraw();
    };

    resize();
    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
    };
  }, [redraw]);

  function pointerPosition(event: React.PointerEvent<HTMLCanvasElement>): [number, number] {
    const canvas = canvasRef.current;

    if (!canvas) {
      return [0, 0];
    }

    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;

    return [
      Math.min(1, Math.max(0, x)),
      Math.min(1, Math.max(0, y))
    ];
  }

  function handlePointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawer) {
      return;
    }

    isDrawingRef.current = true;
    activePointsRef.current = [pointerPosition(event)];
    canvasRef.current?.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawer || !isDrawingRef.current) {
      return;
    }

    activePointsRef.current.push(pointerPosition(event));

    const previewStroke: CanvasStroke = {
      points: [...activePointsRef.current],
      color: STROKE_COLOR,
      lineWidth: STROKE_WIDTH
    };

    setLocalStrokes([previewStroke]);
  }

  async function handlePointerUp(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawer || !isDrawingRef.current) {
      return;
    }

    isDrawingRef.current = false;
    canvasRef.current?.releasePointerCapture(event.pointerId);

    const points = [...activePointsRef.current, pointerPosition(event)];

    activePointsRef.current = [];
    setLocalStrokes([]);

    if (points.length < 2) {
      return;
    }

    const stroke: CanvasStroke = {
      points,
      color: STROKE_COLOR,
      lineWidth: STROKE_WIDTH
    };

    try {
      setCanvasError(null);
      await onStrokeComplete(stroke);
    } catch (error) {
      setCanvasError(error instanceof Error ? error.message : "Unable to save stroke");
    }
  }

  async function handleClear() {
    try {
      setCanvasError(null);
      setIsClearing(true);
      setLocalStrokes([]);
      await onClear();
    } catch (error) {
      setCanvasError(error instanceof Error ? error.message : "Unable to clear canvas");
    } finally {
      setIsClearing(false);
    }
  }

  return (
    <div className="drawing-canvas">
      {isDrawer ? (
        <div className="button-row button-row--compact drawing-canvas__toolbar">
          <button
            type="button"
            className="button button--secondary"
            onClick={() => void handleClear()}
            disabled={isClearing}
          >
            Clear canvas
          </button>
        </div>
      ) : null}
      {canvasError ? <p className="form__error">{canvasError}</p> : null}
      <canvas
        ref={canvasRef}
        className={`drawing-canvas__surface${isDrawer ? "" : " drawing-canvas__surface--readonly"}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={(event) => void handlePointerUp(event)}
        onPointerLeave={(event) => void handlePointerUp(event)}
      />
    </div>
  );
}
