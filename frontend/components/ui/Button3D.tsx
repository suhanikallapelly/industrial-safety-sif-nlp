'use client'

import React, { useState } from 'react'
import { motion, HTMLMotionProps } from 'framer-motion'
import { Loader2 } from 'lucide-react'

export interface Button3DProps extends HTMLMotionProps<'button'> {
  children?: React.ReactNode
  variant?: 'primary' | 'secondary' | 'ghost' | 'voice'
  size?: 'sm' | 'md' | 'lg' | 'icon'
  isLoading?: boolean
  loadingText?: string
  icon?: React.ReactNode
}

export const Button3D: React.FC<Button3DProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  loadingText = 'Evaluating Risk...',
  icon,
  className = '',
  disabled,
  onClick,
  ...props
}) => {
  const [isHovered, setIsHovered] = useState(false)

  // Size configurations
  const sizeStyles = {
    sm: 'px-4 py-2 text-xs font-semibold gap-2',
    md: 'px-6 py-3 text-sm font-bold gap-2.5',
    lg: 'px-8 py-3.5 text-sm sm:text-base font-extrabold gap-3',
    icon: 'w-11 h-11 p-0 flex items-center justify-center',
  }

  // Variant styles with tactile physical depth
  const variantStyles = {
    primary: `
      bg-gradient-to-b from-cyan-400 via-cyan-500 to-blue-600
      text-slate-950 font-extrabold
      shadow-[0_6px_20px_rgba(0,242,254,0.3),0_2px_4px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.4),inset_0_-2px_0_rgba(0,0,0,0.3)]
      hover:shadow-[0_8px_26px_rgba(0,242,254,0.45),0_3px_6px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.6),inset_0_-2px_0_rgba(0,0,0,0.3)]
      border border-cyan-300/40
    `,
    secondary: `
      bg-gradient-to-b from-white/[0.08] to-white/[0.03]
      text-slate-200 font-semibold
      border border-white/15
      shadow-[0_4px_14px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.15),inset_0_-1px_0_rgba(0,0,0,0.4)]
      hover:border-white/30 hover:text-white hover:bg-white/[0.12]
      hover:shadow-[0_6px_18px_rgba(0,0,0,0.45),inset_0_1px_1px_rgba(255,255,255,0.2)]
    `,
    ghost: `
      bg-transparent text-slate-400 hover:text-white hover:bg-white/5
      border border-transparent hover:border-white/10
    `,
    voice: `
      bg-gradient-to-b from-white/[0.1] to-white/[0.04]
      text-slate-200 border border-white/20
      shadow-[0_6px_20px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.25),inset_0_-2px_0_rgba(0,0,0,0.5)]
      hover:border-cyan-400/60 hover:text-cyan-300
      hover:shadow-[0_8px_24px_rgba(0,242,254,0.25),inset_0_1px_1px_rgba(255,255,255,0.35)]
    `,
  }

  const isDisabled = disabled || isLoading

  return (
    <motion.button
      whileHover={!isDisabled ? { y: -2, scale: 1.01 } : {}}
      whileTap={!isDisabled ? { y: 1, scale: 0.985 } : {}}
      transition={{ type: 'spring', stiffness: 450, damping: 25 }}
      disabled={isDisabled}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        relative inline-flex items-center justify-center
        transition-all duration-150 cursor-pointer select-none
        overflow-hidden tracking-wide font-sans
        ${sizeStyles[size]}
        ${variantStyles[variant]}
        ${isDisabled ? 'opacity-40 cursor-not-allowed grayscale pointer-events-none' : ''}
        ${className}
      `}
      {...props}
    >
      {/* Subtle top light sheen for tactile glass/physical feel */}
      <span className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />

      {/* Content */}
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-current" />
          <span>{loadingText}</span>
        </>
      ) : (
        <>
          {icon && <span className="flex-shrink-0">{icon}</span>}
          {children}
        </>
      )}
    </motion.button>
  )
}
