"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useWindowSize } from "react-use";
import { Button } from "@/components/ui";

const SKETCH_IMAGES = [
  "/sketch/resized/1.png",
  "/sketch/resized/2.png",
  "/sketch/resized/3.png",
  "/sketch/resized/4.png",
  "/sketch/resized/5.png",
  "/sketch/resized/6.png",
  "/sketch/resized/7.png",
  "/sketch/resized/8.png",
];

const STEPS = ["Got idea?", "Create it", "Upgrade it", "Play it"];

function shuffle(array: string[]) {
  return [...array].sort(() => Math.random() - 0.5);
}

export default function LandingPage() {
  const { width } = useWindowSize();
  const [shuffledImages, setShuffledImages] = useState<string[]>([]);

  useEffect(() => {
    setShuffledImages(shuffle(SKETCH_IMAGES));
  }, []);

  const topImages = shuffledImages.slice(4, 8);
  const bottomImages = shuffledImages.slice(0, 4);
  const tileSize = Math.max(Math.floor(width / 4), 1);

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      {/* decorative background sketches */}
      <div className="pointer-events-none absolute top-1/4 left-1/2 z-0 grid w-full -translate-x-1/2 -translate-y-1/2 grid-cols-4 gap-6 px-8 opacity-15">
        {topImages.map((src) => (
          <Image
            key={src}
            src={src}
            alt=""
            width={tileSize}
            height={tileSize}
            className="h-auto w-full select-none"
          />
        ))}
      </div>
      <div className="pointer-events-none absolute bottom-10 left-1/2 z-0 grid w-full -translate-x-1/2 grid-cols-4 gap-6 px-8 opacity-15">
        {bottomImages.map((src) => (
          <Image
            key={src}
            src={src}
            alt=""
            width={tileSize}
            height={tileSize}
            className="h-auto w-full select-none"
          />
        ))}
      </div>

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center gap-10 px-6 py-24 text-center">
        <div className="flex flex-col items-center gap-4">
          <Image
            src="/01.png"
            alt="Character Sheet dice icon"
            width={96}
            height={96}
            priority
          />
          <h1 className="font-display text-4xl tracking-wide text-fontcolor sm:text-6xl">
            Character Sheet
          </h1>
          <p className="max-w-xl text-fontcolor-secondary">
            Build, roll, and manage your Dungeons &amp; Dragons characters -
            from a spark of an idea to a full sheet ready for the table.
          </p>
        </div>

        <ol className="flex flex-col gap-4 sm:flex-row sm:gap-8">
          {STEPS.map((step, i) => (
            <li
              key={step}
              className="flex items-center gap-3 sm:flex-col sm:gap-2"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-foreground text-sm font-semibold text-background-darken">
                {i + 1}
              </span>
              <span className="font-[family-name:var(--font-geist-mono)] text-fontcolor-secondary">
                {step}
              </span>
            </li>
          ))}
        </ol>

        <div className="flex flex-col items-center gap-4 sm:flex-row">
          <Button href="/home" size="lg">
            Start now
          </Button>
          <Button
            href="https://www.dndbeyond.com"
            target="_blank"
            rel="noopener noreferrer"
            variant="secondary"
            size="lg"
          >
            Read about the game
          </Button>
        </div>
      </main>

      <footer className="relative z-10 flex flex-wrap items-center justify-center gap-6 pb-10 text-sm text-fontcolor-secondary">
        <Link
          href="/about"
          className="flex items-center gap-2 underline-offset-4 hover:text-fontcolor hover:underline"
        >
          About app
        </Link>
        <Link
          href="https://github.com/Sliwekok/character-sheet"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 underline-offset-4 hover:text-fontcolor hover:underline"
        >
          GitHub
        </Link>
      </footer>
    </div>
  );
}
