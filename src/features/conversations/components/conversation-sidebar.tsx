import ky from "ky";
import { toast } from "sonner";
import React, { useState } from "react";
import {
  CopyIcon,
  FilePlusIcon,
  FolderPlusIcon,
  GlobeIcon,
  HistoryIcon,
  ImageIcon,
  LoaderIcon,
  PencilIcon,
  PlusIcon,
  SparklesIcon,
  Trash2Icon,
} from "lucide-react";

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
  MessageActions,
  MessageAction,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputAttachment,
  PromptInputAttachments,
  PromptInputBody,
  PromptInputButton,
  PromptInputFooter,
  PromptInputHeader,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
  type PromptInputMessage,
  usePromptInputAttachments,
} from "@/components/ai-elements/prompt-input";
import { Button } from "@/components/ui/button";

import {
  useConversation,
  useConversations,
  useCreateConversation,
  useMessages,
} from "../hooks/use-conversations";

import { Id } from "../../../../convex/_generated/dataModel";
import { DEFAULT_CONVERSATION_TITLE } from "../constants";
import { PastConversationsDialog } from "./past-conversations-dialog";
import { useUploadThing } from "@/lib/uploadthing";

const TOOL_ICONS: Record<string, React.ReactNode> = {
  updateFile: <PencilIcon className="size-3" />,
  createFiles: <FilePlusIcon className="size-3" />,
  createFolder: <FolderPlusIcon className="size-3" />,
  renameFile: <PencilIcon className="size-3" />,
  deleteFiles: <Trash2Icon className="size-3" />,
  scrapeUrls: <GlobeIcon className="size-3" />,
};

function ToolCallChip({ toolName, label, index }: { toolName: string; label: string; index: number }) {
  const icon = TOOL_ICONS[toolName] ?? <PencilIcon className="size-3" />;
  return (
    <span
      className="tool-call-chip inline-flex items-center gap-1 rounded-full border border-border/50 bg-muted/60 px-2 py-0.5 font-mono text-[11px] text-muted-foreground"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {icon}
      {label}
    </span>
  );
}

interface ConversationSidebarProps {
  projectId: Id<"projects">;
};

function dataUrlToFile(dataUrl: string, filename: string, mimeType: string): File {
  const [header, data] = dataUrl.split(",");
  const isBase64 = header?.includes("base64") ?? false;

  if (isBase64 && data) {
    const binaryStr = atob(data);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    return new File([bytes], filename, { type: mimeType });
  }

  const decoded = data ? decodeURIComponent(data) : "";
  return new File([decoded], filename, { type: mimeType });
}

function AttachImageButton() {
  const attachments = usePromptInputAttachments();
  return (
    <PromptInputButton
      onClick={() => attachments.openFileDialog()}
      title="Attach image"
    >
      <ImageIcon className="size-4" />
    </PromptInputButton>
  );
}

function EnhancePromptButton({
  input,
  onEnhanced,
}: {
  input: string;
  onEnhanced: (enhanced: string) => void;
}) {
  const [isEnhancing, setIsEnhancing] = useState(false);

  const handleEnhance = async () => {
    if (!input.trim() || isEnhancing) return;

    setIsEnhancing(true);
    try {
      const { enhancedPrompt } = await ky
        .post("/api/enhance-prompt", {
          json: { prompt: input.trim() },
          timeout: 30000,
        })
        .json<{ enhancedPrompt: string }>();

      onEnhanced(enhancedPrompt);
    } catch {
      toast.error("Failed to enhance prompt");
    } finally {
      setIsEnhancing(false);
    }
  };

  return (
    <PromptInputButton
      onClick={handleEnhance}
      disabled={!input.trim() || isEnhancing}
      title="Enhance prompt"
    >
      <SparklesIcon className={`size-4 ${isEnhancing ? "animate-pulse" : ""}`} />
    </PromptInputButton>
  );
}

export const ConversationSidebar = ({
  projectId,
}: ConversationSidebarProps) => {
  const [input, setInput] = useState("");
  const [
    selectedConversationId,
    setSelectedConversationId,
  ] = useState<Id<"conversations"> | null>(null);
  const [
    pastConversationsOpen,
    setPastConversationsOpen
  ] = useState(false);

  const { startUpload, isUploading } = useUploadThing("imageUploader");

  const createConversation = useCreateConversation();
  const conversations = useConversations(projectId);

  const activeConversationId =
    selectedConversationId ?? conversations?.[0]?._id ?? null;

  const activeConversation = useConversation(activeConversationId);
  const {
    results: conversationMessages,
    status: messagesStatus,
    loadMore: loadMoreMessages
  } = useMessages(activeConversationId);

  // Check if any message is currently processing
  const isProcessing = conversationMessages.some(
    (msg) => msg.status === "processing"
  );

  const isLoading = isProcessing || isUploading;

  const handleCancel = async () => {
    try {
      await ky.post("/api/messages/cancel", {
        json: { projectId },
      });
    } catch {
      toast.error("Unable to cancel request");
    }
  };

  const handleCreateConversation = async () => {
    try {
      const newConversationId = await createConversation({
        projectId,
        title: DEFAULT_CONVERSATION_TITLE,
      });
      setSelectedConversationId(newConversationId);
      return newConversationId;
    } catch {
      toast.error("Unable to create new conversation");
      return null;
    }
  };

  const handleSubmit = async (message: PromptInputMessage) => {
    // If processing and no new message, this is just a stop function
    if (isProcessing && !message.text) {
      await handleCancel()
      setInput("");
      return;
    }

    let conversationId = activeConversationId;

    if (!conversationId) {
      conversationId = await handleCreateConversation();
      if (!conversationId) {
        return;
      }
    }

    // Upload any attached images via UploadThing
    let imageUrls: string[] = [];
    const imageFiles = message.files
      .filter((f) => f.mediaType?.startsWith("image/") && f.url)
      .map((f, i) =>
        dataUrlToFile(
          f.url,
          f.filename ?? `image-${i}.png`,
          f.mediaType ?? "image/png"
        )
      );

    if (imageFiles.length > 0) {
      try {
        const uploaded = await startUpload(imageFiles);
        imageUrls = uploaded?.map((f) => f.ufsUrl) ?? [];
      } catch {
        toast.error("Failed to upload image(s)");
        return;
      }
    }

    // Trigger Inngest function via API
    try {
      await ky.post("/api/messages", {
        json: {
          conversationId,
          message: message.text,
          imageUrls,
        },
      });
    } catch {
      toast.error("Message failed to send");
    }

    setInput("");
  }

  return (
    <>
      <PastConversationsDialog
        projectId={projectId}
        open={pastConversationsOpen}
        onOpenChange={setPastConversationsOpen}
        onSelect={setSelectedConversationId}
      />
      <div className="flex flex-col h-full bg-sidebar">
        <div className="h-8.75 flex items-center justify-between border-b">
          <div className="text-sm truncate pl-3">
            {activeConversation?.title ?? DEFAULT_CONVERSATION_TITLE}
          </div>
          <div className="flex items-center px-1 gap-1">
            <Button
              size="icon-xs"
              variant="highlight"
              onClick={() => setPastConversationsOpen(true)}
            >
              <HistoryIcon className="size-3.5" />
            </Button>
            <Button
              size="icon-xs"
              variant="highlight"
              onClick={handleCreateConversation}
            >
              <PlusIcon className="size-3.5" />
            </Button>
          </div>
        </div>
        <Conversation className="flex-1">
          <ConversationContent>
            {messagesStatus === "CanLoadMore" && (
              <div className="flex justify-center p-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => loadMoreMessages(50)}
                >
                  Load More
                </Button>
              </div>
            )}
            {/* Reverse the array for display if we ordered them by desc to paginate correctly */}
            {conversationMessages.slice().reverse().map((message, messageIndex) => (
              <Message
                key={message._id}
                from={message.role}
              >
                <MessageContent>
                  {message.status === "processing" ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <LoaderIcon className="size-4 animate-spin" />
                      <span>Thinking...</span>
                    </div>
                  ) : message.status === "cancelled" ? (
                    <span className="text-muted-foreground italic">
                      Request cancelled
                    </span>
                  ) : (
                    <>
                      {message.toolCalls && message.toolCalls.length > 0 && (
                        <div className="mb-2 flex flex-wrap gap-1">
                          {message.toolCalls.map((tc, i) => (
                            <ToolCallChip key={i} index={i} toolName={tc.toolName} label={tc.label} />
                          ))}
                        </div>
                      )}
                      <MessageResponse key={message._id}>{message.content || "No response content"}</MessageResponse>
                    </>
                  )}
                </MessageContent>
                {message.role === "assistant" &&
                  message.status === "completed" &&
                  messageIndex === conversationMessages.length - 1 && (
                    <MessageActions>
                      <MessageAction
                        onClick={() => {
                          navigator.clipboard.writeText(message.content)
                        }}
                        label="Copy"
                      >
                        <CopyIcon className="size-3" />
                      </MessageAction>
                    </MessageActions>
                  )
                }
              </Message>
            ))}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
        <div className="p-3">
          <PromptInput
            accept="image/*"
            multiple
            onSubmit={handleSubmit}
            className="mt-2"
          >
            <PromptInputHeader>
              <PromptInputAttachments>
                {(file) => <PromptInputAttachment key={file.id} data={file} />}
              </PromptInputAttachments>
            </PromptInputHeader>
            <PromptInputBody>
              <PromptInputTextarea
                placeholder="Ask LuminaWeb anything..."
                onChange={(e) => setInput(e.target.value)}
                value={input}
                disabled={isLoading}
              />

            </PromptInputBody>
            <PromptInputFooter>
              <PromptInputTools>
                <AttachImageButton />
                <EnhancePromptButton input={input} onEnhanced={setInput} />
              </PromptInputTools>
              <PromptInputSubmit
                disabled={isLoading ? false : !input}
                status={isProcessing ? "streaming" : undefined}
              />
            </PromptInputFooter>
          </PromptInput>
        </div>
      </div>
    </>
  );
};
