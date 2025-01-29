interface TranscriptDisplayProps {
  transcript: string;
}

export default function TranscriptDisplay({ transcript }: TranscriptDisplayProps) {
  const handleCopy = () => {
    navigator.clipboard.writeText(transcript);
  };

  return (
    <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-zinc-100">Transcript</h2>
        <button
          onClick={handleCopy}
          className="px-3 py-1 text-sm text-blue-400 hover:text-blue-300"
        >
          Copy
        </button>
      </div>
      <div className="bg-zinc-800 p-4 rounded-md border border-zinc-700 max-h-[400px] overflow-auto">
        <p className="text-zinc-100 whitespace-pre-wrap">{transcript}</p>
      </div>
    </div>
  );
}
