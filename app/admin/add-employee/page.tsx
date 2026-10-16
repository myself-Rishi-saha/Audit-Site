// "use client";

// import { FormEvent, useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
// import {
//   Check,
//   Clipboard,
//   Copy,
//   KeyRound,
//   Loader2,
//   RefreshCw,
//   ShieldCheck,
//   UserPlus,
//   Users,
// } from "lucide-react";

// import { AppShell } from "@/components/app-shell";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";

// // type Employee = {
// //   id: string;
// //   name: string;
// //   email: string;
// //   username: string;
// //   isActive: boolean;
// //   mustChangePassword: boolean;
// //   role: "auditor";
// //   createdAt: string;
// //   updatedAt: string;
// // };
// type Employee = {
//   id: string;
//   name: string;
//   email: string;
//   username: string;
//   isActive: boolean;
//   mustChangePassword: boolean;
//   role: "auditor";
//   canAccessAudit: boolean;
//   canAccessServiceReport: boolean;
//   createdAt: string;
//   updatedAt: string;
// };
// export default function AddEmployeePage() {
//   const router = useRouter();
//   const [canAccessAudit, setCanAccessAudit] = useState(false);
//   const [canAccessServiceReport, setCanAccessServiceReport] = useState(false);
//   const [name, setName] = useState("");
//   const [email, setEmail] = useState("");
//   const [username, setUsername] = useState("");
//   const [password, setPassword] = useState("");

//   const [employees, setEmployees] = useState<Employee[]>([]);

//   const [loadingEmployees, setLoadingEmployees] = useState(true);

//   const [generatingUsername, setGeneratingUsername] = useState(false);

//   const [generatingPassword, setGeneratingPassword] = useState(false);

//   const [saving, setSaving] = useState(false);

//   const [resettingId, setResettingId] = useState<string | null>(null);

//   const [resetPassword, setResetPassword] = useState("");

//   const [copied, setCopied] = useState("");

//   const [error, setError] = useState("");
//   const [success, setSuccess] = useState("");

//   useEffect(() => {
//     loadEmployees();
//   }, []);

//   async function loadEmployees() {
//     try {
//       setLoadingEmployees(true);

//       const response = await fetch("/api/admin/employee", {
//         cache: "no-store",
//       });

//       const data = await response.json();

//       if (!response.ok) {
//         throw new Error(data?.error || "Failed to load employees");
//       }

//       setEmployees(data.employees || []);
//     } catch (error) {
//       console.error("Load employees error:", error);

//       setError("Failed to load employees");
//     } finally {
//       setLoadingEmployees(false);
//     }
//   }

//   async function generateUsername() {
//     if (!name.trim()) {
//       setError("Enter the employee name first.");
//       return;
//     }

//     setError("");
//     setSuccess("");
//     setGeneratingUsername(true);

//     try {
//       const response = await fetch("/api/admin/employee/generate-username", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           name,
//         }),
//       });

//       const data = await response.json();

//       if (!response.ok) {
//         setError(data?.error || "Failed to generate username");
//         return;
//       }

//       setUsername(data.username);
//     } catch (error) {
//       console.error("Generate username error:", error);

//       setError("Unable to generate username.");
//     } finally {
//       setGeneratingUsername(false);
//     }
//   }

//   function generatePassword() {
//     setGeneratingPassword(true);
//     setError("");
//     setSuccess("");

//     const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

//     const special = "!@#$%";

//     let newPassword = "";

//     for (let i = 0; i < 8; i++) {
//       newPassword += chars[Math.floor(Math.random() * chars.length)];
//     }

//     newPassword += special[Math.floor(Math.random() * special.length)];

//     newPassword += Math.floor(Math.random() * 10);

//     setPassword(newPassword);
//     setGeneratingPassword(false);
//   }

//   async function copyText(value: string, type: string) {
//     try {
//       await navigator.clipboard.writeText(value);

//       setCopied(type);

//       setTimeout(() => {
//         setCopied("");
//       }, 1500);
//     } catch {
//       setError("Unable to copy to clipboard.");
//     }
//   }

//   async function handleSubmit(e: FormEvent<HTMLFormElement>) {
//     e.preventDefault();

//     setError("");
//     setSuccess("");

//     if (!name.trim()) {
//       setError("Employee name is required.");
//       return;
//     }

//     if (!email.trim()) {
//       setError("Email is required.");
//       return;
//     }

//     if (!username.trim()) {
//       setError("Generate a username before saving.");
//       return;
//     }

//     if (!password) {
//       setError("Generate a password before saving.");
//       return;
//     }
//     if (!canAccessAudit && !canAccessServiceReport) {
//       setError("Select at least one report permission.");
//       return;
//     }

//     setSaving(true);

//     try {
//       const response = await fetch("/api/admin/employee", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           name: name.trim(),
//           email: email.trim(),
//           username: username.trim(),
//           password,
//           isActive: true,
//         }),
//       });

//       const data = await response.json();

//       if (!response.ok) {
//         setError(data?.error || "Failed to create employee");
//         return;
//       }

//       setSuccess("Employee created successfully.");

//       // Refresh employee list.
//       await loadEmployees();

//       // Clear form.
//       setName("");
//       setEmail("");
//       setUsername("");
//       setPassword("");

//       router.refresh();
//     } catch (error) {
//       console.error("Create employee error:", error);

//       setError("Unable to connect to the server. Please try again.");
//     } finally {
//       setSaving(false);
//     }
//   }

//   async function resetEmployeePassword(employee: Employee) {
//     const confirmed = window.confirm(
//       `Generate a new password for ${employee.name}?`,
//     );

//     if (!confirmed) {
//       return;
//     }

//     setError("");
//     setSuccess("");
//     setResetPassword("");
//     setResettingId(employee.id);

//     try {
//       const response = await fetch(
//         `/api/admin/employee/${employee.id}/reset-password`,
//         {
//           method: "POST",
//         },
//       );

//       const data = await response.json();

//       if (!response.ok) {
//         setError(data?.error || "Failed to reset password");
//         return;
//       }

//       setResetPassword(data.password);

//       setSuccess(`New password generated for ${employee.name}.`);

//       await loadEmployees();
//     } catch (error) {
//       console.error("Reset password error:", error);

//       setError("Unable to reset the password.");
//     } finally {
//       setResettingId(null);
//     }
//   }

//   return (
//     <AppShell>
//       <main className="min-h-screen bg-slate-50 px-4 py-8">
//         <div className="mx-auto max-w-6xl space-y-8">
//           {/* Header */}
//           <div>
//             <div className="flex items-center gap-3">
//               <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
//                 <Users className="h-6 w-6" />
//               </div>

//               <div>
//                 <h1 className="text-2xl font-bold text-slate-900">
//                   Employee Management
//                 </h1>

//                 <p className="text-sm text-slate-500">
//                   Create and manage auditor accounts.
//                 </p>
//               </div>
//             </div>
//           </div>

//           {/* Create employee */}
//           <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
//             <div className="border-b border-slate-200 bg-slate-50/80 px-6 py-5">
//               <div className="flex items-center gap-3">
//                 <UserPlus className="h-5 w-5 text-slate-700" />

//                 <div>
//                   <h2 className="font-semibold text-slate-900">
//                     Add New Employee
//                   </h2>

//                   <p className="text-sm text-slate-500">
//                     Create an auditor login account.
//                   </p>
//                 </div>
//               </div>
//             </div>

//             <form onSubmit={handleSubmit} className="space-y-6 p-6">
//               {/* Name + email */}
//               <div className="grid gap-5 md:grid-cols-2">
//                 <div className="space-y-2">
//                   <label
//                     htmlFor="name"
//                     className="text-sm font-medium text-slate-700"
//                   >
//                     Employee Name
//                   </label>

//                   <Input
//                     id="name"
//                     value={name}
//                     onChange={(e) => setName(e.target.value)}
//                     placeholder="e.g. S. Roy"
//                     disabled={saving}
//                     required
//                   />
//                 </div>

//                 <div className="space-y-2">
//                   <label
//                     htmlFor="email"
//                     className="text-sm font-medium text-slate-700"
//                   >
//                     Email ID
//                   </label>

//                   <Input
//                     id="email"
//                     type="email"
//                     value={email}
//                     onChange={(e) => setEmail(e.target.value)}
//                     placeholder="employee@company.com"
//                     disabled={saving}
//                     required
//                   />
//                 </div>
//               </div>

//               {/* Username */}
//               <div className="space-y-2">
//                 <label
//                   htmlFor="username"
//                   className="text-sm font-medium text-slate-700"
//                 >
//                   Username
//                 </label>

//                 <div className="flex gap-2">
//                   <Input
//                     id="username"
//                     value={username}
//                     readOnly
//                     placeholder="Click Generate Username"
//                     className="font-mono"
//                   />

//                   <Button
//                     type="button"
//                     variant="outline"
//                     onClick={generateUsername}
//                     disabled={generatingUsername || saving || !name.trim()}
//                   >
//                     {generatingUsername ? (
//                       <Loader2 className="h-4 w-4 animate-spin" />
//                     ) : (
//                       <RefreshCw className="h-4 w-4" />
//                     )}

//                     <span className="ml-2">Generate</span>
//                   </Button>

//                   <Button
//                     type="button"
//                     variant="outline"
//                     onClick={() => copyText(username, "username")}
//                     disabled={!username}
//                   >
//                     {copied === "username" ? (
//                       <Check className="h-4 w-4" />
//                     ) : (
//                       <Copy className="h-4 w-4" />
//                     )}
//                   </Button>
//                 </div>

//                 <p className="text-xs text-slate-500">
//                   Username is generated uniquely from the employee name.
//                 </p>
//               </div>

//               {/* Password */}
//               <div className="space-y-2">
//                 <label
//                   htmlFor="password"
//                   className="text-sm font-medium text-slate-700"
//                 >
//                   Temporary Password
//                 </label>

//                 <div className="flex gap-2">
//                   <Input
//                     id="password"
//                     type="text"
//                     value={password}
//                     readOnly
//                     placeholder="Click Generate Password"
//                     className="font-mono"
//                   />

//                   <Button
//                     type="button"
//                     variant="outline"
//                     onClick={generatePassword}
//                     disabled={saving}
//                   >
//                     {generatingPassword ? (
//                       <Loader2 className="h-4 w-4 animate-spin" />
//                     ) : (
//                       <KeyRound className="h-4 w-4" />
//                     )}

//                     <span className="ml-2">Generate</span>
//                   </Button>

//                   <Button
//                     type="button"
//                     variant="outline"
//                     onClick={() => copyText(password, "password")}
//                     disabled={!password}
//                   >
//                     {copied === "password" ? (
//                       <Check className="h-4 w-4" />
//                     ) : (
//                       <Copy className="h-4 w-4" />
//                     )}
//                   </Button>
//                 </div>

//                 <p className="text-xs text-slate-500">
//                   The password is stored securely as a hash. The employee should
//                   change this temporary password after their first login.
//                 </p>
//               </div>

//               {/* Role */}
//               {/* <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
//                 <ShieldCheck className="mt-0.5 h-5 w-5 text-slate-600" />

//                 <div>
//                   <p className="text-sm font-semibold text-slate-800">
//                     Role: Auditor
//                   </p>

//                   <p className="mt-1 text-xs text-slate-500">
//                     Employees created here can create audits and service
//                     reports.
//                   </p>
//                 </div>
//               </div> */}
//               {/* Module Access Permissions */}
//               <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
//                 <div className="flex items-start gap-3">
//                   <ShieldCheck className="mt-0.5 h-5 w-5 text-slate-700" />

//                   <div>
//                     <h3 className="font-semibold text-slate-900">
//                       Module Access Permissions
//                     </h3>

//                     <p className="mt-1 text-sm text-slate-500">
//                       Select which reports this employee is allowed to access.
//                     </p>
//                   </div>
//                 </div>

//                 <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-4 transition hover:bg-slate-50">
//                   <input
//                     type="checkbox"
//                     checked={canAccessAudit}
//                     onChange={(e) => setCanAccessAudit(e.target.checked)}
//                     disabled={saving}
//                     className="mt-1 h-4 w-4 accent-slate-900"
//                   />

//                   <div>
//                     <p className="font-medium text-slate-900">Audit Report</p>
//                     <p className="mt-1 text-sm text-slate-500">
//                       Create, view, and submit audit reports.
//                     </p>
//                   </div>
//                 </label>

//                 <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-4 transition hover:bg-slate-50">
//                   <input
//                     type="checkbox"
//                     checked={canAccessServiceReport}
//                     onChange={(e) =>
//                       setCanAccessServiceReport(e.target.checked)
//                     }
//                     disabled={saving}
//                     className="mt-1 h-4 w-4 accent-slate-900"
//                   />

//                   <div>
//                     <p className="font-medium text-slate-900">Service Report</p>
//                     <p className="mt-1 text-sm text-slate-500">
//                       Create, view, and submit service reports.
//                     </p>
//                   </div>
//                 </label>

//                 {!canAccessAudit && !canAccessServiceReport && (
//                   <p className="text-sm text-red-600">
//                     Select at least one report permission.
//                   </p>
//                 )}

//                 <p className="text-xs text-slate-500">
//                   Access permissions can be changed later by the admin.
//                 </p>
//               </div>

//               {/* Messages */}
//               {error && (
//                 <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
//                   {error}
//                 </div>
//               )}

//               {success && (
//                 <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
//                   {success}
//                 </div>
//               )}

//               {/* Save */}
//               <div className="flex justify-end border-t border-slate-200 pt-6">
//                 <Button
//                   type="submit"
//                   disabled={saving || !name || !email || !username || !password}
//                 >
//                   {saving ? (
//                     <>
//                       <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                       Saving...
//                     </>
//                   ) : (
//                     <>
//                       <Check className="mr-2 h-4 w-4" />
//                       Save Employee
//                     </>
//                   )}
//                 </Button>
//               </div>
//             </form>
//           </div>

//           {/* Reset password result */}
//           {resetPassword && (
//             <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
//               <div className="flex items-start gap-4">
//                 <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100">
//                   <KeyRound className="h-5 w-5 text-amber-700" />
//                 </div>

//                 <div className="min-w-0 flex-1">
//                   <h3 className="font-semibold text-amber-900">
//                     New Temporary Password
//                   </h3>

//                   <p className="mt-1 text-sm text-amber-800">
//                     Give this password to the employee. It will not be displayed
//                     again after leaving this page.
//                   </p>

//                   <div className="mt-3 flex gap-2">
//                     <Input
//                       value={resetPassword}
//                       readOnly
//                       className="bg-white font-mono"
//                     />

//                     <Button
//                       type="button"
//                       variant="outline"
//                       onClick={() => copyText(resetPassword, "reset-password")}
//                     >
//                       {copied === "reset-password" ? (
//                         <Check className="h-4 w-4" />
//                       ) : (
//                         <Copy className="h-4 w-4" />
//                       )}

//                       <span className="ml-2">Copy</span>
//                     </Button>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           )}

//           {/* Employee list */}
//           <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
//             <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-6 py-5">
//               <div>
//                 <h2 className="font-semibold text-slate-900">
//                   Existing Employees
//                 </h2>

//                 <p className="text-sm text-slate-500">
//                   {employees.length} employee
//                   {employees.length !== 1 ? "s" : ""} registered
//                 </p>
//               </div>

//               <Button
//                 type="button"
//                 variant="outline"
//                 size="sm"
//                 onClick={loadEmployees}
//                 disabled={loadingEmployees}
//               >
//                 <RefreshCw
//                   className={`mr-2 h-4 w-4 ${
//                     loadingEmployees ? "animate-spin" : ""
//                   }`}
//                 />
//                 Refresh
//               </Button>
//             </div>

//             {loadingEmployees ? (
//               <div className="flex items-center justify-center py-12">
//                 <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
//               </div>
//             ) : employees.length === 0 ? (
//               <div className="py-12 text-center">
//                 <Users className="mx-auto h-10 w-10 text-slate-300" />

//                 <p className="mt-3 font-medium text-slate-700">
//                   No employees yet
//                 </p>

//                 <p className="mt-1 text-sm text-slate-500">
//                   Create your first auditor above.
//                 </p>
//               </div>
//             ) : (
//               <div className="overflow-x-auto">
//                 <table className="w-full min-w-[1000px]">
//                   <thead>
//                     <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
//                       <th className="px-6 py-4">Employee</th>

//                       <th className="px-6 py-4">Email</th>

//                       <th className="px-6 py-4">Username</th>

//                       <th className="px-6 py-4">Role</th>

//                       <th className="px-6 py-4">Report Access</th>

//                       <th className="px-6 py-4">Status</th>

//                       <th className="px-6 py-4 text-right">Actions</th>
//                     </tr>
//                   </thead>

//                   <tbody className="divide-y divide-slate-100">
//                     {employees.map((employee) => (
//                       <tr
//                         key={employee.id}
//                         className="transition hover:bg-slate-50"
//                       >
//                         <td className="px-6 py-4">
//                           <div>
//                             <p className="font-medium text-slate-900">
//                               {employee.name}
//                             </p>

//                             <p className="mt-0.5 text-xs text-slate-400">
//                               {employee.id}
//                             </p>
//                           </div>
//                         </td>

//                         <td className="px-6 py-4 text-sm text-slate-600">
//                           {employee.email}
//                         </td>

//                         <td className="px-6 py-4">
//                           <div className="flex items-center gap-2">
//                             <code className="rounded-md bg-slate-100 px-2 py-1 text-sm text-slate-800">
//                               {employee.username}
//                             </code>

//                             <button
//                               type="button"
//                               onClick={() =>
//                                 copyText(
//                                   employee.username,
//                                   `employee-${employee.id}`,
//                                 )
//                               }
//                               className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
//                               title="Copy username"
//                             >
//                               {copied === `employee-${employee.id}` ? (
//                                 <Check className="h-4 w-4" />
//                               ) : (
//                                 <Clipboard className="h-4 w-4" />
//                               )}
//                             </button>
//                           </div>
//                         </td>

//                         <td className="px-6 py-4">
//                           <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
//                             Auditor
//                           </span>
//                         </td>
//                         <td className="px-6 py-4">
//                           <div className="flex flex-wrap gap-1.5">
//                             {employee.canAccessAudit && (
//                               <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
//                                 Audit
//                               </span>
//                             )}

//                             {employee.canAccessServiceReport && (
//                               <span className="rounded-full bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-700">
//                                 Service
//                               </span>
//                             )}

//                             {!employee.canAccessAudit &&
//                               !employee.canAccessServiceReport && (
//                                 <span className="text-xs text-red-600">
//                                   No access
//                                 </span>
//                               )}
//                           </div>
//                         </td>

//                         <td className="px-6 py-4">
//                           {employee.isActive ? (
//                             <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
//                               <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
//                               Active
//                             </span>
//                           ) : (
//                             <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
//                               Inactive
//                             </span>
//                           )}
//                         </td>

//                         <td className="px-6 py-4 text-right">
//                           <Button
//                             type="button"
//                             variant="outline"
//                             size="sm"
//                             onClick={() => resetEmployeePassword(employee)}
//                             disabled={resettingId === employee.id}
//                           >
//                             {resettingId === employee.id ? (
//                               <>
//                                 <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                                 Generating...
//                               </>
//                             ) : (
//                               <>
//                                 <KeyRound className="mr-2 h-4 w-4" />
//                                 New Password
//                               </>
//                             )}
//                           </Button>
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//             )}
//           </div>
//         </div>
//       </main>
//     </AppShell>
//   );
// }
"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Clipboard,
  Copy,
  KeyRound,
  Loader2,
  RefreshCw,
  ShieldCheck,
  UserPlus,
  Users,
  X,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Employee = {
  id: string;
  name: string;
  email: string;
  username: string;
  isActive: boolean;
  mustChangePassword: boolean;
  role: "auditor";
  canAccessAudit: boolean;
  canAccessServiceReport: boolean;
  createdAt: string;
  updatedAt: string;
};

export default function AddEmployeePage() {
  const router = useRouter();

  // New employee form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // New employee permissions
  const [canAccessAudit, setCanAccessAudit] = useState(false);
  const [canAccessServiceReport, setCanAccessServiceReport] =
    useState(false);

  // Employee list
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);

  // Loading states
  const [generatingUsername, setGeneratingUsername] = useState(false);
  const [generatingPassword, setGeneratingPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resettingId, setResettingId] = useState<string | null>(null);

  // Password reset result
  const [resetPassword, setResetPassword] = useState("");

  // Edit existing employee permissions
  const [editingEmployee, setEditingEmployee] =
    useState<Employee | null>(null);
  const [editCanAccessAudit, setEditCanAccessAudit] = useState(false);
  const [editCanAccessServiceReport, setEditCanAccessServiceReport] =
    useState(false);
  const [savingAccess, setSavingAccess] = useState(false);

  // Messages and clipboard
  const [copied, setCopied] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    void loadEmployees();
  }, []);

  async function loadEmployees() {
    try {
      setLoadingEmployees(true);

      const response = await fetch("/api/admin/employee", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to load employees");
      }

      setEmployees(data.employees || []);
    } catch (error) {
      console.error("Load employees error:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to load employees",
      );
    } finally {
      setLoadingEmployees(false);
    }
  }

  async function generateUsername() {
    if (!name.trim()) {
      setError("Enter the employee name first.");
      return;
    }

    setError("");
    setSuccess("");
    setGeneratingUsername(true);

    try {
      const response = await fetch(
        "/api/admin/employee/generate-username",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name: name.trim() }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to generate username");
      }

      setUsername(data.username);
    } catch (error) {
      console.error("Generate username error:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Unable to generate username.",
      );
    } finally {
      setGeneratingUsername(false);
    }
  }

  function generatePassword() {
    setError("");
    setSuccess("");
    setGeneratingPassword(true);

    try {
      const chars =
        "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
      const special = "!@#$%";

      // Use the browser cryptographic random number generator.
      const randomIndex = (max: number) => {
        const values = new Uint32Array(1);
        crypto.getRandomValues(values);
        return values[0] % max;
      };

      let newPassword = "";

      for (let i = 0; i < 8; i++) {
        newPassword += chars[randomIndex(chars.length)];
      }

      newPassword += special[randomIndex(special.length)];
      newPassword += String(randomIndex(10));

      setPassword(newPassword);
    } finally {
      setGeneratingPassword(false);
    }
  }

  async function copyText(value: string, type: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(type);

      window.setTimeout(() => {
        setCopied((current) => (current === type ? "" : current));
      }, 1500);
    } catch {
      setError("Unable to copy to clipboard.");
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!name.trim()) {
      setError("Employee name is required.");
      return;
    }

    if (!email.trim()) {
      setError("Email is required.");
      return;
    }

    if (!username.trim()) {
      setError("Generate a username before saving.");
      return;
    }

    if (!password) {
      setError("Generate a password before saving.");
      return;
    }

    if (!canAccessAudit && !canAccessServiceReport) {
      setError("Select at least one report permission.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/admin/employee", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          username: username.trim(),
          password,
          isActive: true,
          canAccessAudit,
          canAccessServiceReport,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to create employee");
      }

      setSuccess("Employee created successfully.");

      setName("");
      setEmail("");
      setUsername("");
      setPassword("");
      setCanAccessAudit(false);
      setCanAccessServiceReport(false);

      await loadEmployees();
      router.refresh();
    } catch (error) {
      console.error("Create employee error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Unable to connect to the server. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function resetEmployeePassword(employee: Employee) {
    const confirmed = window.confirm(
      `Generate a new password for ${employee.name}?`,
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");
    setResetPassword("");
    setResettingId(employee.id);

    try {
      const response = await fetch(
        `/api/admin/employee/${employee.id}/reset-password`,
        { method: "POST" },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to reset password");
      }

      setResetPassword(data.password);
      setSuccess(`New password generated for ${employee.name}.`);

      await loadEmployees();
    } catch (error) {
      console.error("Reset password error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Unable to reset the password.",
      );
    } finally {
      setResettingId(null);
    }
  }

  // Open the permissions editor for an existing employee.
  function openEditAccess(employee: Employee) {
    setEditingEmployee(employee);
    setEditCanAccessAudit(employee.canAccessAudit);
    setEditCanAccessServiceReport(employee.canAccessServiceReport);
    setError("");
    setSuccess("");
  }

  // Save permission changes without changing the employee's password or details.
  async function saveEmployeeAccess() {
    if (!editingEmployee) return;

    if (!editCanAccessAudit && !editCanAccessServiceReport) {
      setError("Select at least one report permission.");
      return;
    }

    setSavingAccess(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `/api/admin/employee/${editingEmployee.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            canAccessAudit: editCanAccessAudit,
            canAccessServiceReport: editCanAccessServiceReport,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to update permissions");
      }

      // Update the local list immediately using the saved values.
      setEmployees((currentEmployees) =>
        currentEmployees.map((employee) =>
          employee.id === editingEmployee.id
            ? {
                ...employee,
                canAccessAudit: editCanAccessAudit,
                canAccessServiceReport: editCanAccessServiceReport,
              }
            : employee,
        ),
      );

      setSuccess(`Report access updated for ${editingEmployee.name}.`);
      setEditingEmployee(null);

      // Refresh from the database.
      await loadEmployees();
    } catch (error) {
      console.error("Update employee access error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Unable to update permissions.",
      );
    } finally {
      setSavingAccess(false);
    }
  }

  return (
    <AppShell>
      <main className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto max-w-6xl space-y-8">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
              <Users className="h-6 w-6" />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Employee Management
              </h1>
              <p className="text-sm text-slate-500">
                Create accounts and manage report access.
              </p>
            </div>
          </div>

          {/* Create employee */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 bg-slate-50/80 px-6 py-5">
              <div className="flex items-center gap-3">
                <UserPlus className="h-5 w-5 text-slate-700" />

                <div>
                  <h2 className="font-semibold text-slate-900">
                    Add New Employee
                  </h2>
                  <p className="text-sm text-slate-500">
                    Create an employee login and choose permitted modules.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 p-6">
              {/* Name and email */}
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <label
                    htmlFor="name"
                    className="text-sm font-medium text-slate-700"
                  >
                    Employee Name
                  </label>

                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. S. Roy"
                    disabled={saving}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="email"
                    className="text-sm font-medium text-slate-700"
                  >
                    Email ID
                  </label>

                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="employee@company.com"
                    disabled={saving}
                    required
                  />
                </div>
              </div>

              {/* Username */}
              <div className="space-y-2">
                <label
                  htmlFor="username"
                  className="text-sm font-medium text-slate-700"
                >
                  Username
                </label>

                <div className="flex flex-wrap gap-2">
                  <Input
                    id="username"
                    value={username}
                    readOnly
                    placeholder="Click Generate Username"
                    className="min-w-0 flex-1 font-mono"
                  />

                  <Button
                    type="button"
                    variant="outline"
                    onClick={generateUsername}
                    disabled={generatingUsername || saving || !name.trim()}
                  >
                    {generatingUsername ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    <span className="ml-2">Generate</span>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => copyText(username, "username")}
                    disabled={!username}
                    aria-label="Copy username"
                  >
                    {copied === "username" ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                <p className="text-xs text-slate-500">
                  Generate a unique username from the employee name.
                </p>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-slate-700"
                >
                  Temporary Password
                </label>

                <div className="flex flex-wrap gap-2">
                  <Input
                    id="password"
                    type="text"
                    value={password}
                    readOnly
                    placeholder="Click Generate Password"
                    className="min-w-0 flex-1 font-mono"
                  />

                  <Button
                    type="button"
                    variant="outline"
                    onClick={generatePassword}
                    disabled={saving || generatingPassword}
                  >
                    {generatingPassword ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <KeyRound className="h-4 w-4" />
                    )}
                    <span className="ml-2">Generate</span>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => copyText(password, "password")}
                    disabled={!password}
                    aria-label="Copy password"
                  >
                    {copied === "password" ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                <p className="text-xs text-slate-500">
                  The password must be stored as a hash by the backend. Share
                  the generated password securely with the employee.
                </p>
              </div>

              {/* New employee permissions */}
              <div className="space-y-4 rounded-xl border border-slate-200 p-5">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 text-slate-700" />

                  <div>
                    <h3 className="font-semibold text-slate-900">
                      Module Access Permissions
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Select which report modules this employee can access.
                    </p>
                  </div>
                </div>

                <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-4 hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={canAccessAudit}
                    onChange={(e) => setCanAccessAudit(e.target.checked)}
                    disabled={saving}
                    className="mt-1 h-4 w-4 accent-slate-900"
                  />
                  <div>
                    <p className="font-medium text-slate-900">Audit Report</p>
                    <p className="mt-1 text-sm text-slate-500">
                      Create and submit audit reports.
                    </p>
                  </div>
                </label>

                <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-4 hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={canAccessServiceReport}
                    onChange={(e) =>
                      setCanAccessServiceReport(e.target.checked)
                    }
                    disabled={saving}
                    className="mt-1 h-4 w-4 accent-slate-900"
                  />
                  <div>
                    <p className="font-medium text-slate-900">
                      Service Report
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Create and submit service reports.
                    </p>
                  </div>
                </label>

                {!canAccessAudit && !canAccessServiceReport && (
                  <p className="text-sm text-red-600">
                    Select at least one report permission.
                  </p>
                )}
              </div>

              {/* Messages */}
              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  {error}
                </div>
              )}

              {success && (
                <div
                  role="status"
                  className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
                >
                  {success}
                </div>
              )}

              {/* Save employee */}
              <div className="flex justify-end border-t border-slate-200 pt-6">
                <Button
                  type="submit"
                  disabled={
                    saving ||
                    !name.trim() ||
                    !email.trim() ||
                    !username.trim() ||
                    !password ||
                    (!canAccessAudit && !canAccessServiceReport)
                  }
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Save Employee
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>

          {/* Edit existing employee access dialog */}
          {editingEmployee && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
              onMouseDown={(e) => {
                if (
                  e.target === e.currentTarget &&
                  !savingAccess
                ) {
                  setEditingEmployee(null);
                }
              }}
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="edit-access-title"
                className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                      <ShieldCheck className="h-5 w-5 text-slate-700" />
                    </div>

                    <div>
                      <h2
                        id="edit-access-title"
                        className="text-xl font-bold text-slate-900"
                      >
                        Edit Report Access
                      </h2>
                      <p className="mt-1 text-sm text-slate-500">
                        {editingEmployee.name}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setEditingEmployee(null)}
                    disabled={savingAccess}
                    className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                    aria-label="Close dialog"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <p className="mt-5 text-sm text-slate-600">
                  Choose which report modules this employee is allowed to
                  access. This will not change their username or password.
                </p>

                <div className="mt-5 space-y-3">
                  <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-4 hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={editCanAccessAudit}
                      onChange={(e) =>
                        setEditCanAccessAudit(e.target.checked)
                      }
                      disabled={savingAccess}
                      className="mt-1 h-4 w-4 accent-slate-900"
                    />
                    <div>
                      <p className="font-medium text-slate-900">
                        Audit Report
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Allow access to audit reports.
                      </p>
                    </div>
                  </label>

                  <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-4 hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={editCanAccessServiceReport}
                      onChange={(e) =>
                        setEditCanAccessServiceReport(e.target.checked)
                      }
                      disabled={savingAccess}
                      className="mt-1 h-4 w-4 accent-slate-900"
                    />
                    <div>
                      <p className="font-medium text-slate-900">
                        Service Report
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Allow access to service reports.
                      </p>
                    </div>
                  </label>
                </div>

                {!editCanAccessAudit && !editCanAccessServiceReport && (
                  <p className="mt-3 text-sm text-red-600">
                    Select at least one permission.
                  </p>
                )}

                <div className="mt-6 flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditingEmployee(null)}
                    disabled={savingAccess}
                  >
                    Cancel
                  </Button>

                  <Button
                    type="button"
                    onClick={saveEmployeeAccess}
                    disabled={
                      savingAccess ||
                      (!editCanAccessAudit &&
                        !editCanAccessServiceReport)
                    }
                  >
                    {savingAccess ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Save Access
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Reset password result */}
          {resetPassword && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100">
                  <KeyRound className="h-5 w-5 text-amber-700" />
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-amber-900">
                    New Temporary Password
                  </h3>

                  <p className="mt-1 text-sm text-amber-800">
                    Give this password to the employee. It will not be
                    displayed again after leaving this page.
                  </p>

                  <div className="mt-3 flex gap-2">
                    <Input
                      value={resetPassword}
                      readOnly
                      className="bg-white font-mono"
                    />

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        copyText(resetPassword, "reset-password")
                      }
                    >
                      {copied === "reset-password" ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                      <span className="ml-2">Copy</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Existing employees */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 bg-slate-50/80 px-6 py-5">
              <div>
                <h2 className="font-semibold text-slate-900">
                  Existing Employees
                </h2>
                <p className="text-sm text-slate-500">
                  {employees.length} employee
                  {employees.length !== 1 ? "s" : ""} registered
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void loadEmployees()}
                disabled={loadingEmployees}
              >
                <RefreshCw
                  className={`mr-2 h-4 w-4 ${
                    loadingEmployees ? "animate-spin" : ""
                  }`}
                />
                Refresh
              </Button>
            </div>

            {loadingEmployees ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
              </div>
            ) : employees.length === 0 ? (
              <div className="py-12 text-center">
                <Users className="mx-auto h-10 w-10 text-slate-300" />
                <p className="mt-3 font-medium text-slate-700">
                  No employees yet
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Create your first employee above.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1100px]">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <th className="px-6 py-4">Employee</th>
                      <th className="px-6 py-4">Email</th>
                      <th className="px-6 py-4">Username</th>
                      <th className="px-6 py-4">Role</th>
                      <th className="px-6 py-4">Report Access</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {employees.map((employee) => (
                      <tr
                        key={employee.id}
                        className="transition hover:bg-slate-50"
                      >
                        <td className="px-6 py-4">
                          <p className="font-medium text-slate-900">
                            {employee.name}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-400">
                            {employee.id}
                          </p>
                        </td>

                        <td className="px-6 py-4 text-sm text-slate-600">
                          {employee.email}
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <code className="rounded-md bg-slate-100 px-2 py-1 text-sm text-slate-800">
                              {employee.username}
                            </code>

                            <button
                              type="button"
                              onClick={() =>
                                void copyText(
                                  employee.username,
                                  `employee-${employee.id}`,
                                )
                              }
                              className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                              title="Copy username"
                              aria-label={`Copy username for ${employee.name}`}
                            >
                              {copied === `employee-${employee.id}` ? (
                                <Check className="h-4 w-4" />
                              ) : (
                                <Clipboard className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                            Auditor
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1.5">
                            {employee.canAccessAudit && (
                              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                                Audit
                              </span>
                            )}

                            {employee.canAccessServiceReport && (
                              <span className="rounded-full bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-700">
                                Service
                              </span>
                            )}

                            {!employee.canAccessAudit &&
                              !employee.canAccessServiceReport && (
                                <span className="text-xs text-red-600">
                                  No access
                                </span>
                              )}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          {employee.isActive ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                              Inactive
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => openEditAccess(employee)}
                            >
                              <ShieldCheck className="mr-2 h-4 w-4" />
                              Edit Access
                            </Button>

                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                void resetEmployeePassword(employee)
                              }
                              disabled={resettingId === employee.id}
                            >
                              {resettingId === employee.id ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Generating...
                                </>
                              ) : (
                                <>
                                  <KeyRound className="mr-2 h-4 w-4" />
                                  New Password
                                </>
                              )}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </AppShell>
  );
}