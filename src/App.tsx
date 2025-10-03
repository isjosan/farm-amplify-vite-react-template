import { useAuthenticator } from '@aws-amplify/ui-react';
// Assuming you saved the application component file in src/components/
import SnapShotCapture from '../src/components/SnapShotCapture'; 


const App: React.FC = () => {
  const { signOut } = useAuthenticator();
  return (
    <main>
      // Render the new component within your application's structure
      <SnapShotCapture />
      <button onClick={signOut}>Sign Out</button>
    </main>
  );
};

export default App;

