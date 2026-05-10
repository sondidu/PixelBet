import type { ButtonHTMLAttributes } from 'react'

const BASE_CLASS =
  'group relative inline-flex h-12 items-center justify-center overflow-hidden rounded-md border border-neutral-200 bg-green-600 px-8 font-medium text-neutral-50 transition-all duration-75 [box-shadow:5px_5px_rgba(100,100,100,0.25)] active:translate-x-0.75 active:translate-y-0.75 active:[box-shadow:0px_0px_rgb(100_100_100)] cursor-pointer'

export default function Button({
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={`${BASE_CLASS} ${className}`} {...props} />
}
