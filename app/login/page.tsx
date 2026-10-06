"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardCheck, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
export default function Login() {
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  async function submit(e: FormEvent) {
    e.preventDefault();
    const r = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, password }),
    });
    const d = await r.json();
    if (!r.ok) return setError(d.error);
    router.push(d.user.role === "admin" ? "/admin" : "/employee");
  }
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <ClipboardCheck />
          </div>
          <CardTitle className="text-2xl">Welcome to AuditDesk</CardTitle>
          <CardDescription>
            Sign in to manage your workplace audits.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="flex flex-col gap-4">
            <label className="text-sm font-medium">
              Employee ID
              <Input
                className="mt-2"
                placeholder="EMP001"
                value={id}
                onChange={(e) => setId(e.target.value)}
                required
              />
            </label>
            <label className="text-sm font-medium">
              Password
              <Input
                className="mt-2"
                type="password"
                placeholder="••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full">
              <LockKeyhole data-icon="inline-start" />
              Sign in
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Demo: EMP001 / 123456 · ADMIN001 / admin123
            </p>
            {/* <p className="text-center text-xs text-muted-foreground">
              Demo: 
            </p> */}
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
