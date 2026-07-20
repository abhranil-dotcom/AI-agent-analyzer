export default function ChipList({ items, chipClass }) {
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {items.map((item) => (
        <span key={item} className={`rounded-full border px-3 py-1 text-xs font-semibold ${chipClass}`}>
          {item}
        </span>
      ))}
    </div>
  )
}
