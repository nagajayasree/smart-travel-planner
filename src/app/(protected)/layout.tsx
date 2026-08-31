import RequireAuth from '../lib/features/auth/RequireAuth';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RequireAuth>{children}</RequireAuth>;
}
