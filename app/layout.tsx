// Root layout is a minimal wrapper — locale layout provides <html lang> and <body>
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
