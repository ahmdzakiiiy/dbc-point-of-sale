import Image from "next/image"

interface ProductImagePlaceholderProps {
  src?: string
  alt: string
  className?: string
}

export default function ProductImagePlaceholder({ src, alt, className = "" }: ProductImagePlaceholderProps) {
  return (
    <div className={`aspect-[3/4] w-full overflow-hidden bg-gray-100 ${className}`}>
      <Image
        src={src || "/placeholder.svg?height=240&width=180"}
        alt={alt}
        width={180}
        height={240}
        className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
      />
    </div>
  )
}
