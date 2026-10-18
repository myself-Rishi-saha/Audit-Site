// "use client";
// import { FormEvent, useState } from "react";
// import { useRouter } from "next/navigation";
// import { ClipboardCheck, LockKeyhole } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import Image from "next/image";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// export default function Login() {
//   const [id, setId] = useState("");
//   const [password, setPassword] = useState("");
//   const [error, setError] = useState("");
//   const [username, setUsername] = useState("");
//   const router = useRouter();
//   async function submit(e: FormEvent) {
//     e.preventDefault();

//     const r = await fetch("/api/auth/login", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         username,
//         password,
//       }),
//     });

//     const d = await r.json();

//     if (!r.ok) {
//       return setError(d.error);
//     }

//     router.push("/employee");
//   }
//   return (
//     <main className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
//       <Card className="w-full max-w-md">
//         <CardHeader className="text-center">
//           {/* <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
//             <ClipboardCheck />
//           </div> */}
//           <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-xl bg-white">
//             <Image
//                src="/logo-without-background-.png"
//               alt="Company Logo"
//               width={48}
//               height={48}
//               className="object-contain"
//               priority
//             />
//           </div>
//           <CardTitle className="text-2xl">Welcome to AuditDesk</CardTitle>
//           <CardDescription>
//             Sign in to manage your workplace audits.
//           </CardDescription>
//         </CardHeader>
//         <CardContent>
//           <form onSubmit={submit} className="flex flex-col gap-4">
//             <label className="text-sm font-medium">
//               Employee ID
//               <Input
//                 className="mt-2"
//                 value={username}
//                 onChange={(e) => setUsername(e.target.value)}
//                 placeholder="Enter username"
//                 required
//               />
//             </label>
//             <label className="text-sm font-medium">
//               Password
//               <Input
//                 className="mt-2"
//                 type="password"
//                 placeholder="••••••"
//                 value={password}
//                 onChange={(e) => setPassword(e.target.value)}
//                 required
//               />
//             </label>
//             {error && <p className="text-sm text-destructive">{error}</p>}
//             <Button type="submit" className="w-full">
//               <LockKeyhole data-icon="inline-start" />
//               Sign in
//             </Button>
//             <p className="text-center text-xs text-muted-foreground">
//               Demo: EMP001 / 123456 · ADMIN001 / admin123
//             </p>
//             {/* <p className="text-center text-xs text-muted-foreground">
//               Demo: 
//             </p> */}
//           </form>
//         </CardContent>
//       </Card>
//     </main>
//   );
// }
"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Login() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [username, setUsername] = useState("");
  const [checkingSession, setCheckingSession] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const router = useRouter();

  // Redirect an already-authenticated employee.
  useEffect(() => {
    let active = true;

    async function checkSession() {
      try {
        const response = await fetch("/api/auth/me", {
          cache: "no-store",
        });

        if (!active) return;

        if (response.ok) {
          const data = await response.json();

          if (!active) return;

          if (data.role === "admin" || data.user?.role === "admin") {
            router.replace("/admin");
            return;
          }

          if (
            data.role === "auditor" ||
            data.user?.role === "auditor"
          ) {
            router.replace("/employee");
            return;
          }
        }
      } catch (err) {
        console.error("Session check failed:", err);
      } finally {
        if (active) {
          setCheckingSession(false);
        }
      }
    }

    checkSession();

    return () => {
      active = false;
    };
  }, [router]);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");
    setSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Login failed.");
        return;
      }

      router.replace("/employee");
      router.refresh();
    } catch {
      setError("Unable to connect to the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (checkingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted/40">
        <p className="text-sm text-muted-foreground">
          Checking your session...
        </p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-xl bg-white">
            <Image
              src="/logo-without-background-.png"
              alt="Company Logo"
              width={48}
              height={48}
              className="object-contain"
              priority
            />
          </div>

          <CardTitle className="text-2xl">
            Welcome to AuditDesk
          </CardTitle>

          <CardDescription>
            Sign in to manage your workplace audits.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={submit} className="flex flex-col gap-4">
            <label className="text-sm font-medium">
              Username
              <Input
                className="mt-2"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                autoComplete="username"
                required
              />
            </label>

            <label className="text-sm font-medium">
              Password
              <Input
                className="mt-2"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </label>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={submitting}
            >
              <LockKeyhole data-icon="inline-start" />
              {submitting ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
