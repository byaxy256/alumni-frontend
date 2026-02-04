import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Mail, Send, Eye, Clock, Users, TrendingUp, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';

const emailTemplates = [
  { id: 'scholarship', name: 'Scholarship Announcement', subject: 'New Scholarship Opportunities Available' },
  { id: 'event', name: 'Event Invitation', subject: 'You\'re Invited: UCU Alumni Gathering' },
  { id: 'fundraiser', name: 'Fundraising Campaign', subject: 'Support UCU Students - Make a Difference' },
  { id: 'newsletter', name: 'Monthly Newsletter', subject: 'Alumni Aid Update - {{Month}} {{Year}}' },
  { id: 'reminder', name: 'Loan Reminder', subject: 'Loan Repayment Due Soon' },
];

const emailHistory = [
  { id: 1, subject: 'Scholarship opportunities for 2024', recipients: 1234, sent: '2024-11-01 10:30', opened: 876, clicked: 234 },
  { id: 2, subject: 'Alumni Homecoming Event - Register Now', recipients: 2847, sent: '2024-10-28 14:15', opened: 1823, clicked: 456 },
  { id: 3, subject: 'Support UCU Students This Christmas', recipients: 1847, sent: '2024-10-25 09:00', opened: 1234, clicked: 345 },
  { id: 4, subject: 'October Newsletter - Alumni Success Stories', recipients: 2847, sent: '2024-10-15 08:00', opened: 1956, clicked: 567 },
];

export default function BroadcastEmail() {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [segmentGradYear, setSegmentGradYear] = useState<string>('all');
  const [segmentProgram, setSegmentProgram] = useState<string>('all');
  const [segmentLocation, setSegmentLocation] = useState<string>('all');
  const [unsubscribeEnabled, setUnsubscribeEnabled] = useState(true);
  const [scheduleSend, setScheduleSend] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const estimatedRecipients = 1234; // Mock calculation based on segments

  const handleSend = () => {
    if (!subject || !body) {
      toast.error('Please fill in subject and message body');
      return;
    }
    toast.success(`Email scheduled to ${estimatedRecipients} recipients`);
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = emailTemplates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(templateId);
      setSubject(template.subject);
      // In real app, would load template body
      setBody('Template content would load here...');
    }
  };

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div>
        <h2>Broadcast Email</h2>
        <p className="text-muted-foreground">Compose and send emails to alumni segments</p>
      </div>

      <Tabs defaultValue="compose" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="compose">Compose</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="compose" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Compose Area */}
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="w-5 h-5" />
                    Compose Email
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="template">Template (Optional)</Label>
                    <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                      <SelectTrigger>
                        <SelectValue placeholder="Start from scratch or select template" />
                      </SelectTrigger>
                      <SelectContent>
                        {emailTemplates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject Line</Label>
                    <Input
                      id="subject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Enter email subject"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="body">Message Body</Label>
                    <Textarea
                      id="body"
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      placeholder="Compose your email message..."
                      rows={10}
                    />
                    <p className="text-sm text-muted-foreground">
                      Use variables: {'{{FirstName}}'}, {'{{LastName}}'}, {'{{GradYear}}'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center gap-2">
                      <Switch
                        id="unsubscribe"
                        checked={unsubscribeEnabled}
                        onCheckedChange={setUnsubscribeEnabled}
                      />
                      <Label htmlFor="unsubscribe">Include unsubscribe link</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Segmentation & Preview */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Audience Segmentation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="gradYear">Graduation Year</Label>
                    <Select value={segmentGradYear} onValueChange={setSegmentGradYear}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Years</SelectItem>
                        <SelectItem value="2024">2024</SelectItem>
                        <SelectItem value="2023">2023</SelectItem>
                        <SelectItem value="2022">2022</SelectItem>
                        <SelectItem value="2021">2021</SelectItem>
                        <SelectItem value="2020">2020 & Earlier</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="program">Program</Label>
                    <Select value={segmentProgram} onValueChange={setSegmentProgram}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Programs</SelectItem>
                        <SelectItem value="business">Business Administration</SelectItem>
                        <SelectItem value="law">Law</SelectItem>
                        <SelectItem value="engineering">Engineering</SelectItem>
                        <SelectItem value="theology">Theology</SelectItem>
                        <SelectItem value="education">Education</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Select value={segmentLocation} onValueChange={setSegmentLocation}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Locations</SelectItem>
                        <SelectItem value="kampala">Kampala</SelectItem>
                        <SelectItem value="mukono">Mukono</SelectItem>
                        <SelectItem value="mbale">Mbale</SelectItem>
                        <SelectItem value="arua">Arua</SelectItem>
                        <SelectItem value="international">International</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Estimated Recipients:</span>
                      <Badge variant="secondary" className="text-lg">
                        {estimatedRecipients}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Scheduling
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="schedule">Schedule for later</Label>
                    <Switch
                      id="schedule"
                      checked={scheduleSend}
                      onCheckedChange={setScheduleSend}
                    />
                  </div>

                  {scheduleSend && (
                    <div className="space-y-2">
                      <Label htmlFor="sendDate">Send Date & Time</Label>
                      <Input
                        id="sendDate"
                        type="datetime-local"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="space-y-2">
                <Dialog open={showPreview} onOpenChange={setShowPreview}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full">
                      <Eye className="w-4 h-4 mr-2" />
                      Preview Email
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Email Preview</DialogTitle>
                      <DialogDescription>How recipients will see your email</DialogDescription>
                    </DialogHeader>
                    <div className="border rounded-lg p-6 space-y-4 bg-white">
                      <div className="border-b pb-4">
                        <p className="text-sm text-muted-foreground">Subject:</p>
                        <p>{subject || 'No subject'}</p>
                      </div>
                      <div className="whitespace-pre-wrap">
                        {body || 'No message body'}
                      </div>
                      {unsubscribeEnabled && (
                        <div className="border-t pt-4 text-xs text-muted-foreground">
                          <a href="#" className="underline">Unsubscribe from these emails</a>
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
                
                <Button onClick={handleSend} className="w-full">
                  <Send className="w-4 h-4 mr-2" />
                  {scheduleSend ? 'Schedule Send' : 'Send Now'}
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Campaign History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {emailHistory.map((email) => (
                  <div key={email.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p>{email.subject}</p>
                        <p className="text-sm text-muted-foreground">
                          Sent to {email.recipients} recipients on {email.sent}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Open Rate</p>
                        <div className="flex items-center gap-2">
                          <p>{Math.round((email.opened / email.recipients) * 100)}%</p>
                          <TrendingUp className="w-4 h-4 text-green-600" />
                        </div>
                        <p className="text-xs text-muted-foreground">{email.opened} opens</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Click Rate</p>
                        <div className="flex items-center gap-2">
                          <p>{Math.round((email.clicked / email.recipients) * 100)}%</p>
                          <TrendingUp className="w-4 h-4 text-blue-600" />
                        </div>
                        <p className="text-xs text-muted-foreground">{email.clicked} clicks</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Recipients</p>
                        <p>{email.recipients}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
