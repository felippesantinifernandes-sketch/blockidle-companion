/** Preferences are versioned at the storage key and validated on every load.
 * Unknown backup versions are rejected to preserve existing configuration.
 * IndexedDB v1 stores only bounded, sanitized stock summaries, partitioned per capture session.
 */
export const preferencesVersion = 1;
export const snapshotsVersion = 1;
