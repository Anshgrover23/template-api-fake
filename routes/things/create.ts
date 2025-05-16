import { withRouteSpec } from "lib/middleware/with-winter-spec"
import { z } from "zod"

export default withRouteSpec({
  methods: ["GET", "POST"],
  urlEncodedFormData: z.object({
    name: z.string(),
    description: z.string(),
  }),
  jsonResponse: z.object({
    ok: z.boolean(),
  }),
})(async (req, ctx) => {
  const formData = req.urlEncodedFormData

  // Add the thing to the database
  ctx.db.addThing({
    name: formData.name,
    description: formData.description,
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
