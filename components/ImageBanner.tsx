import Image from 'next/image'

interface ImageBannerProps {
  src: string
  alt: string
  className?: string
  children?: React.ReactNode
}

export default function ImageBanner({ src, alt, className = '', children }: ImageBannerProps) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover"
        priority
      />
      <div className="absolute inset-0 bg-black bg-opacity-40"></div>
      {children && (
        <div className="relative z-10">
          {children}
        </div>
      )}
    </div>
  )
}