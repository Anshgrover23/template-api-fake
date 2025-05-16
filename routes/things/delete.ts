import { withRouteSpec } from "lib/middleware/with-winter-spec"
import { z } from "zod"
import type { DatabaseSchema } from "lib/db/schema"

export default withRouteSpec({
  methods: ["POST"],
  formData: z.object({
    thing_id: z.string(),
  }),
  jsonResponse: z.object({
    ok: z.boolean(),
  }),
})(async (req, ctx) => {
  let thing_id = ""

  // Try to parse form data first
  try {
    const formData = await req.formData()
    thing_id = formData.get("thing_id")?.toString() || ""
  } catch {
    // If not form data, try JSON
    try {
      const data = await req.json()
      thing_id = data.thing_id
    } catch (error) {
      return new Response(JSON.stringify({ error: "Invalid request format" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }
  }

  // Validate required fields
  if (!thing_id) {
    return new Response(JSON.stringify({ error: "Thing ID is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }

  // Get the current things and filter out the one with the given ID
  const currentThings = ctx.db.things
  const updatedThings = currentThings.filter(
    (thing) => thing.thing_id !== thing_id,
  )

  // Update the state directly
  ctx.db.setState({
    things: updatedThings,
    idCounter: ctx.db.getState().idCounter,
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
