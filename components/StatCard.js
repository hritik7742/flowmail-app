export default function StatCard({ title, value, icon, change }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className="text-3xl mr-4">{icon}</div>
        <div className="flex-1">
          <div className="text-sm text-gray-500">{title}</div>
          <div className="text-2xl font-bold text-gray-900">{value}</div>
          {change && (
            <div className={`text-sm ${change.positive ? 'text-green-600' : 'text-red-600'}`}>
              {change.positive ? '↗' : '↘'} {change.value}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}