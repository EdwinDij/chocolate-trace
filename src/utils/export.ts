import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface HistoricEntry {
    id: string;
    type_name: string;
    reference: string;
    status: string;
    reason: string | null;
    week_receiving: string;
    created_at: string;
}

const STATUS_LABELS: Record<string, string> = {
    perime: "Périmé",
    non_conforme: "Non conforme",
    epuise: "Épuisé",
};


// traitement CSV

export function exportToCSV(entries: HistoricEntry[], shopName: string, period: string) {
    const headers = ["Date", "Produit", "Référence", "Statut", "Raison", "Semaine réception"];

    const rows = entries.map((e) => [
        new Date(e.created_at).toLocaleDateString("fr-FR"),
        e.type_name,
        e.reference,
        STATUS_LABELS[e.status] ?? e.status,
        e.reason ?? "-",
        e.week_receiving,
    ])

    const csvContent = [
        `# Traquéo — ${shopName} — ${period}`,
        `# Exporté le ${new Date().toLocaleDateString("fr-FR")}`,
        "",
        headers.join(";"),
        ...rows.map((r) => r.join(";")),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a");
    link.href = url;
    link.download = `traqueo-historique-${period.replace(/\s/g, "-")}.csv`;
    link.click();
    URL.revokeObjectURL(url)

}

// traitement PDF

export function exportToPDF(entries: HistoricEntry[], shopName: string, period: string) {

    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getHeight()

    doc.setFillColor(29, 66, 59); // ink-800
    doc.rect(0, 0, pageWidth, 40, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("Traquéo", 14, 18);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(111, 216, 183); // teal-300
    doc.text("Rapport de traçabilité", 14, 27);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.text(shopName, 14, 35);
    doc.text(`Période : ${period}`, pageWidth - 14, 35, { align: "right" });

    doc.setTextColor(100, 116, 112); // slate-500
    doc.setFontSize(9);
    doc.text(
        `Exporté le ${new Date().toLocaleDateString("fr-FR")} — ${entries.length} entrée${entries.length > 1 ? "s" : ""}`,
        14,
        52
    );

    // ── KPI ──
    const perime = entries.filter((e) => e.status === "perime").length;
    const nonConforme = entries.filter((e) => e.status === "non_conforme").length;
    const epuise = entries.filter((e) => e.status === "epuise").length;

    const kpis = [
        { label: "Périmés", value: perime, color: [220, 38, 38] as [number, number, number] },
        { label: "Non conformes", value: nonConforme, color: [124, 58, 237] as [number, number, number] },
        { label: "Épuisés", value: epuise, color: [100, 116, 112] as [number, number, number] },
    ];

    kpis.forEach((kpi, i) => {
        const x = 14 + i * 62;
        doc.setFillColor(247, 250, 249);
        doc.roundedRect(x, 57, 56, 22, 3, 3, "F");
        doc.setTextColor(...kpi.color);
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text(String(kpi.value), x + 8, 69);
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 116, 112);
        doc.text(kpi.label, x + 8, 75);
    });


    const sections = [
        { status: "perime", label: "Périmés", color: [220, 38, 38] as [number, number, number] },
        { status: "non_conforme", label: "Non conformes", color: [124, 58, 237] as [number, number, number] },
        { status: "epuise", label: "Épuisés", color: [100, 116, 112] as [number, number, number] },
    ];

    let currentY = 90;

    sections.forEach(({ status, label, color }) => {
        const sectionEntries = entries.filter((e) => e.status === status);
        if (sectionEntries.length === 0) return;

        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...color);
        doc.text(label, 14, currentY);
        currentY += 4;

        autoTable(doc, {
            startY: currentY,
            head: [["Date", "Produit", "Référence", "Sem. réception", "Raison"]],
            body: sectionEntries.map((e) => [
                new Date(e.created_at).toLocaleDateString("fr-FR"),
                e.type_name,
                e.reference,
                e.week_receiving,
                e.reason ?? "—",
            ]),
            styles: {
                fontSize: 9,
                cellPadding: 3,
                textColor: [35, 43, 41],
            },
            headStyles: {
                fillColor: [29, 66, 59],
                textColor: [255, 255, 255],
                fontStyle: "bold",
                fontSize: 9,
            },
            alternateRowStyles: {
                fillColor: [247, 250, 249],
            },
            margin: { left: 14, right: 14 },
        });

        currentY = (doc as any).lastAutoTable.finalY + 12;
    });

    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(180, 180, 180);
        doc.text(
            `© 2026 Traquéo — Edwin Dijeont · Page ${i}/${pageCount}`,
            pageWidth / 2,
            doc.internal.pageSize.getHeight() - 8,
            { align: "center" }
        );
    }

    doc.save(`traqueo-historique-${period.replace(/\s/g, "-")}.pdf`);

}




