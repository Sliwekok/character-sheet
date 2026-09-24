/** The user shape the API returns to the browser - never includes the password hash. */
export interface PublicUser {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
}
