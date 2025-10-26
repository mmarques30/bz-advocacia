export interface MenuItem {
  title: string;
  label: string;
  icon: any;
  url?: string;
  badge?: number;
  submenu?: SubMenuItem[];
}

export interface SubMenuItem {
  title: string;
  url: string;
  badge?: number;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
}
