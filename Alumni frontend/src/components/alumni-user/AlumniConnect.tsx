import { Card } from '../ui/card';
import { Button } from '../ui/button';
import type { User } from '../../App';
import { ArrowLeft, Users } from 'lucide-react';
import { useState } from 'react';

interface AlumniConnectProps {
  user: User;
  onBack: () => void;
}

export function AlumniConnect({ user, onBack }: AlumniConnectProps) {
  const [selectedClass, setSelectedClass] = useState('');

  const classes = [
    { id: '2025-sep', name: 'Class of 2025 - September Intake', members: 245 },
    { id: '2025-may', name: 'Class of 2025 - May Intake', members: 198 },
    { id: '2024-sep', name: 'Class of 2024 - September Intake', members: 230 },
    { id: '2024-may', name: 'Class of 2024 - May Intake', members: 210 },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-6">
      <div className="bg-white border-b border-gray-200 p-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-primary">Alumni Network</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-4">
        <h3 className="text-lg">Connect by Class</h3>
        {classes.map((cls) => (
          <Card key={cls.id} className="p-5 cursor-pointer hover:shadow-md transition" onClick={() => setSelectedClass(cls.id)}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4>{cls.name}</h4>
                  <p className="text-sm text-gray-600">{cls.members} members</p>
                </div>
              </div>
              <Button>Join</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
