
import React, { useState } from 'react';
import { Settings, Users, CreditCard, Shield, LogOut, Home, Menu, X, UserCheck, BarChart3 } from 'lucide-react';
import { Button } from './ui/button';
import AdminDashboard from './admin/AdminDashboard';
import AdminReports from './admin/AdminReports';
import SystemConfig from './admin/SystemConfig';
import UserRoleManagement from './admin/UserRoleManagement';
import DisbursementApproval from './admin/DisbursementApproval';
import AuditLegal from './admin/AuditLegal';
import AlumniOfficeApproval from './admin/AlumniOfficeApproval';
import { User } from '../App';
import { UcuBadgeLogo } from './UcuBadgeLogo';

export const AdminApp = ({ user, onLogout }: { user: User; onLogout: () => void }) => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'reports' | 'config' | 'users' | 'disbursements' | 'audit' | 'alumni-approval'>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: Home },
    { id: 'reports' as const, label: 'Reports & Analytics', icon: BarChart3 },
    { id: 'config' as const, label: 'Settings', icon: Settings },
    { id: 'users' as const, label: 'User Management', icon: Users },
    { id: 'alumni-approval' as const, label: 'Alumni Office Approval', icon: UserCheck },
    { id: 'disbursements' as const, label: 'Disbursements', icon: CreditCard },
    { id: 'audit' as const, label: 'Audit & Legal', icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col bg-gradient-to-b from-[#0b2a4a] via-[#0b2a4a] to-[#020617] text-slate-100 shadow-2xl">
        <div className="flex flex-col flex-1 min-h-0">

          <div className="flex items-center justify-between h-16 flex-shrink-0 px-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <UcuBadgeLogo className="h-8 w-8" />
              <div>
                <h1 className="text-sm font-semibold text-white">Alumni Circle</h1>
                <p className="text-xs text-slate-300 mt-0.5">System Admin</p>
              </div>
            </div>
          </div>
          <nav className="flex-1 px-4 py-6 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    currentView === item.id
                      ? 'bg-white/12 text-white'
                      : 'text-slate-200 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
          <div className="flex-shrink-0 p-4 border-t border-white/10">
            <Button
              onClick={onLogout}
              variant="ghost"
              className="w-full justify-start text-slate-200 hover:bg-white/5 hover:text-white"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-[#0b2a4a] border-b border-border z-40">
        <div className="flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-3">
            <UcuBadgeLogo className="h-8 w-8" />
            <div>
              <h1 className="text-sm font-semibold text-white">Alumni Circle</h1>
              <p className="text-xs text-slate-200 mt-0.5">System Admin</p>
            </div>
          </div>
          <Button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            variant="ghost"
            size="icon"
            className="text-white"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-30 bg-gradient-to-b from-[#0b2a4a] via-[#0b2a4a] to-[#020617] pt-16 text-slate-100">
          <nav className="p-4 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentView(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    currentView === item.id
                      ? 'bg-white/12 text-white'
                      : 'text-slate-200 hover:bg-white/5 hover:text-white'
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
              className="w-full justify-start text-slate-200 hover:bg-white/5 hover:text-white mt-4"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Logout
            </Button>
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className="lg:pl-72 pt-16 lg:pt-0 min-h-screen bg-white">
        {currentView === 'dashboard' && <AdminDashboard />}
        {currentView === 'reports' && <AdminReports />}
        {currentView === 'config' && <SystemConfig />}
        {currentView === 'users' && <UserRoleManagement />}
        {currentView === 'alumni-approval' && <AlumniOfficeApproval />}
        {currentView === 'disbursements' && <DisbursementApproval />}
        {currentView === 'audit' && <AuditLegal />}
      </main>
    </div>
  );
}
