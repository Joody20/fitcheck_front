import {
  getAccessToken,
  clearAccessToken,
  setLoggedOutFlag,
} from "@/src/lib/auth";

export async function logout() {
  void getAccessToken();
  clearAccessToken();
  setLoggedOutFlag(true);
}
