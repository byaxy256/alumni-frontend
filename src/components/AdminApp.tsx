
import React, { useState } from 'react';
import { Bell, Settings, Users, FileText, CreditCard, Shield, LogOut, Home, Menu, X } from 'lucide-react';
import { Button } from './ui/button';
import AdminDashboard from './admin/AdminDashboard';
import SystemConfig from './admin/SystemConfig';
import UserRoleManagement from './admin/UserRoleManagement';
import DisbursementApproval from './admin/DisbursementApproval';
import AuditLegal from './admin/AuditLegal';
import { User } from '../App';
import { ThemeToggle } from './ui/ThemeToggle';

export const AdminApp = ({ user, onLogout }: { user: User; onLogout: () => void }) => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'config' | 'users' | 'disbursements' | 'audit'>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: Home },
    { id: 'config' as const, label: 'System Config', icon: Settings },
    { id: 'users' as const, label: 'User Management', icon: Users },
    { id: 'disbursements' as const, label: 'Disbursements', icon: CreditCard },
    { id: 'audit' as const, label: 'Audit & Legal', icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col bg-sidebar">
        <div className="flex flex-col flex-1 min-h-0">

          <div className="flex items-center justify-between h-16 flex-shrink-0 px-6 bg-primary border-b border-sidebar-border">
            <h1 className="text-sidebar-foreground">Alumni connect Admin</h1>
            <ThemeToggle />
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
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
          <div className="flex-shrink-0 p-4 border-t border-sidebar-border">
            <Button
              onClick={onLogout}
              variant="ghost"
              className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-primary border-b border-border z-40">
        <div className="flex items-center justify-between h-16 px-4">
          <h1 className="text-primary-foreground">Alumni connect Admin</h1>
          <Button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            variant="ghost"
            size="icon"
            className="text-primary-foreground"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-30 bg-sidebar pt-16">
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
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent'
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
              className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent mt-4"
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
        {currentView === 'config' && <SystemConfig />}
        {currentView === 'users' && <UserRoleManagement />}
        {currentView === 'disbursements' && <DisbursementApproval />}
        {currentView === 'audit' && <AuditLegal />}
      </main>
    </div>
  );
}
