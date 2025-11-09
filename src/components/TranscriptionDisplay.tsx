import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar } from "@/components/ui/avatar";
import { Bot, User } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface TranscriptionDisplayProps {
  messages: Message[];
}

const TranscriptionDisplay = ({ messages }: TranscriptionDisplayProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-center mb-4">Conversation</h3>
      <ScrollArea className="h-64 rounded-lg border border-border p-4">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex gap-3 ${
                message.role === "assistant" ? "justify-start" : "justify-end"
              }`}
            >
              {message.role === "assistant" && (
                <Avatar className="w-8 h-8 bg-primary">
                  <Bot className="w-5 h-5 text-primary-foreground" />
                </Avatar>
              )}
              <div
                className={`rounded-lg px-4 py-2 max-w-[80%] ${
                  message.role === "assistant"
                    ? "bg-muted text-foreground"
                    : "gradient-primary text-primary-foreground"
                }`}
              >
                <p className="text-sm">{message.content}</p>
              </div>
              {message.role === "user" && (
                <Avatar className="w-8 h-8 bg-accent">
                  <User className="w-5 h-5 text-accent-foreground" />
                </Avatar>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default TranscriptionDisplay;
