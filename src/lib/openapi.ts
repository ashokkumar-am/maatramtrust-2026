/**
 * OpenAPI 3.0 specification for the HTTP backend.
 *
 * Single source of truth for the API docs. Served as JSON at `GET /api/docs`
 * and rendered by Swagger UI at `/api-docs`.
 *
 * Covers the public v1 endpoints and the admin CRUD API. Server Actions
 * (student create/update RPC) and NextAuth's `/api/auth/*` routes are not
 * documented here — neither is a stable, consumer-facing REST endpoint.
 */

const messageResponse = (description: string) => ({
  description,
  content: {
    "application/json": {
      schema: { $ref: "#/components/schemas/MessageResponse" },
    },
  },
});

const jsonBody = (ref: string) => ({
  required: true,
  content: { "application/json": { schema: { $ref: ref } } },
});

const objectResponse = (description: string) => ({
  description,
  content: { "application/json": { schema: { type: "object" } } },
});

const validationResponse = {
  description: "Invalid request",
  content: {
    "application/json": {
      schema: { $ref: "#/components/schemas/ValidationError" },
    },
  },
};

const adminErrors = {
  "401": { $ref: "#/components/responses/Unauthorized" },
  "403": { $ref: "#/components/responses/Forbidden" },
};

const paginationParams = [
  {
    name: "page",
    in: "query",
    schema: { type: "integer", minimum: 1, default: 1 },
  },
  {
    name: "limit",
    in: "query",
    schema: { type: "integer", minimum: 1, maximum: 100, default: 50 },
  },
];

const idParam = {
  name: "id",
  in: "path",
  required: true,
  schema: { type: "string" },
};

/** Build the collection + item path pair for an admin CRUD resource. */
function adminCrudPaths(config: {
  tag: string;
  noun: string;
  createRef: string;
  updateRef: string;
}) {
  const { tag, noun, createRef, updateRef } = config;
  const security = [{ cookieAuth: [] }];

  return {
    collection: {
      get: {
        tags: [tag],
        summary: `List ${noun}s`,
        security,
        parameters: paginationParams,
        responses: {
          "200": {
            description: `Paginated ${noun} list`,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/PaginatedList" },
              },
            },
          },
          ...adminErrors,
        },
      },
      post: {
        tags: [tag],
        summary: `Create a ${noun}`,
        security,
        requestBody: jsonBody(createRef),
        responses: {
          "201": objectResponse(`${noun} created`),
          "400": validationResponse,
          "409": { $ref: "#/components/responses/Conflict" },
          ...adminErrors,
        },
      },
    },
    item: {
      parameters: [idParam],
      get: {
        tags: [tag],
        summary: `Get a ${noun} by id`,
        security,
        responses: {
          "200": objectResponse(noun),
          "404": { $ref: "#/components/responses/NotFound" },
          ...adminErrors,
        },
      },
      patch: {
        tags: [tag],
        summary: `Update a ${noun}`,
        security,
        requestBody: jsonBody(updateRef),
        responses: {
          "200": objectResponse(`${noun} updated`),
          "400": validationResponse,
          "404": { $ref: "#/components/responses/NotFound" },
          "409": { $ref: "#/components/responses/Conflict" },
          ...adminErrors,
        },
      },
      delete: {
        tags: [tag],
        summary: `Delete a ${noun}`,
        security,
        responses: {
          "200": messageResponse("Deleted"),
          "404": { $ref: "#/components/responses/NotFound" },
          ...adminErrors,
        },
      },
    },
  };
}

const contactPaths = adminCrudPaths({
  tag: "Admin · Contacts",
  noun: "contact",
  createRef: "#/components/schemas/ContactInput",
  updateRef: "#/components/schemas/ContactUpdate",
});
const newsletterAdminPaths = adminCrudPaths({
  tag: "Admin · Newsletter",
  noun: "subscription",
  createRef: "#/components/schemas/NewsletterInput",
  updateRef: "#/components/schemas/NewsletterUpdate",
});
const studentPaths = adminCrudPaths({
  tag: "Admin · Students",
  noun: "student",
  createRef: "#/components/schemas/StudentInput",
  updateRef: "#/components/schemas/StudentUpdate",
});
const bannerPaths = adminCrudPaths({
  tag: "Admin · Banners",
  noun: "banner",
  createRef: "#/components/schemas/BannerInput",
  updateRef: "#/components/schemas/BannerUpdate",
});
const categoryPaths = adminCrudPaths({
  tag: "Admin · Categories",
  noun: "category",
  createRef: "#/components/schemas/CategoryInput",
  updateRef: "#/components/schemas/CategoryUpdate",
});
const documentPaths = adminCrudPaths({
  tag: "Admin · Documents",
  noun: "document",
  createRef: "#/components/schemas/DocumentInput",
  updateRef: "#/components/schemas/DocumentUpdate",
});
const blogPaths = adminCrudPaths({
  tag: "Admin · Blog",
  noun: "post",
  createRef: "#/components/schemas/BlogInput",
  updateRef: "#/components/schemas/BlogUpdate",
});
const annadhanaCampaignPaths = adminCrudPaths({
  tag: "Admin · Annadhana",
  noun: "campaign",
  createRef: "#/components/schemas/AnnadhanaCampaignInput",
  updateRef: "#/components/schemas/AnnadhanaCampaignUpdate",
});

export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Maatram 2026 API",
    version: "1.0.0",
    description:
      "HTTP API for the Maatram 2026 backend: public contact/newsletter endpoints and the admin CRUD API (session-cookie auth, admin role required).",
  },
  servers: [{ url: "/", description: "Current host" }],
  tags: [
    { name: "Contact", description: "Public contact form" },
    { name: "Newsletter", description: "Public newsletter subscription" },
    { name: "Banners", description: "Public homepage banners" },
    { name: "Admin · Banners", description: "Manage homepage banners (admin)" },
    { name: "Categories", description: "Public categories" },
    { name: "Admin · Categories", description: "Manage categories (admin)" },
    {
      name: "Donations",
      description: "Public donations (order, confirm, wall)",
    },
    { name: "Documents", description: "Public org documents (download)" },
    { name: "Admin · Documents", description: "Manage org documents (admin)" },
    { name: "Blog", description: "Public blog posts (by category)" },
    { name: "Admin · Blog", description: "Manage blog posts (admin CRUD)" },
    { name: "Admin · Contacts", description: "Manage contacts (admin)" },
    { name: "Admin · Newsletter", description: "Manage subscriptions (admin)" },
    { name: "Admin · Students", description: "Manage students (admin)" },
    {
      name: "Admin · Donations",
      description: "List donations; record cash (admin)",
    },
    {
      name: "Annadhana",
      description: "Public Annadhana Sevai campaigns + self-booking",
    },
    {
      name: "Admin · Annadhana",
      description: "Manage Annadhana Sevai campaigns and bookings (admin)",
    },
  ],
  paths: {
    "/api/v1/contact": {
      post: {
        tags: ["Contact"],
        summary: "Create a contact submission",
        operationId: "createContact",
        requestBody: jsonBody("#/components/schemas/ContactInput"),
        responses: {
          "201": messageResponse("Contact created"),
          "400": validationResponse,
          "500": messageResponse("Server error"),
        },
      },
    },
    "/api/v1/newsletter": {
      post: {
        tags: ["Newsletter"],
        summary: "Subscribe an email to the newsletter",
        operationId: "subscribeNewsletter",
        requestBody: jsonBody("#/components/schemas/NewsletterInput"),
        responses: {
          "201": messageResponse("Subscribed"),
          "400": validationResponse,
          "409": messageResponse("Already subscribed"),
          "500": messageResponse("Server error"),
        },
      },
    },
    "/api/v1/banners": {
      get: {
        tags: ["Banners"],
        summary: "List active homepage banners",
        operationId: "listBanners",
        responses: {
          "200": {
            description: "Active banners, ordered",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    banners: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Banner" },
                    },
                  },
                },
              },
            },
          },
          "500": messageResponse("Server error"),
        },
      },
    },
    "/api/admin/contacts": contactPaths.collection,
    "/api/admin/contacts/{id}": contactPaths.item,
    "/api/admin/newsletter": newsletterAdminPaths.collection,
    "/api/admin/newsletter/{id}": newsletterAdminPaths.item,
    "/api/admin/students": studentPaths.collection,
    "/api/admin/students/{id}": studentPaths.item,
    "/api/admin/banners": bannerPaths.collection,
    "/api/admin/banners/{id}": bannerPaths.item,
    "/api/admin/categories": categoryPaths.collection,
    "/api/admin/categories/{id}": categoryPaths.item,
    "/api/admin/documents": documentPaths.collection,
    "/api/admin/documents/{id}": documentPaths.item,
    "/api/admin/documents/upload": {
      post: {
        tags: ["Admin · Documents"],
        summary: "Upload a document file (stored in Cloudinary) and record it",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["file", "type", "year"],
                properties: {
                  file: { type: "string", format: "binary" },
                  type: { type: "string", enum: ["annual-report", "itr"] },
                  year: { type: "integer", example: 2025 },
                  title: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "201": objectResponse("Document uploaded"),
          "400": validationResponse,
          "413": messageResponse("File too large"),
          "503": messageResponse("Storage not configured"),
          ...adminErrors,
        },
      },
    },
    "/api/v1/categories": {
      get: {
        tags: ["Categories"],
        summary: "List active categories",
        operationId: "listCategories",
        parameters: [
          {
            name: "type",
            in: "query",
            schema: { type: "string" },
            description: "Filter to a namespace (e.g. blog).",
          },
        ],
        responses: {
          "200": {
            description: "Active categories, ordered",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    categories: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Category" },
                    },
                  },
                },
              },
            },
          },
          "500": messageResponse("Server error"),
        },
      },
    },
    "/api/v1/donations": {
      get: {
        tags: ["Donations"],
        summary: "List recent donations (public donor wall, names masked)",
        operationId: "listDonations",
        parameters: [
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", minimum: 1, maximum: 50, default: 20 },
          },
        ],
        responses: {
          "200": {
            description: "Recent captured donations, donor names masked",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    donations: {
                      type: "array",
                      items: { $ref: "#/components/schemas/PublicDonation" },
                    },
                  },
                },
              },
            },
          },
          "500": messageResponse("Server error"),
        },
      },
      post: {
        tags: ["Donations"],
        summary: "Start a donation (create a Razorpay order)",
        operationId: "createDonation",
        requestBody: jsonBody("#/components/schemas/DonationOrderInput"),
        responses: {
          "201": {
            description: "Razorpay order created",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/DonationOrder" },
              },
            },
          },
          "400": validationResponse,
          "502": messageResponse("Payment gateway error"),
        },
      },
    },
    "/api/v1/donations/confirm": {
      post: {
        tags: ["Donations"],
        summary: "Confirm a donation after Razorpay Checkout succeeds",
        operationId: "confirmDonation",
        requestBody: jsonBody("#/components/schemas/DonationConfirmInput"),
        responses: {
          "200": {
            description: "Verified and captured (idempotent)",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    ok: { type: "boolean" },
                    receiptNumber: { type: "string" },
                  },
                },
              },
            },
          },
          "400": messageResponse("Verification failed / invalid request"),
          "500": messageResponse("Server error"),
        },
      },
    },
    "/api/v1/documents": {
      get: {
        tags: ["Documents"],
        summary: "List active org documents grouped by type",
        operationId: "listDocuments",
        responses: {
          "200": {
            description: "Documents grouped by type, newest year first",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    groups: {
                      type: "array",
                      items: { $ref: "#/components/schemas/DocumentGroup" },
                    },
                  },
                },
              },
            },
          },
          "500": messageResponse("Server error"),
        },
      },
    },
    "/api/v1/documents/{id}/download": {
      parameters: [idParam],
      get: {
        tags: ["Documents"],
        summary: "Download a document (redirects to the Cloudinary URL)",
        operationId: "downloadDocument",
        responses: {
          "307": {
            description: "Redirect to the Cloudinary asset (attachment)",
          },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/api/admin/donations": {
      get: {
        tags: ["Admin · Donations"],
        summary: "List recent donations (web + cash)",
        security: [{ cookieAuth: [] }],
        responses: {
          "200": objectResponse("Recent donations"),
          ...adminErrors,
        },
      },
      post: {
        tags: ["Admin · Donations"],
        summary: "Record a cash/offline donation (captured immediately)",
        security: [{ cookieAuth: [] }],
        requestBody: jsonBody("#/components/schemas/ManualDonationInput"),
        responses: {
          "201": objectResponse("Donation recorded"),
          "400": validationResponse,
          ...adminErrors,
        },
      },
    },
    "/api/admin/donations/{id}/void": {
      parameters: [idParam],
      post: {
        tags: ["Admin · Donations"],
        summary: "Void/refund a captured donation (soft)",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: false,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: { reason: { type: "string" } },
              },
            },
          },
        },
        responses: {
          "200": messageResponse("Voided"),
          "404": messageResponse("Not found or not captured"),
          ...adminErrors,
        },
      },
    },
    "/api/admin/blog": blogPaths.collection,
    "/api/admin/blog/{id}": blogPaths.item,
    "/api/v1/blog": {
      get: {
        tags: ["Blog"],
        summary: "List published blog posts (optionally by category)",
        operationId: "listPosts",
        parameters: [
          {
            name: "category",
            in: "query",
            schema: { type: "string" },
            description: "Filter by category slug.",
          },
          {
            name: "page",
            in: "query",
            schema: { type: "integer", minimum: 1, default: 1 },
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", minimum: 1, maximum: 50, default: 20 },
          },
        ],
        responses: {
          "200": {
            description: "Published posts, newest first",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    items: {
                      type: "array",
                      items: { $ref: "#/components/schemas/BlogListItem" },
                    },
                    total: { type: "integer" },
                    page: { type: "integer" },
                  },
                },
              },
            },
          },
          "500": messageResponse("Server error"),
        },
      },
    },
    "/api/v1/blog/{slug}": {
      parameters: [
        {
          name: "slug",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
      ],
      get: {
        tags: ["Blog"],
        summary: "Get a published post by slug",
        operationId: "getPost",
        responses: {
          "200": {
            description: "The post",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    post: { $ref: "#/components/schemas/BlogDetail" },
                  },
                },
              },
            },
          },
          "404": { $ref: "#/components/responses/NotFound" },
          "500": messageResponse("Server error"),
        },
      },
    },
    "/api/admin/students/{id}/sponsor": {
      parameters: [idParam],
      post: {
        tags: ["Admin · Students"],
        summary: "Record a manual sponsorship for a student",
        security: [{ cookieAuth: [] }],
        requestBody: jsonBody("#/components/schemas/SponsorshipInput"),
        responses: {
          "201": objectResponse("Sponsorship recorded"),
          "400": validationResponse,
          "404": { $ref: "#/components/responses/NotFound" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
        },
      },
    },
    "/api/admin/annadhana/campaigns": annadhanaCampaignPaths.collection,
    "/api/admin/annadhana/campaigns/{id}": annadhanaCampaignPaths.item,
    "/api/admin/annadhana/bookings": {
      get: {
        tags: ["Admin · Annadhana"],
        summary: "Booking history (paginated, filterable)",
        security: [{ cookieAuth: [] }],
        parameters: [
          ...paginationParams,
          {
            name: "q",
            in: "query",
            schema: { type: "string" },
            description: "Search donor name/email and honoree name.",
          },
          {
            name: "occasion",
            in: "query",
            schema: {
              type: "string",
              enum: ["birthday", "anniversary", "memorial", "other"],
            },
          },
          {
            name: "status",
            in: "query",
            schema: {
              type: "string",
              enum: ["pending", "received", "failed", "cancelled"],
            },
          },
          {
            name: "campaign",
            in: "query",
            schema: { type: "string" },
            description: "Filter to one campaign id.",
          },
          {
            name: "when",
            in: "query",
            schema: { type: "string", enum: ["past", "upcoming"] },
            description: "Past or upcoming bookings by event date.",
          },
          {
            name: "from",
            in: "query",
            schema: { type: "string", format: "date" },
            description: "Event date lower bound.",
          },
          {
            name: "to",
            in: "query",
            schema: { type: "string", format: "date" },
            description: "Event date upper bound.",
          },
        ],
        responses: {
          "200": {
            description: "Paginated bookings, newest event date first",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/PaginatedList" },
              },
            },
          },
          ...adminErrors,
        },
      },
      post: {
        tags: ["Admin · Annadhana"],
        summary: "Record an offline booking (received immediately)",
        security: [{ cookieAuth: [] }],
        requestBody: jsonBody("#/components/schemas/AnnadhanaBookingInput"),
        responses: {
          "201": objectResponse("Booking recorded"),
          "400": validationResponse,
          ...adminErrors,
        },
      },
    },
    "/api/admin/annadhana/bookings/{id}": {
      parameters: [idParam],
      get: {
        tags: ["Admin · Annadhana"],
        summary: "Get a booking by id",
        security: [{ cookieAuth: [] }],
        responses: {
          "200": objectResponse("Booking"),
          "404": { $ref: "#/components/responses/NotFound" },
          ...adminErrors,
        },
      },
      patch: {
        tags: ["Admin · Annadhana"],
        summary: "Update a booking's details or cancel it",
        security: [{ cookieAuth: [] }],
        requestBody: jsonBody("#/components/schemas/AnnadhanaBookingUpdate"),
        responses: {
          "200": objectResponse("Booking updated"),
          "400": validationResponse,
          "404": { $ref: "#/components/responses/NotFound" },
          ...adminErrors,
        },
      },
      delete: {
        tags: ["Admin · Annadhana"],
        summary: "Delete a booking that never received money",
        security: [{ cookieAuth: [] }],
        responses: {
          "200": messageResponse("Deleted"),
          "404": { $ref: "#/components/responses/NotFound" },
          "409": messageResponse(
            "Received bookings can only be cancelled, not deleted",
          ),
          ...adminErrors,
        },
      },
    },
    "/api/admin/annadhana/updates": {
      get: {
        tags: ["Admin · Annadhana"],
        summary: "List daily campaign updates (newest day first)",
        security: [{ cookieAuth: [] }],
        parameters: [
          ...paginationParams,
          {
            name: "campaign",
            in: "query",
            schema: { type: "string" },
            description: "Filter to one campaign id.",
          },
        ],
        responses: {
          "200": {
            description: "Paginated daily updates",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/PaginatedList" },
              },
            },
          },
          ...adminErrors,
        },
      },
      post: {
        tags: ["Admin · Annadhana"],
        summary: "Post a day's photos/videos for a campaign",
        security: [{ cookieAuth: [] }],
        requestBody: jsonBody("#/components/schemas/AnnadhanaUpdateInput"),
        responses: {
          "201": objectResponse("Update posted"),
          "400": validationResponse,
          "409": messageResponse(
            "An update for this campaign and day already exists",
          ),
          ...adminErrors,
        },
      },
    },
    "/api/admin/annadhana/updates/{id}": {
      parameters: [idParam],
      get: {
        tags: ["Admin · Annadhana"],
        summary: "Get a daily update by id",
        security: [{ cookieAuth: [] }],
        responses: {
          "200": objectResponse("Daily update"),
          "404": { $ref: "#/components/responses/NotFound" },
          ...adminErrors,
        },
      },
      patch: {
        tags: ["Admin · Annadhana"],
        summary: "Edit a daily update (replaced media is cleaned up)",
        security: [{ cookieAuth: [] }],
        requestBody: jsonBody("#/components/schemas/AnnadhanaUpdateUpdate"),
        responses: {
          "200": objectResponse("Update saved"),
          "400": validationResponse,
          "404": { $ref: "#/components/responses/NotFound" },
          "409": { $ref: "#/components/responses/Conflict" },
          ...adminErrors,
        },
      },
      delete: {
        tags: ["Admin · Annadhana"],
        summary: "Delete a daily update (gallery assets are cleaned up)",
        security: [{ cookieAuth: [] }],
        responses: {
          "200": messageResponse("Deleted"),
          "404": { $ref: "#/components/responses/NotFound" },
          ...adminErrors,
        },
      },
    },
    "/api/v1/annadhana/campaigns/{slug}/updates": {
      parameters: [
        {
          name: "slug",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
      ],
      get: {
        tags: ["Annadhana"],
        summary: "Day-wise campaign feed (media + daily breakfast sponsors)",
        operationId: "getAnnadhanaCampaignFeed",
        parameters: [
          {
            name: "page",
            in: "query",
            schema: { type: "integer", minimum: 1, default: 1 },
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", minimum: 1, maximum: 50, default: 10 },
          },
        ],
        responses: {
          "200": {
            description: "Campaign info + paginated daily updates",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AnnadhanaCampaignFeed" },
              },
            },
          },
          "404": { $ref: "#/components/responses/NotFound" },
          "500": messageResponse("Server error"),
        },
      },
    },
    "/api/v1/annadhana/campaigns": {
      get: {
        tags: ["Annadhana"],
        summary: "List active Annadhana Sevai campaigns",
        operationId: "listAnnadhanaCampaigns",
        responses: {
          "200": {
            description: "Active campaigns with amount raised",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    campaigns: {
                      type: "array",
                      items: {
                        $ref: "#/components/schemas/PublicAnnadhanaCampaign",
                      },
                    },
                  },
                },
              },
            },
          },
          "500": messageResponse("Server error"),
        },
      },
    },
    "/api/v1/annadhana/bookings": {
      post: {
        tags: ["Annadhana"],
        summary:
          "Start a self-booking for an occasion (create a Razorpay order)",
        operationId: "createAnnadhanaBooking",
        requestBody: jsonBody(
          "#/components/schemas/AnnadhanaBookingOrderInput",
        ),
        responses: {
          "201": {
            description: "Razorpay order created",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/DonationOrder" },
              },
            },
          },
          "400": validationResponse,
          "502": messageResponse("Payment gateway error"),
        },
      },
    },
    "/api/v1/annadhana/bookings/confirm": {
      post: {
        tags: ["Annadhana"],
        summary: "Confirm a booking after Razorpay Checkout succeeds",
        operationId: "confirmAnnadhanaBooking",
        requestBody: jsonBody("#/components/schemas/DonationConfirmInput"),
        responses: {
          "200": {
            description: "Verified and captured (idempotent)",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { ok: { type: "boolean" } },
                },
              },
            },
          },
          "400": messageResponse("Verification failed / invalid request"),
          "500": messageResponse("Server error"),
        },
      },
    },
    "/api/admin/students/{id}/sponsorships": {
      parameters: [idParam],
      get: {
        tags: ["Admin · Students"],
        summary: "Year-wise sponsorship history for a student",
        security: [{ cookieAuth: [] }],
        responses: {
          "200": {
            description: "Sponsorships grouped by year",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    studentId: { type: "string" },
                    years: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          year: { type: "integer" },
                          count: { type: "integer" },
                          pledged: { type: "number" },
                          received: { type: "number" },
                          sponsorships: {
                            type: "array",
                            items: { type: "object" },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      cookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "authjs.session-token",
        description:
          "Auth.js session cookie. Admin endpoints also require the user's role to be `admin`.",
      },
    },
    responses: {
      Unauthorized: messageResponse("Missing or invalid session"),
      Forbidden: messageResponse("Admin role required"),
      NotFound: messageResponse("Resource not found"),
      Conflict: messageResponse("Duplicate value (unique constraint)"),
    },
    schemas: {
      ContactInput: {
        type: "object",
        required: ["name", "email", "mobile", "comments"],
        properties: {
          name: { type: "string", example: "Karthikeyan" },
          email: {
            type: "string",
            format: "email",
            example: "karthik@example.com",
          },
          mobile: { type: "string", example: "9000012345" },
          comments: { type: "string", example: "I would like to help." },
          isSource: { type: "string", example: "website" },
        },
      },
      ContactUpdate: {
        type: "object",
        description: "Partial update; all fields optional.",
        properties: {
          name: { type: "string" },
          email: { type: "string", format: "email" },
          mobile: { type: "string" },
          comments: { type: "string" },
          isSource: { type: "string" },
        },
      },
      NewsletterInput: {
        type: "object",
        required: ["email"],
        properties: {
          email: {
            type: "string",
            format: "email",
            example: "subscriber@example.com",
          },
          isSource: { type: "string", example: "website" },
        },
      },
      NewsletterUpdate: {
        type: "object",
        description: "Partial update; all fields optional.",
        properties: {
          email: { type: "string", format: "email" },
          isSource: { type: "string" },
        },
      },
      StudentInput: {
        type: "object",
        required: ["student_id", "name", "student_type", "amount"],
        properties: {
          student_id: { type: "string", example: "STU2025001" },
          name: { type: "string", example: "Karthikeyan" },
          photo: { type: "string", format: "uri" },
          public_id: { type: "string" },
          dob: { type: "string", format: "date-time" },
          gender: { type: "string", enum: ["Male", "Female", "Other"] },
          phonenumber: { type: "string", example: "9000012345" },
          reason: { type: "string" },
          student_type: { type: "string", enum: ["School", "College"] },
          blood_group: {
            type: "string",
            enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
          },
          school_name: { type: "string" },
          grade_level: { type: "string" },
          college_name: { type: "string" },
          department: { type: "string" },
          semester: { type: "string" },
          marks: { type: "string" },
          amount: { type: "number", minimum: 0, example: 2300 },
          originalAmount: { type: "number", minimum: 0 },
          parenting_status: {
            type: "string",
            enum: [
              "orphan",
              "single-parent",
              "single-father",
              "single-mother",
              "family",
              "guardian",
            ],
          },
          isStatus: { type: "boolean" },
          isDonate: { type: "boolean" },
        },
      },
      StudentUpdate: {
        type: "object",
        description:
          "Partial update — any subset of StudentInput fields (none required).",
      },
      BannerInput: {
        type: "object",
        required: ["mediaType", "url", "public_id"],
        properties: {
          title: { type: "string" },
          mediaType: { type: "string", enum: ["image", "video"] },
          url: {
            type: "string",
            format: "uri",
            description: "Cloudinary secure URL of the media.",
          },
          public_id: {
            type: "string",
            description: "Cloudinary public id.",
          },
          alt: { type: "string" },
          caption: { type: "string" },
          link: {
            type: "string",
            format: "uri",
            description: "Optional click-through URL.",
          },
          order: { type: "integer", default: 0 },
          isActive: { type: "boolean", default: true },
        },
      },
      BannerUpdate: {
        type: "object",
        description:
          "Partial update — any subset of BannerInput fields (none required).",
      },
      Banner: {
        allOf: [
          { $ref: "#/components/schemas/BannerInput" },
          {
            type: "object",
            properties: {
              _id: { type: "string" },
              createdAt: { type: "string", format: "date-time" },
              updatedAt: { type: "string", format: "date-time" },
            },
          },
        ],
      },
      CategoryInput: {
        type: "object",
        required: ["name"],
        properties: {
          name: { type: "string", example: "Announcements" },
          slug: {
            type: "string",
            description: "URL-safe key; derived from name when omitted.",
            example: "announcements",
          },
          type: {
            type: "string",
            description: "Optional namespace (e.g. blog).",
            example: "blog",
          },
          parent: {
            type: "string",
            nullable: true,
            description:
              "Parent category id (24-char ObjectId) — set for a sub-category, null/omitted for top-level.",
          },
          description: { type: "string" },
          icon: {
            type: "string",
            format: "uri",
            nullable: true,
            description: "Cloudinary icon URL.",
          },
          iconPublicId: { type: "string", nullable: true },
          image: {
            type: "string",
            format: "uri",
            nullable: true,
            description: "Cloudinary image URL.",
          },
          imagePublicId: { type: "string", nullable: true },
          order: { type: "integer", default: 0 },
          isActive: { type: "boolean", default: true },
        },
      },
      CategoryUpdate: {
        type: "object",
        description:
          "Partial update — any subset of CategoryInput fields (none required). Send null to clear an optional field (parent/icon/image).",
      },
      Category: {
        type: "object",
        properties: {
          name: { type: "string" },
          slug: { type: "string" },
          type: { type: "string" },
          parent: { type: "string", nullable: true },
          description: { type: "string" },
          icon: { type: "string" },
          image: { type: "string" },
          order: { type: "integer" },
        },
      },
      SponsorshipInput: {
        type: "object",
        required: ["amount"],
        properties: {
          donorName: { type: "string", example: "Ashok Kumar A M" },
          donorEmail: { type: "string", format: "email" },
          donorPhone: { type: "string", example: "9000012345" },
          year: {
            type: "integer",
            description: "Sponsorship year. Defaults to the current year.",
            example: 2026,
          },
          amount: { type: "number", exclusiveMinimum: 0, example: 3300 },
          currency: { type: "string", default: "INR" },
          note: { type: "string" },
        },
      },
      DonationOrderInput: {
        type: "object",
        required: ["amount"],
        properties: {
          amount: {
            type: "number",
            exclusiveMinimum: 0,
            description: "Donation amount in rupees (converted to paise).",
            example: 500,
          },
          donorName: {
            type: "string",
            description: "Falls back to the logged-in Google account name.",
            example: "Ashok Kumar",
          },
          donorEmail: {
            type: "string",
            format: "email",
            description: "Falls back to the logged-in Google account email.",
          },
          anonymous: {
            type: "boolean",
            default: false,
            description: "Hide the donor's name on the public wall.",
          },
          categoryId: {
            type: "string",
            description: "Optional active category id to tag the donation.",
          },
        },
      },
      DonationOrder: {
        type: "object",
        properties: {
          keyId: { type: "string", description: "Razorpay public key id." },
          orderId: { type: "string" },
          amount: { type: "integer", description: "Amount in paise." },
          currency: { type: "string", example: "INR" },
        },
      },
      DonationConfirmInput: {
        type: "object",
        required: ["orderId", "paymentId", "signature"],
        properties: {
          orderId: { type: "string", example: "order_ABC123" },
          paymentId: { type: "string", example: "pay_XYZ789" },
          signature: { type: "string" },
        },
      },
      BlogInput: {
        type: "object",
        required: ["title", "category", "content"],
        properties: {
          title: { type: "string", example: "How sponsorship changes lives" },
          slug: {
            type: "string",
            description: "URL-safe key; derived from the title when omitted.",
          },
          category: {
            type: "string",
            description: "Category id (24-char ObjectId) the post belongs to.",
          },
          excerpt: { type: "string" },
          content: { type: "string", description: "Post body." },
          coverImage: { type: "string", format: "uri" },
          coverPublicId: {
            type: "string",
            description: "Cloudinary public id for the cover (for cleanup).",
          },
          tags: { type: "array", items: { type: "string" } },
          status: {
            type: "string",
            enum: ["draft", "published"],
            default: "draft",
          },
          publishedAt: { type: "string", format: "date-time" },
        },
      },
      BlogUpdate: {
        type: "object",
        description:
          "Partial update — any subset of BlogInput fields (none required).",
      },
      PostCategory: {
        type: "object",
        properties: {
          name: { type: "string" },
          slug: { type: "string" },
        },
      },
      BlogListItem: {
        type: "object",
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          slug: { type: "string" },
          excerpt: { type: "string" },
          coverImage: { type: "string" },
          tags: { type: "array", items: { type: "string" } },
          publishedAt: { type: "string", format: "date-time" },
          category: { $ref: "#/components/schemas/PostCategory" },
        },
      },
      BlogDetail: {
        allOf: [
          { $ref: "#/components/schemas/BlogListItem" },
          {
            type: "object",
            properties: { content: { type: "string" } },
          },
        ],
      },
      DocumentInput: {
        type: "object",
        required: ["type", "year", "fileName", "url", "publicId"],
        properties: {
          type: { type: "string", enum: ["annual-report", "itr"] },
          year: {
            type: "integer",
            minimum: 2000,
            maximum: 2100,
            example: 2025,
          },
          title: { type: "string", example: "Annual Report 2025" },
          fileName: { type: "string", example: "annual-report-2025.pdf" },
          url: {
            type: "string",
            format: "uri",
            description: "Cloudinary delivery URL.",
          },
          publicId: { type: "string", description: "Cloudinary public id." },
          resourceType: {
            type: "string",
            enum: ["raw", "image"],
            default: "raw",
          },
          contentType: { type: "string", example: "application/pdf" },
          size: { type: "integer", minimum: 0, description: "Bytes." },
          isActive: { type: "boolean", default: true },
        },
      },
      DocumentUpdate: {
        type: "object",
        description:
          "Partial update — any subset of DocumentInput fields (none required).",
      },
      PublicDocument: {
        type: "object",
        properties: {
          id: { type: "string" },
          type: { type: "string", enum: ["annual-report", "itr"] },
          year: { type: "integer" },
          title: { type: "string" },
          fileName: { type: "string" },
          size: { type: "integer" },
        },
      },
      DocumentGroup: {
        type: "object",
        properties: {
          type: { type: "string", enum: ["annual-report", "itr"] },
          label: { type: "string", example: "Annual Reports" },
          documents: {
            type: "array",
            items: { $ref: "#/components/schemas/PublicDocument" },
          },
        },
      },
      ManualDonationInput: {
        type: "object",
        required: ["amount"],
        properties: {
          amount: {
            type: "number",
            exclusiveMinimum: 0,
            description: "Amount received in rupees.",
            example: 5000,
          },
          donorName: { type: "string", example: "Ashok Kumar" },
          donorEmail: {
            type: "string",
            format: "email",
            description: "If given, a PDF receipt is emailed.",
          },
          anonymous: { type: "boolean", default: false },
          categoryId: { type: "string", description: "Optional category id." },
          method: {
            type: "string",
            enum: ["cash", "cheque", "bank_transfer"],
            default: "cash",
          },
          note: { type: "string", example: "cheque no. 001234" },
          receivedAt: {
            type: "string",
            format: "date",
            description:
              "Date the money was received (backdate). Defaults to now.",
          },
        },
      },
      PublicDonation: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: {
            type: "string",
            description: 'Masked donor name, or "Anonymous".',
            example: "A**** K.",
          },
          category: { type: "string" },
          amount: { type: "number", description: "Amount in major units." },
          currency: { type: "string", example: "INR" },
          at: { type: "string", format: "date-time" },
        },
      },
      AnnadhanaCampaignInput: {
        type: "object",
        required: ["title", "minAmount"],
        properties: {
          title: { type: "string", example: "Annadhana Sevai 2026" },
          slug: {
            type: "string",
            description: "URL-safe key; derived from the title when omitted.",
          },
          description: { type: "string" },
          image: {
            type: "string",
            format: "uri",
            nullable: true,
            description: "Cloudinary image URL.",
          },
          imagePublicId: { type: "string", nullable: true },
          minAmount: {
            type: "number",
            minimum: 0,
            description: "Minimum booking amount in rupees.",
            example: 1000,
          },
          targetAmount: {
            type: "number",
            nullable: true,
            description: "Optional fundraising goal in rupees.",
          },
          startDate: { type: "string", format: "date", nullable: true },
          endDate: { type: "string", format: "date", nullable: true },
          order: { type: "integer", default: 0 },
          isActive: { type: "boolean", default: true },
        },
      },
      AnnadhanaCampaignUpdate: {
        type: "object",
        description:
          "Partial update — any subset of AnnadhanaCampaignInput fields (none required). Send null to clear an optional field.",
      },
      PublicAnnadhanaCampaign: {
        type: "object",
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          slug: { type: "string" },
          description: { type: "string" },
          image: { type: "string", format: "uri" },
          minAmount: { type: "number" },
          targetAmount: { type: "number" },
          raisedAmount: {
            type: "number",
            description: "Total received so far, in rupees.",
          },
          startDate: { type: "string", format: "date-time" },
          endDate: { type: "string", format: "date-time" },
        },
      },
      AnnadhanaBookingOrderInput: {
        type: "object",
        required: ["occasion", "eventDate", "amount"],
        properties: {
          campaignId: {
            type: "string",
            description: "Optional open campaign id to book against.",
          },
          occasion: {
            type: "string",
            enum: ["birthday", "anniversary", "memorial", "other"],
          },
          occasionDetail: {
            type: "string",
            description: 'Free-text label when occasion is "other".',
            example: "housewarming",
          },
          honoreeName: {
            type: "string",
            description: "Person celebrated or remembered.",
            example: "Lakshmi Ammal",
          },
          eventDate: {
            type: "string",
            format: "date",
            description: "Date the annadhanam is booked for (today or later).",
          },
          donorName: {
            type: "string",
            description: "Falls back to the logged-in account name.",
          },
          donorEmail: {
            type: "string",
            format: "email",
            description: "Falls back to the logged-in account email.",
          },
          donorPhone: { type: "string", example: "9000012345" },
          amount: {
            type: "number",
            exclusiveMinimum: 0,
            description: "Booking amount in rupees (converted to paise).",
            example: 5000,
          },
          note: { type: "string" },
        },
      },
      AnnadhanaBookingInput: {
        allOf: [
          { $ref: "#/components/schemas/AnnadhanaBookingOrderInput" },
          {
            type: "object",
            description:
              "Admin-entered offline booking; recorded as received immediately. Past event dates are allowed (backfilling).",
            properties: { currency: { type: "string", default: "INR" } },
          },
        ],
      },
      AnnadhanaBookingUpdate: {
        type: "object",
        description:
          'Partial update — occasion/honoree/event date/donor details/note, or `status: "cancelled"` to cancel. Payment fields are owned by the payment flow.',
        properties: {
          occasion: {
            type: "string",
            enum: ["birthday", "anniversary", "memorial", "other"],
          },
          occasionDetail: { type: "string" },
          honoreeName: { type: "string" },
          eventDate: { type: "string", format: "date" },
          donorName: { type: "string" },
          donorEmail: { type: "string", format: "email" },
          donorPhone: { type: "string" },
          note: { type: "string" },
          status: { type: "string", enum: ["cancelled"] },
        },
      },
      AnnadhanaUpdateMedia: {
        type: "object",
        required: ["url"],
        properties: {
          url: {
            type: "string",
            format: "uri",
            description: "Cloudinary secure URL of the photo/video.",
          },
          publicId: { type: "string" },
          mediaType: {
            type: "string",
            enum: ["image", "video"],
            default: "image",
          },
        },
      },
      AnnadhanaUpdateInput: {
        type: "object",
        required: ["campaignId", "date"],
        properties: {
          campaignId: { type: "string", description: "Campaign id." },
          date: {
            type: "string",
            format: "date",
            description: "The day this update covers (one per campaign/day).",
          },
          title: { type: "string", example: "Day 12 — Sunday breakfast" },
          description: { type: "string" },
          media: {
            type: "array",
            maxItems: 30,
            items: { $ref: "#/components/schemas/AnnadhanaUpdateMedia" },
          },
          isActive: { type: "boolean", default: true },
        },
      },
      AnnadhanaUpdateUpdate: {
        type: "object",
        description:
          "Partial update — any subset of AnnadhanaUpdateInput fields except campaignId.",
      },
      AnnadhanaCampaignFeed: {
        type: "object",
        properties: {
          campaign: { $ref: "#/components/schemas/PublicAnnadhanaCampaign" },
          items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                date: { type: "string", format: "date-time" },
                title: { type: "string" },
                description: { type: "string" },
                media: {
                  type: "array",
                  items: { $ref: "#/components/schemas/AnnadhanaUpdateMedia" },
                },
                sponsors: {
                  type: "array",
                  description:
                    "That day's breakfast sponsors (from received bookings).",
                  items: {
                    type: "object",
                    properties: {
                      donorName: { type: "string" },
                      occasion: {
                        type: "string",
                        enum: ["birthday", "anniversary", "memorial", "other"],
                      },
                      occasionDetail: { type: "string" },
                      honoreeName: { type: "string" },
                    },
                  },
                },
              },
            },
          },
          total: { type: "integer" },
          page: { type: "integer" },
          limit: { type: "integer" },
        },
      },
      PaginatedList: {
        type: "object",
        properties: {
          items: { type: "array", items: { type: "object" } },
          total: { type: "integer" },
          page: { type: "integer" },
          limit: { type: "integer" },
        },
      },
      MessageResponse: {
        type: "object",
        properties: { message: { type: "string" } },
      },
      ValidationError: {
        type: "object",
        properties: {
          message: { type: "string", example: "Invalid request" },
          errors: {
            type: "object",
            additionalProperties: { type: "array", items: { type: "string" } },
          },
        },
      },
    },
  },
};
