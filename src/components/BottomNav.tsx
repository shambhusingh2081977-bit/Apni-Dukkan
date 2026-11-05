import React from 'react';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard,
  Boxes,
  Receipt,
  TrendingUp,
  Settings,
  CircleDollarSign,
  Users,
} from 'lucide-react';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, cart, creditCustomers, t } = useApp();

  const customersWithDue = creditCustomers.filter((c) => c.totalDue > 0).length;

  const navItems = [
    {
      id: 'home' as const,
      label: t.home,
      icon: LayoutDashboard,
    },
    {
      id: 'stock' as const,
      label: t.stock,
      icon: Boxes,
    },
    {
      id: 'billing' as const,
      label: t.billing,
      icon: Receipt,
      isPrimary: true,
      badge: cart.length > 0 ? cart.length : null,
    },
    {
      id: 'credit' as const,
      label: t.creditKhata,
      icon: Users,
      badge: customersWithDue > 0 ? customersWithDue : null,
    },
    {
      id: 'purchases' as const,
      label: t.purchases,
      icon: CircleDollarSign,
    },
    {
      id: 'reports' as const,
      label: t.reports,
      icon: TrendingUp,
    },
    {
      id: 'settings' as const,
      label: t.settings,
      icon: Settings,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-lg mx-auto px-2 py-1.5 flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          if (item.isPrimary) {
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                aria-label={item.label}
                className="relative -top-4 flex flex-col items-center group focus:outline-none"
              >
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg transition-transform duration-200 active:scale-95 ${
                    isActive
                      ? 'bg-gradient-to-tr from-emerald-600 to-teal-500 ring-4 ring-emerald-500/20'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  <Icon className="w-7 h-7" />
                  {item.badge && (
                    <span className="absolute -top-1 -right-1 min-w-[22px] h-[22px] px-1 bg-amber-500 text-white text-[11px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span
                  className={`text-[11px] font-bold mt-1 ${
                    isActive
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              aria-label={item.label}
              className={`flex flex-col items-center py-1 px-2 rounded-xl transition duration-150 active:scale-90 ${
                isActive
                  ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
              <span className="text-[10px] mt-1 truncate max-w-[65px]">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
