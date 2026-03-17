import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { ArrowLeft, Users } from 'lucide-react';

interface AlumniConnectProps {
  onBack: () => void;
}
export function AlumniConnect({ onBack }: AlumniConnectProps) {
  const classes = [
    { id: '2025-may', name: 'Class of 2025 - May Intake', members: 198, whatsappUrl: '' },
    { id: '2024-sep', name: 'Class of 2024 - September Intake', members: 230, whatsappUrl: '' },
    { id: '2024-may', name: 'Class of 2024 - May Intake', members: 210, whatsappUrl: '' },
  ];

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
          <button onClick={onBack} className="p-2 hover:bg-white/15 rounded-lg text-white" title="Go back">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-white">Alumni Network</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-4">
        <h3 className="text-lg">Connect by Class</h3>
        {classes.map((cls) => (
          <Card key={cls.id} className="p-5 cursor-pointer hover:shadow-md transition">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4>{cls.name}</h4>
                  <p className="text-sm text-gray-600">{cls.members} members</p>
                </div>
              </div>
              <div className="mt-4">
                <Button
                  disabled={!cls.whatsappUrl}
                  onClick={() => {
                    if (!cls.whatsappUrl) return;
                    window.open(cls.whatsappUrl, '_blank', 'noopener,noreferrer');
                  }}
                  className="w-full"
                >
                  {cls.whatsappUrl ? 'Join WhatsApp group' : 'WhatsApp link needed'}
                </Button>
              </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
