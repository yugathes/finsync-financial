import { Layout } from "@/components/Layout";
import { RefactoredDashboard } from "@/components/Dashboard/RefactoredDashboard";
// import { NewDashboard } from "./NewDashboard";

const Index = () => {
  return (
    <Layout title="FinSync - Your Financial Commitment Tracker">
      {/* <Dashboard /> */}
      <RefactoredDashboard />
    </Layout>
  );
};

export default Index;
