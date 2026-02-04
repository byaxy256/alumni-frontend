import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Save, Key, Smartphone, CreditCard, Shield, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';
import { toast } from 'sonner';

export default function SystemConfig() {
  const [config, setConfig] = useState({
    mtnApiKey: 'sk_mtn_**********************',
    airtelApiKey: 'sk_airtel_********************',
    crbApiKey: 'crb_**********************',
    twilioSid: 'AC********************************',
    twilioToken: '********************************',
    sendgridApiKey: 'SG.****************************',
    gracePeriodDays: '30',
    defaultInterestRate: '5',
    maxLoanAmount: '10000000',
    chopEnabled: true,
    autoApprovalEnabled: false,
    crbCheckEnabled: true,
    emailNotifications: true,
    smsNotifications: true,
  });

  const handleSave = () => {
    toast.success('Configuration saved successfully');
  };

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div>
        <h1>System Configuration</h1>
        <p className="text-muted-foreground">Manage integrations, payment gateways, and system policies</p>
      </div>

      <Alert>
        <Shield className="w-4 h-4" />
        <AlertDescription>
          Changes to system configuration will affect all users. Please verify settings before saving.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="payments" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="policies">Policies</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="w-5 h-5" />
                Mobile Money Integration
              </CardTitle>
              <CardDescription>Configure MTN and Airtel Mobile Money API credentials</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mtnApiKey">MTN API Key</Label>
                <Input
                  id="mtnApiKey"
                  type="password"
                  value={config.mtnApiKey}
                  onChange={(e) => setConfig({ ...config, mtnApiKey: e.target.value })}
                  placeholder="Enter MTN API key"
                />
                <p className="text-sm text-muted-foreground">Get your API key from MTN MoMo Developer Portal</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="airtelApiKey">Airtel API Key</Label>
                <Input
                  id="airtelApiKey"
                  type="password"
                  value={config.airtelApiKey}
                  onChange={(e) => setConfig({ ...config, airtelApiKey: e.target.value })}
                  placeholder="Enter Airtel API key"
                />
                <p className="text-sm text-muted-foreground">Get your API key from Airtel Money Business Portal</p>
              </div>

              <div className="pt-4">
                <Button onClick={handleSave}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Payment Settings
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Credit Reference Bureau (CRB)
              </CardTitle>
              <CardDescription>Configure CRB API for credit checks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="crbApiKey">CRB API Key</Label>
                <Input
                  id="crbApiKey"
                  type="password"
                  value={config.crbApiKey}
                  onChange={(e) => setConfig({ ...config, crbApiKey: e.target.value })}
                  placeholder="Enter CRB API key"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable CRB Checks</Label>
                  <p className="text-sm text-muted-foreground">Automatically check credit history for loan applications</p>
                </div>
                <Switch
                  checked={config.crbCheckEnabled}
                  onCheckedChange={(checked: any) => setConfig({ ...config, crbCheckEnabled: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Services</CardTitle>
              <CardDescription>Configure email and SMS notification providers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sendgridApiKey">SendGrid API Key</Label>
                <Input
                  id="sendgridApiKey"
                  type="password"
                  value={config.sendgridApiKey}
                  onChange={(e) => setConfig({ ...config, sendgridApiKey: e.target.value })}
                  placeholder="Enter SendGrid API key"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="twilioSid">Twilio Account SID</Label>
                <Input
                  id="twilioSid"
                  type="password"
                  value={config.twilioSid}
                  onChange={(e) => setConfig({ ...config, twilioSid: e.target.value })}
                  placeholder="Enter Twilio SID"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="twilioToken">Twilio Auth Token</Label>
                <Input
                  id="twilioToken"
                  type="password"
                  value={config.twilioToken}
                  onChange={(e) => setConfig({ ...config, twilioToken: e.target.value })}
                  placeholder="Enter Twilio auth token"
                />
              </div>

              <div className="border-t pt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Send email notifications for all events</p>
                  </div>
                  <Switch
                    checked={config.emailNotifications}
                    onCheckedChange={(checked: any) => setConfig({ ...config, emailNotifications: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>SMS Notifications</Label>
                    <p className="text-sm text-muted-foreground">Send SMS notifications for critical events</p>
                  </div>
                  <Switch
                    checked={config.smsNotifications}
                    onCheckedChange={(checked: any) => setConfig({ ...config, smsNotifications: checked })}
                  />
                </div>
              </div>

              <div className="pt-4">
                <Button onClick={handleSave}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Notification Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="policies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Loan Policies</CardTitle>
              <CardDescription>Configure default loan terms and deduction rules</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="maxLoanAmount">Maximum Loan Amount (UGX)</Label>
                <Input
                  id="maxLoanAmount"
                  type="number"
                  value={config.maxLoanAmount}
                  onChange={(e) => setConfig({ ...config, maxLoanAmount: e.target.value })}
                  placeholder="10000000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="defaultInterestRate">Default Interest Rate (%)</Label>
                <Input
                  id="defaultInterestRate"
                  type="number"
                  value={config.defaultInterestRate}
                  onChange={(e) => setConfig({ ...config, defaultInterestRate: e.target.value })}
                  placeholder="5"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gracePeriodDays">Grace Period (Days)</Label>
                <Input
                  id="gracePeriodDays"
                  type="number"
                  value={config.gracePeriodDays}
                  onChange={(e) => setConfig({ ...config, gracePeriodDays: e.target.value })}
                  placeholder="30"
                />
                <p className="text-sm text-muted-foreground">Days before late fees are applied</p>
              </div>

              <div className="border-t pt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Chop Deductions</Label>
                    <p className="text-sm text-muted-foreground">Automatically deduct from university disbursements</p>
                  </div>
                  <Switch
                    checked={config.chopEnabled}
                    onCheckedChange={(checked: any) => setConfig({ ...config, chopEnabled: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto-Approval (Small Amounts)</Label>
                    <p className="text-sm text-muted-foreground">Automatically approve loans under UGX 500,000</p>
                  </div>
                  <Switch
                    checked={config.autoApprovalEnabled}
                    onCheckedChange={(checked: any) => setConfig({ ...config, autoApprovalEnabled: checked })}
                  />
                </div>
              </div>

              <div className="pt-4">
                <Button onClick={handleSave}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Policy Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Manage authentication and access control</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>
                  All API keys are encrypted at rest. Changing keys will require all integrations to be updated.
                </AlertDescription>
              </Alert>

              <div className="space-y-4 pt-4">
                <Button variant="outline" className="w-full justify-start">
                  <Key className="w-4 h-4 mr-2" />
                  Rotate All API Keys
                </Button>
                
                <Button variant="outline" className="w-full justify-start">
                  <Shield className="w-4 h-4 mr-2" />
                  View Security Audit Log
                </Button>

                <Button variant="outline" className="w-full justify-start">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Test Payment Gateway Connection
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
