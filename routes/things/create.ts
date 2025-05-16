import { withRouteSpec } from "lib/middleware/with-winter-spec"
import { z } from "zod"

export default withRouteSpec({
  methods: ["POST"],
  jsonBody: z
    .object({
      name: z.string(),
      description: z.string(),
    })
    .optional(),
  jsonResponse: z.object({
    ok: z.boolean(),
  }),
})(async (req, ctx) => {
  let name = ""
  let description = ""

  // Check content type to determine how to parse the request
  const contentType = req.headers.get("Content-Type") || ""

  if (contentType.includes("application/json")) {
    // Handle JSON request
    const data = await req.json()
    name = data.name
    description = data.description
  } else if (
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  ) {
    // Handle form data
    const formData = await req.formData()
    name = formData.get("name")?.toString() || ""
    description = formData.get("description")?.toString() || ""
  } else {
    // Default fallback - try to parse as JSON
    try {
      const data = await req.json()
      name = data.name
      description = data.description
    } catch (error) {
      return new Response(JSON.stringify({ error: "Invalid request format" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }
  }

  // Validate required fields
  if (!name || !description) {
    return new Response(
      JSON.stringify({ error: "Name and description are required" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    )
  }

  // Add the thing to the database
  ctx.db.addThing({
    name,
    description,
  })

  // Check if the request wants HTML response (from a form) or JSON response (from fetch)
  const acceptHeader = req.headers.get("Accept") || ""
  if (acceptHeader.includes("text/html")) {
    // Redirect back to the admin page
    return new Response(null, {
      status: 302,
      headers: { Location: "/_fake/admin" },
    })
  }

  // Return JSON response
  return ctx.json({ ok: true })
})
