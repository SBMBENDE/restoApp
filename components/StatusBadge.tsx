import { OrderStatus } from '@/models/Order'

const statusConfig: Record<OrderStatus, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  preparing: { label: 'Preparing', color: 'bg-blue-100 text-blue-800' },
  served: { label: 'Served', color: 'bg-green-100 text-green-800' },
}

export default function StatusBadge({ status }: { status: OrderStatus }) {
  const { label, color } = statusConfig[status]
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${color}`}>
      {label}
    </span>
  )
}
