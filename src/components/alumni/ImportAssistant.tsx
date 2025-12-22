import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { ArrowLeft, Upload, Check, X, AlertTriangle, FileUp, Download, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Progress } from '../ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';

export default function ImportAssistant() {
  const [step, setStep] = useState(1);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({});
  const [showDuplicates, setShowDuplicates] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);

  const csvColumns = ['Name', 'Email', 'Phone', 'Grad_Year', 'Program', 'Faculty', 'Location'];
  const systemFields = ['fullName', 'email', 'phoneNumber', 'graduationYear', 'program', 'faculty', 'location'];

  const sampleData = [
    { name: 'John Doe', email: 'john@example.com', phone: '+256700123456', gradYear: '2015', program: 'Computer Science', status: 'new' },
    { name: 'Jane Smith', email: 'jane@example.com', phone: '+256701234567', gradYear: '2016', program: 'Business', status: 'new' },
    { name: 'Mary Nakato', email: 'mary@example.com', phone: '+256702345678', gradYear: '2014', program: 'Education', status: 'duplicate' },
    { name: 'Peter Ssemakula', email: 'peter@example.com', phone: '+256703456789', gradYear: '2017', program: 'Engineering', status: 'new' },
  ];

  const duplicates = sampleData.filter((d) => d.status === 'duplicate');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFile(e.target.files[0].name);
      toast.success('File uploaded successfully');
      setStep(2);
    }
  };

  const handleFieldMapping = (csvField: string, systemField: string) => {
    setFieldMapping({ ...fieldMapping, [csvField]: systemField });
  };

  const handleDryRun = () => {
    setStep(3);
    toast.info('Running duplicate detection...');
  };

  const handleImport = () => {
    setImporting(true);
    setImportProgress(0);

    // Simulate import progress
    const interval = setInterval(() => {
      setImportProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setImporting(false);
          toast.success('Import completed! 150 records imported, 3 duplicates skipped.');
          setTimeout(() => {
            onBack();
          }, 2000);
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <Card className="border-2 border-dashed">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                  <FileUp size={32} className="text-blue-600" />
                </div>
                <h3 className="text-base mb-2">Upload CSV File</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Select a CSV file containing alumni data to import
                </p>
                <Input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="max-w-xs mx-auto"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Required Fields</CardTitle>
                <CardDescription>Your CSV should contain these fields</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Check size={14} className="text-green-600" />
                    <span>Full Name</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check size={14} className="text-green-600" />
                    <span>Email</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check size={14} className="text-green-600" />
                    <span>Phone Number</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check size={14} className="text-green-600" />
                    <span>Graduation Year</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check size={14} className="text-gray-400" />
                    <span>Program (optional)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check size={14} className="text-gray-400" />
                    <span>Faculty (optional)</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Download Template</CardTitle>
                <CardDescription>Use our template for easy import</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  <Download size={16} className="mr-2" />
                  Download CSV Template
                </Button>
              </CardContent>
            </Card>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Check className="text-green-600" size={20} />
                  <div>
                    <p className="text-sm text-green-900">File uploaded: {uploadedFile}</p>
                    <p className="text-xs text-green-700">150 records detected</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Map CSV Fields</CardTitle>
                <CardDescription>Match your CSV columns to system fields</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {csvColumns.map((csvField, index) => (
                  <div key={csvField} className="flex items-center gap-3">
                    <div className="flex-1">
                      <p className="text-sm mb-1">{csvField}</p>
                      <Input value={csvField} disabled className="text-sm" />
                    </div>
                    <div className="text-gray-400">→</div>
                    <div className="flex-1">
                      <p className="text-sm mb-1">System Field</p>
                      <Select
                        value={fieldMapping[csvField]}
                        onValueChange={(value) => handleFieldMapping(csvField, value)}
                      >
                        <SelectTrigger className="text-sm">
                          <SelectValue placeholder="Select field" />
                        </SelectTrigger>
                        <SelectContent>
                          {systemFields.map((field) => (
                            <SelectItem key={field} value={field}>
                              {field}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                Back
              </Button>
              <Button onClick={handleDryRun} className="flex-1" style={{ backgroundColor: '#0b2a4a' }}>
                Run Dry Run
              </Button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Import Preview</CardTitle>
                <CardDescription>Review before final import</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div className="p-3 bg-green-50 rounded-lg text-center">
                    <p className="text-2xl text-green-600 mb-1">{sampleData.filter((d) => d.status === 'new').length}</p>
                    <p className="text-xs text-gray-600">New Records</p>
                  </div>
                  <div className="p-3 bg-yellow-50 rounded-lg text-center">
                    <p className="text-2xl text-yellow-600 mb-1">{duplicates.length}</p>
                    <p className="text-xs text-gray-600">Duplicates</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg text-center">
                    <p className="text-2xl text-gray-600 mb-1">{sampleData.length}</p>
                    <p className="text-xs text-gray-600">Total</p>
                  </div>
                </div>

                {duplicates.length > 0 && (
                  <div className="p-3 border-l-4 border-yellow-500 bg-yellow-50 rounded">
                    <div className="flex items-start gap-2">
                      <AlertTriangle size={18} className="text-yellow-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm text-yellow-900 mb-1">Duplicate Records Found</p>
                        <p className="text-xs text-yellow-800 mb-2">
                          {duplicates.length} record(s) already exist in the system
                        </p>
                        <Button size="sm" variant="outline" onClick={() => setShowDuplicates(true)}>
                          View Duplicates
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-sm mb-2">Sample Preview (first 4 records):</p>
                  <div className="space-y-2">
                    {sampleData.map((record, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs">
                        <div className="flex-1">
                          <p className="text-sm">{record.name}</p>
                          <p className="text-gray-500">{record.email}</p>
                        </div>
                        <Badge
                          variant="outline"
                          className={
                            record.status === 'new'
                              ? 'border-green-600 text-green-600'
                              : 'border-yellow-600 text-yellow-600'
                          }
                        >
                          {record.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Post-Import Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <input type="checkbox" id="sendVerification" defaultChecked />
                  <label htmlFor="sendVerification">Send verification emails to imported alumni</label>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <input type="checkbox" id="markUnverified" defaultChecked />
                  <label htmlFor="markUnverified">Mark as "Imported-Unverified" status</label>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <input type="checkbox" id="skipDuplicates" defaultChecked />
                  <label htmlFor="skipDuplicates">Skip duplicate records</label>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                Back
              </Button>
              <Button onClick={handleImport} className="flex-1" style={{ backgroundColor: '#c79b2d' }}>
                <Upload size={16} className="mr-2" />
                Start Import
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="p-4 lg:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg lg:text-xl">Import Alumni Data</h2>
              <p className="text-xs text-gray-500 mt-1">Upload and merge CSV data from legacy systems</p>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4">
            {[1, 2, 3].map((stepNum) => (
              <div key={stepNum} className="flex-1">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                      step >= stepNum
                        ? 'bg-[#0b2a4a] text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {step > stepNum ? <Check size={16} /> : stepNum}
                  </div>
                  {stepNum < 3 && (
                    <div
                      className={`flex-1 h-1 rounded ${
                        step > stepNum ? 'bg-[#0b2a4a]' : 'bg-gray-200'
                      }`}
                    ></div>
                  )}
                </div>
                <p className="text-xs mt-1 text-gray-600">
                  {stepNum === 1 ? 'Upload' : stepNum === 2 ? 'Map Fields' : 'Review'}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4 lg:p-6 pb-20 lg:pb-6">
        {importing ? (
          <Card>
            <CardContent className="p-8">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto">
                  <Users size={32} className="text-blue-600 animate-pulse" />
                </div>
                <div>
                  <p className="text-base mb-2">Importing alumni data...</p>
                  <p className="text-sm text-gray-600">Please wait while we process the records</p>
                </div>
                <Progress value={importProgress} className="w-full" />
                <p className="text-sm text-gray-500">{importProgress}% Complete</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          renderStepContent()
        )}
      </div>

      {/* Duplicates Dialog */}
      <AlertDialog open={showDuplicates} onOpenChange={setShowDuplicates}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Duplicate Records</AlertDialogTitle>
            <AlertDialogDescription>
              These records already exist in the system. You can choose to skip or merge them.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3 max-h-[400px] overflow-y-auto py-4">
            {duplicates.map((duplicate, index) => (
              <div key={index} className="p-3 border rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm">{duplicate.name}</p>
                    <p className="text-xs text-gray-500">{duplicate.email}</p>
                  </div>
                  <Badge variant="outline" className="border-yellow-600 text-yellow-600">
                    Duplicate
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                  <div>
                    <span className="text-gray-500">Phone:</span> {duplicate.phone}
                  </div>
                  <div>
                    <span className="text-gray-500">Grad Year:</span> {duplicate.gradYear}
                  </div>
                </div>
                <div className="flex gap-2 mt-2">
                  <Button size="sm" variant="outline" className="flex-1">
                    <X size={14} className="mr-2" />
                    Skip
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1">
                    Merge Data
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
            <AlertDialogAction onClick={() => toast.success('Duplicates will be skipped')}>
              Skip All Duplicates
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
