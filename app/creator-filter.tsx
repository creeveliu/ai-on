"use client";

import { useRef, useEffect, useState } from "react";
import Link from "next/link";

type Creator = { id: string; name: string };

export function CreatorFilter({ creators, activeId }: { creators: Creator[]; activeId?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const checkScroll = () => {
      setShowLeftArrow(el.scrollLeft > 5);
      setShowRightArrow(el.scrollLeft < el.scrollWidth - el.clientWidth - 5);
    };

    checkScroll();
    el.addEventListener("scroll", checkScroll);
    window.addEventListener("resize", checkScroll);

    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [creators]);

  const scrollLeft = () => {
    const el = ref.current;
    if (!el) return;
    const scrollAmount = el.clientWidth - 40;
    el.scrollBy({ left: -scrollAmount, behavior: "smooth" });
  };

  const scrollRight = () => {
    const el = ref.current;
    if (!el) return;
    const scrollAmount = el.clientWidth - 40;
    el.scrollBy({ left: scrollAmount, behavior: "smooth" });
  };

  return (
    <div
      className="threads-creator-filter-wrapper"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Left arrow */}
      {showLeftArrow && isHovered && (
        <button className="threads-scroll-arrow threads-scroll-arrow-left" onClick={scrollLeft} aria-label="向左滚动">
          ‹
        </button>
      )}

      {/* Right arrow */}
      {showRightArrow && isHovered && (
        <button className="threads-scroll-arrow threads-scroll-arrow-right" onClick={scrollRight} aria-label="向右滚动">
          ›
        </button>
      )}

      <div ref={ref} className="threads-creator-filter">
        <Link href="/" className={!activeId ? "is-active" : ""}>
          全部
        </Link>
        {creators.map((item) => (
          <Link key={item.id} href={`/?creator=${item.id}`} className={activeId === item.id ? "is-active" : ""}>
            {item.name}
          </Link>
        ))}
      </div>
    </div>
  );
}