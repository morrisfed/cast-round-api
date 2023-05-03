export interface MemberUploadResponse {
  success: boolean;
  membersUploaded: number;
  membersCreated: number;
  membersUpdated: number;
  errors: number;
  errorMessages: string[];
}
