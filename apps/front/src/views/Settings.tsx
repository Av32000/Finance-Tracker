import { Account, FetchServerType } from "@finance-tracker/types";
import { startRegistration } from "@simplewebauthn/browser";
import { useEffect, useState } from "react";
import AccountManagerCard from "../components/AccountManagerCard";
import FTButton from "../components/FTButton";
import FTInput from "../components/FTInput";
import { useModal } from "../components/ModalProvider";
import NavBar from "../components/NavBar";
import TagsManager from "../components/TagsManager";
import { useBearStore } from "../GlobalState";

const importAccount = (
  successCallback: (response: Response) => void,
  fetchServer: FetchServerType,
  account: Account,
  force: boolean = false,
) => {
  const input: HTMLInputElement = document.createElement("input");
  input.type = "file";
  input.accept = ".zip";

  input.onchange = async (e: Event) => {
    const target = e.target as HTMLInputElement;
    const file: File | null = target.files?.[0] || null;

    if (file) {
      const formData = new FormData();
      formData.append("zipFile", file);
      formData.append("force", force.toString());

      try {
        const response = await fetchServer(
          `/accounts/${account.id}/import?force=${force}`,
          {
            method: "POST",
            body: formData,
          },
        );

        successCallback(response);
      } catch (error) {
        console.error(error);
      }
    }
  };

  input.click();
};

const Settings = () => {
  const {
    account,
    refreshAccount,
    setAccount,
    fetchServer,
    refreshAccountsCallback,
  } = useBearStore();
  const [newAccountName, setNewAccountName] = useState("");
  const [newMonthly, setNewMonthly] = useState(0);
  const { showModal } = useModal();
  const Reset = (account: Account) => {
    setNewAccountName(account.name);
    setNewMonthly(account.monthly);
  };

  const register = async (fetchServer: FetchServerType) => {
    return new Promise<void>(async (resolve, reject) => {
      const resp = await fetchServer("/generate-new-key-options");
      let attResp;
      try {
        attResp = await startRegistration(await resp.json());
      } catch (error) {
        reject(error);
        throw error;
      }

      const verificationResp = await fetchServer(
        "/verify-new-key-registration",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(attResp),
        },
      );

      const verificationJSON = await verificationResp.json();

      if (verificationJSON) {
        resolve();
      } else {
        reject(verificationJSON);
      }
    });
  };

  const Save = async (account: Account) => {
    await fetchServer("/accounts/" + account.id, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newAccountName }),
    });

    await fetchServer("/accounts/" + account.id + "/monthly", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ monthly: newMonthly }),
    });

    await refreshAccount(account.id, setAccount);
  };

  useEffect(() => {
    if (account) {
      Reset(account);
    }
  }, [account]);

  useEffect(() => {
    document.title = "Finance Tracker - Settings";
  });

  return (
    <div className="overflow-hidden flex">
      <NavBar />
      {account ? (
        <div className="bg-bg flex-1 h-screen flex flex-col desktop:relative">
          <div className="w-full p-4 flex flex-row justify-between mobile:flex-col mobile:items-center mobile:mt-2 mobile:w-screen">
            <div className="flex items-start mobile:gap-2">
              <img
                src="/pages/settings.svg"
                className="w-6 m-2 mobile:my-1 mobile:mx-0"
              />
              <div className="flex flex-col">
                <h1 className="text-active-text-color text-2xl">Settings</h1>
                <p className="text-text-color mobile:hidden">
                  Edit account settings
                </p>
              </div>
            </div>
            <div className="flex flex-row items-center gap-3">
              {newAccountName != account.name ||
              newMonthly != account.monthly ? (
                <div className="mobile:mt-3 flex flex-row gap-3">
                  <FTButton className="h-10" onClick={() => Save(account)}>
                    Save Settings
                  </FTButton>
                  <FTButton
                    className="bg-red h-10"
                    onClick={() => Reset(account)}
                  >
                    Clear Modifications
                  </FTButton>
                </div>
              ) : null}
            </div>
          </div>
          <div className="p-4 flex flex-col gap-4 overflow-y-scroll">
            <div className="flex flex-row items-center gap-3">
              <p className="text-active-text-color">Account Name : </p>
              <FTInput
                placeholder="Account Name"
                value={newAccountName}
                onChange={(e) => setNewAccountName(e.target.value)}
              />
            </div>
            <div className="flex flex-row items-center gap-3">
              <p className="text-active-text-color">Monthly Budget : </p>
              <FTInput
                type="number"
                value={newMonthly}
                onChange={(e) => {
                  const nRegex = /^\d+$/;
                  if (nRegex.test(e.target.value))
                    setNewMonthly(Number(e.target.value));
                }}
              />
            </div>
            <TagsManager />
            <div className="flex gap-2">
              <FTButton
                onClick={() => {
                  fetchServer(`/accounts/${account.id}/export`)
                    .then((response) => response.blob())
                    .then((blob) => {
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download =
                        account.name.replace(/[^a-zA-Z0-9-_.]/g, "") + ".zip";
                      document.body.appendChild(a);
                      a.click();
                      window.URL.revokeObjectURL(url);
                    });
                }}
              >
                Export Account Data
              </FTButton>
              <FTButton
                onClick={() => {
                  importAccount(
                    async (response: Response) => {
                      if (response.status == 200) {
                        refreshAccountsCallback();
                        response.json().then((json) => {
                          showModal({
                            type: "Info",
                            title: `Account ${json.name} successfully imported`,
                          });
                        });
                      } else if (response.status == 403) {
                        const showForceImportModal = () =>
                          showModal({
                            type: "Boolean",
                            title:
                              "An account with the same ID already exists. Would you like to replace the existing account?",
                            confirmText: "Replace",
                            cancelText: "Cancel",
                            callback: () => {
                              importAccount(
                                async (response: Response) => {
                                  if (response.status == 200) {
                                    refreshAccountsCallback();
                                    response.json().then((json) => {
                                      showModal({
                                        type: "Info",
                                        title: `Account ${json.name} successfully imported`,
                                      });
                                    });
                                  } else if (response.status == 403) {
                                    showForceImportModal();
                                  } else if (response.status == 400) {
                                    const text = await response.text();
                                    showModal({
                                      type: "Info",
                                      title: "Import Error : " + text,
                                    });
                                  }
                                },
                                fetchServer,
                                account!,
                                true,
                              );
                            },
                          });
                        showForceImportModal();
                      } else if (response.status == 400) {
                        const text = await response.text();
                        showModal({
                          type: "Info",
                          title: "Import Error : " + text,
                        });
                      }
                    },
                    fetchServer,
                    account,
                  );
                }}
              >
                Import Account Data
              </FTButton>
            </div>
            <div className="flex gap-2">
              <FTButton
                onClick={() => {
                  register(fetchServer);
                }}
              >
                Add New Passkey
              </FTButton>
              <FTButton
                onClick={() => {
                  showModal({ type: "OTP" });
                }}
              >
                Get OTP QrCode
              </FTButton>
              <FTButton
                className="bg-red"
                onClick={() => {
                  showModal({
                    type: "Boolean",
                    title: `Are you sure you want to delete the account ${account?.name}?`,
                    confirmText: "Delete Account",
                    cancelText: "Cancel",
                    callback: () => {
                      fetchServer(`/accounts/${account!.id}`, {
                        method: "DELETE",
                      }).then(() => {
                        window.location.reload();
                      });
                    },
                  });
                }}
              >
                Delete Account
              </FTButton>
            </div>
          </div>
          <div className="desktop:hidden">
            <AccountManagerCard />
          </div>
        </div>
      ) : (
        <div className="flex-1 h-screen bg-bg flex items-center justify-center">
          <p className="text-2xl text-text-color">No Account</p>
          <div className="desktop:hidden">
            <AccountManagerCard />
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
