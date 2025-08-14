import { Account, BuildInfo, FetchServerType } from "@finance-tracker/types";
import { startRegistration } from "@simplewebauthn/browser";
import { useEffect, useRef, useState } from "react";
import AccountManagerCard from "../components/AccountManagerCard";
import FTButton from "../components/FTButton";
import FTInput from "../components/FTInput";
import { useModal } from "../components/ModalProvider";
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
  const versionInfo = useRef<BuildInfo | null>(null);

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
    // Fetch version info once on mount
    fetchServer("/version")
      .then((response) => response.json())
      .then((data) => {
        versionInfo.current = data;
      })
      .catch((error) => console.error("Failed to fetch version info:", error));
  }, [fetchServer]);

  useEffect(() => {
    document.title = "Finance Tracker - Settings";
  });

  return (
    <>
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
          <div className="p-4 flex flex-col gap-6 overflow-y-scroll mobile:pb-40">
            {/* Account Information Section */}
            <div
              className="bg-card rounded-lg p-4 border-text-color"
              style={{ borderWidth: "0.9px" }}
            >
              <h2 className="text-active-text-color text-lg font-medium mb-4">
                Account Information
              </h2>
              <div className="flex flex-col gap-4">
                <div className="flex flex-row items-center gap-3">
                  <p className="text-active-text-color min-w-[120px]">
                    Account Name:
                  </p>
                  <FTInput
                    placeholder="Account Name"
                    value={newAccountName}
                    onChange={(e) => setNewAccountName(e.target.value)}
                    className="flex-1"
                  />
                </div>
                <div className="flex flex-row items-center gap-3">
                  <p className="text-active-text-color min-w-[120px]">
                    Monthly Budget:
                  </p>
                  <FTInput
                    type="number"
                    value={newMonthly}
                    onChange={(e) => {
                      const nRegex = /^\d+$/;
                      if (nRegex.test(e.target.value))
                        setNewMonthly(Number(e.target.value));
                    }}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            {/* Tags Management Section */}
            <div
              className="bg-card rounded-lg p-4 border-text-color"
              style={{ borderWidth: "0.9px" }}
            >
              <h2 className="text-active-text-color text-lg font-medium mb-4">
                Tags Management
              </h2>
              <TagsManager />
            </div>

            {/* Data Management Section */}
            <div
              className="bg-card rounded-lg p-4 border-text-color"
              style={{ borderWidth: "0.9px" }}
            >
              <h2 className="text-active-text-color text-lg font-medium mb-4">
                Data Management
              </h2>
              <div className="flex flex-col mobile:flex-col gap-3">
                <div className="flex gap-3 mobile:flex-col">
                  <FTButton
                    onClick={() => {
                      fetchServer(`/accounts/${account.id}/export`)
                        .then((response) => response.blob())
                        .then((blob) => {
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download =
                            account.name.replace(/[^a-zA-Z0-9-_.]/g, "") +
                            ".zip";
                          document.body.appendChild(a);
                          a.click();
                          window.URL.revokeObjectURL(url);
                        });
                    }}
                    className="flex-1"
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
                    className="flex-1"
                  >
                    Import Account Data
                  </FTButton>
                </div>
              </div>
            </div>

            {/* Security Settings Section */}
            <div
              className="bg-card rounded-lg p-4 border-text-color"
              style={{ borderWidth: "0.9px" }}
            >
              <h2 className="text-active-text-color text-lg font-medium mb-4">
                Security Settings
              </h2>
              <div className="flex flex-col gap-3">
                <div className="flex gap-3 mobile:flex-col">
                  <FTButton
                    onClick={() => {
                      register(fetchServer);
                    }}
                    className="flex-1"
                  >
                    Add New Passkey
                  </FTButton>
                  <FTButton
                    onClick={() => {
                      showModal({ type: "OTP" });
                    }}
                    className="flex-1"
                  >
                    Get OTP QrCode
                  </FTButton>
                </div>
              </div>
            </div>

            {/* Danger Zone Section */}
            <div className="bg-red/10 rounded-lg p-4 border border-red/30">
              <h2 className="text-red text-lg font-medium mb-4">Danger Zone</h2>
              <p className="text-text-color text-sm mb-4">
                This action cannot be undone. This will permanently delete the
                account and all associated data.
              </p>
              <FTButton
                className="bg-red hover:bg-red/80"
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
            {versionInfo.current && (
              <span className="text-sm text-text-color">
                Finance-Tracker - v{versionInfo.current.version} -{" "}
                <a
                  href={`https://github.com/Av32000/Finance-Tracker/commit/${versionInfo.current.commitHash}`}
                  target="_blank"
                >
                  {versionInfo.current.commitHash}
                </a>{" "}
                -{" "}
                <a
                  href={`https://github.com/Av32000/Finance-Tracker/tree/${versionInfo.current.branch}`}
                  target="_blank"
                >
                  {versionInfo.current.branch}
                </a>{" "}
                - Build date :{" "}
                {new Date(versionInfo.current.buildTimestamp).toLocaleString()}
              </span>
            )}
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
    </>
  );
};

export default Settings;
