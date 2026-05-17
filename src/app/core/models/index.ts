export interface Tenant {
  id: string;
  name: string;
  created_at: string;
}

export type BackendType = 's3' | 'gcs' | 'r2' | 'azure' | 'local';
export type PresignedMode = 'proxy' | 'redirect';

export interface Store {
  id: string;
  tenant_id: string;
  name: string;
  backend_type: BackendType;
  presigned_mode: PresignedMode;
  created_at: string;
  updated_at: string;
}

export interface CreateStoreRequest {
  name: string;
  backend_type: BackendType;
  presigned_mode: PresignedMode;
  backend_config: Record<string, unknown>;
}

export interface AccessKey {
  id: string;
  tenant_id: string;
  access_key: string;
  secret_key?: string;
  created_at: string;
  revoked_at?: string;
}

export interface BucketMapping {
  id: string;
  store_id: string;
  gateway_bucket: string;
  backend_bucket: string;
  created_at: string;
}

export interface S3Config {
  region: string;
  access_key_id: string;
  secret_access_key: string;
}

export interface R2Config {
  region: string;
  endpoint: string;
  access_key_id: string;
  secret_access_key: string;
  force_path_style: boolean;
}

export interface GcsConfig {
  credentials_json: Record<string, unknown>;
}

export interface AzureConfig {
  account_name: string;
  account_key: string;
  service_url?: string;
}

export interface LocalConfig {
  root_path: string;
}

export interface Toast {
  id: number;
  type: 'success' | 'error' | 'info';
  message: string;
}

// ── File Browser ─────────────────────────────────────────────────

export interface BrowseObject {
  key:            string;
  size:           number;
  last_modified:  string;
  etag:           string;
  storage_class:  string;
}

export interface BrowseObjectMetadata extends BrowseObject {
  content_type:  string;
  user_metadata: Record<string, string>;
}

export interface ListObjectsResponse {
  prefix:                   string;
  delimiter:                string;
  max_keys:                 number;
  key_count:                number;
  is_truncated:             boolean;
  next_continuation_token:  string | null;
  objects:                  BrowseObject[];
  common_prefixes:          string[];
}

export interface PresignResponse {
  url:         string;
  expires_at:  string;
}

export interface FolderSizeEvent {
  scanned:     number;
  total_bytes: number;
  error?:      string;
}

export interface BrowserEntry {
  type:    'folder' | 'file';
  name:    string;
  prefix?: string;
  object?: BrowseObject;
}
