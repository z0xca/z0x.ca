import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useEffect } from "react"

interface ReplacerProps {
  string: string
  label: string
  placeholder: string
  children: React.ReactNode
}

export function Replacer({ string, label, placeholder, children }: ReplacerProps) {
  useEffect(() => {
    const input = document.querySelector<HTMLInputElement>(".replacer-input");
    const content = document.querySelector<HTMLElement>(".replacer-content");
    if (!input || !content) return;
    
    content.dataset.originalContent ||= content.innerHTML;
    const handleInput = () => {
      const replaceString = input.dataset.replaceString;
      if (!replaceString || !input.value) {
        content.innerHTML = content.dataset.originalContent || "";
        return;
      }
      try {
        const regex = new RegExp(replaceString.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g");
        content.innerHTML = (content.dataset.originalContent || "").replace(regex, input.value);
      } catch {
        content.innerHTML = content.dataset.originalContent || "";
      }
    };
    
    input.addEventListener("input", handleInput);
    return () => input.removeEventListener("input", handleInput);
  }, []);

  return (
    <div>
      <div className="replacer-container grid w-full max-w-sm items-center gap-3">
        <Label htmlFor="replacer-input">{label}</Label>
        <Input 
          type="text" 
          id="replacer-input"
          placeholder={placeholder}
          className="replacer-input"
          data-replace-string={string}
        />
      </div>
      <div className="replacer-content" data-original-content="">
        {children}
      </div>
    </div>
  )
}
