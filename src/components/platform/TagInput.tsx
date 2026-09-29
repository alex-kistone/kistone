import { useState } from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface TagInputProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  placeholder?: string;
}

const TagInput = ({ tags, onTagsChange, placeholder }: TagInputProps) => {
  const [input, setInput] = useState("");

  const addTag = () => {
    const tag = input.trim();
    if (tag && !tags.includes(tag)) {
      onTagsChange([...tags, tag]);
      setInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    onTagsChange(tags.filter((t) => t !== tagToRemove));
  };

  return (
    <div className="space-y-2">
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1 pr-1">
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
      <Input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            addTag();
          }
        }}
        placeholder={placeholder}
      />
    </div>
  );
};

export default TagInput;
