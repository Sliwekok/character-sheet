"use client"

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react"

export default function Nav() {
    const [isOpen, setNav] = useState(false)
    const toggleNav = () => {
        setNav(!isOpen)
    }

    return (
        <nav className="shadow-xl bg-(--background-darken)">
            <div className="h-18 max-w-7xl m-auto px-18">

                {/* mobile nav */}
                {
                    isOpen
                        ?
                        // expanded nav
                        <div className="md:hidden flex flex-col gap-10 justify-center h-screen w-screen fixed bg-gray-900 left-0">
                            <Link href="/home" className="text-center font-thin text-xl" onClick={toggleNav}><span> Home </span></Link>
                            <Link href="/about" className="text-center font-thin text-xl" onClick={toggleNav}><span> About </span></Link>
                            <svg onClick={toggleNav} x="0px" y="0px"  className="w-8 cursor-pointer mx-auto" viewBox="0 0 122.879 122.879">
                                <g>
                                    <path fill="white" fill-rule="evenodd" clip-rule="evenodd" d="M61.44,0c33.933,0,61.439,27.507,61.439,61.439 s-27.506,61.439-61.439,61.439C27.507,122.879,0,95.372,0,61.439S27.507,0,61.44,0L61.44,0z M73.451,39.151 c2.75-2.793,7.221-2.805,9.986-0.027c2.764,2.776,2.775,7.292,0.027,10.083L71.4,61.445l12.076,12.249 c2.729,2.77,2.689,7.257-0.08,10.022c-2.773,2.765-7.23,2.758-9.955-0.013L61.446,71.54L49.428,83.728 c-2.75,2.793-7.22,2.805-9.986,0.027c-2.763-2.776-2.776-7.293-0.027-10.084L51.48,61.434L39.403,49.185 c-2.728-2.769-2.689-7.256,0.082-10.022c2.772-2.765,7.229-2.758,9.953,0.013l11.997,12.165L73.451,39.151L73.451,39.151z"/>
                                </g>
                            </svg>
                        </div>
                        :
                        // hamburger icon
                        <div className="md:hidden flex flex-row justify-end h-full">
                            <svg onClick={toggleNav} fill="white" className="h-8 my-auto cursor-pointer" x="0px" y="0px" viewBox="0 0 122.88 103.17">
                                <g>
                                    <path d="M26,0h70.87c7.15,0,13.65,2.93,18.36,7.64l0.22,0.24c4.58,4.69,7.42,11.1,7.42,18.13v51.16c0,7.15-2.93,13.65-7.64,18.36 c-4.71,4.71-11.21,7.64-18.36,7.64H26c-7.14,0-13.64-2.93-18.35-7.64H7.64C2.93,90.82,0,84.32,0,77.16V26 c0-7.13,2.92-13.63,7.64-18.35l0.02-0.03C12.38,2.92,18.87,0,26,0L26,0z M41.31,29.74h40.26c2.25,0,4.09,1.84,4.09,4.09l0,0 c0,2.25-1.84,4.09-4.09,4.09H41.31c-2.25,0-4.09-1.84-4.09-4.09l0,0C37.22,31.58,39.06,29.74,41.31,29.74L41.31,29.74L41.31,29.74z M41.31,65.25h40.26c2.25,0,4.09,1.84,4.09,4.09l0,0c0,2.25-1.84,4.09-4.09,4.09l-40.26,0c-2.25,0-4.09-1.84-4.09-4.09l0,0 C37.22,67.09,39.06,65.25,41.31,65.25L41.31,65.25L41.31,65.25z M41.31,47.5h40.26c2.25,0,4.09,1.84,4.09,4.09l0,0 c0,2.25-1.84,4.09-4.09,4.09H41.31c-2.25,0-4.09-1.84-4.09-4.09l0,0C37.22,49.34,39.06,47.5,41.31,47.5L41.31,47.5L41.31,47.5z M96.88,8.2H26c-4.9,0-9.35,2-12.57,5.22l-0.02,0.02C10.2,16.65,8.2,21.1,8.2,26v51.16c0,4.89,2.01,9.34,5.23,12.56l-0.01,0.01 c3.23,3.22,7.68,5.23,12.57,5.23h70.87c4.88,0,9.33-2.01,12.56-5.24c3.23-3.23,5.24-7.68,5.24-12.56V26c0-4.8-1.93-9.17-5.04-12.39 l-0.19-0.18C106.21,10.21,101.77,8.2,96.88,8.2L96.88,8.2z"/>
                                </g>
                            </svg>
                        </div>
                }


                {/* desktop */}
                <div className="hidden md:flex gap-10 h-full flex-row justify-end bg-(--background-darken)">
                    <Link href="/" className="flex flex-col justify-center"><span> Home </span></Link>
                    <Link href="/about" className="flex flex-col justify-center"><span> About </span></Link>
                </div>
            </div>
        </nav>
    )
}
