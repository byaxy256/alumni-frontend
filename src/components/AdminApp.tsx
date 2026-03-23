
import React, { useState } from 'react';
import { Settings, Users, CreditCard, Shield, LogOut, Home, Menu, UserCheck, BarChart3, DollarSign, ShoppingCart } from 'lucide-react';
import { Button } from './ui/button';
import AdminDashboard from './admin/AdminDashboard';
import AdminReports from './admin/AdminReports';
import AdminFundRequests from './admin/AdminFundRequests';
import SystemConfig from './admin/SystemConfig';
import UserRoleManagement from './admin/UserRoleManagement';
import DisbursementApproval from './admin/DisbursementApproval';
import AuditLegal from './admin/AuditLegal';
import AlumniOfficeApproval from './admin/AlumniOfficeApproval';
import AdminOrders from './alumni_office_staff/AdminOrders';
import { User } from '../App';
import { UcuBadgeLogo } from './UcuBadgeLogo';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

export const AdminApp = ({ user, onLogout }: { user: User; onLogout: () => void }) => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'reports' | 'config' | 'users' | 'disbursements' | 'audit' | 'alumni-approval' | 'fund-requests' | 'orders'>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: Home },
    { id: 'reports' as const, label: 'Reports & Analytics', icon: BarChart3 },
    { id: 'config' as const, label: 'System Config', icon: Settings },
    { id: 'users' as const, label: 'User Management', icon: Users },
    { id: 'alumni-approval' as const, label: 'Alumni Office Approval', icon: UserCheck },
    { id: 'fund-requests' as const, label: 'Requested Funds', icon: DollarSign },
    { id: 'orders' as const, label: 'Shop Orders', icon: ShoppingCart },
    { id: 'disbursements' as const, label: 'Disbursements', icon: CreditCard },
    { id: 'audit' as const, label: 'Audit & Legal', icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-[var(--brand-blue-soft-10)] text-foreground">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col border-r border-black/20 text-white" style={{ backgroundColor: '#8A1F3A' }}>
        <div className="flex flex-col flex-1 min-h-0">

          <div className="flex items-center justify-between h-16 flex-shrink-0 px-6 border-b border-black/20" style={{ backgroundColor: '#8A1F3A' }}>
            <div className="flex items-center gap-3">
              <UcuBadgeLogo className="h-8 w-8" />
              <h1 className="text-white font-semibold">Alumni Admin</h1>
            </div>
          </div>
          <nav className="flex-1 px-4 py-6 space-y-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    currentView === item.id
                      ? item.id === 'fund-requests'
                        ? 'bg-[#0b2a4a] text-white shadow-sm font-medium'
                        : 'bg-white/20 text-white shadow-sm font-medium'
                      : 'text-white/90 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm">{item.label}</span>
                </button>
              );
            })}
          </nav>
          <div className="flex-shrink-0 p-4 border-t border-black/20">
            <Button
              onClick={onLogout}
              variant="ghost"
              className="w-full justify-start text-white hover:bg-white/10"
            >
              <LogOut className="w-5 h-5 mr-3" />
              <span className="text-sm">Logout</span>
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
          <DropdownMenu open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="bg-black/20 text-white hover:bg-black/30">
                <Menu className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 border-black/30 text-white" style={{ backgroundColor: '#8A1F3A' }}>
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <DropdownMenuItem
                    key={item.id}
                    className="focus:bg-black/15 focus:text-white"
                    onClick={() => {
                      setCurrentView(item.id);
                      setMobileMenuOpen(false);
                    }}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {item.label}
                  </DropdownMenuItem>
                );
              })}
              <DropdownMenuItem className="focus:bg-black/15 focus:text-white" onClick={onLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

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
        {currentView === 'orders' && <AdminOrders />}
      </main>
    </div>
  );
}
