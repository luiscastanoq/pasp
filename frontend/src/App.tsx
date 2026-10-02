import { AuthGate } from './features/auth/components/AuthGate';
import { AppRouter } from './app/router';
import { DemoNotice } from './shared/components/DemoNotice';

function App() {
  return (
    <AuthGate>
      <AppRouter />
      <DemoNotice />
    </AuthGate>
  );
}

export default App;
