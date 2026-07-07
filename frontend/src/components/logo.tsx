import { Link } from 'react-router-dom'
import { BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      to="/"
      className={cn('inline-flex items-center gap-2 font-semibold text-foreground', className)}
    >
      <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
        <BarChart3 className="size-4" />
      </span>
      <span className="text-lg tracking-tight">KapustaDev</span>
    </Link>
  )
}
