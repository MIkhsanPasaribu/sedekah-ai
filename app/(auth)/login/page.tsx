import { LoginForm } from "./LoginForm";

export const metadata = {
  title: "Masuk — SEDEKAH.AI",
  description: "Masuk ke SEDEKAH.AI untuk melanjutkan perjalanan ibadah Anda.",
};

interface LoginPageProps {
  searchParams: Promise<{ msg?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { msg } = await searchParams;
  return <LoginForm message={msg} />;
}
