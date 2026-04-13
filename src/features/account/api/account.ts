import { apiRequest } from "@/lib/api-client";

export interface DeleteCurrentUserAccountDataResponse {
  success: true;
  deleted: {
    contacts: number;
    projects: number;
    tasks: number;
    transactions: number;
    goals: number;
    users: number;
  };
}

export async function deleteCurrentUserAccountData() {
  return apiRequest<DeleteCurrentUserAccountDataResponse>("/api/v1/account", {
    method: "DELETE",
  });
}
