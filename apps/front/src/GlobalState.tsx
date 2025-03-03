import {
  Account,
  AccountSchema,
  FetchServerType,
} from "@finance-tracker/types";
import { create } from "zustand";
type AppState = {
  account: Account | null;
  apiURL: string;
  setAccount: (account: Account) => void;
  refreshAccount: (
    id: string,
    setAccount: (account: Account) => void
  ) => Promise<void>;
  fetchServer: FetchServerType;
  setAuthToken: (token: string) => void;
  openFileFromAPI: (id: string, ext: string) => void;
  refreshAccountsCallback: (callback?: () => void) => void;
};

const apiURL = import.meta.env.VITE_API_URL || "/api";
let authToken: string;
let refreshAccountsCallback: () => void;

const fetchServer: FetchServerType = async (endpoint, options) => {
  let fetchOptions = structuredClone(options);
  if (fetchOptions && authToken) {
    if (fetchOptions.headers)
      Object.assign(fetchOptions.headers, {
        Authorization: `Bearer ${authToken}`,
      });
    else
      Object.assign(fetchOptions, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
  } else if (!fetchOptions && authToken) {
    fetchOptions = {
      headers: { Authorization: `Bearer ${authToken}` },
    };
  }
  return await fetch(
    apiURL + (endpoint.startsWith("/") ? endpoint : "/" + endpoint),
    fetchOptions
  );
};

export const useBearStore = create<AppState>((set) => ({
  account: null,
  apiURL,
  setAccount: (account) => set({ account }),
  refreshAccount: async (id, setAccount) => {
    try {
      const fetchedAccouts = await fetchServer("/accounts/" + id);
      const accounts = AccountSchema.parse(await fetchedAccouts.json());
      setAccount(accounts);
    } catch (e) {
      console.error(e);
    }
  },
  fetchServer,
  setAuthToken: (token) => {
    authToken = token;
  },
  openFileFromAPI: (id, ext) => {
    const url = "/files/" + id + "." + ext;
    fetchServer(url)
      .then((response) => response.blob())
      .then((blob) => {
        const fileUrl = URL.createObjectURL(blob);
        window.open(fileUrl, "_blank");
      })
      .catch((error) => {
        console.error("File Error :", error);
      });
  },
  refreshAccountsCallback: async (callback?) => {
    if (callback) {
      refreshAccountsCallback = callback;
    } else if (refreshAccountsCallback != null) {
      refreshAccountsCallback();
    }
  },
}));
