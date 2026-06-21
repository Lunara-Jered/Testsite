import { relations } from "drizzle-orm";
import { integer, pgTable, serial, text, timestamp, numeric, boolean } from "drizzle-orm/pg-core";

// Users table (Citizens and Municipal Staff)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  uid: text("uid").notNull().unique(), // Firebase Auth UID
  email: text("email").notNull(),
  role: text("role").notNull().default("citoyen"), // 'admin' | 'agent' | 'citoyen'
  firstName: text("first_name"),
  lastName: text("last_name"),
  phoneNumber: text("phone_number"),
  dateOfBirth: text("date_of_birth"), // YYYY-MM-DD
  placeOfBirth: text("place_of_birth"),
  nationalIdNumber: text("national_id_number"),
  address: text("address"),
  district: text("district"), // Arrondissement (1er au 6ème)
  isVerified: boolean("is_verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Services (e.g. Naissance, Mariage, Permis de Construire)
export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  categorySlug: text("category_slug").notNull(), // 'etat-civil' | 'urbanisme'
  icon: text("icon").notNull(), // Lucide icon name
  estimatedTime: text("estimated_time").notNull(),
  requiredDocuments: text("required_documents").notNull(), // JSON or text list Split by newline
  feeAmount: numeric("fee_amount", { precision: 10, scale: 2 }).notNull().default("0.00"),
});

// News and Annonces (Actus de Libreville)
export const newsArticles = pgTable("news_articles", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  summary: text("summary").notNull(),
  content: text("content").notNull(),
  featuredImage: text("featured_image"), // URL or path
  isPublished: boolean("is_published").default(true),
  isFeatured: boolean("is_featured").default(false),
  publicationDate: timestamp("publication_date").defaultNow(),
  viewCount: integer("view_count").default(0),
});

// Events (e.g. Campagne de Salubrité urbaine)
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  startDate: text("start_date").notNull(), // YYYY-MM-DD
  endDate: text("end_date").notNull(), // YYYY-MM-DD
  location: text("location").notNull(),
  isActive: boolean("is_active").default(true),
});

// Birth Declarations (Acte de Naissance)
export const birthDeclarations = pgTable("birth_declarations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  childLastName: text("child_last_name").notNull(),
  childFirstName: text("child_first_name").notNull(),
  childDateOfBirth: text("child_date_of_birth").notNull(), // YYYY-MM-DD
  childPlaceOfBirth: text("child_place_of_birth").notNull(),
  fatherName: text("father_name").notNull(),
  motherName: text("mother_name").notNull(),
  declarationDate: text("declaration_date").notNull(), // YYYY-MM-DD
  status: text("status").notNull().default("SUBMITTED"), // 'SUBMITTED' | 'PROCESSING' | 'APPROVED' | 'REJECTED' | 'COMPLETED'
  registrationNumber: text("registration_number"), // N° Registre
  comments: text("comments"), // Agent explanation
  documentUrl: text("document_url"), // URL of PDF/image proof
  submittedAt: timestamp("submitted_at").defaultNow(),
  processedAt: timestamp("processed_at"),
});

// Marriage Dossiers (Célébration de Mariage)
export const marriageDossiers = pgTable("marriage_dossiers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  spouseLastName: text("spouse_last_name").notNull(),
  spouseFirstName: text("spouse_first_name").notNull(),
  spouseDateOfBirth: text("spouse_date_of_birth").notNull(),
  spousePlaceOfBirth: text("spouse_place_of_birth").notNull(),
  spouseNationalId: text("spouse_national_id").notNull(),
  weddingDate: text("wedding_date").notNull(), // YYYY-MM-DD
  weddingLocation: text("wedding_location").notNull(),
  celebrationOfficer: text("celebration_officer"),
  status: text("status").notNull().default("SUBMITTED"), // 'SUBMITTED' | 'PROCESSING' | 'APPROVED' | 'REJECTED' | 'CELEBRATED'
  dossierNumber: text("dossier_number"), // Code unique
  comments: text("comments"),
  documentUrl: text("document_url"),
  submittedAt: timestamp("submitted_at").defaultNow(),
  processedAt: timestamp("processed_at"),
});

// National ID / Passport Requests (Demandes de CNI / Passeport)
export const nationalIdRequests = pgTable("national_id_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  idType: text("id_type").notNull(), // 'CNI' | 'PASSPORT'
  applicationReason: text("application_reason").notNull(), // 'NEW' | 'RENEWAL' | 'LOST' | 'STOLEN'
  previousIdNumber: text("previous_id_number"),
  placeOfIssue: text("place_of_issue").notNull(),
  status: text("status").notNull().default("SUBMITTED"), // 'SUBMITTED' | 'PROCESSING' | 'READY' | 'COLLECTED'
  requestNumber: text("request_number"),
  comments: text("comments"),
  documentUrl: text("document_url"),
  submittedAt: timestamp("submitted_at").defaultNow(),
  processedAt: timestamp("processed_at"),
});

// Building Permits (Permis de Construire)
export const buildingPermits = pgTable("building_permits", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  permitType: text("permit_type").notNull(), // 'CONSTRUCTION' | 'RENOVATION' | 'DEMOLITION' | 'EXTENSION'
  propertyAddress: text("property_address").notNull(),
  propertyParcelNumber: text("property_parcel_number").notNull(), // Section / Cadastre
  projectDescription: text("project_description").notNull(),
  constructionArea: numeric("construction_area", { precision: 10, scale: 2 }).notNull(),
  estimatedCost: numeric("estimated_cost", { precision: 15, scale: 2 }).notNull(),
  architectName: text("architect_name"),
  status: text("status").notNull().default("SUBMITTED"), // 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'DELIVERED'
  permitNumber: text("permit_number"),
  comments: text("comments"),
  landTitleUrl: text("land_title_url"),
  plansUrl: text("plans_url"),
  submittedAt: timestamp("submitted_at").defaultNow(),
  processedAt: timestamp("processed_at"),
});

// Work Authorizations (Autorisation de Travaux)
export const workAuthorizations = pgTable("work_authorizations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  workType: text("work_type").notNull(), // 'PUBLIC' | 'PRIVATE' | 'ROAD' | 'UTILITY'
  workLocation: text("work_location").notNull(),
  workDescription: text("work_description").notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  estimatedDuration: text("estimated_duration").notNull(), // In days / weeks
  trafficImpact: text("traffic_impact"),
  securityMeasures: text("security_measures"),
  status: text("status").notNull().default("SUBMITTED"), // 'SUBMITTED' | 'UNDER_REVIEW' | 'AUTHORIZED' | 'REFUSED'
  authorizationNumber: text("authorization_number"),
  comments: text("comments"),
  submittedAt: timestamp("submitted_at").defaultNow(),
  processedAt: timestamp("processed_at"),
});

// Contact Messages (Contactez la Mairie)
export const contactMessages = pgTable("contact_messages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  subject: text("subject").notNull(), // 'GENERAL' | 'CIVIL_REGISTRY' | 'URBANISM' | 'COMPLAINT' | 'SUGGESTION'
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  message: text("message").notNull(),
  isProcessed: boolean("is_processed").default(false),
  response: text("response"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Notifications
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  notificationType: text("notification_type").notNull(), // 'INFO' | 'STATUS_UPDATE' | 'DOCUMENT'
  link: text("link"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations configuration for Drizzle
export const usersRelations = relations(users, ({ many }) => ({
  birthDeclarations: many(birthDeclarations),
  marriageDossiers: many(marriageDossiers),
  nationalIdRequests: many(nationalIdRequests),
  buildingPermits: many(buildingPermits),
  workAuthorizations: many(workAuthorizations),
  contactMessages: many(contactMessages),
  notifications: many(notifications),
}));

export const birthDeclarationsRelations = relations(birthDeclarations, ({ one }) => ({
  user: one(users, { fields: [birthDeclarations.userId], references: [users.id] }),
}));

export const marriageDossiersRelations = relations(marriageDossiers, ({ one }) => ({
  user: one(users, { fields: [marriageDossiers.userId], references: [users.id] }),
}));

export const nationalIdRequestsRelations = relations(nationalIdRequests, ({ one }) => ({
  user: one(users, { fields: [nationalIdRequests.userId], references: [users.id] }),
}));

export const buildingPermitsRelations = relations(buildingPermits, ({ one }) => ({
  user: one(users, { fields: [buildingPermits.userId], references: [users.id] }),
}));

export const workAuthorizationsRelations = relations(workAuthorizations, ({ one }) => ({
  user: one(users, { fields: [workAuthorizations.userId], references: [users.id] }),
}));

export const contactMessagesRelations = relations(contactMessages, ({ one }) => ({
  user: one(users, { fields: [contactMessages.userId], references: [users.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
}));
