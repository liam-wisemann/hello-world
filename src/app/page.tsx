"use client";
import { useEffect, useRef } from "react";

interface Particle {
  x: number; y: number; z: number;
  ox: number; oy: number; oz: number;
  vx: number; vy: number; vz: number;
  hue: number; size: number;
}

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let w = canvas.width = window.innerWidth;
    let h = canvas.height = window.innerHeight;
    let mx = 0, my = 0, mouseDown = false;
    const N = 3000;
    const particles: Particle[] = [];

    for (let i = 0; i < N; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * 200 + 30;
      const spread = (1 - r / 230) * 40;
      const p: Particle = {
        ox: Math.cos(angle) * r,
        oy: (Math.random() - 0.5) * spread,
        oz: Math.sin(angle) * r,
        x: 0, y: 0, z: 0,
        vx: 0, vy: 0, vz: 0,
        hue: (angle / Math.PI / 2) * 60 + 200 + Math.random() * 40,
        size: Math.random() * 1.5 + 0.5,
      };
      p.x = p.ox; p.y = p.oy; p.z = p.oz;
      particles.push(p);
    }

    let rotY = 0, rotX = 0.4;
    let autoRot = 0;

    const onResize = () => { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; };
    const onMove = (e: MouseEvent) => { mx = e.clientX - w / 2; my = e.clientY - h / 2; };
    const onDown = () => { mouseDown = true; };
    const onUp = () => { mouseDown = false; };
    window.addEventListener("resize", onResize);
    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);

    let raf: number;
    const draw = () => {
      ctx.fillStyle = "rgba(0,0,0,0.15)";
      ctx.fillRect(0, 0, w, h);

      autoRot += 0.003;
      const ry = autoRot + (mouseDown ? mx * 0.002 : 0);
      const rx = 0.4 + (mouseDown ? my * 0.002 : 0);
      rotY += (ry - rotY) * 0.05;
      rotX += (rx - rotX) * 0.05;

      const cosY = Math.cos(rotY), sinY = Math.sin(rotY);
      const cosX = Math.cos(rotX), sinX = Math.sin(rotX);

      const pulse = Math.sin(Date.now() * 0.001) * 0.1 + 1;

      const projected: { sx: number; sy: number; sz: number; hue: number; size: number }[] = [];

      for (const p of particles) {
        // gentle orbit
        const a = Math.atan2(p.oz, p.ox) + 0.002;
        const r = Math.sqrt(p.ox * p.ox + p.oz * p.oz);
        p.ox = Math.cos(a) * r;
        p.oz = Math.sin(a) * r;

        p.x += (p.ox * pulse - p.x) * 0.02;
        p.y += (p.oy * pulse - p.y) * 0.02;
        p.z += (p.oz * pulse - p.z) * 0.02;

        // rotate
        let x1 = p.x * cosY - p.z * sinY;
        const z1 = p.x * sinY + p.z * cosY;
        const y1 = p.y * cosX - z1 * sinX;
        const z2 = p.y * sinX + z1 * cosX;

        const scale = 500 / (500 + z2);
        projected.push({
          sx: w / 2 + x1 * scale,
          sy: h / 2 + y1 * scale,
          sz: z2,
          hue: p.hue,
          size: p.size * scale,
        });
      }

      projected.sort((a, b) => b.sz - a.sz);

      for (const p of projected) {
        const alpha = Math.min(1, Math.max(0.1, (500 - p.sz) / 600));
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue},80%,65%,${alpha})`;
        ctx.fill();
      }

      // center glow
      const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, 60);
      g.addColorStop(0, "rgba(180,200,255,0.15)");
      g.addColorStop(1, "transparent");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden cursor-crosshair">
      <canvas ref={canvasRef} className="block" />
      <div className="absolute bottom-8 left-0 right-0 text-center">
        <h1 className="text-white/80 text-2xl font-light tracking-[0.3em] mb-2">HELLO WORLD</h1>
        <p className="text-white/30 text-sm tracking-widest">click & drag to orbit</p>
      </div>
    </div>
  );
}
