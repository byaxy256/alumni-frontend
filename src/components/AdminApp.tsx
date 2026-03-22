
import React, { useState } from 'react';
import { Settings, Users, CreditCard, Shield, LogOut, Home, Menu, X, UserCheck, BarChart3, DollarSign } from 'lucide-react';
import { Button } from './ui/button';
import AdminDashboard from './admin/AdminDashboard';
import AdminReports from './admin/AdminReports';
import AdminFundRequests from './admin/AdminFundRequests';
import SystemConfig from './admin/SystemConfig';
import UserRoleManagement from './admin/UserRoleManagement';
import DisbursementApproval from './admin/DisbursementApproval';
import AuditLegal from './admin/AuditLegal';
import AlumniOfficeApproval from './admin/AlumniOfficeApproval';
import { User } from '../App';
import { UcuBadgeLogo } from './UcuBadgeLogo';

export const AdminApp = ({ user, onLogout }: { user: User; onLogout: () => void }) => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'reports' | 'config' | 'users' | 'disbursements' | 'audit' | 'alumni-approval' | 'fund-requests'>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: Home },
    { id: 'reports' as const, label: 'Reports & Analytics', icon: BarChart3 },
    { id: 'config' as const, label: 'System Config', icon: Settings },
    { id: 'users' as const, label: 'User Management', icon: Users },
    { id: 'alumni-approval' as const, label: 'Alumni Office Approval', icon: UserCheck },
    { id: 'fund-requests' as const, label: 'Requested Funds', icon: DollarSign },
    { id: 'disbursements' as const, label: 'Disbursements', icon: CreditCard },
    { id: 'audit' as const, label: 'Audit & Legal', icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-[var(--brand-blue-soft-10)] text-foreground">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col bg-white border-r border-black/10">
        <div className="flex flex-col flex-1 min-h-0">

          <div className="flex items-center justify-between h-16 flex-shrink-0 px-6 border-b border-black/10" style={{ backgroundColor: '#8A1F3A' }}>
            <div className="flex items-center gap-3">
              <UcuBadgeLogo className="h-8 w-8" />
              <h1 className="text-white font-semibold">Alumni Admin</h1>
            </div>
          </div>
          <nav className="flex-1 px-3 py-6 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm ${
                    currentView === item.id
                      ? 'bg-blue-100 text-blue-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
          <div className="flex-shrink-0 p-4 border-t border-black/10">
            <Button
              onClick={onLogout}
              variant="ghost"
              className="w-full justify-start text-gray-700 hover:bg-gray-100 text-sm"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 border-b border-black/10 z-40 shadow-sm" style={{ backgroundColor: '#8A1F3A' }}>
        <div className="flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-3">
            <UcuBadgeLogo className="h-8 w-8" />
            <h1 className="text-white font-semibold text-sm">Alumni Admin</h1>
          </div>
          <Button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-30 bg-white pt-16">
          <nav className="p-3 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentView(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm ${
                    currentView === item.id
                      ? 'bg-blue-100 text-blue-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
            <Button
              onClick={onLogout}
              variant="ghost"
              className="w-full justify-start text-gray-700 hover:bg-gray-100 text-sm mt-4"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Logout
            </Button>
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className="lg:pl-72 pt-16 lg:pt-0 min-h-screen">
        {currentView === 'dashboard' && <AdminDashboard />}
        {currentView === 'reports' && <AdminReports />}
        {currentView === 'config' && <SystemConfig />}
        {currentView === 'users' && <UserRoleManagement />}
        {currentView === 'alumni-approval' && <AlumniOfficeApproval />}
        {currentView === 'disbursements' && <DisbursementApproval />}
        {currentView === 'audit' && <AuditLegal />}
        {currentView === 'fund-requests' && <AdminFundRequests />}
      </main>
    </div>
  );
}
