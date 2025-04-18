import React from "react";

import Image from "next/image";
import Link from "next/link";
import Nav from "../layout/nav";

export default function HomePage() {
    return (
        <>
            <Nav/>
            <main className="flex flex-wrap flex-col gap-[32px] row-start-2 items-center sm:items-start h-9/12">
                <fieldset className="ml-16 border-2 bg-(--background-darken) border-foreground relative p-5 w-2/4 h-4/5 rounded-xs">
                    <legend className="font-bold">Characters</legend>
                    <div className="border-2 border-background w-5/12 h-11/12 p-3 rounded-xl">
                        <h2 className="font-bold text-center">Name | 12 lvl | Chaotic Evil</h2>
                        <p><span className="text-(--fontcolor-secondary)">Class:</span> Bard</p>
                        <p><span className="text-(--fontcolor-secondary)">AC:</span> 18</p>
                        <p><span className="text-(--fontcolor-secondary)">Initiative:</span> +2</p>
                        <p><span className="text-(--fontcolor-secondary)">Strength:</span> +2</p>
                        <p><span className="text-(--fontcolor-secondary)">Dexterity:</span> +2</p>
                        <p><span className="text-(--fontcolor-secondary)">Constitution:</span> +2</p>
                        <p><span className="text-(--fontcolor-secondary)">Intelligence:</span> +2</p>
                        <p><span className="text-(--fontcolor-secondary)">Wisdom:</span> +2</p>
                        <p><span className="text-(--fontcolor-secondary)">Charisma:</span> +2</p>
                    </div>
                </fieldset>
            </main>
        </>
    )
}
