import {
  LayoutDashboard,
  Package,
  Warehouse,
  ShoppingCart,
  Receipt,
  Truck,
  Wallet,
  Users,
  Building2,
  BarChart3,
  UserCog,
  GitBranch,
  Settings,
  CreditCard,
  LifeBuoy,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const navSections: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Operations',
    items: [
      { label: 'Products', to: '/products', icon: Package },
      { label: 'Inventory', to: '/inventory', icon: Warehouse },
      { label: 'POS', to: '/pos', icon: ShoppingCart },
      { label: 'Sales', to: '/sales', icon: Receipt },
      { label: 'Purchases', to: '/purchases', icon: Truck },
      { label: 'Expenses', to: '/expenses', icon: Wallet },
    ],
  },
  {
    title: 'Contacts',
    items: [
      { label: 'Customers', to: '/customers', icon: Users },
      { label: 'Suppliers', to: '/suppliers', icon: Building2 },
    ],
  },
  {
    title: 'Insights',
    items: [
      { label: 'Reports', to: '/reports', icon: BarChart3 },
    ],
  },
  {
    title: 'Administration',
    items: [
      { label: 'Staff', to: '/staff', icon: UserCog },
      { label: 'Branches', to: '/branches', icon: GitBranch },
      { label: 'Settings', to: '/settings', icon: Settings },
      { label: 'Subscription', to: '/subscription', icon: CreditCard },
    ],
  },
];

export const supportItem: NavItem = { label: 'Help & Support', to: '/support', icon: LifeBuoy };
