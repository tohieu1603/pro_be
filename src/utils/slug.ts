export const generateSlug = (text: string): string => {
  return text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
};

export const generateSPK = (prefix: string, sequence: number): string => {
  return `${prefix}-${String(sequence).padStart(6, "0")}`;
};

export const generateSKU = (
  spk: string,
  variantOptions: string[]
): string => {
  const optionPart = variantOptions
    .map((opt) => generateSlug(opt).toUpperCase().substring(0, 10))
    .join("-");
  return `${spk}-${optionPart}`;
};
