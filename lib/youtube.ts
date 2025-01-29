export async function getVideoId(url: string): Promise<string> {
  const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  
  if (match && match[2].length === 11) {
    return match[2];
  }
  
  throw new Error('Invalid YouTube URL');
}

export async function fetchTranscript(videoId: string): Promise<string> {
  // TODO: Implement transcript fetching using youtube-transcript-api
  // This will be implemented in the API route
  return '';
}
