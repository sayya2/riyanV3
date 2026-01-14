'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

type Sector = {
  name: string;
  image: string;
};

type Props = {
  sectors: Sector[];
  speed?: number; // pixels per second
};

export default function SectorSlider({ sectors, speed = 50 }: Props) {
  const [isPaused, setIsPaused] = useState(false);
  const [offset, setOffset] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);

  // Duplicate sectors for seamless infinite loop
  const duplicatedSectors = [...sectors, ...sectors, ...sectors];

  useEffect(() => {
    if (isPaused) return;

    let lastTime = Date.now();

    const animate = () => {
      const now = Date.now();
      const delta = (now - lastTime) / 1000; // seconds
      lastTime = now;

      setOffset((prev) => {
        const newOffset = prev + speed * delta;
        const cardWidth = containerRef.current
          ? containerRef.current.scrollWidth / duplicatedSectors.length
          : 0;

        // Reset when we've scrolled through one set of sectors
        if (newOffset >= cardWidth * sectors.length) {
          return newOffset - cardWidth * sectors.length;
        }
        return newOffset;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPaused, speed, sectors.length, duplicatedSectors.length]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsPaused(true);
    const startX = e.clientX;
    const startOffset = offset;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const diff = startX - moveEvent.clientX;
      setOffset(startOffset + diff);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      setTimeout(() => setIsPaused(false), 500); // Resume after brief pause
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div
      className="relative w-full"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Slider container */}
      <div className="relative overflow-hidden cursor-grab active:cursor-grabbing">
        <div
          ref={containerRef}
          className="flex gap-6"
          style={{
            transform: `translateX(-${offset}px)`,
            transition: isPaused ? 'none' : 'transform 0.1s linear',
          }}
          onMouseDown={handleMouseDown}
        >
          {duplicatedSectors.map((sector, index) => (
            <div
              key={`${sector.name}-${index}`}
              className="relative h-[40vh] overflow-hidden rounded-lg group shadow-lg flex-shrink-0 w-[calc(33.333%-16px)] md:w-[calc(33.333%-16px)]"
            >
              <Image
                src={sector.image}
                alt={sector.name}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="33vw"
                draggable={false}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <h3 className="text-2xl md:text-3xl font-semibold text-white">
                  {sector.name}
                </h3>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Hint text
      <div className="mt-6 text-center text-sm text-gray-500">
        Hover to pause • Drag to navigate
      </div> */}
    </div>
  );
}
