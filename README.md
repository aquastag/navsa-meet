# Skillvelop Meet

Open-source, peer-to-peer video classrooms for tutors and up to three learners.

## Features

- 1:1, 1:2 and 1:3 room formats
- WebRTC mesh video, audio and screen sharing
- Supabase Realtime signaling and presence
- Synchronized chat, animated reactions and host controls
- Collaborative whiteboard with pen, highlighter, eraser, shapes, text, undo and redo
- Shared PDF annotation and PPT/PPTX handoff
- Installable responsive PWA

## Local setup

1. Copy `.env.example` to `.env.local`.
2. Add the URL and publishable key from your Supabase project.
3. Run `npm install` and `npm run dev`.

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key
```

The Supabase key used in the browser must be a publishable key, never a secret or service-role key.

## Architecture

Media travels directly between participants through WebRTC. Supabase Realtime carries signaling, room presence and synchronized classroom events. A public coturn server is recommended for reliable calls on restrictive networks.

## Document support

PDF files render inside the shared annotation surface. PPT/PPTX files can be transferred and annotated, but presenters should export them to PDF when exact PowerPoint rendering is required.

## License

MIT
