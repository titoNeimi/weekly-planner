"use client";

import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

const DAYS = ["M", "T", "W", "T", "F", "S", "S"] as const;

const TASK_BARS: { y: number; w: number }[][] = [
  [{ y: 12, w: 28 }, { y: 28, w: 20 }, { y: 44, w: 32 }, { y: 60, w: 18 }],
  [{ y: 12, w: 36 }, { y: 28, w: 24 }, { y: 44, w: 18 }],
  [{ y: 12, w: 30 }, { y: 28, w: 34 }, { y: 44, w: 22 }, { y: 60, w: 26 }],
  [{ y: 12, w: 32 }, { y: 28, w: 28 }, { y: 44, w: 20 }, { y: 60, w: 24 }],
  [{ y: 12, w: 26 }, { y: 28, w: 34 }, { y: 44, w: 16 }],
  [{ y: 12, w: 22 }, { y: 28, w: 16 }],
  [{ y: 12, w: 20 }],
];

const COL_W = 52;
const COL_GAP = 12;
const COL_H = 100;
const LABEL_H = 26;
const SVG_W = 7 * COL_W + 6 * COL_GAP;
const SVG_H = LABEL_H + 6 + COL_H;
const TODAY_COL = 3;

export default function Home() {
  const { t } = useLanguage();

  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-[oklch(0.978_0.000_0)] dark:bg-gray-950 px-6 py-16">
      <div className="flex flex-col items-center gap-10 text-center">

        <div className="animate-fade-in" style={{ animationDelay: "0ms" }}>
          <WeekIllustration />
        </div>

        <div className="flex flex-col items-center gap-3">
          <h1
            className="animate-fade-in text-balance text-4xl font-semibold tracking-tight text-gray-900 dark:text-gray-100"
            style={{ animationDelay: "150ms" }}
          >
            {t("landing_headline")}
          </h1>
          <p
            className="animate-fade-in max-w-sm text-pretty text-gray-500 dark:text-gray-400"
            style={{ animationDelay: "230ms" }}
          >
            {t("landing_subtitle")}
          </p>
        </div>

        <Link
          href="/login"
          className="animate-fade-in rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white transition hover:bg-primary-hover"
          style={{ animationDelay: "320ms" }}
        >
          {t("landing_cta")}
        </Link>
      </div>
    </main>
  );
}

function WeekIllustration() {
  const colTop = LABEL_H + 6;

  return (
    <svg
      viewBox={`0 0 ${SVG_W} ${SVG_H}`}
      width={SVG_W}
      height={SVG_H}
      style={{ maxWidth: "100%" }}
      aria-hidden="true"
    >
      <defs>
        <filter id="today-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="1" stdDeviation="4" floodColor="black" floodOpacity="0.08" />
        </filter>
      </defs>

      {DAYS.map((day, i) => {
        const x = i * (COL_W + COL_GAP);
        const isToday = i === TODAY_COL;
        const labelCY = 13;

        return (
          <g key={i}>
            {isToday && (
              <circle
                cx={x + COL_W / 2}
                cy={labelCY}
                r={11}
                fill="oklch(0.480 0.120 150)"
              />
            )}
            <text
              x={x + COL_W / 2}
              y={labelCY}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="9"
              fontWeight="600"
              letterSpacing="0.08em"
              fill={isToday ? "white" : "oklch(0.640 0.005 150)"}
              fontFamily="system-ui,-apple-system,sans-serif"
            >
              {day}
            </text>
            <rect
              x={x}
              y={colTop}
              width={COL_W}
              height={COL_H}
              rx={8}
              fill={isToday ? "oklch(0.940 0.040 150)" : "white"}
              stroke={isToday ? "oklch(0.480 0.120 150)" : "oklch(0.918 0.003 150)"}
              strokeWidth={1}
              filter={isToday ? "url(#today-glow)" : undefined}
            />
            {TASK_BARS[i].map((bar, j) => (
              <rect
                key={j}
                x={x + 8}
                y={colTop + bar.y}
                width={bar.w}
                height={4}
                rx={2}
                fill={isToday ? "oklch(0.480 0.120 150)" : "oklch(0.822 0.005 150)"}
              />
            ))}
          </g>
        );
      })}
    </svg>
  );
}
