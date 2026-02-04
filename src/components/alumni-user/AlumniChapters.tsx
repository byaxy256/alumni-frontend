import { Card } from '../ui/card';
import { ArrowLeft, Award } from 'lucide-react';

interface AlumniChaptersProps {
  onBack: () => void;
}

export function AlumniChapters({ onBack }: AlumniChaptersProps) {
  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-6">
      <div className="bg-white border-b border-gray-200 p-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-primary">Alumni Chapters</h1>
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
