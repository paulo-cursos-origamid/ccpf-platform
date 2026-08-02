export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="auth-page">{children}</div>;
}
