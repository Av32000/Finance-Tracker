import { WSEventType } from "@finance-tracker/types";
import { useEffect, useState } from "react";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { useBearStore } from "./GlobalState";
import Layout from "./components/Layout";
import Home from "./views/Home";
import Loading from "./views/Loading";
import Login from "./views/Login";
import NoBackend from "./views/NoBackend";
import Settings from "./views/Settings";
import Statistics from "./views/Statistics";
import Transactions from "./views/Transactions";

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <Layout>
        <Home />
      </Layout>
    ),
  },
  {
    path: "/home",
    element: (
      <Layout>
        <Home />
      </Layout>
    ),
  },
  {
    path: "/transactions",
    element: (
      <Layout>
        <Transactions />
      </Layout>
    ),
  },
  {
    path: "/stats",
    element: (
      <Layout>
        <Statistics />
      </Layout>
    ),
  },
  {
    path: "/settings",
    element: (
      <Layout>
        <Settings />
      </Layout>
    ),
  },
  {
    path: "/*",
    element: (
      <Layout>
        <Home />
      </Layout>
    ),
  },
]);

const BACKEND_STATUS = {
  LOADING: -1,
  UNAUTHENTICATED: 2,
  CONNECTED: 1,
  DISCONNECTED: 0,
};

function App() {
  const [backendStatus, setbackendStatus] = useState(BACKEND_STATUS.LOADING);
  const { fetchServer, refreshAccount, setAccount } = useBearStore();

  const pingBackend = () => {
    fetchServer("/")
      .then((res) => {
        res.status === 401
          ? setbackendStatus(BACKEND_STATUS.UNAUTHENTICATED)
          : setbackendStatus(BACKEND_STATUS.CONNECTED);
      })
      .catch(() => setbackendStatus(BACKEND_STATUS.DISCONNECTED));
  };

  useEffect(() => {
    let ws: WebSocket | null = null;
    const connectWs = () => {
      ws = new WebSocket(`${import.meta.env.VITE_API_URL || ""}/ws`);
      const wsTimeout = setTimeout(() => {
        if (ws && ws.readyState !== WebSocket.OPEN) {
          ws.close();
          setbackendStatus(BACKEND_STATUS.DISCONNECTED);
        }
      }, 4000);

      ws.onopen = () => {
        clearTimeout(wsTimeout);
        console.log("WebSocket connected");
        setbackendStatus(BACKEND_STATUS.CONNECTED);
      };

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.type === WSEventType.PING) {
          ws?.send(
            JSON.stringify({ type: WSEventType.PONG, timestamp: Date.now() }),
          );
        } else if (message.type === WSEventType.PONG) {
          setbackendStatus(BACKEND_STATUS.CONNECTED);
        } else if (message.type === WSEventType.RefreshEvent) {
          const currentAccount = useBearStore.getState().account;
          if (currentAccount) refreshAccount(currentAccount.id, setAccount);
        }
      };

      ws.onclose = () => {
        clearTimeout(wsTimeout);
        setbackendStatus(BACKEND_STATUS.DISCONNECTED);
      };
    };

    connectWs();

    setInterval(() => {
      if (!ws || ws.readyState !== WebSocket.OPEN) {
        connectWs();
      }
    }, 5000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      {backendStatus == BACKEND_STATUS.LOADING && <Loading />}

      {backendStatus == BACKEND_STATUS.CONNECTED && (
        <RouterProvider router={router} />
      )}

      {backendStatus == BACKEND_STATUS.UNAUTHENTICATED && (
        <Login refresh={pingBackend} />
      )}

      {backendStatus == BACKEND_STATUS.DISCONNECTED && <NoBackend />}
    </div>
  );
}

export default App;
