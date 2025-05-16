import React from "react"
import { timeAgo } from "./time-ago"

declare global {
  interface Window {
    timezone?: string
  }
}

const pluralize = (resource: string) => {
  if (resource.endsWith("s")) return resource
  return resource.endsWith("y") ? `${resource.slice(0, -1)}ies` : `${resource}s`
}

const removeResourcePrefixes = (resource: string) => {
  if (resource.startsWith("creator_")) return resource.slice(8)
  if (resource.startsWith("owner_")) return resource.slice(6)
  if (resource.startsWith("personal_")) return resource.slice(9)
  return resource
}

// Adapt downloadable columns for generic use
const DOWNLOADABLE_COLUMNS = ["data", "metadata", "config"]

const Cell = ({
  columnKey,
  cellValue,
  timezone,
}: {
  columnKey: string
  cellValue: any
  timezone: string
}) => {
  if (typeof cellValue === "boolean") return <>{String(cellValue)}</>
  if (cellValue === null || cellValue === undefined) return <></>
  if (React.isValidElement(cellValue)) return cellValue

  // Handle arrays of IDs (e.g., thing_ids)
  if (columnKey.endsWith("_ids") && Array.isArray(cellValue)) {
    const resource = pluralize(columnKey.slice(0, -4))
    return (
      <div className="flex flex-col space-y-1">
        {cellValue.map((id: string, index: number) => (
          <a
            key={index}
            href={`/_fake/admin/${removeResourcePrefixes(resource)}/get?${removeResourcePrefixes(columnKey.slice(0, -1))}=${id}`}
            className="text-blue-500 hover:underline"
          >
            {id?.split("-")?.[0]}...
          </a>
        ))}
      </div>
    )
  }

  // Handle single IDs
  if (columnKey.endsWith("_id") && typeof cellValue === "string") {
    const resource = pluralize(columnKey.slice(0, -3))
    return (
      <a
        href={`/_fake/admin/${removeResourcePrefixes(resource)}/get?${removeResourcePrefixes(columnKey)}=${cellValue}`}
        className="text-blue-500 hover:underline"
      >
        {cellValue?.split("-")?.[0]}...
      </a>
    )
  }

  if (columnKey.endsWith("_at")) {
    return <span className="tabular-nums">{timeAgo(cellValue, timezone)}</span>
  }

  if (DOWNLOADABLE_COLUMNS.includes(columnKey)) {
    let b64: string
    let filename: string
    let contentType: string
    if (typeof cellValue === "object") {
      const jsonStr = JSON.stringify(cellValue, null, 2)
      b64 = Buffer.from(jsonStr).toString("base64")
      filename = `${columnKey}.json`
      contentType = "application/json"
    } else if (typeof cellValue === "string") {
      b64 = Buffer.from(cellValue).toString("base64")
      filename = `${columnKey}`
      contentType = "application/octet-stream"
    } else {
      throw new Error(`Unknown cell value type: ${typeof cellValue}`)
    }
    return (
      <div
        // biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
        dangerouslySetInnerHTML={{
          __html: `<button
          class="bg-transparent hover:bg-transparent font-normal text-blue-500 hover:text-blue-700 py-1 px-2 rounded"
          onclick="(function(){
            const a = document.createElement('a');
            const content = atob('${b64}');
            const blob = new Blob([content], {type: '${contentType}'});
            a.href = window.URL.createObjectURL(blob);
            a.download = '${filename}';
            a.click();
            window.URL.revokeObjectURL(a.href);
          })();return false;"
        >
          Download
        </button>`,
        }}
      />
    )
  }

  if (typeof cellValue === "object") {
    return (
      <details>
        <summary>{JSON.stringify(cellValue).slice(0, 40)}...</summary>
        <pre>{JSON.stringify(cellValue, null, 2)}</pre>
      </details>
    )
  }

  return <>{String(cellValue)}</>
}

export const Table = ({
  rows,
  obj,
  timezone,
}: {
  rows?: Record<string, any>[]
  obj?: Record<string, any>
  timezone?: string
}) => {
  if (!timezone) {
    timezone =
      (typeof window !== "undefined" ? window.timezone : undefined) ?? "UTC"
  }

  if (obj) {
    const entries = Object.entries(obj)
    return (
      <table className="min-w-full divide-y divide-gray-200 bg-white shadow-sm rounded-lg overflow-hidden">
        <thead>
          <tr>
            <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Key
            </th>
            <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Value
            </th>
          </tr>
        </thead>
        <tbody>
          {entries.map(([key, value], index) => (
            <tr key={index} className="hover:bg-gray-50">
              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 border-b border-gray-100">
                {key}
              </td>
              <td className="px-4 py-2 whitespace-normal text-sm text-gray-600 border-b border-gray-100">
                <Cell columnKey={key} cellValue={value} timezone={timezone!} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    )
  }

  if (!rows || rows.length === 0)
    return (
      <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200 text-gray-500">
        Empty Table
      </div>
    )

  const keys = Object.keys(rows[0]!)

  return (
    <table className="min-w-full divide-y divide-gray-200 bg-white shadow-sm rounded-lg overflow-hidden">
      <thead>
        <tr>
          {keys.map((key) => (
            <th
              key={key}
              className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              {key}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, rowIndex) => (
          <tr key={rowIndex}>
            {keys.map((key) => (
              <td
                key={key}
                className="px-4 py-2 whitespace-normal text-sm text-gray-600 border-b border-gray-100"
              >
                <Cell
                  columnKey={key}
                  cellValue={row[key]}
                  timezone={timezone!}
                />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
