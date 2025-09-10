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
  // sort by name at each level
  const sortRec = (ns: Node[]) => {
    ns.sort((a, b) => a.name.localeCompare(b.name, 'vi'))
    ns.forEach((n) => sortRec(n.children))
  }
  sortRec(roots)
  return roots
}

export default function OrgUnitTreeSelect({ items, value, onChange, className }: Props) {
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
    // If searching, show path to matches only
    const shouldRender = !matches.size || isMatch || node.children.some((c) => hasMatchDeep(c, matches))
    if (!shouldRender) return null
    return (
      <div key={node.id} className="select-none">
        <div className="flex items-center py-1">
          <div style={{ width: depth * 12 }} />
          {hasChildren ? (
            <button type="button" onClick={() => toggle(node.id)} className="w-5 h-5 text-gray-600">
              {isOpen ? '▾' : '▸'}
            </button>
          ) : (
            <span className="w-5" />
          )}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="org_unit"
              className="accent-blue-600"
              checked={value === node.id}
              onChange={() => onChange(node.id)}
            />
            <span className="text-sm text-gray-800">{node.name}{node.code ? ` (${node.code})` : ''}</span>
          </label>
        </div>
        {hasChildren && isOpen && (
          <div>
            {node.children.map((ch) => renderNode(ch, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={className}>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Tìm theo mã hoặc tên..."
        className="w-full mb-2 border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <div className="border rounded-md p-2 max-h-64 overflow-auto bg-white">
        {tree.map((n) => renderNode(n))}
      </div>
    </div>
  )
}

function hasMatchDeep(node: Node, matches: Set<string>): boolean {
  if (matches.has(node.id)) return true
  return node.children.some((c) => hasMatchDeep(c, matches))
}

