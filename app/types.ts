export enum UserRole {
  INDIVIDUAL = "INDIVIDUAL",
  SUPER_ADMIN = "SUPER_ADMIN",
  BUSINESS_ADMIN = "BUSINESS_ADMIN",
  BUSINESS_STAFF = "BUSINESS_STAFF",
}

export interface User {
  id: string;
  name: string | null;
  email: string | null;
  role: string; // Prisma uses string
}
