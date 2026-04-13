"use client";

import Link from "next/link";
import { useRef, useState } from "react";

type Creator = { id: string; name: string };

export function CreatorFilter({ creators, activeId }: { creators: Creator[]; activeId?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    setIsDragging(true);
    setStartX(e.pageX - el.offsetLeft);
    setScrollLeft(el.scrollLeft);
    el.style.cursor = "grabbing";
    el.style.userSelect = "none";
  };

  const handleMouseLeave = () => {
    const el = ref.current;
    if (!el) return;
    setIsDragging(false);
    el.style.cursor = "grab";
    el.style.userSelect = "";
  };

  const handleMouseUp = () => {
    const el = ref.current;
    if (!el) return;
    setIsDragging(false);
    el.style.cursor = "grab";
    el.style.userSelect = "";
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const el = ref.current;
    if (!el) return;
    e.preventDefault();
    const x = e.pageX - el.offsetLeft;
    const walk = x - startX;
    el.scrollLeft = scrollLeft - walk;
  };

  return (
    <div
      ref={ref}
      className="threads-creator-filter"
      style={{ cursor: "grab" }}
      onMouseDown={handleMouseDown}
      onMouseLeave={handleMouseLeave}
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
    >
      <Link href="/" className={!activeId ? "is-active" : ""}>
        全部
      </Link>
      {creators.map((item) => (
        <Link key={item.id} href={`/?creator=${item.id}`} className={activeId === item.id ? "is-active" : ""}>
          {item.name}
        </Link>
      ))}
    </div>
  );
}