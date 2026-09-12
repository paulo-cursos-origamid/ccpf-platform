import { AccountDetails } from "@/modules/accounts/components/client/AccountDetails";

interface AccountDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function AccountDetailsPage({
  params,
}: AccountDetailsPageProps) {
  const { id } = await params;

  return (
    <main>
      <AccountDetails accountId={id} />
    </main>
  );
}
