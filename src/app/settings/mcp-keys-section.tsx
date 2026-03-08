"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CopyIcon,
  CheckIcon,
  KeyIcon,
  PlusIcon,
  TrashIcon,
  LoaderIcon,
  AlertCircleIcon,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ApiKey {
  _id: string;
  name: string;
  _creationTime: number;
}

export const McpKeysSection = () => {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create key state
  const [createOpen, setCreateOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState("My API Key");
  const [creating, setCreating] = useState(false);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Delete state
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchKeys = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch("/api/mcp/keys");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to load API keys");
      }
      const data = await res.json();
      setKeys(data.keys ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load API keys");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const res = await fetch("/api/mcp/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyName.trim() || "My API Key" }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to create API key");
        return;
      }

      setCreatedKey(data.key);
      toast.success("API key created");
      fetchKeys();
    } catch {
      toast.error("Failed to create API key");
    } finally {
      setCreating(false);
    }
  };

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async (keyId: string) => {
    setDeleting(keyId);
    try {
      const res = await fetch("/api/mcp/keys", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyId }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Failed to revoke key");
        return;
      }

      toast.success("API key revoked");
      setKeys((prev) => prev.filter((k) => k._id !== keyId));
    } catch {
      toast.error("Failed to revoke key");
    } finally {
      setDeleting(null);
    }
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      setCreatedKey(null);
      setNewKeyName("My API Key");
      setCopied(false);
    }
    setCreateOpen(open);
  };

  const mcpUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/mcp`
      : "/api/mcp";

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <KeyIcon className="size-5" />
          MCP API Keys
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Connect Claude Desktop, Cursor, or any MCP-compatible client to your
          LuminaWeb projects.
        </p>
      </div>

      <Separator />

      {/* MCP Connection Info */}
      <div className="rounded-md border bg-background p-4 flex flex-col gap-3">
        <div>
          <Label className="text-xs text-muted-foreground uppercase tracking-wider">
            MCP Server URL
          </Label>
          <div className="flex items-center gap-2 mt-1">
            <code className="flex-1 text-sm bg-muted px-3 py-2 rounded-md font-mono break-all">
              {mcpUrl}
            </code>
            <Button
              variant="outline"
              size="icon"
              className="shrink-0 size-9"
              onClick={() => handleCopy(mcpUrl)}
            >
              <CopyIcon className="size-3.5" />
            </Button>
          </div>
        </div>
        <div className="text-xs text-muted-foreground space-y-1">
          <p className="font-medium text-foreground">Quick setup:</p>
          <p>
            Add to your MCP client config (e.g.{" "}
            <code className="bg-muted px-1 rounded">claude_desktop_config.json</code>
            ):
          </p>
          <pre className="bg-muted p-3 rounded-md overflow-x-auto text-[11px] leading-relaxed">
{`{
  "mcpServers": {
    "luminaweb": {
      "url": "${mcpUrl}",
      "headers": {
        "x-api-key": "pk_your_api_key_here"
      }
    }
  }
}`}
          </pre>
        </div>
      </div>

      {/* Key List */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">
          Your Keys {!loading && `(${keys.length}/10)`}
        </h3>
        <Dialog open={createOpen} onOpenChange={handleDialogClose}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5">
              <PlusIcon className="size-3.5" />
              Create Key
            </Button>
          </DialogTrigger>
          <DialogContent>
            {createdKey ? (
              <>
                <DialogHeader>
                  <DialogTitle>API Key Created</DialogTitle>
                  <DialogDescription>
                    Copy this key now. You won&apos;t be able to see it again.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-sm bg-muted px-3 py-2 rounded-md font-mono break-all select-all">
                    {createdKey}
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    className="shrink-0"
                    onClick={() => handleCopy(createdKey)}
                  >
                    {copied ? (
                      <CheckIcon className="size-3.5" />
                    ) : (
                      <CopyIcon className="size-3.5" />
                    )}
                  </Button>
                </div>
                <DialogFooter>
                  <Button onClick={() => handleDialogClose(false)}>
                    Done
                  </Button>
                </DialogFooter>
              </>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle>Create API Key</DialogTitle>
                  <DialogDescription>
                    Give your key a name to identify it later.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="key-name">Name</Label>
                  <Input
                    id="key-name"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="e.g. Claude Desktop, Cursor"
                    maxLength={100}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !creating) handleCreate();
                    }}
                  />
                </div>
                <DialogFooter>
                  <Button
                    onClick={handleCreate}
                    disabled={creating || !newKeyName.trim()}
                  >
                    {creating && (
                      <LoaderIcon className="size-3.5 animate-spin mr-1.5" />
                    )}
                    Create
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <LoaderIcon className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 text-sm text-destructive py-4">
          <AlertCircleIcon className="size-4 shrink-0" />
          {error}
        </div>
      ) : keys.length === 0 ? (
        <div className="text-center py-8 text-sm text-muted-foreground">
          No API keys yet. Create one to connect your MCP client.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {keys.map((key) => (
            <div
              key={key._id}
              className="flex items-center justify-between rounded-md border bg-background px-4 py-3"
            >
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-sm font-medium truncate">
                  {key.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  Created{" "}
                  {formatDistanceToNow(new Date(key._creationTime), {
                    addSuffix: true,
                  })}
                </span>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                    disabled={deleting === key._id}
                  >
                    {deleting === key._id ? (
                      <LoaderIcon className="size-3.5 animate-spin" />
                    ) : (
                      <TrashIcon className="size-3.5" />
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Revoke API Key</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently revoke &ldquo;{key.name}&rdquo;. Any
                      MCP clients using this key will stop working immediately.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDelete(key._id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Revoke
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
