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
import {Wallet, Settings, DollarSign, LogOut, User, BrainCircuit, Sparkles, Bell, PiggyBank} from 'lucide-react'
import { Account } from '@/lib/types'
import { useState, useEffect } from 'react'
import { reminderApi } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import DueRemindersDialog from '@/components/DueRemindersDialog'

interface NavbarProps {
  accounts?: Account[]
  selectedAccount?: Account | null
  onAccountChange?: (accountId: number) => void
  balancesVisible?: boolean
}

export function Navbar({ accounts, selectedAccount, onAccountChange, balancesVisible = true }: NavbarProps) {
  const router = useRouter()
  const { user, logout } = useAuth()
  const [dueRemindersCount, setDueRemindersCount] = useState(0)
  const [remindersDialogOpen, setRemindersDialogOpen] = useState(false)

  useEffect(() => {
    loadDueRemindersCount()
    // Poll for due reminders every 5 minutes
    const interval = setInterval(loadDueRemindersCount, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const loadDueRemindersCount = async () => {
    try {
      const dueReminders = await reminderApi.getDue()
      setDueRemindersCount(dueReminders.length)
    } catch (error) {
      console.error('Failed to load due reminders count:', error)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const formatBalance = (amount: number, currency: string) => {
    if (balancesVisible) {
      return `${amount.toFixed(2)} ${currency}`;
    }
    return '••••••';
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
                onClick={() => router.push('/dashboard/savings')}
                className="gap-2"
              >
                <PiggyBank className="h-4 w-4" />
                Savings
              </Button>
              <Button
                variant="ghost"
                onClick={() => router.push('/dashboard/reminders')}
                className="gap-2"
              >
                <Bell className="h-4 w-4" />
                Reminders
              </Button>
              <Button
                variant="ghost"
                onClick={() => router.push('/dashboard/assistant')}
                className="gap-2"
              >
                <Sparkles className="h-4 w-4" />
                Assistant
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
                    {selectedAccount.name} ({formatBalance(Number(selectedAccount.current_balance), selectedAccount.currency)})
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {accounts.map(acc => (
                    <SelectItem key={acc.id} value={acc.id.toString()}>
                      {acc.name} ({formatBalance(Number(acc.current_balance), acc.currency)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Reminders Bell */}
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => setRemindersDialogOpen(true)}
            >
              <Bell className="h-5 w-5" />
              {dueRemindersCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
                >
                  {dueRemindersCount}
                </Badge>
              )}
            </Button>

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

      {/* Due Reminders Dialog */}
      <DueRemindersDialog
        open={remindersDialogOpen}
        onOpenChange={setRemindersDialogOpen}
        onReminderProcessed={loadDueRemindersCount}
      />
    </nav>
  )
}