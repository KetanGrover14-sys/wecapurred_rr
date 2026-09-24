import './globals.css';
import AuthProvider from '../components/AuthProvider';

export const metadata = {
  title: 'Apollo Pharmacy \u00d7 Norrvex Labs',
  description: 'Apollo Pharmacy recce, installation and project management in collaboration with Norrvex Labs',
  icons: { icon: '/images/apollopharmacy.png' },
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
