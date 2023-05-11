export interface AccountUploadResponse {
  success: boolean;
  accountsUploaded: number;
  accountsCreated: number;
  accountsUpdated: number;
  errors: number;
  errorMessages: string[];
}
