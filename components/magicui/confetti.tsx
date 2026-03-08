"use client";

import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { cn } from "@/lib/utils";

interface ConfettiRef {
  fire: () => void;
}

interface ConfettiProps {
  className?: string;
  colors?: string[];
  particleCount?: number;
  autoFire?: boolean;
}

const COLORS = [
  "#1b4332",
  "#2d6a4f",
  "#40916c",
  "#74c69d",
  "#c9a227",
  "#e8c55a",
  "#d8f3dc",
];

export const Confetti = forwardRef<ConfettiRef, ConfettiProps>(
  (
    { className, colors = COLORS, particleCount = 80, autoFire = true },
    ref,
  ) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>(0);
    const particlesRef = useRef<Particle[]>([]);

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      color: string;
      size: number;
      rotation: number;
      rotationSpeed: number;
      alpha: number;
    }

    const createParticles = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const particles: Particle[] = [];
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: canvas.width / 2,
          y: canvas.height / 2,
          vx: (Math.random() - 0.5) * 15,
          vy: Math.random() * -12 - 3,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: Math.random() * 8 + 4,
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 10,
          alpha: 1,
        });
      }
      particlesRef.current = particles;
    };

    const animate = () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;

      particlesRef.current.forEach((p) => {
        if (p.alpha <= 0) return;
        alive = true;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.3;
        p.alpha -= 0.008;
        p.rotation += p.rotationSpeed;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      });

      if (alive) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    const fire = () => {
      createParticles();
      cancelAnimationFrame(animationRef.current);
      animate();
    };

    useImperativeHandle(ref, () => ({ fire }));

    useEffect(() => {
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = canvas.offsetWidth * 2;
        canvas.height = canvas.offsetHeight * 2;
      }
      if (autoFire) {
        const timer = setTimeout(fire, 300);
        return () => clearTimeout(timer);
      }
      return () => cancelAnimationFrame(animationRef.current);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
      <canvas
        ref={canvasRef}
        className={cn(
          "pointer-events-none fixed inset-0 z-50 size-full",
          className,
        )}
      />
    );
  },
);

Confetti.displayName = "Confetti";
