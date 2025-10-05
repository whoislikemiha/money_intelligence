"use client"

import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { ThemeToggle } from '@/components/theme-toggle'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {Wallet, Settings, DollarSign, LogOut, User, BrainCircuit} from 'lucide-react'
import { Account } from '@/lib/types'

interface NavbarProps {
  accounts?: Account[]
  selectedAccount?: Account | null
  onAccountChange?: (accountId: number) => void
}

export function Navbar({ accounts, selectedAccount, onAccountChange }: NavbarProps) {
  const router = useRouter()
  const { user, logout } = useAuth()

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Left side - Logo and Navigation */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <BrainCircuit className="h-6 w-6 text-primary " />
            </div>

            <div className="hidden md:flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => router.push('/dashboard')}
                className="gap-2"
              >
                <Wallet className="h-4 w-4" />
                Dashboard
              </Button>
              <Button
                variant="ghost"
                onClick={() => router.push('/dashboard/budgets')}
                className="gap-2"
              >
                <DollarSign className="h-4 w-4" />
                Budgets
              </Button>
              <Button
                variant="ghost"
                onClick={() => router.push('/dashboard/settings')}
                className="gap-2"
              >
                <Settings className="h-4 w-4" />
                Settings
              </Button>
            </div>
          </div>

          {/* Right side - Account selector, theme toggle, user menu */}
          <div className="flex items-center gap-4">
            {/* Account Selector */}
            {accounts && accounts.length > 0 && selectedAccount && (
              <Select
                value={selectedAccount.id.toString()}
                onValueChange={(value) => onAccountChange?.(Number(value))}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue>
                    {selectedAccount.name} ({Number(selectedAccount.current_balance).toFixed(2)} {selectedAccount.currency})
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {accounts.map(acc => (
                    <SelectItem key={acc.id} value={acc.id.toString()}>
                      {acc.name} ({Number(acc.current_balance).toFixed(2)} {acc.currency})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <ThemeToggle />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar>
                    <AvatarFallback>{user ? getInitials(user.name) : 'U'}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/dashboard/profile')}>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-red-600 dark:text-red-400">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  )
}