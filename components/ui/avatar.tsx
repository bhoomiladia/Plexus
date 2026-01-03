'use client'

import * as React from 'react'
import * as AvatarPrimitive from '@radix-ui/react-avatar'
import { cn } from '@/lib/utils'

function Avatar({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root>) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn(
        'relative flex size-8 shrink-0 overflow-hidden rounded-full',
        className
      )}
      {...props}
    />
  )
}

function AvatarImage({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn('aspect-square size-full', className)}
      {...props}
    />
  )
}

function AvatarFallback({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        'bg-muted flex size-full items-center justify-center rounded-full',
        className
      )}
      {...props}
    />
  )
}

/**
 * AvatarStack component
 * Displays overlapping user avatars (e.g., team members)
 */
function AvatarStack({
  images,
  max = 3,
  className,
}: {
  images: string[]
  max?: number
  className?: string
}) {
  const displayImages = images.slice(0, max)
  const remaining = images.length - max

  return (
    <div className={cn('flex items-center', className)}>
      {displayImages.map((img, idx) => (
        <div
          key={idx}
          className="relative z-0 -ml-2 first:ml-0"
          style={{ zIndex: displayImages.length - idx }}
        >
          <Avatar className="border-2 border-background">
            <AvatarImage src={img} alt={`User ${idx + 1}`} />
            <AvatarFallback>U{idx + 1}</AvatarFallback>
          </Avatar>
        </div>
      ))}
      {remaining > 0 && (
        <div className="-ml-2 flex size-8 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-medium text-foreground">
          +{remaining}
        </div>
      )}
    </div>
  )
}

export { Avatar, AvatarImage, AvatarFallback, AvatarStack }
