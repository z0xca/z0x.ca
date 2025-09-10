import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useEffect } from "react"

interface ReplacerProps {
  string: string
  label: string
  placeholder: string
  children: React.ReactNode
  enableDiskReplacement?: boolean
  id?: string
}

export function Replacer({ string, label, placeholder, children, enableDiskReplacement = false, id }: ReplacerProps) {
  useEffect(() => {
    const inputSelector = id ? `.replacer-input[data-replacer-id="${id}"]` : ".replacer-input";
    const contentSelector = id ? `.replacer-content[data-replacer-id="${id}"]` : ".replacer-content";
    
    const input = document.querySelector<HTMLInputElement>(inputSelector);
    const content = document.querySelector<HTMLElement>(contentSelector);
    if (!input || !content) return;
    
    content.dataset.originalContent ||= content.innerHTML;
    const handleInput = () => {
      const replaceString = input.dataset.replaceString;
      if (!replaceString || !input.value) {
        content.innerHTML = content.dataset.originalContent || "";
        return;
      }
      try {
        let newContent = content.dataset.originalContent || "";
        
        if (enableDiskReplacement) {
          // Smart replacement logic for disk names
          // Check if the original string follows NVMe pattern (like nvme0n1)
          const isNvmePattern = /^nvme\d+n\d+$/.test(replaceString);
          const isSataPattern = /^sd[a-z]$/.test(input.value);
          
          if (isNvmePattern && isSataPattern) {
            // Converting from NVMe to SATA pattern
            // Replace nvme0n1p1 with sda1, nvme0n1p2 with sda2, etc.
            const nvmeWithPartitionRegex = new RegExp(replaceString.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + 'p(\\d+)', 'g');
            newContent = newContent.replace(nvmeWithPartitionRegex, (match, partitionNumber) => {
              return input.value + partitionNumber;
            });
            // Also replace the base disk name without partitions
            const nvmeBaseRegex = new RegExp(replaceString.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), 'g');
            newContent = newContent.replace(nvmeBaseRegex, input.value);
          } else if (!isNvmePattern && isSataPattern && input.value.includes('p')) {
            // Converting from SATA to NVMe pattern (if user enters nvme0n1)
            // Replace sda1 with nvme0n1p1, sda2 with nvme0n1p2, etc.
            const sataWithPartitionRegex = new RegExp(replaceString + '(\\d+)', 'g');
            newContent = newContent.replace(sataWithPartitionRegex, (match, partitionNumber) => {
              return input.value + 'p' + partitionNumber;
            });
            // Also replace the base disk name without partitions
            const sataBaseRegex = new RegExp(replaceString.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), 'g');
            newContent = newContent.replace(sataBaseRegex, input.value);
          } else {
            // Simple replacement for other cases
            const regex = new RegExp(replaceString.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g");
            newContent = newContent.replace(regex, input.value);
          }
        } else {
          // Simple replacement for all cases when disk replacement is disabled
          const regex = new RegExp(replaceString.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g");
          newContent = newContent.replace(regex, input.value);
        }
        
        content.innerHTML = newContent;
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
        <Label htmlFor={id ? `replacer-input-${id}` : "replacer-input"}>{label}</Label>
        <Input 
          type="text" 
          id={id ? `replacer-input-${id}` : "replacer-input"}
          placeholder={placeholder}
          className="replacer-input"
          data-replace-string={string}
          data-replacer-id={id}
        />
      </div>
      <div className="replacer-content" data-original-content="" data-replacer-id={id}>
        {children}
      </div>
    </div>
  )
}
