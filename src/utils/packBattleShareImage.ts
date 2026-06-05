import { formatUsd, gemsToUsd } from "../constants/retail";
import type { BattleOutcome } from "../lib/packBattleLogic";
import { formatBattleRecord } from "./packBattleRank";
import type { Card } from "../types";

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (!src.trim()) {
      resolve(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export async function generateBattleShareImage(options: {
  userCard: Card;
  botCard: Card;
  outcome: BattleOutcome;
  wins: number;
  losses: number;
  packName: string;
  botUsername: string;
}): Promise<Blob | null> {
  if (typeof document === "undefined") return null;

  const width = 1080;
  const height = 1350;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#050508");
  gradient.addColorStop(0.5, "#0a0a14");
  gradient.addColorStop(1, "#050508");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "rgba(255,255,255,0.04)";
  for (let i = 0; i < 80; i += 1) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const size = Math.random() * 2 + 0.5;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.textAlign = "center";
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 56px system-ui, -apple-system, sans-serif";
  ctx.fillText("WinRips Pack Battle", width / 2, 90);

  ctx.font = "500 32px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.65)";
  ctx.fillText(options.packName, width / 2, 140);

  const headline =
    options.outcome === "win"
      ? "🏆 You Won!"
      : options.outcome === "loss"
        ? "😤 You Lost"
        : "🤝 Tie";
  ctx.font = "bold 72px system-ui, -apple-system, sans-serif";
  ctx.fillStyle =
    options.outcome === "win"
      ? "#F2D680"
      : options.outcome === "loss"
        ? "#F87171"
        : "rgba(255,255,255,0.72)";
  ctx.fillText(headline, width / 2, 240);

  const [userImg, botImg] = await Promise.all([
    loadImage(options.userCard.image),
    loadImage(options.botCard.image),
  ]);

  const cardW = 360;
  const cardH = 500;
  const cardY = 320;

  function drawCardFrame(
    context: CanvasRenderingContext2D,
    x: number,
    label: string,
    img: HTMLImageElement | null,
    card: Card,
  ) {
    context.fillStyle = "rgba(255,255,255,0.06)";
    roundRect(context, x, cardY, cardW, cardH + 120, 24);
    context.fill();

    context.font = "600 28px system-ui, -apple-system, sans-serif";
    context.fillStyle = "rgba(255,255,255,0.55)";
    context.textAlign = "center";
    context.fillText(label, x + cardW / 2, cardY + 40);

    if (img) {
      const aspect = img.width / img.height;
      const drawH = 380;
      const drawW = drawH * aspect;
      const drawX = x + (cardW - drawW) / 2;
      context.drawImage(img, drawX, cardY + 60, drawW, drawH);
    }

    context.font = "600 30px system-ui, -apple-system, sans-serif";
    context.fillStyle = "#ffffff";
    context.fillText(card.name.slice(0, 22), x + cardW / 2, cardY + cardH + 40);

    context.font = "bold 34px system-ui, -apple-system, sans-serif";
    context.fillStyle = "#4ADE80";
    context.fillText(formatUsd(gemsToUsd(card.value)), x + cardW / 2, cardY + cardH + 85);
  }

  drawCardFrame(ctx, 80, "You", userImg, options.userCard);
  drawCardFrame(ctx, 640, options.botUsername.replace(/^@/, ""), botImg, options.botCard);

  ctx.font = "bold 48px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.fillText("VS", width / 2, cardY + cardH / 2);

  ctx.font = "500 34px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.fillText(formatBattleRecord(options.wins, options.losses), width / 2, height - 80);

  ctx.font = "500 28px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.fillText("winrips.com", width / 2, height - 36);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/png", 0.92);
  });
}

export async function shareBattleResultImage(blob: Blob, title: string): Promise<boolean> {
  const file = new File([blob], "winrips-battle.png", { type: "image/png" });

  if (typeof navigator.share === "function" && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ title, files: [file] });
      return true;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return false;
    }
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "winrips-battle.png";
  link.click();
  URL.revokeObjectURL(url);
  return true;
}
