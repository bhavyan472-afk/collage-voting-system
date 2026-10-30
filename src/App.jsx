import Footer from "./components/Footer.jsx";
import Loader from "./components/Loader.jsx";
import Navbar from "./components/Navbar.jsx";
import NetworkBanner from "./components/NetworkBanner.jsx";
import SetupNotice from "./components/SetupNotice.jsx";
import Toasts from "./components/Toasts.jsx";
import TxStatus from "./components/TxStatus.jsx";
import { useElection } from "./hooks/useElection.js";
import { useHashRoute } from "./hooks/useHashRoute.js";
import { useToasts } from "./hooks/useToasts.js";
import { useWallet } from "./hooks/useWallet.js";
import AdminPage from "./pages/AdminPage.jsx";
import HomePage from "./pages/HomePage.jsx";
import ResultsPage from "./pages/ResultsPage.jsx";
import VotePage from "./pages/VotePage.jsx";
import { IS_CONFIGURED } from "./utils/contract.js";

const PAGES = {
  "/": HomePage,
  "/vote": VotePage,
  "/results": ResultsPage,
  "/admin": AdminPage,
};

export default function App() {
  const { path } = useHashRoute();
  const { toasts, notify, dismiss } = useToasts();
  const wallet = useWallet(notify);
  const election = useElection(wallet, notify);

  const Page = PAGES[path];
  // The landing page renders without chain data; the others need it loaded.
  const needsData = path !== "/";

  let content;
  if (!IS_CONFIGURED) content = <SetupNotice />;
  else if (needsData && election.loading) content = <Loader />;
  else if (needsData && !election.info) content = <Loader label="Waiting for the blockchain node…" />;
  else content = <Page wallet={wallet} election={election} />;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar path={path} wallet={wallet} isAdmin={election.isAdmin} />
      {IS_CONFIGURED && <NetworkBanner wallet={wallet} loadError={election.loadError} onRetry={election.refresh} />}
      <main className="flex-1">{content}</main>
      <Footer />
      <Toasts toasts={toasts} dismiss={dismiss} />
      <TxStatus tx={election.tx} onClose={election.clearTx} />
    </div>
  );
}
