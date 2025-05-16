import { withRouteSpec } from "lib/middleware/with-winter-spec"
import type { Thing } from "lib/db/schema"
import React from "react"
import { Table } from "lib/admin/Table"

// Admin page component to display thing resources
const AdminPage: React.FC<{ things: Thing[] }> = ({ things }) => {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Thing Resources Admin</h1>

      {/* Create new thing form */}
      <div className="mb-6">
        <h2>Create New Thing</h2>
        <form
          action="/things/create"
          method="POST"
          className="w-full max-w-md"
          onSubmit={(e) => {
            // Use JavaScript for enhanced experience, but allow traditional form submission as fallback
            e.preventDefault()
            console.log("Form submitted")

            const form = e.currentTarget
            const nameInput = form.elements.namedItem(
              "name",
            ) as HTMLInputElement
            const descriptionInput = form.elements.namedItem(
              "description",
            ) as HTMLInputElement

            if (!nameInput || !descriptionInput) {
              console.error("Form elements not found")
              return
            }

            const data = {
              name: nameInput.value,
              description: descriptionInput.value,
            }

            console.log("Submitting data:", data)

            fetch("/things/create", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(data),
            })
              .then((response) => {
                console.log("Create response status:", response.status)
                if (!response.ok) {
                  throw new Error(`HTTP error! status: ${response.status}`)
                }
                return response.json()
              })
              .then((responseData) => {
                console.log("Create response data:", responseData)
                // Reset form fields
                form.reset()
                // Reload the page to show the new thing
                window.location.href = "/_fake/admin"
              })
              .catch((error) => {
                console.error("Error creating thing:", error)
                alert(`Error creating thing: ${error.message}`)
              })
          }}
        >
          <div className="mb-2">
            <label className="block text-gray-700 text-sm font-bold mb-1">
              Name:
              <input type="text" name="name" className="w-full" required />
            </label>
          </div>
          <div className="mb-2">
            <label className="block text-gray-700 text-sm font-bold mb-1">
              Description:
              <input
                type="text"
                name="description"
                className="w-full"
                required
              />
            </label>
          </div>
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Create Thing
          </button>
        </form>
      </div>

      {/* Display thing resources */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">Thing Resources</h2>
        <Table
          rows={things.map((thing) => ({
            ...thing,
            actions: (
              <form
                action="/things/delete"
                method="POST"
                onSubmit={(e) => {
                  e.preventDefault()
                  if (
                    confirm(`Are you sure you want to delete "${thing.name}"?`)
                  ) {
                    fetch("/things/delete", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ thing_id: thing.thing_id }),
                    })
                      .then((response) => {
                        if (!response.ok)
                          throw new Error(
                            `HTTP error! status: ${response.status}`,
                          )
                        return response.json()
                      })
                      .then(() => {
                        window.location.href = "/_fake/admin"
                      })
                      .catch((error) => {
                        alert(`Error deleting thing: ${error.message}`)
                      })
                  }
                }}
              >
                <input type="hidden" name="thing_id" value={thing.thing_id} />
                <button
                  type="submit"
                  className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Delete
                </button>
              </form>
            ),
          }))}
        />
      </div>
    </div>
  )
}

export default withRouteSpec({
  methods: ["GET"],
})((req, ctx) => {
  // Get things from the database
  const things = ctx.db.things

  // Render the admin page using the React middleware
  return ctx.react(<AdminPage things={things} />)
})
