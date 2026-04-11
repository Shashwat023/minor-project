// frontend/src/components/ui/NeuralHero3D.tsx
// Full-viewport scroll-driven 3D neural environment.
// Renders as a FIXED background that spans the entire landing page.
// The 240-frame sequence progresses based on total page scroll progress.
// Does NOT block main thread — uses requestAnimationFrame + batched preload.

import React, { useRef, useEffect, useState, useCallback } from "react";

const FRAME_COUNT = 240;
const FRAME_PATH = (i: number) =>
  `/3d-frames/ezgif-frame-${String(i).padStart(3, "0")}.jpg`;

interface NeuralHero3DProps {
  /** Total scrollable height in px — the environment maps frames across this range */
  scrollHeight: number;
}

const NeuralHero3D: React.FC<NeuralHero3DProps> = ({ scrollHeight }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const currentFrameRef = useRef(0);
  const rafRef = useRef<number>(0);
  const [loaded, setLoaded] = useState(false);
  const [progress, setProgress] = useState(0);

  // Preload all frames in batches
  useEffect(() => {
    let mounted = true;
    const images: HTMLImageElement[] = new Array(FRAME_COUNT);
    let loadedCount = 0;

    const loadFrame = (index: number): Promise<void> =>
      new Promise((resolve) => {
        const img = new Image();
        img.src = FRAME_PATH(index + 1);
        img.onload = () => {
          images[index] = img;
          loadedCount++;
          if (mounted) setProgress(Math.round((loadedCount / FRAME_COUNT) * 100));
          resolve();
        };
        img.onerror = () => { loadedCount++; resolve(); };
      });

    const init = async () => {
      // Load first frame immediately
      await loadFrame(0);
      if (mounted) {
        imagesRef.current = images;
        drawFrame(0);
      }

      // Batch load remaining
      const batchSize = 16;
      for (let i = 1; i < FRAME_COUNT; i += batchSize) {
        const batch = [];
        for (let j = i; j < Math.min(i + batchSize, FRAME_COUNT); j++) {
          batch.push(loadFrame(j));
        }
        await Promise.all(batch);
        if (!mounted) return;
      }

      if (mounted) {
        imagesRef.current = images;
        setLoaded(true);
      }
    };

    init();
    return () => { mounted = false; };
  }, []);

  // Draw a frame on canvas with object-fit: cover
  const drawFrame = useCallback((frameIndex: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const img = imagesRef.current[frameIndex];
    if (!canvas || !ctx || !img) return;

    const dpr = window.devicePixelRatio || 1;
    const w = window.innerWidth;
    const h = window.innerHeight;

    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    // Cover fit
    const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
    const iw = img.naturalWidth * scale;
    const ih = img.naturalHeight * scale;
    const ix = (w - iw) / 2;
    const iy = (h - ih) / 2;

    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(img, ix, iy, iw, ih);
  }, []);

  // Scroll-driven frame progression across entire page
  useEffect(() => {
    const onScroll = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const scrollY = window.scrollY || window.pageYOffset;
        const maxScroll = Math.max(1, scrollHeight - window.innerHeight);
        const scrollProgress = Math.max(0, Math.min(1, scrollY / maxScroll));

        const frameIndex = Math.min(
          FRAME_COUNT - 1,
          Math.floor(scrollProgress * (FRAME_COUNT - 1))
        );

        if (frameIndex !== currentFrameRef.current) {
          currentFrameRef.current = frameIndex;
          drawFrame(frameIndex);
        }
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafRef.current);
    };
  }, [drawFrame, scrollHeight]);

  // Resize
  useEffect(() => {
    const onResize = () => drawFrame(currentFrameRef.current);
    window.addEventListener("resize", onResize, { passive: true });
    return () => window.removeEventListener("resize", onResize);
  }, [drawFrame]);

  return (
    <div className="neural-env" aria-hidden="true">
      <canvas
        ref={canvasRef}
        className="neural-env__canvas"
        style={{
          opacity: loaded ? 0.58 : progress > 0 ? 0.1 : 0,
          filter: "brightness(0.8) contrast(1.1)",
          transition: "opacity 1s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      />
      {/* Subtle depth fog — mid layer */}
      <div className="neural-env__fog" />
      {/* Loading state */}
      {!loaded && progress > 0 && progress < 100 && (
        <div className="neural-env__loader">
          <div className="neural-env__loader-track">
            <div
              className="neural-env__loader-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="neural-env__loader-text">Loading neural environment</span>
        </div>
      )}
    </div>
  );
};

export default NeuralHero3D;
