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
			const regex = new RegExp(replaceString.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g");
			content.innerHTML = (content.dataset.originalContent || "").replace(regex, input.value);
		} catch {
			content.innerHTML = content.dataset.originalContent || "";
		}
	});
});