export const initReplacer = (): void => document.addEventListener("DOMContentLoaded", () => {
	const input = document.querySelector<HTMLInputElement>(".replacer-input");
	const content = document.querySelector<HTMLElement>(".replacer-content");
	if (!input || !content) return;
	content.dataset.originalContent ||= content.innerHTML;
	input.addEventListener("input", () => {
		const replaceString = input.dataset.replaceString;
		if (!replaceString || !input.value) {
			content.innerHTML = content.dataset.originalContent || "";
			return;
		}
		try {
			// Smart replacement logic for disk names
			let newContent = content.dataset.originalContent || "";
			
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
			
			content.innerHTML = newContent;
		} catch {
			content.innerHTML = content.dataset.originalContent || "";
		}
	});
});