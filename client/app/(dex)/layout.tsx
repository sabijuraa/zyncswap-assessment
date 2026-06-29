import { AppShell } from "../../src/components/dex/AppShell";
import { Providers } from "../providers";

export default function DexLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <AppShell>{children}</AppShell>
    </Providers>
  );
}
