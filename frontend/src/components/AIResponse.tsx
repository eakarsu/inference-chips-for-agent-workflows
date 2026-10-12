import AIReport from './AIReport';

interface Props { content: string; loading?: boolean; timestamp?: string; }

export default function AIResponse({ content, loading, timestamp }: Props) {
  if (!content && !loading) return null;
  return <section aria-label="AI analysis">
    {timestamp && !loading && <p className="text-gray-400 text-xs mb-2">Generated at {timestamp}</p>}
    <AIReport response={content || null} loading={loading} title="AI Analysis" />
  </section>;
}
