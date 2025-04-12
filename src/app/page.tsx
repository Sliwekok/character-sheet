import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <div className="items-center inline-flex">
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

        <div className="flex gap-4 items-center flex-col sm:flex-row">
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
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
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
