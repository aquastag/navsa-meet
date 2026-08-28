import type { Metadata, Viewport } from "next";
import "./globals.css";
export const metadata: Metadata = { title:"Skillvelop Meet — Collaborative teaching, reimagined", description:"Peer-to-peer video classrooms with collaborative whiteboards and shared teaching documents.", manifest:"/manifest.webmanifest", icons:{icon:"/favicon.svg",shortcut:"/favicon.svg",apple:"/favicon.svg"} };
export const viewport: Viewport = { themeColor:"#0b1020", width:"device-width", initialScale:1 };
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="en"><body>{children}</body></html>}
