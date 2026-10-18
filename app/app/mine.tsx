import { Redirect } from 'expo-router';

// "My mountains" is the home page now; keep old links and bookmarks working.
export default function MyMountainsRedirect() {
  return <Redirect href="/" />;
}
