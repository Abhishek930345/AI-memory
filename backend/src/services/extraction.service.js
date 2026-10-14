import fs from "fs";
import * as pdfModule from "pdf-parse";
import mammoth from "mammoth";

export const extractText = async (filePath, fileType) => {
  switch (fileType) {
    case "pdf": {
      const dataBuffer = fs.readFileSync(filePath);
      if (pdfModule.PDFParse) {
        const parser = new pdfModule.PDFParse({ data: dataBuffer });
        try {
          const result = await parser.getText();
          return result.text || "";
        } finally {
          await parser.destroy();
        }
      } else {
        const pdf = pdfModule.default || pdfModule;
        const result = await pdf(dataBuffer);
        return result.text || "";
      }
    }
    case "docx": {
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value;
    }
    case "txt": {
      return fs.readFileSync(filePath, "utf-8");
    }
    default:
      throw new Error(`Unsupported file type for extraction: ${fileType}`);
  }
};