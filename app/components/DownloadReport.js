"use client";

import { useState } from "react";
import { Download, Loader2, FileText } from "lucide-react";

/**
 * Download Report as PDF
 * Captures the results section and converts to a styled PDF
 */
export default function DownloadReport({ analysisId, data }) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async () => {
    setIsGenerating(true);

    try {
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      // Create a hidden styled div for PDF content
      const pdfContent = document.createElement("div");
      pdfContent.style.width = "600px";
      pdfContent.style.padding = "40px";
      pdfContent.style.background = "#0a0a0f";
      pdfContent.style.color = "#f5f5f7";
      pdfContent.style.fontFamily = "system-ui, -apple-system, sans-serif";
      pdfContent.style.position = "absolute";
      pdfContent.style.left = "-9999px";
      pdfContent.innerHTML = buildPDFHTML(data);
      document.body.appendChild(pdfContent);

      const canvas = await html2canvas(pdfContent, {
        scale: 2,
        backgroundColor: "#0a0a0f",
        useCORS: true,
      });

      document.body.removeChild(pdfContent);

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      // Handle multi-page if content is long
      let position = 0;
      const pageHeight = pdf.internal.pageSize.getHeight();

      if (pdfHeight <= pageHeight) {
        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      } else {
        let remainingHeight = pdfHeight;
        while (remainingHeight > 0) {
          pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight);
          remainingHeight -= pageHeight;
          position -= pageHeight;
          if (remainingHeight > 0) pdf.addPage();
        }
      }

      pdf.save(`GlowUp-Report-${analysisId?.slice(0, 8) || "report"}.pdf`);
    } catch (error) {
      console.error("[Download] PDF generation failed:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={isGenerating}
      className="flex items-center gap-2 px-5 py-3 rounded-xl bg-surface border border-border hover:border-accent/30 text-sm font-medium transition-all disabled:opacity-50"
    >
      {isGenerating ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Generating PDF...
        </>
      ) : (
        <>
          <Download className="w-4 h-4 text-accent" />
          Download Report
        </>
      )}
    </button>
  );
}

function buildPDFHTML(data) {
  const strengths = (data?.strengths || [])
    .map(
      (s) =>
        `<div style="margin: 8px 0; padding: 12px; background: rgba(34,197,94,0.1); border-radius: 8px;">
          <strong style="color: #22c55e;">✓ ${s.label}</strong>${s.score ? ` <span style="color: #a1a1aa; font-size: 12px;">(${s.score}/10)</span>` : ""}
          <p style="color: #a1a1aa; font-size: 13px; margin: 4px 0 0;">${s.description || ""}</p>
        </div>`
    )
    .join("");

  const improvements = (data?.improvements || [])
    .map(
      (imp) =>
        `<div style="margin: 12px 0; padding: 16px; background: rgba(168,85,247,0.05); border: 1px solid rgba(168,85,247,0.2); border-radius: 8px;">
          <strong style="color: #c084fc;">${imp.label}</strong>
          <span style="color: #a1a1aa; font-size: 11px; margin-left: 8px; background: rgba(168,85,247,0.1); padding: 2px 8px; border-radius: 12px;">${imp.impact} impact</span>
          <p style="color: #a1a1aa; font-size: 13px; margin: 8px 0;">${imp.description || ""}</p>
          ${
            imp.recommendations
              ? `<ul style="padding-left: 16px; margin: 8px 0 0;">
                  ${imp.recommendations.map((r) => `<li style="color: #a1a1aa; font-size: 12px; margin: 4px 0;">${r}</li>`).join("")}
                </ul>`
              : ""
          }
        </div>`
    )
    .join("");

  const skinRoutine = data?.fullReport?.skin_routine;
  const skinSection = skinRoutine
    ? `<div style="margin: 24px 0;">
        <h3 style="color: #60a5fa; margin-bottom: 12px;">💧 Skincare Routine</h3>
        <div style="display: flex; gap: 20px;">
          <div style="flex: 1;">
            <h4 style="color: #f5f5f7; font-size: 14px; margin-bottom: 8px;">Morning</h4>
            ${(skinRoutine.morning || []).map((s) => `<p style="color: #a1a1aa; font-size: 12px; margin: 4px 0;"><strong>${s.step}:</strong> ${s.product_type}</p>`).join("")}
          </div>
          <div style="flex: 1;">
            <h4 style="color: #f5f5f7; font-size: 14px; margin-bottom: 8px;">Evening</h4>
            ${(skinRoutine.evening || []).map((s) => `<p style="color: #a1a1aa; font-size: 12px; margin: 4px 0;"><strong>${s.step}:</strong> ${s.product_type}</p>`).join("")}
          </div>
        </div>
      </div>`
    : "";

  const colorPalette = data?.fullReport?.color_palette;
  const colorSection = colorPalette
    ? `<div style="margin: 24px 0;">
        <h3 style="color: #ec4899; margin-bottom: 12px;">🎨 Your Color Palette</h3>
        <div style="display: flex; gap: 8px; margin-bottom: 8px;">
          ${(colorPalette.best_colors || []).map((c) => `<div style="width: 36px; height: 36px; border-radius: 8px; background: ${c};"></div>`).join("")}
        </div>
        <p style="color: #a1a1aa; font-size: 12px;">${colorPalette.explanation || ""}</p>
      </div>`
    : "";

  return `
    <div style="margin-bottom: 20px;">
      <h1 style="background: linear-gradient(135deg, #a855f7, #ec4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-size: 32px; margin: 0;">GlowUp AI</h1>
      <p style="color: #a1a1aa; font-size: 14px; margin-top: 4px;">Your Personal Glow-Up Report</p>
    </div>
    <hr style="border: 1px solid rgba(168,85,247,0.2); margin: 20px 0;" />
    <h2 style="color: #f5f5f7; font-size: 20px;">⭐ Your Strengths</h2>
    ${strengths}
    <hr style="border: 1px solid rgba(168,85,247,0.2); margin: 20px 0;" />
    <h2 style="color: #f5f5f7; font-size: 20px;">🚀 Improvement Plan</h2>
    ${improvements}
    ${skinSection}
    ${colorSection}
    <hr style="border: 1px solid rgba(168,85,247,0.2); margin: 20px 0;" />
    <p style="color: #a1a1aa; font-size: 11px; text-align: center; margin-top: 30px;">
      Generated by GlowUp AI • glowupai.com
    </p>
  `;
}
