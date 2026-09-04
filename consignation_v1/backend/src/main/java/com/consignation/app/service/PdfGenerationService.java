package com.consignation.app.service;

import com.consignation.app.model.*;
import com.itextpdf.io.font.constants.StandardFonts;
import com.itextpdf.io.image.ImageDataFactory;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.borders.SolidBorder;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Image;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.HorizontalAlignment;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import com.itextpdf.layout.properties.VerticalAlignment;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.List;

@Service
public class PdfGenerationService {

    // Couleurs du template Maghreb Steel
    private static final DeviceRgb C_HEADER      = new DeviceRgb(74,  114, 178);
    private static final DeviceRgb C_SUBHEADER   = new DeviceRgb(141, 171, 200);
    private static final DeviceRgb C_ROW         = new DeviceRgb(189, 210, 230);
    private static final DeviceRgb C_ROW_EXEC    = new DeviceRgb(220, 230, 241);
    private static final DeviceRgb C_BLACK       = new DeviceRgb(0,   0,   0);
    private static final DeviceRgb C_SIG_HEADER  = new DeviceRgb(0,   0,   0);

    private static final float BW = 0.5f;

    public byte[] genererPdf(PlanConsignation plan) throws Exception {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfDocument pdfDoc = new PdfDocument(new PdfWriter(baos));
        Document doc = new Document(pdfDoc, PageSize.A4.rotate());
        doc.setMargins(12, 12, 12, 12);

        PdfFont font     = PdfFontFactory.createFont(StandardFonts.HELVETICA);
        PdfFont fontBold = PdfFontFactory.createFont(StandardFonts.HELVETICA_BOLD);

        addEntete(doc, plan, font, fontBold);
        doc.add(new Paragraph("").setMarginBottom(3));
        addInfosPlan(doc, plan, font, fontBold);
        doc.add(new Paragraph("").setMarginBottom(3));
        addTableauPrincipal(doc, plan, font, fontBold);
        doc.add(new Paragraph("").setMarginBottom(5));
        addSignatures(doc, plan, font, fontBold);

        doc.close();
        return baos.toByteArray();
    }

    public byte[] genererPdfAvecDate(PlanConsignation plan) throws Exception {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfDocument pdfDoc = new PdfDocument(new PdfWriter(baos));
        Document doc = new Document(pdfDoc, PageSize.A4.rotate());
        doc.setMargins(12, 12, 12, 12);

        PdfFont font     = PdfFontFactory.createFont(StandardFonts.HELVETICA);
        PdfFont fontBold = PdfFontFactory.createFont(StandardFonts.HELVETICA_BOLD);

        addEntete(doc, plan, font, fontBold);
        doc.add(new Paragraph("").setMarginBottom(3));
        addInfosPlan(doc, plan, font, fontBold);
        doc.add(new Paragraph("").setMarginBottom(3));
        addTableauPrincipal(doc, plan, font, fontBold);
        doc.add(new Paragraph("").setMarginBottom(5));
        addSignatures(doc, plan, font, fontBold);

        String dateStr = LocalDateTime.now()
            .format(DateTimeFormatter.ofPattern("dd/MM/yyyy 'à' HH:mm"));
        doc.add(new Paragraph("Téléchargé le " + dateStr)
            .setFont(font).setFontSize(7)
            .setFontColor(new DeviceRgb(120, 120, 120))
            .setTextAlignment(TextAlignment.RIGHT)
            .setMarginTop(4));

        doc.close();
        return baos.toByteArray();
    }

    // ─── ENTÊTE ────────────────────────────────────────────────────────────
    private void addEntete(Document doc, PlanConsignation plan, PdfFont font, PdfFont bold) {
        Table t = new Table(new float[]{150, 450, 170});
        t.setWidth(UnitValue.createPercentValue(100));

        // Logo
        Cell logo = new Cell()
            .add(new Paragraph("MAGHREB STEEL").setFont(bold).setFontSize(11).setFontColor(C_HEADER))
            .add(new Paragraph("▲").setFont(bold).setFontSize(14).setFontColor(new DeviceRgb(255, 120, 0)))
            .setBorder(new SolidBorder(C_BLACK, BW))
            .setVerticalAlignment(VerticalAlignment.MIDDLE)
            .setTextAlignment(TextAlignment.CENTER)
            .setPadding(6);
        t.addCell(logo);

        // Titre
        Cell titre = new Cell()
            .add(new Paragraph("Plan de Consignation & Déconsignation")
                .setFont(bold).setFontSize(17).setTextAlignment(TextAlignment.CENTER))
            .setBorder(new SolidBorder(C_BLACK, 1.5f))
            .setVerticalAlignment(VerticalAlignment.MIDDLE)
            .setPadding(8);
        t.addCell(titre);

        // Date / Code / Version
        String dateStr = plan.getDateCreation() != null
            ? plan.getDateCreation().format(DateTimeFormatter.ofPattern("MM/yyyy")) : "";
        Cell info = new Cell()
            .add(new Paragraph("Date : " + dateStr).setFont(font).setFontSize(7))
            .add(new Paragraph("Code : ").setFont(font).setFontSize(7))
            .add(new Paragraph("Version : 01    Page 1 sur 1").setFont(font).setFontSize(7))
            .setBorder(new SolidBorder(C_BLACK, BW))
            .setPadding(4);
        t.addCell(info);

        doc.add(t);
    }

    // ─── INFOS PLAN ─────────────────────────────────────────────────────────
    private void addInfosPlan(Document doc, PlanConsignation plan, PdfFont font, PdfFont bold) {
        Equipement eq  = plan.getEquipement();
        String zone    = eq.getZone() != null ? eq.getZone().getCode() : "";
        String eqLabel = eq.getCode() + "  –  " + eq.getDescription();

        // Statut : libellé français
        String statutLabel = switch (plan.getStatut()) {
            case DEMANDE_EN_COURS           -> "Demande en cours";
            case DEMANDE_ACCEPTE            -> "Demande acceptée";
            case DEMANDE_REJETE             -> "Demande rejetée";
            case PLAN_EN_COURS              -> "Plan en cours";
            case PLAN_EN_ATTENTE_VALIDATION -> "En attente de validation";
            case PLAN_VALIDE                -> "Validé";
            case PLAN_REJETE                -> "Plan rejeté";
            case PLAN_TESTE                 -> "Plan testé";
        };

        // Ligne 1 : N° Plan | Entité | Zone / ligne | État actuel
        Table l1 = new Table(new float[]{3, 2, 2.5f, 1.5f});
        l1.setWidth(UnitValue.createPercentValue(100));
        l1.addCell(infoCell(font, "N° Plan :  " + plan.getReference()));
        String demandeurNom = plan.getDemandeur() != null
            ? plan.getDemandeur().getPrenom() + " " + plan.getDemandeur().getNom() : "";
        l1.addCell(infoCell(font, "Demandeur :  " + demandeurNom));
        l1.addCell(infoCell(font, "Zone / ligne :  " + zone));
        l1.addCell(infoCellBold(font, bold, "État actuel :  ", statutLabel));
        doc.add(l1);

        // Ligne 2 : Chargé (vide) | Equipement / installation
        Table l2 = new Table(new float[]{3, 6});
        l2.setWidth(UnitValue.createPercentValue(100));
        l2.addCell(infoCell(font, "Chargé d'exploitation : .....................................  Visa : ..............."));
        l2.addCell(infoCell(font, "Equipement / installation :  " + eqLabel));
        doc.add(l2);

        // Ligne 3 : Intervention prévue
        Table l3 = new Table(1);
        l3.setWidth(UnitValue.createPercentValue(100));
        l3.addCell(infoCell(font, "Intervention prévue :  " + nvl(plan.getDescriptionIntervention())));
        doc.add(l3);
    }

    // ─── TABLEAU PRINCIPAL ──────────────────────────────────────────────────
    private void addTableauPrincipal(Document doc, PlanConsignation plan, PdfFont font, PdfFont bold) {
        // 13 colonnes : 7 plan + 6 exécution
        float[] w = {30, 98, 65, 68, 65, 68, 60,   48, 32, 64, 64, 48, 64};
        Table table = new Table(w);
        table.setWidth(UnitValue.createPercentValue(100));

        // ── LIGNE 1 : groupes principaux ──
        table.addCell(hCell(bold, "Plan de Consignation",              1, 7, C_HEADER, 8.5f));
        table.addCell(hCell(bold, "Exécution du Plan de Consignation", 1, 6, C_HEADER, 8.5f));

        // ── LIGNE 2 : en-têtes colonnes (plan rowspan=2) + sous-groupes exec ──
        String[] planH = {
            "Etapes",
            "Equipement /\nOrgane à\nConsigner",
            "Energie /\nEnergie\nRésiduelle",
            "Repère et\nlocalisation\ndu point de\nCadenassage",
            "Action\n(Ouvrir /\nfermer /\npurger...)",
            "Dispositif de\ncadenassage",
            "Point et Valeur\nVAE /\nTry-Out"
        };
        for (String h : planH) {
            table.addCell(hCellRS(bold, h, 2, 1, C_SUBHEADER, 6.5f));
        }
        table.addCell(hCell(bold, "Consignation",    1, 4, C_SUBHEADER, 7f));
        table.addCell(hCell(bold, "Déconsignation",  1, 2, C_SUBHEADER, 7f));

        // ── LIGNE 3 : sous-en-têtes exécution (colonnes plan couvertes par rowspan) ──
        table.addCell(hCell(bold, "Début le :\n  à",              1, 1, C_SUBHEADER, 5.5f));
        table.addCell(hCell(bold, "N°\ncadenas",                  1, 1, C_SUBHEADER, 5.5f));
        table.addCell(hCell(bold, "Consigné par\nNom & Visa",     1, 1, C_SUBHEADER, 5.5f));
        table.addCell(hCell(bold, "Vérifié par\nNom & Visa",      1, 1, C_SUBHEADER, 5.5f));
        table.addCell(hCell(bold, "Fin le :\n  à",                1, 1, C_SUBHEADER, 5.5f));
        table.addCell(hCell(bold, "Déconsigné par\nNom & Visa",   1, 1, C_SUBHEADER, 5.5f));

        // ── LIGNES DE DONNÉES ──
        List<EnergieDangereuse> energies = plan.getEnergies();
        int total = Math.max(8, energies != null ? energies.size() : 0);

        for (int i = 0; i < total; i++) {
            EnergieDangereuse e = (energies != null && i < energies.size()) ? energies.get(i) : null;

            String energieCell = e != null ? typeLabel(e.getType()) +
                (e.getEnergieResiduelle() != null && !e.getEnergieResiduelle().isBlank()
                    ? "\n" + e.getEnergieResiduelle() : "") : "";

            table.addCell(dCell(font, String.valueOf(i + 1),                                           C_ROW));
            table.addCell(dCell(font, e != null ? nvl(e.getEquipementOrgane()) : "",                   C_ROW));
            table.addCell(dCell(font, energieCell,                                                     C_ROW));
            table.addCell(dCell(font, e != null ? nvl(e.getRepereLocalisation()) : "",                 C_ROW));
            table.addCell(dCell(font, e != null ? nvl(e.getAction()) : "",                             C_ROW));
            table.addCell(dCell(font, e != null && e.getDispositif() != null
                    ? nvl(e.getDispositif().getDesignation()) : "",                                    C_ROW));
            table.addCell(dCell(font, e != null ? nvl(e.getPointValeurVAE()) : "",                     C_ROW));
            // 6 colonnes exécution : vides (remplissage manuel)
            for (int j = 0; j < 6; j++) {
                table.addCell(dCell(font, "", C_ROW_EXEC));
            }
        }

        doc.add(table);
    }

    // ─── SIGNATURES ─────────────────────────────────────────────────────────
    private void addSignatures(Document doc, PlanConsignation plan, PdfFont font, PdfFont bold) throws Exception {
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd/MM/yyyy");

        // Dates pour les titres
        String dateRedaction   = plan.getDateEnvoi()     != null ? "  " + plan.getDateEnvoi().format(fmt)     : "";
        String dateValidation  = plan.getDateValidation() != null ? "  " + plan.getDateValidation().format(fmt) : "";

        float[] cols = {80, 40, 80, 40, 80, 40};
        Table t = new Table(cols);
        t.setWidth(UnitValue.createPercentValue(67));
        t.setHorizontalAlignment(HorizontalAlignment.LEFT);

        // ── Titres (colspan=2) ──
        t.addCell(sigTitle(bold, "Plan Rédigé le :" + dateRedaction));
        t.addCell(sigTitle(bold, "Plan Approuvé le :" + dateValidation));
        t.addCell(sigTitle(bold, "Plan Testé le :"));

        // ── Sous-en-têtes ──
        for (String s : new String[]{"Nom", "Visa", "Nom / Fonction", "Signature", "Nom", "Visa"}) {
            t.addCell(new Cell()
                .add(new Paragraph(s).setFont(bold).setFontSize(6.5f).setFontColor(ColorConstants.WHITE))
                .setBackgroundColor(C_SIG_HEADER)
                .setBorder(new SolidBorder(C_BLACK, BW))
                .setPadding(2));
        }

        // ── Ligne de données ──

        // Rédigé par (demandeur du plan) — Nom
        String redacteur = plan.getDemandeur() != null
            ? plan.getDemandeur().getPrenom() + " " + plan.getDemandeur().getNom()
            : nvl(plan.getResponsableIntervention());
        t.addCell(new Cell().setHeight(22)
            .add(new Paragraph(redacteur).setFont(font).setFontSize(7))
            .setBorder(new SolidBorder(C_BLACK, BW)).setPadding(3)
            .setVerticalAlignment(VerticalAlignment.MIDDLE));

        // Rédigé — Visa (vide, signature manuelle)
        t.addCell(new Cell().setHeight(22).setBorder(new SolidBorder(C_BLACK, BW)));

        // Approuvé par — Nom + Fonction
        Validation val = plan.getValidation();
        if (val != null && val.getSignature() != null) {
            String approuveur = nvl(val.getSignature().getSignataire())
                + (val.getSignature().getFonction() != null ? "\n" + val.getSignature().getFonction() : "");
            t.addCell(new Cell().setHeight(22)
                .add(new Paragraph(approuveur).setFont(font).setFontSize(7))
                .setBorder(new SolidBorder(C_BLACK, BW)).setPadding(3)
                .setVerticalAlignment(VerticalAlignment.MIDDLE));

            // Approuvé — image de signature numérique
            Cell sigCell = new Cell().setHeight(22)
                .setBorder(new SolidBorder(C_BLACK, BW)).setPadding(2)
                .setVerticalAlignment(VerticalAlignment.MIDDLE);
            String b64 = val.getSignature().getDonneesSignature();
            if (b64 != null && !b64.isBlank()) {
                String data = b64.contains(",") ? b64.substring(b64.indexOf(',') + 1) : b64;
                byte[] imgBytes = Base64.getDecoder().decode(data);
                Image img = new Image(ImageDataFactory.create(imgBytes))
                    .setMaxWidth(35).setMaxHeight(18).setAutoScale(false);
                sigCell.add(img);
            }
            t.addCell(sigCell);
        } else {
            t.addCell(new Cell().setHeight(22).setBorder(new SolidBorder(C_BLACK, BW)));
            t.addCell(new Cell().setHeight(22).setBorder(new SolidBorder(C_BLACK, BW)));
        }

        // Testé — vide
        t.addCell(new Cell().setHeight(22).setBorder(new SolidBorder(C_BLACK, BW)));
        t.addCell(new Cell().setHeight(22).setBorder(new SolidBorder(C_BLACK, BW)));

        doc.add(t);
    }

    // ─── HELPERS CELLULES ───────────────────────────────────────────────────

    /** En-tête rowspan=1 centré */
    private Cell hCell(PdfFont font, String text, int rs, int cs, DeviceRgb bg, float fs) {
        return new Cell(rs, cs)
            .add(new Paragraph(text).setFont(font).setFontSize(fs)
                .setFontColor(ColorConstants.WHITE).setTextAlignment(TextAlignment.CENTER))
            .setBackgroundColor(bg)
            .setBorder(new SolidBorder(C_BLACK, BW))
            .setVerticalAlignment(VerticalAlignment.MIDDLE)
            .setPaddingTop(2).setPaddingBottom(2).setPaddingLeft(2).setPaddingRight(2);
    }

    /** En-tête avec rowspan > 1 */
    private Cell hCellRS(PdfFont font, String text, int rs, int cs, DeviceRgb bg, float fs) {
        return new Cell(rs, cs)
            .add(new Paragraph(text).setFont(font).setFontSize(fs)
                .setFontColor(ColorConstants.WHITE).setTextAlignment(TextAlignment.CENTER))
            .setBackgroundColor(bg)
            .setBorder(new SolidBorder(C_BLACK, BW))
            .setVerticalAlignment(VerticalAlignment.MIDDLE)
            .setPaddingTop(2).setPaddingBottom(2).setPaddingLeft(2).setPaddingRight(2);
    }

    /** Cellule de données */
    private Cell dCell(PdfFont font, String text, DeviceRgb bg) {
        return new Cell()
            .add(new Paragraph(text != null ? text : "").setFont(font).setFontSize(7))
            .setBackgroundColor(bg)
            .setBorder(new SolidBorder(C_BLACK, BW))
            .setHeight(18)
            .setPadding(2)
            .setVerticalAlignment(VerticalAlignment.MIDDLE);
    }

    /** Cellule info (entête plan) */
    private Cell infoCell(PdfFont font, String text) {
        return new Cell()
            .add(new Paragraph(text).setFont(font).setFontSize(7.5f))
            .setBorder(new SolidBorder(C_BLACK, BW))
            .setPadding(3);
    }

    /** Cellule info avec label normal + valeur en gras */
    private Cell infoCellBold(PdfFont font, PdfFont bold, String label, String value) {
        com.itextpdf.layout.element.Text tLabel = new com.itextpdf.layout.element.Text(label).setFont(font).setFontSize(7.5f);
        com.itextpdf.layout.element.Text tValue = new com.itextpdf.layout.element.Text(value).setFont(bold).setFontSize(7.5f);
        return new Cell()
            .add(new Paragraph().add(tLabel).add(tValue))
            .setBorder(new SolidBorder(C_BLACK, BW))
            .setPadding(3);
    }

    /** Titre section signature (colspan=2) */
    private Cell sigTitle(PdfFont font, String text) {
        return new Cell(1, 2)
            .add(new Paragraph(text).setFont(font).setFontSize(7))
            .setBorder(new SolidBorder(C_BLACK, BW))
            .setPadding(3);
    }

    // ─── UTILITAIRES ────────────────────────────────────────────────────────
    private String nvl(String s) {
        return (s != null && !s.isBlank()) ? s : "";
    }

    private String typeLabel(TypeEnergie t) {
        if (t == null) return "";
        return switch (t) {
            case ELECTRIQUE      -> "Electrique";
            case HYDRAULIQUE     -> "Hydraulique";
            case PNEUMATIQUE     -> "Pneumatique";
            case MECANIQUE       -> "Mecanique";
            case THERMIQUE       -> "Thermique";
            case CHIMIQUE        -> "Chimique";
            case GRAVITATIONNELLE -> "Gravitationnelle";
        };
    }
}
