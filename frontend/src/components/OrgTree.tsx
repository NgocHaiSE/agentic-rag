import React, { useMemo, useState } from 'react'

export type OrgUnit = {
  id: string
  code?: string | null
  name: string
  parent_id?: string | null
}

type Props = {
  items: OrgUnit[]
  value: string
  onChange: (id: string) => void
  className?: string
}

type Node = OrgUnit & { children: Node[] }

function buildTree(items: OrgUnit[]): Node[] {
  const byId = new Map<string, Node>()
  items.forEach((it) => byId.set(it.id, { ...it, children: [] }))
  const roots: Node[] = []
  byId.forEach((node) => {
    const pid = node.parent_id || ''
    if (pid && byId.has(pid)) byId.get(pid)!.children.push(node)
    else roots.push(node)
  })
  const sortRec = (ns: Node[]) => {
    ns.sort((a, b) => a.name.localeCompare(b.name, 'vi'))
    ns.forEach((n) => sortRec(n.children))
  }
  sortRec(roots)
  return roots
}

export default function OrgTree({ items, value, onChange, className }: Props) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [q, setQ] = useState('')

  const tree = useMemo(() => buildTree(items), [items])

  const matches = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return new Set<string>()
    const set = new Set<string>()
    items.forEach((it) => {
      const code = (it.code || '').toLowerCase()
      const name = it.name.toLowerCase()
      if (code.includes(s) || name.includes(s)) set.add(it.id)
    })
    return set
  }, [q, items])

  const toggle = (id: string) => setExpanded((e) => ({ ...e, [id]: !e[id] }))

  const renderNode = (node: Node, depth = 0): React.ReactNode => {
    const hasChildren = node.children.length > 0
    const isOpen = expanded[node.id] || !!q
    const isMatch = matches.size ? matches.has(node.id) : true
    const shouldRender = !matches.size || isMatch || node.children.some((c) => hasMatchDeep(c, matches))
    if (!shouldRender) return null
    return (
      <div key={node.id} className="select-none transition-all duration-200 ease-in-out">
        <div className="flex items-center py-1.5 hover:bg-gray-50 rounded-md transition-colors">
          <div style={{ width: depth * 16 }} />
          {hasChildren ? (
            <button
              type="button"
              onClick={() => toggle(node.id)}
              className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors"
              aria-label={isOpen ? `Collapse ${node.name}` : `Expand ${node.name}`}
            >
              <svg
                className={`w-4 h-4 transform transition-transform ${isOpen ? 'rotate-90' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ) : (
            <span className="w-6" />
          )}
          <label className="flex items-center gap-2 cursor-pointer flex-1 py-1">
            <input
              type="radio"
              name="org_unit"
              className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              checked={value === node.id}
              onChange={() => onChange(node.id)}
              aria-label={`Select ${node.name}`}
            />
            <span className="text-sm text-gray-900 font-medium">
              {node.name}
              {node.code && (
                <span className="text-xs text-gray-500 font-normal ml-1">({node.code})</span>
              )}
            </span>
          </label>
        </div>
        {hasChildren && isOpen && (
          <div className="ml-2 transition-all duration-200 ease-in-out">
            {node.children.map((ch) => renderNode(ch, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="relative">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tìm kiếm theo tên hoặc mã đơn vị"
          className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white shadow-sm placeholder-gray-400"
          aria-label="Search organizational units"
        />
        {q && (
          <button
            type="button"
            onClick={() => setQ('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            aria-label="Clear search"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      <div className="border border-gray-200 rounded-lg p-3 max-h-80 overflow-auto bg-white shadow-sm">
        {tree.length > 0 ? (
          tree.map((n) => renderNode(n))
        ) : (
          <div className="text-center text-sm text-gray-500 py-4">
            No organizational units found
          </div>
        )}
      </div>
    </div>
  )
}

function hasMatchDeep(node: Node, matches: Set<string>): boolean {
  if (matches.has(node.id)) return true
  return node.children.some((c) => hasMatchDeep(c, matches))
}