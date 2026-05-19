"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, Loader2, Save, User as UserIcon } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/cn";
import { getDashboardPath } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { UserAvatar } from "@/components/layout/user-avatar";
import { RoleBadge } from "@/components/layout/role-badge";
import type { Role } from "@prisma/client";

type ProfileClientProps = {
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    role: Role;
    createdAt: string;
    hasPassword: boolean;
  };
};

export function ProfileClient({ user }: ProfileClientProps) {
  const router = useRouter();

  const [name, setName] = useState(user.name ?? "");
  const [image, setImage] = useState(user.image ?? "");
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const dashboardPath = getDashboardPath(user.role);
  const formattedJoinDate = new Date(user.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  async function handleProfileSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setProfileMsg(null);

    if (name.trim().length < 3) {
      setProfileMsg({ type: "error", text: "Name must be at least 3 characters." });
      return;
    }

    setProfileLoading(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          image: image.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setProfileMsg({
          type: "error",
          text: data?.error ?? "Failed to update profile.",
        });
        return;
      }

      setProfileMsg({ type: "success", text: "Profile updated successfully." });
      router.refresh();
    } catch {
      setProfileMsg({ type: "error", text: "Something went wrong. Please try again." });
    } finally {
      setProfileLoading(false);
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPasswordMsg(null);

    if (newPassword.length < 8) {
      setPasswordMsg({
        type: "error",
        text: "Password must be at least 8 characters.",
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: "error", text: "Passwords do not match." });
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setPasswordMsg({
          type: "error",
          text: data?.error ?? "Failed to update password.",
        });
        return;
      }

      setPasswordMsg({ type: "success", text: "Password updated successfully." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setPasswordMsg({ type: "error", text: "Something went wrong. Please try again." });
    } finally {
      setPasswordLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 py-8 lg:p-8">
      <div className="flex items-center gap-3">
        <Link
          href={dashboardPath}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Back to dashboard"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Account Settings
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your profile and account preferences.
          </p>
        </div>
      </div>

      {/* Profile preview */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-4 space-y-0">
          <UserAvatar
            name={name || user.name}
            image={image || user.image}
            size="lg"
          />
          <div className="flex flex-1 flex-col gap-1">
            <CardTitle className="text-lg">{name || user.name || "Unnamed User"}</CardTitle>
            <CardDescription className="flex items-center gap-2 text-sm">
              {user.email}
              <RoleBadge role={user.role} />
            </CardDescription>
            <p className="text-xs text-muted-foreground">
              Joined on {formattedJoinDate}
            </p>
          </div>
        </CardHeader>
      </Card>

      {/* Profile info form */}
      <Card>
        <form onSubmit={handleProfileSubmit}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <UserIcon className="h-4 w-4" />
              Profile Information
            </CardTitle>
            <CardDescription>
              Update your display name and profile picture.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {profileMsg && (
              <p
                className={cn(
                  "rounded-md px-3 py-2 text-sm",
                  profileMsg.type === "success"
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "bg-destructive/10 text-destructive",
                )}
                role="status"
              >
                {profileMsg.text}
              </p>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={user.email} disabled />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="name">Display Name</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                disabled={profileLoading}
                required
                minLength={3}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="image">Profile Image URL</Label>
              <Input
                id="image"
                type="url"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="https://example.com/avatar.png"
                disabled={profileLoading}
              />
              <p className="text-xs text-muted-foreground">
                Paste a public image URL. Leave empty to use initials.
              </p>
            </div>
          </CardContent>

          <CardFooter className="justify-end">
            <Button type="submit" disabled={profileLoading}>
              {profileLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save Changes
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* Password form */}
      {user.hasPassword ? (
        <Card>
          <form onSubmit={handlePasswordSubmit}>
            <CardHeader>
              <CardTitle className="text-base">Change Password</CardTitle>
              <CardDescription>
                Update the password used to sign in with email.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {passwordMsg && (
                <p
                  className={cn(
                    "rounded-md px-3 py-2 text-sm",
                    passwordMsg.type === "success"
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "bg-destructive/10 text-destructive",
                  )}
                  role="status"
                >
                  {passwordMsg.text}
                </p>
              )}

              <PasswordField
                id="currentPassword"
                label="Current Password"
                value={currentPassword}
                onChange={setCurrentPassword}
                show={showCurrent}
                onToggle={() => setShowCurrent((v) => !v)}
                disabled={passwordLoading}
              />
              <PasswordField
                id="newPassword"
                label="New Password"
                value={newPassword}
                onChange={setNewPassword}
                show={showNew}
                onToggle={() => setShowNew((v) => !v)}
                disabled={passwordLoading}
              />
              <PasswordField
                id="confirmPassword"
                label="Confirm New Password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                show={showConfirm}
                onToggle={() => setShowConfirm((v) => !v)}
                disabled={passwordLoading}
              />
            </CardContent>

            <CardFooter className="justify-end">
              <Button type="submit" disabled={passwordLoading}>
                {passwordLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Update Password
              </Button>
            </CardFooter>
          </form>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Password</CardTitle>
            <CardDescription>
              You signed in with Google. Password change is managed through your
              Google account.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}

type PasswordFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  show: boolean;
  onToggle: () => void;
  disabled?: boolean;
};

function PasswordField({
  id,
  label,
  value,
  onChange,
  show,
  onToggle,
  disabled,
}: PasswordFieldProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          required
          minLength={8}
          className="pr-10"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground focus-visible:outline-none"
          aria-label={show ? "Hide password" : "Show password"}
          tabIndex={-1}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
