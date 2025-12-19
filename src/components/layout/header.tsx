'use client';

import {
  Users,
  Home,
  Menu,
  FilePlus,
  ShieldCheck,
  LogIn,
  Heart,
  Info,
  Globe,
} from 'lucide-react';
import Image from 'next/image';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Link, usePathname, useRouter } from '@/i18n/routing';
import { useLocale, useTranslations } from 'next-intl';

const navLinksData = [
  { href: '/', labelKey: 'nav.home', icon: Home },
  { href: '/about', labelKey: 'nav.about', icon: Info },
  { href: '/contribute', labelKey: 'nav.contribute', icon: FilePlus },
  { href: '/donation', labelKey: 'nav.donation', icon: Heart },
  { href: '/admin', labelKey: 'nav.admin', icon: ShieldCheck },
];

const NavLink = ({
  href,
  children,
  className,
  closeSheet,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  closeSheet?: () => void;
}) => {
  const pathname = usePathname();
  const isActive = pathname === href;

  const link = (
    <Link
      href={href}
      className={cn(
        'transition-colors hover:text-primary',
        isActive ? 'text-primary font-bold' : 'text-muted-foreground',
        className
      )}
      onClick={closeSheet}
    >
      {children}
    </Link>
  );

  return link;
};

export function Header() {
  const t = useTranslations('Header');
  const pathname = usePathname();
  const router = useRouter();
  const currentLocale = useLocale();

  const navLinks = navLinksData.map(link => ({
    ...link,
    label: t(link.labelKey)
  }));

  const handleLanguageChange = (locale: string) => {
    router.replace(pathname, { locale });
  };

  const UserMenu = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarImage src="https://placehold.co/100x100" alt="User avatar" />
            <AvatarFallback>
              <Users />
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{t('guest.name')}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {t('guest.email')}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/login">
            <LogIn className="mr-2 h-4 w-4" />
            <span>{t('guest.login')}</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/signup">
            <Users className="mr-2 h-4 w-4" />
            <span>{t('guest.signup')}</span>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const LanguageMenu = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="mr-2">
          <Globe className="h-5 w-5" />
          <span className="sr-only">{t('switchLanguage')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleLanguageChange('en')} className={currentLocale === 'en' ? 'bg-accent' : ''}>
          English
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleLanguageChange('btk')} className={currentLocale === 'btk' ? 'bg-accent' : ''}>
          Batak
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleLanguageChange('id')} className={currentLocale === 'id' ? 'bg-accent' : ''}>
          Bahasa Indonesia
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="flex items-center space-x-2">
            <Image src="/images/icons/logo_tarombo_batak.png" alt="Tarombo Batak Logo" width={32} height={32} className="h-8 w-8" />
            <span className="hidden font-bold sm:inline-block font-headline font-toba">
              trom\bo
            </span>
          </Link>
        </div>

        <nav className="hidden items-center space-x-6 text-sm font-medium md:flex">
          {navLinks.map((link) => (
            <NavLink key={link.href} href={link.href}>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Toggle navigation menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <Link href="/" className="flex items-center space-x-2 mb-6">
                  <Image src="/images/icons/logo_tarombo_batak.png" alt="Tarombo Batak Logo" width={24} height={24} className="h-6 w-6" />
                  <span className="font-bold font-headline">{t('nav.home')}</span>
                </Link>
                <nav className="flex flex-col space-y-4">
                  {navLinks.map((link) => (
                    <SheetClose asChild key={link.href}>
                      <NavLink
                        href={link.href}
                        className="flex items-center space-x-2 text-lg"
                      >
                        <link.icon className="h-5 w-5" />
                        <span>{link.label}</span>
                      </NavLink>
                    </SheetClose>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
          <div className="flex items-center">
            <LanguageMenu />
            <UserMenu />
          </div>
        </div>
      </div>
    </header>
  );
}
