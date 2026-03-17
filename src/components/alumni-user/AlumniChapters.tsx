import { Card } from '../ui/card';
import { ArrowLeft, Award } from 'lucide-react';

interface AlumniChaptersProps {
  onBack: () => void;
}

export function AlumniChapters({ onBack }: AlumniChaptersProps) {
  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-6">
      <div
        className="p-4 sticky top-0 z-10"
        style={{
          background: 'linear-gradient(135deg, #2f5288 0%, #355C9A 100%)',
          borderBottom: '1px solid rgba(255,255,255,0.12)'
        }}
      >
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-white/15 rounded-lg text-white"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-white">Alumni Chapters</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        <Card className="p-6 text-center">
          <Award className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">Regional alumni chapters will appear here</p>
        </Card>
      </div>
    </div>
  );
}
