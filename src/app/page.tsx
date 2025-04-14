'use client';

import Image from "next/image";
import Link from "next/link";
import { useWindowSize } from 'react-use';
import { useEffect, useState } from "react";

export default function Home() {
  const { width, height } = useWindowSize();

  const imagePaths = [
    "/sketch/resized/1.png",
    "/sketch/resized/2.png",
    "/sketch/resized/3.png",
    "/sketch/resized/4.png",
    "/sketch/resized/5.png",
    "/sketch/resized/6.png",
    "/sketch/resized/7.png",
    "/sketch/resized/8.png",
  ];

  function shuffleArray(array: string[]) {
    return [...array].sort(() => Math.random() - 0.5);
  }

  const [shuffledImages, setShuffledImages] = useState<string[]>([]);

  useEffect(() => {
    setShuffledImages(shuffleArray(imagePaths));
  }, []);

  const topImages = shuffledImages.slice(4, 8);
  const bottomImages = shuffledImages.slice(0, 4);

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen  pb-20 gap-16 font-[family-name:var(--font-geist-sans)]">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 grid grid-cols-4 gap-6 w-full px-8 opacity-40">
        {topImages.map((src, i) => (
            <Image key={i} src={src} alt={`sketch ${i}`} width={width/4} height={height/4} className="w-full h-auto scale-40 select-none z-0" />
        ))}
      </div>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 grid grid-cols-4 gap-6 w-full px-8 opacity-40">
        {bottomImages.map((src, i) => (
            <Image key={i} src={src} alt={`sketch ${i}`} width={width/4} height={height/4} className="w-full h-auto scale-50 select-none z-0" />
        ))}
      </div>

      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <div className="scale-125 items-center inline-flex backdrop-brightness-50 pr-5">
          <Image
            className="dark:invert"
            src="/01.png"
            alt="dice icon"
            width={180}
            height={38}
            priority
          />
          <ol className="list-inside list-decimal text- text-center sm:text-left font-[family-name:var(--font-geist-mono)] ml-5">
            <li>Got idea?</li>
            <li>Create it</li>
            <li>Upgrade it</li>
            <li>Play it</li>
          </ol>
        </div>

        <div className="mt-5 scale-125 flex gap-4 items-center flex-col sm:flex-row ml-5">
          <Link
            className="rounded-full transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-(--fontcolor) font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
            href="/home"
            rel="noopener noreferrer"
          >
            <Image
              className="dark:invert"
              src="/vercel.svg"
              alt="Vercel logomark"
              width={20}
              height={20}
            />
            Start now
          </Link>
          <Link
            className="rounded-full border border-solid border-white/[.145] transition-all flex items-center justify-center brightness-75 hover:brightness-100 duration-200 font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto"
            href="https://www.dndbeyond.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            Read about game
          </Link>
        </div>
      </main>
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center z-20 mt-10">
        <Link
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="/about"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/file.svg"
            alt="File icon"
            width={16}
            height={16}
          />
          About app
        </Link>
        <Link
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://github.com/Sliwekok/character-sheet"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/window.svg"
            alt="Window icon"
            width={16}
            height={16}
          />
          GitHub
        </Link>
      </footer>
    </div>
  );
}
