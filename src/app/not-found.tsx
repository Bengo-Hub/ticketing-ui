import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center flex-col gap-4">
      <h1 className="text-4xl font-black text-foreground">404</h1>
      <p className="text-muted-foreground">Page not found.</p>
      <Link href="/" className="text-primary hover:underline font-medium">
        Go home
      </Link>
    </div>
  );
}
