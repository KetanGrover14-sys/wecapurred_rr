import './globals.css';
import AuthProvider from '../components/AuthProvider';

export const metadata = {
  title: 'Norrvex Partner',
  description: 'Banner & Hoarding Management',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased" style={{ backgroundColor: '#F5EDD6' }}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
