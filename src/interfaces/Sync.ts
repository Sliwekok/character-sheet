import { StoredCharacter } from "./StoredCharacter";

/**
 * One character as the server reports it. A deleted character comes back
 * as a tombstone (`deletedAt` set, `character` null) so every device can
 * drop its local copy instead of re-uploading it.
 */
export interface RemoteCharacter {
  id: string;
  updatedAt: string;
  deletedAt: string | null;
  character: StoredCharacter | null;
}
