import { withRouteSpec } from "lib/middleware/with-winter-spec"
import type { Thing } from "lib/db/schema"
import React from "react"

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
      <div>
        <h2>Thing Resources</h2>
        {things.length === 0 ? (
          <p className="text-gray-500 italic">No things found</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
            {things.map((thing) => (
              <div
                key={thing.thing_id}
                className="border border-gray-300 rounded p-4 hover:shadow-md transition-shadow"
              >
                <div className="font-bold text-lg">{thing.name}</div>
                <div className="text-gray-700">{thing.description}</div>
                <div className="text-gray-500 text-xs mt-2">
                  ID: {thing.thing_id}
                </div>
                <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-200">
                  <span className="text-xs text-gray-500">Actions:</span>
                  <form
                    action="/things/delete"
                    method="POST"
                    onSubmit={(e) => {
                      e.preventDefault()
                      console.log(
                        `Attempting to delete thing with ID: ${thing.thing_id}`,
                      )

                      if (
                        confirm(
                          `Are you sure you want to delete "${thing.name}"?`,
                        )
                      ) {
                        console.log("Confirmed deletion, sending request...")

                        const formData = new FormData()
                        formData.append("thing_id", thing.thing_id)

                        fetch("/things/delete", {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                          },
                          body: JSON.stringify({ thing_id: thing.thing_id }),
                        })
                          .then((response) => {
                            console.log(
                              "Delete response status:",
                              response.status,
                            )
                            if (!response.ok) {
                              throw new Error(
                                `HTTP error! status: ${response.status}`,
                              )
                            }
                            return response.json()
                          })
                          .then((data) => {
                            console.log("Delete response data:", data)
                            // Redirect to admin page to show the updated list
                            window.location.href = "/_fake/admin"
                          })
                          .catch((error) => {
                            console.error("Error deleting thing:", error)
                            alert(`Error deleting thing: ${error.message}`)
                          })
                      } else {
                        console.log("Deletion cancelled by user")
                      }
                    }}
                  >
                    <input
                      type="hidden"
                      name="thing_id"
                      value={thing.thing_id}
                    />
                    <button
                      type="submit"
                      className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded"
                    >
                      Delete
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
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
