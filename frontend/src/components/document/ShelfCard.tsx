import { Card, CardContent } from '@/components/ui/card'

export interface ShelfItem {
  id: string
  name: string
  description?: string
  image?: string
}

interface ShelfCardProps {
  shelf: ShelfItem
  onClick?: () => void
}

export function ShelfCard({ shelf, onClick }: ShelfCardProps) {
  const cover = shelf.image 
  return (
    <Card 
    onClick={onClick} 
    className="group hover:shadow-md transition-shadow duration-200 border border-blue-100/50 bg-white overflow-hidden rounded-xl cursor-pointer h-full"
>
    <CardContent className="p-0 flex flex-col h-full">
        <div 
            className="relative h-32 sm:h-36 bg-cover bg-center"
            style={{ backgroundImage: `url(${cover})` }}
            aria-label="Shelf background"
        >
            <div className="absolute inset-0 bg-black/10" />
        </div>
        <div className="p-4 flex-grow">
            <h3 className="font-semibold text-gray-900 text-base mb-1 group-hover:text-blue-600 transition-colors">
                {shelf.name}
            </h3>
            {shelf.description && (
                <p className="text-[13px] text-gray-600 line-clamp-2">{shelf.description}</p>
            )}
        </div>
    </CardContent>
</Card>
  )
}
