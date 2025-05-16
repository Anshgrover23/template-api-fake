import { withRouteSpec } from "lib/middleware/with-winter-spec"
import { z } from "zod"
import type { DatabaseSchema } from "lib/db/schema"

export default withRouteSpec({
  methods: ["DELETE", "POST"],
  urlEncodedFormData: z.object({
    thing_id: z.string(),
  }),
  jsonResponse: z.object({
    ok: z.boolean(),
  }),
})(async (req, ctx) => {
  const formData = req.urlEncodedFormData
  const thing_id = formData.thing_id

  // Check if the thing exists
  const things = ctx.db.getState().things
  const thing = things.find((t) => t.thing_id === thing_id)

  if (!thing) {
    return new Response("Thing not found", { status: 404 })
  }

  // Delete the thing
  ctx.db.setState({
    ...ctx.db.getState(),
    things: ctx.db.getState().things.filter((t) => t.thing_id !== thing_id),
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
