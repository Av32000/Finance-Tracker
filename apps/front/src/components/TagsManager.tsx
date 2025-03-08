import { useBearStore } from "../GlobalState";
import FTInput from "./FTInput";
import FTButton from "./FTButton";

const TagsManager = () => {
  const { account, fetchServer, refreshAccount, setAccount } = useBearStore();
  return account ? (
    <div className="flex flex-col w-96 mobile:w-full">
      <p className="text-active-text-color p-1 mobile:self-center">Tags</p>
      {account.tags.map((tag) => (
        <div className="flex flex-row justify-between w-full p-3" key={tag.id}>
          <div className="flex flex-row gap-2 w-full mobile:justify-between mobile:gap-4">
            <FTInput
              type="color"
              defaultValue={tag.color}
              onBlur={(event) => {
                fetchServer(`/accounts/${account.id}/tags/${tag.id}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    tagColor: event.currentTarget.value,
                  }),
                }).then((res) => {
                  if (res.ok) refreshAccount(account.id, setAccount);
                  else console.error("Unable to update tag");
                });
              }}
            />
            <FTInput
              type="text"
              defaultValue={tag.name}
              onBlur={(event) => {
                fetchServer(`/accounts/${account.id}/tags/${tag.id}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    tagName: event.currentTarget.value,
                  }),
                }).then((res) => {
                  if (res.ok) refreshAccount(account.id, setAccount);
                  else console.error("Unable to update tag");
                });
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  fetchServer(`/accounts/${account.id}/tags/${tag.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      tagName: event.currentTarget.value,
                    }),
                  }).then((res) => {
                    if (res.ok) refreshAccount(account.id, setAccount);
                    else console.error("Unable to update tag");
                  });
                }
              }}
            />
            <img
              src="/components/trash.svg"
              className="w-6 cursor-pointer desktop:hidden"
              onClick={() => {
                fetchServer(`/accounts/${account.id}/tags/${tag.id}`, {
                  method: "DELETE",
                }).then((res) => {
                  if (res.ok) refreshAccount(account.id, setAccount);
                  else console.error("Unable to delete tag");
                });
              }}
            />
          </div>
          <img
            src="/components/trash.svg"
            className="w-6 cursor-pointer mobile:hidden"
            onClick={() => {
              fetchServer(`/accounts/${account.id}/tags/${tag.id}`, {
                method: "DELETE",
              }).then((res) => {
                if (res.ok) refreshAccount(account.id, setAccount);
                else console.error("Unable to delete tag");
              });
            }}
          />
        </div>
      ))}
      <FTButton
        onClick={() => {
          fetchServer(`/accounts/${account.id}/tags`, { method: "POST" }).then(
            (res) => {
              if (res.ok) refreshAccount(account.id, setAccount);
              else console.error("Unable to create new tag");
            },
          );
        }}
      >
        Create new tag
      </FTButton>
    </div>
  ) : null;
};

export default TagsManager;
