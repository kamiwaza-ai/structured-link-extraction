import { NextResponse } from 'next/server';
import { getVideoId } from '@/lib/youtube';

export async function POST(req: Request) {
  try {
    const { videoUrl } = await req.json();
    console.log('Processing URL:', videoUrl);
    
    const videoId = await getVideoId(videoUrl);
    console.log('Extracted video ID:', videoId);

    // Fetch the video page to get the initial player response
    const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`);
    const html = await response.text();

    // Extract ytInitialPlayerResponse from the page
    const YT_INITIAL_PLAYER_RESPONSE_RE = /ytInitialPlayerResponse\s*=\s*({.+?})\s*;\s*(?:var\s+(?:meta|head)|<\/script|\n)/;
    const match = html.match(YT_INITIAL_PLAYER_RESPONSE_RE);
    
    if (!match) {
      throw new Error('Could not find player response in page');
    }

    const player = JSON.parse(match[1]);
    console.log('Found player response');

    // Get the caption tracks
    const tracks = player.captions?.playerCaptionsTracklistRenderer?.captionTracks;
    if (!tracks || !tracks.length) {
      throw new Error('No caption tracks found');
    }

    // Sort tracks to prioritize English and manual captions
    tracks.sort((track1: any, track2: any) => {
      const langCode1 = track1.languageCode;
      const langCode2 = track2.languageCode;

      if (langCode1 === 'en' && langCode2 !== 'en') return -1;
      if (langCode1 !== 'en' && langCode2 === 'en') return 1;
      if (track1.kind !== 'asr' && track2.kind === 'asr') return -1;
      if (track1.kind === 'asr' && track2.kind !== 'asr') return 1;
      return 0;
    });

    // Fetch the transcript data
    console.log('Fetching transcript from:', tracks[0].baseUrl);
    const transcriptResponse = await fetch(`${tracks[0].baseUrl}&fmt=json3`);
    const transcriptData = await transcriptResponse.json();

    // Parse the transcript
    const transcript = transcriptData.events
      ?.filter((x: any) => x.segs)
      ?.map((x: any) => 
        x.segs
          .map((y: any) => y.utf8)
          .join(' ')
      )
      .join(' ')
      // Remove invalid characters
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      // Replace multiple spaces with single space
      .replace(/\s+/g, ' ');

    if (!transcript) {
      throw new Error('Failed to parse transcript data');
    }

    return NextResponse.json({ transcript });
    
  } catch (error) {
    console.error('Transcript fetch error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        details: error
      },
      { status: 500 }
    );
  }
}